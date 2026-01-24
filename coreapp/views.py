from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SalaryIncrement, SalaryIncrementHistory
from .serializers import (
    SalaryIncrementSerializer,
    SalaryIncrementHistorySerializer
)
from .permissions import IsAdminManagerOrSuperuser


class SalaryIncrementViewSet(viewsets.ModelViewSet):
    """
    Create / Update / Approve Salary Increments
    """
    queryset = SalaryIncrement.objects.select_related(
        'employee', 'approved_by'
    )
    serializer_class = SalaryIncrementSerializer
    permission_classes = [IsAuthenticated, IsAdminManagerOrSuperuser]

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
                status=status.HTTP_400_BAD_REQUEST
            )

        increment.status = 'approved'
        increment.approved_by = request.user
        increment.save()

        return Response(
            {"detail": "Increment approved successfully."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject increment
        """
        increment = self.get_object()

        if increment.status == 'approved':
            return Response(
                {"detail": "Approved increment cannot be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        increment.status = 'rejected'
        increment.save()

        return Response(
            {"detail": "Increment rejected."},
            status=status.HTTP_200_OK
        )


class SalaryIncrementHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only salary increment history
    """
    queryset = SalaryIncrementHistory.objects.select_related(
        'employee', 'increment'
    )
    serializer_class = SalaryIncrementHistorySerializer
    permission_classes = [IsAuthenticated]
