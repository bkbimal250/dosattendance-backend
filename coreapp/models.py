from django.db import models
import uuid
from django.conf import settings
from decimal import Decimal


class SalaryIncrement(models.Model):
    INCREMENT_TYPE_CHOICES = [
        ('annual', 'Annual Increment'),
        ('promotion', 'Promotion'),
        ('performance', 'Performance Based'),
        ('adjustment', 'Adjustment'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='increments'
    )

    increment_type = models.CharField(max_length=20, choices=INCREMENT_TYPE_CHOICES)

    old_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    increment_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Increment percentage (e.g. 10 for 10%)"
    )

    increment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    new_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    effective_from = models.DateField(help_text="Increment effective date")

    reason = models.TextField(blank=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_salary_increments'
    )

    applied_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this increment was applied to base salary"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_from']
        verbose_name = "Salary Increment"
        verbose_name_plural = "Salary Increments"

    def __str__(self):
        return f"{self.employee.get_full_name()} | +{self.increment_amount or 0}"

    def clean(self):
        """
        Auto-calculate increment amount and new salary
        """
        if not self.old_salary:
            self.old_salary = self.employee.salary or Decimal('0.00')

        # If percentage is given → calculate amount
        if self.increment_percentage and not self.increment_amount:
            self.increment_amount = (
                self.old_salary * self.increment_percentage / Decimal('100')
            ).quantize(Decimal('0.01'))

        # If amount is given → calculate percentage (optional)
        if self.increment_amount and not self.increment_percentage and self.old_salary:
            self.increment_percentage = (
                self.increment_amount * Decimal('100') / self.old_salary
            ).quantize(Decimal('0.01'))

        # Calculate new salary
        if self.old_salary is not None and self.increment_amount is not None:
            self.new_salary = self.old_salary + self.increment_amount

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class SalaryIncrementHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='increment_history'
    )

    increment = models.ForeignKey(
        SalaryIncrement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_records'
    )

    old_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    new_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='salary_changes_made'
    )

    changed_at = models.DateTimeField(auto_now_add=True)

    remarks = models.TextField(blank=True)

    class Meta:
        verbose_name = "Salary Increment History"
        verbose_name_plural = "Salary Increment Histories"
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.employee.get_full_name()} | {self.old_salary} → {self.new_salary}"
