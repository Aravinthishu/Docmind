from rest_framework.throttling import SimpleRateThrottle


class APIKeyThrottle(SimpleRateThrottle):
    scope = 'widget_chat'

    def get_cache_key(self, request, view):
        api_key = getattr(request, 'auth', None)
        if not api_key:
            return None
        return self.cache_format % {'scope': self.scope, 'ident': api_key.public_key}


class FeedbackThrottle(APIKeyThrottle):
    scope = 'widget_feedback'