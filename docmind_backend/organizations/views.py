from django.utils.text import slugify
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Organization, Membership, WidgetConfig, APIKey
from .serializers import OrganizationSerializer, WidgetConfigSerializer, APIKeySerializer
from .permissions import IsOrgMember, IsOrgAdmin, IsOrgOwner


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsOrgOwner()]

        admin_only = (
            self.action in ('update', 'partial_update', 'update_api_key')
            or (self.action == 'api_keys' and self.request.method == 'POST')
        )
        if admin_only:
            return [permissions.IsAuthenticated(), IsOrgAdmin()]
        return [permissions.IsAuthenticated(), IsOrgMember()]

    def _is_admin(self, org):
        return Membership.objects.filter(
            organization=org, user=self.request.user, role__in=['owner', 'admin']
        ).exists()

    def perform_create(self, serializer):
        name = serializer.validated_data['name']
        org = serializer.save(owner=self.request.user, slug=slugify(name))
        Membership.objects.create(organization=org, user=self.request.user, role=Membership.Role.OWNER)
        WidgetConfig.objects.create(organization=org)
        APIKey.objects.create(organization=org)

    @action(detail=True, methods=['get', 'patch'], url_path='widget-config')
    def widget_config(self, request, pk=None):
        org = self.get_object()
        config = org.widget_config
        if request.method == 'GET':
            return Response(WidgetConfigSerializer(config).data)
        serializer = WidgetConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='api-keys')
    def api_keys(self, request, pk=None):
        org = self.get_object()
        if request.method == 'GET':
            data = APIKeySerializer(org.api_keys.all(), many=True).data
            if not self._is_admin(org):
                data = [{k: v for k, v in item.items() if k != 'secret_key'} for item in data]
            return Response(data)
        key = APIKey.objects.create(organization=org)
        return Response(APIKeySerializer(key).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path=r'api-keys/(?P<key_id>\d+)')
    def update_api_key(self, request, pk=None, key_id=None):
        org = self.get_object()
        try:
            key = org.api_keys.get(id=key_id)
        except APIKey.DoesNotExist:
            return Response({'detail': 'Key not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = APIKeySerializer(key, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)