from django.urls import path
from .team_views import MembersView, MemberDetailView, InvitationsView, InvitationDetailView

urlpatterns = [
    path('members/', MembersView.as_view(), name='org_members'),
    path('members/<int:member_id>/', MemberDetailView.as_view(), name='org_member_detail'),
    path('invitations/', InvitationsView.as_view(), name='org_invitations'),
    path('invitations/<int:invite_id>/', InvitationDetailView.as_view(), name='org_invitation_detail'),
]