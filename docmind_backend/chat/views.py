from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .authentication import APIKeyAuthentication
from .permissions import HasValidAPIKey
from .throttling import APIKeyThrottle, FeedbackThrottle
from .models import ChatLog
from .rag import generate_answer, HISTORY_TURNS
from organizations.serializers import WidgetConfigSerializer


def get_month_start():
    now = timezone.now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


class ChatQueryView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [HasValidAPIKey]
    throttle_classes = [APIKeyThrottle]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = request.auth
        org = api_key.organization
        session_id = request.data.get('session_id', '')

        usage_count = ChatLog.objects.filter(organization=org, created_at__gte=get_month_start()).count()
        if usage_count >= org.monthly_query_limit:
            return Response(
                {'error': 'This assistant has reached its monthly query limit. Please contact the site owner.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        history = []
        if session_id:
            recent = ChatLog.objects.filter(organization=org, session_id=session_id).order_by('-created_at')[:HISTORY_TURNS]
            history = list(reversed(recent))

        answer, sources = generate_answer(org, message, history)

        log = ChatLog.objects.create(
            organization=org,
            session_id=session_id,
            question=message,
            answer=answer,
            sources=sources,
        )

        return Response({'answer': answer, 'log_id': log.id})


class FeedbackView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [HasValidAPIKey]
    throttle_classes = [FeedbackThrottle]

    def post(self, request):
        log_id = request.data.get('log_id')
        value = request.data.get('feedback')
        session_id = request.data.get('session_id', '')

        if value not in (1, -1, 0):
            return Response({'error': 'feedback must be 1, -1 or 0'}, status=status.HTTP_400_BAD_REQUEST)

        updated = ChatLog.objects.filter(
            id=log_id,
            organization=request.auth.organization,
            session_id=session_id,
        ).update(feedback=value)

        if not updated:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'ok': True})


class WidgetConfigPublicView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [HasValidAPIKey]

    def get(self, request):
        config = request.auth.organization.widget_config
        return Response(WidgetConfigSerializer(config).data)