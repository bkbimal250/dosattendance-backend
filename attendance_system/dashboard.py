from django.utils.translation import gettext_lazy as _
from core.models import CustomUser, Leave
from coreapp.models import SalaryIncrement

def dashboard_callback(request, context):
    """
    Callback to customize the Unfold dashboard with real-time data.
    """
    context.update({
        "total_employees": CustomUser.objects.filter(is_active=True).count(),
        "active_leaves": Leave.objects.filter(status='pending').count(),
        "pending_increments": SalaryIncrement.objects.filter(status='pending').count(),
    })
    return context
