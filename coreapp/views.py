from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SalaryIncrement, SalaryIncrementHistory
from .serializers import (
    SalaryIncrementSerializer,
    SalaryIncrementHistorySerializer,
)
from .permissions import IsAdminManagerOrSuperuser


class SalaryIncrementViewSet(viewsets.ModelViewSet):
    """
    Create / Update / Approve Salary Increments.

    Supports filtering by:
    - office_id: UUID of employee.office
    - department_id: UUID of employee.department
    - employee_id: UUID of employee
    - status: pending / approved / rejected
    - increment_type: annual / promotion / performance / adjustment / other
    - effective_from (exact), from_date, to_date (date range on effective_from)
    """

    queryset = SalaryIncrement.objects.select_related(
        'employee',
        'approved_by',
        'employee__office',
        'employee__department',
        'employee__designation',
    )
    serializer_class = SalaryIncrementSerializer
    permission_classes = [IsAuthenticated, IsAdminManagerOrSuperuser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        office_id = params.get('office_id')
        department_id = params.get('department_id')
        employee_id = params.get('employee_id')
        status_param = params.get('status')
        increment_type = params.get('increment_type')
        effective_from = params.get('effective_from')
        from_date = params.get('from_date')
        to_date = params.get('to_date')

        if office_id:
            qs = qs.filter(employee__office_id=office_id)
        if department_id:
            qs = qs.filter(employee__department_id=department_id)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)
        if increment_type and increment_type != 'all':
            qs = qs.filter(increment_type=increment_type)
        if effective_from:
            qs = qs.filter(effective_from=effective_from)
        if from_date:
            qs = qs.filter(effective_from__gte=from_date)
        if to_date:
            qs = qs.filter(effective_from__lte=to_date)

        return qs

    def perform_create(self, serializer):
        """
        When an admin/manager creates an increment, approve it
        immediately so the base salary is updated right away
        via the salary increment signal.
        """
        increment = serializer.save()

        user = self.request.user

        # Auto-approve only for admin/manager/superuser
        if user.is_superuser or getattr(user, 'role', None) in ['admin', 'manager']:
            if increment.status != 'approved':
                increment.status = 'approved'
                increment.approved_by = user
                # Saving with status=approved will trigger the post_save
                # signal in coreapp.signals to update the base salary
                # and create history, and mark applied_at.
                increment.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Explicit approval endpoint (kept for compatibility),
        will also immediately update the base salary via signal.
        """
        increment = self.get_object()

        if increment.status == 'approved':
            return Response(
                {"detail": "Increment already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        increment.status = 'approved'
        increment.approved_by = request.user
        increment.save()

        return Response(
            {"detail": "Increment approved successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject increment.
        """
        increment = self.get_object()

        if increment.status == 'approved':
            return Response(
                {"detail": "Approved increment cannot be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        increment.status = 'rejected'
        increment.save()

        return Response(
            {"detail": "Increment rejected."},
            status=status.HTTP_200_OK,
        )


class SalaryIncrementHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only salary increment history.

    Supports filtering by:
    - office_id: UUID of employee.office
    - department_id: UUID of employee.department
    - employee_id: UUID of employee
    - from_date / to_date: date range on changed_at
    """

    queryset = SalaryIncrementHistory.objects.select_related(
        'employee',
        'increment',
        'employee__office',
        'employee__department',
    )
    serializer_class = SalaryIncrementHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        office_id = params.get('office_id')
        department_id = params.get('department_id')
        employee_id = params.get('employee_id')
        from_date = params.get('from_date')
        to_date = params.get('to_date')

        if office_id:
            qs = qs.filter(employee__office_id=office_id)
        if department_id:
            qs = qs.filter(employee__department_id=department_id)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if from_date:
            qs = qs.filter(changed_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(changed_at__date__lte=to_date)

        return qs


class HolidayViewSet(viewsets.ModelViewSet):
    """
    Create / Update / Delete holidays.
    """

    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        holiday_type = params.get('type')
        from_date = params.get('from_date')
        to_date = params.get('to_date')
        is_paid = params.get('is_paid')

        if holiday_type:
            qs = qs.filter(type=holiday_type)
        if from_date:
            qs = qs.filter(date__gte=from_date)
        if to_date:
            qs = qs.filter(date__lte=to_date)
        if is_paid is not None:
            is_paid = is_paid.lower() == 'true'
            qs = qs.filter(is_paid=is_paid)

        return qs
