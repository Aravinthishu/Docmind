from rest_framework import serializers
from .models import Organization, WidgetConfig, APIKey, Membership, Invitation


class WidgetConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetConfig
        fields = ['bot_name', 'welcome_message', 'primary_color', 'font_family',
                  'position', 'logo_url', 'is_published', 'updated_at']


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['id', 'public_key', 'secret_key', 'allowed_domains', 'is_active', 'created_at']
        read_only_fields = ['public_key', 'secret_key', 'created_at']


class OrganizationSerializer(serializers.ModelSerializer):
    widget_config = WidgetConfigSerializer(read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'created_at', 'widget_config', 'role']
        read_only_fields = ['slug', 'created_at']

    def get_role(self, obj):
        request = self.context.get('request')
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None


class MemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    is_you = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'joined_at', 'is_you']

    def get_is_you(self, obj):
        request = self.context.get('request')
        return bool(request and obj.user_id == request.user.id)


class InvitationSerializer(serializers.ModelSerializer):
    invited_by = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invitation
        fields = ['id', 'email', 'role', 'token', 'invited_by', 'created_at', 'expires_at', 'is_expired']

    def get_invited_by(self, obj):
        return obj.invited_by.email if obj.invited_by else None