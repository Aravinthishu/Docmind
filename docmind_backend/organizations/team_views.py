from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organization, Membership, Invitation
from .serializers import MemberSerializer, InvitationSerializer

RANK = {'member': 1, 'admin': 2, 'owner': 3}


def get_org_and_membership(request, org_pk):
    org = get_object_or_404(Organization, pk=org_pk)
    membership = get_object_or_404(Membership, organization=org, user=request.user)
    return org, membership


def require_admin(membership):
    if membership.role not in ('owner', 'admin'):
        raise PermissionDenied('Only owners and admins can manage the team.')


class MembersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, org_pk):
        org, _ = get_org_and_membership(request, org_pk)
        members = sorted(
            org.memberships.select_related('user'),
            key=lambda m: (-RANK[m.role], m.joined_at),
        )
        return Response(MemberSerializer(members, many=True, context={'request': request}).data)


class MemberDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, org_pk, member_id):
        org, me = get_org_and_membership(request, org_pk)
        if me.role != 'owner':
            raise PermissionDenied('Only the owner can change roles.')

        target = get_object_or_404(Membership, pk=member_id, organization=org)
        if target.role == 'owner':
            raise PermissionDenied("The owner's role can't be changed.")

        role = request.data.get('role')
        if role not in ('admin', 'member'):
            return Response({'detail': 'Role must be admin or member.'}, status=status.HTTP_400_BAD_REQUEST)

        target.role = role
        target.save(update_fields=['role'])
        return Response(MemberSerializer(target, context={'request': request}).data)

    def delete(self, request, org_pk, member_id):
        org, me = get_org_and_membership(request, org_pk)
        target = get_object_or_404(Membership, pk=member_id, organization=org)

        if target.id == me.id:
            if me.role == 'owner':
                raise PermissionDenied("The owner can't leave. Delete the organization from Settings instead.")
        else:
            require_admin(me)
            if RANK[target.role] >= RANK[me.role]:
                raise PermissionDenied("You can't remove someone with an equal or higher role.")

        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvitationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, org_pk):
        org, me = get_org_and_membership(request, org_pk)
        require_admin(me)
        invites = org.invitations.filter(accepted_at__isnull=True).select_related('invited_by').order_by('-created_at')
        return Response(InvitationSerializer(invites, many=True).data)

    def post(self, request, org_pk):
        org, me = get_org_and_membership(request, org_pk)
        require_admin(me)

        email = (request.data.get('email') or '').strip().lower()
        role = request.data.get('role', 'member')

        try:
            validate_email(email)
        except ValidationError:
            return Response({'detail': 'Enter a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)

        if role not in ('admin', 'member'):
            return Response({'detail': 'Role must be admin or member.'}, status=status.HTTP_400_BAD_REQUEST)
        if role == 'admin' and me.role != 'owner':
            raise PermissionDenied('Only the owner can invite admins.')

        if Membership.objects.filter(organization=org, user__email__iexact=email).exists():
            return Response({'detail': 'This person is already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        # one live invite per email: a new one replaces any older pending one
        org.invitations.filter(email__iexact=email, accepted_at__isnull=True).delete()
        invite = Invitation.objects.create(organization=org, email=email, role=role, invited_by=request.user)
        return Response(InvitationSerializer(invite).data, status=status.HTTP_201_CREATED)


class InvitationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, org_pk, invite_id):
        org, me = get_org_and_membership(request, org_pk)
        require_admin(me)
        invite = get_object_or_404(Invitation, pk=invite_id, organization=org, accepted_at__isnull=True)
        invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvitationPreviewView(APIView):
    """Public: lets the invite page show who invited you before you log in."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        invite = get_object_or_404(
            Invitation.objects.select_related('organization', 'invited_by'),
            token=token, accepted_at__isnull=True,
        )
        return Response({
            'organization': invite.organization.name,
            'email': invite.email,
            'role': invite.role,
            'invited_by': invite.invited_by.email if invite.invited_by else None,
            'is_expired': invite.is_expired,
        })


class InvitationAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        invite = get_object_or_404(
            Invitation.objects.select_related('organization'),
            token=token, accepted_at__isnull=True,
        )

        if invite.is_expired:
            return Response(
                {'detail': 'This invitation has expired. Ask for a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.email.lower() != invite.email.lower():
            return Response(
                {'detail': f'This invitation was sent to {invite.email}. Sign in with that email to accept it.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        Membership.objects.get_or_create(
            organization=invite.organization,
            user=request.user,
            defaults={'role': invite.role},
        )
        invite.accepted_at = timezone.now()
        invite.save(update_fields=['accepted_at'])

        return Response({'organization_id': invite.organization_id})