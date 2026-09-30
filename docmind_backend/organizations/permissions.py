from rest_framework.permissions import BasePermission
from .models import Membership


def _org_of(obj):
    return obj if hasattr(obj, 'memberships') else obj.organization


class IsOrgMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(organization=_org_of(obj), user=request.user).exists()


class IsOrgAdmin(BasePermission):
    """Owner or admin."""

    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(
            organization=_org_of(obj),
            user=request.user,
            role__in=[Membership.Role.OWNER, Membership.Role.ADMIN],
        ).exists()


class IsOrgOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(
            organization=_org_of(obj), user=request.user, role=Membership.Role.OWNER
        ).exists()