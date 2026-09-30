import secrets
from django.conf import settings
from django.db import models
from datetime import timedelta
from django.utils import timezone


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_organizations')
    monthly_query_limit = models.PositiveIntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('organization', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"


class WidgetConfig(models.Model):
    POSITION_CHOICES = [('bottom-right', 'Bottom Right'), ('bottom-left', 'Bottom Left')]

    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='widget_config')
    bot_name = models.CharField(max_length=100, default='Assistant')
    welcome_message = models.CharField(max_length=255, default='Hi! How can I help you today?')
    primary_color = models.CharField(max_length=7, default='#4F46E5')
    font_family = models.CharField(max_length=100, default='Inter, sans-serif')
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='bottom-right')
    logo_url = models.URLField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Widget config for {self.organization.name}"


def generate_public_key():
    return f"pk_{secrets.token_hex(24)}"


def generate_secret_key():
    return f"sk_{secrets.token_hex(24)}"


class APIKey(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='api_keys')
    public_key = models.CharField(max_length=64, unique=True, default=generate_public_key)
    secret_key = models.CharField(max_length=64, unique=True, default=generate_secret_key)
    allowed_domains = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization.name} - {self.public_key}"

def generate_invite_token():
    return secrets.token_urlsafe(32)


def default_invite_expiry():
    return timezone.now() + timedelta(days=7)


class Invitation(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=10, choices=Membership.Role.choices, default=Membership.Role.MEMBER)
    token = models.CharField(max_length=64, unique=True, default=generate_invite_token)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_invite_expiry)
    accepted_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.email} -> {self.organization.name} ({self.role})"