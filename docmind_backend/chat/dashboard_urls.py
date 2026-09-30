from django.urls import path
from .dashboard_views import UsageStatsView, ConversationListView, ConversationDetailView

urlpatterns = [
    path('usage/', UsageStatsView.as_view(), name='usage_stats'),
    path('conversations/', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<str:session_id>/', ConversationDetailView.as_view(), name='conversation_detail'),
]