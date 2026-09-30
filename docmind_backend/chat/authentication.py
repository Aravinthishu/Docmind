from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from organizations.models import APIKey


class APIKeyAuthentication(BaseAuthentication):
    """
    Widget sends the public key in header X-Public-Key.
    Validates the key is active AND the request Origin matches
    the org's allowed_domains (if any are configured).
    Returns (None, api_key) — no logged-in user, just the resolved key.
    """

    def authenticate(self, request):
        public_key = request.headers.get('X-Public-Key')
        if not public_key:
            return None

        try:
            api_key = APIKey.objects.select_related('organization', 'organization__widget_config').get(
                public_key=public_key, is_active=True
            )
        except APIKey.DoesNotExist:
            raise AuthenticationFailed('Invalid or inactive API key')

        if api_key.allowed_domains:
            origin = request.headers.get('Origin', '')
            domain = origin.replace('https://', '').replace('http://', '').split('/')[0]
            if domain not in api_key.allowed_domains:
                raise AuthenticationFailed(f'Domain "{domain}" not authorized for this key')

        return (None, api_key)