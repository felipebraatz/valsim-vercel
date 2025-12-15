from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),
    path('quick-match/', views.quick_match_setup, name='quick_match_setup'),
    path('simulation-choice/', views.simulation_choice, name='simulation_choice'),
    path('simulate-match/', views.simulate_match, name='simulate_match'),
    path('match-result/<int:match_id>/', views.match_result, name='match_result'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
