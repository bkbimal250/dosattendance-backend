from rest_framework import serializers
from .models import SalaryIncrement, SalaryIncrementHistory


class SalaryIncrementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.get_full_name',
        read_only=True
    )
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = SalaryIncrement
        fields = [
            'id',
            'employee',
            'employee_name',
            'increment_type',
            'old_salary',
            'increment_percentage',
            'increment_amount',
            'new_salary',
            'effective_from',
            'reason',
            'status',
            'approved_by',
            'approved_by_name',
            'applied_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'old_salary',
            'increment_amount',
            'new_salary',
            'applied_at',
            'created_at',
            'updated_at',
        )

    def create(self, validated_data):
        """
        Auto set old_salary from employee
        """
        employee = validated_data['employee']
        validated_data['old_salary'] = employee.salary or 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Prevent editing salary values after approval
        """
        if instance.status == 'approved':
            raise serializers.ValidationError(
                "Approved increments cannot be modified."
            )
        return super().update(instance, validated_data)


class SalaryIncrementHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.get_full_name',
        read_only=True
    )

    class Meta:
        model = SalaryIncrementHistory
        fields = [
            'id',
            'employee',
            'employee_name',
            'increment',
            'old_salary',
            'new_salary',
            'changed_by',
            'changed_at',
            'remarks',
        ]
        read_only_fields = fields
