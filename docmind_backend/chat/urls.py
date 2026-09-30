from django.urls import path
from .views import ChatQueryView, FeedbackView, WidgetConfigPublicView

urlpatterns = [
    path('chat/', ChatQueryView.as_view(), name='widget_chat'),
    path('feedback/', FeedbackView.as_view(), name='widget_feedback'),
    path('config/', WidgetConfigPublicView.as_view(), name='widget_config'),
]