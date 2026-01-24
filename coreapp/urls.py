from rest_framework.routers import DefaultRouter
from .views import SalaryIncrementViewSet, SalaryIncrementHistoryViewSet

router = DefaultRouter()
router.register(r'salary-increments', SalaryIncrementViewSet, basename='salary-increment')
router.register(r'salary-increment-history', SalaryIncrementHistoryViewSet, basename='salary-increment-history')

urlpatterns = router.urls
