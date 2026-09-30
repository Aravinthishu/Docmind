from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from organizations.team_views import InvitationPreviewView, InvitationAcceptView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('organizations.urls')),
    path('api/organizations/<int:org_pk>/', include('documents.urls')),
    path('api/organizations/<int:org_pk>/', include('chat.dashboard_urls')),
    path('api/organizations/<int:org_pk>/', include('organizations.team_urls')),
    path('api/invitations/<str:token>/', InvitationPreviewView.as_view(), name='invitation_preview'),
    path('api/invitations/<str:token>/accept/', InvitationAcceptView.as_view(), name='invitation_accept'),
    path('api/widget/', include('chat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)