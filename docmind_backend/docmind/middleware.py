from django.http import HttpResponse


class WidgetCorsMiddleware:
    """
    Adds CORS headers only for /api/widget/* — any origin allowed here,
    since actual access control is the domain allowlist inside
    chat.authentication.APIKeyAuthentication, not CORS itself.
    Dashboard/auth/org endpoints are untouched and keep using
    django-cors-headers' strict CORS_ALLOWED_ORIGINS.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        is_widget_path = request.path.startswith('/api/widget/')

        if is_widget_path and request.method == 'OPTIONS':
            response = HttpResponse()
        else:
            response = self.get_response(request)

        if is_widget_path:
            origin = request.headers.get('Origin')
            if origin:
                response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Headers'] = 'Content-Type, X-Public-Key'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Max-Age'] = '86400'

        return response