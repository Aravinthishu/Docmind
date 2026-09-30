from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from organizations.models import Organization
from organizations.permissions import IsOrgMember
from .models import ChatLog
from .views import get_month_start


class UsageStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]

    def get(self, request, org_pk):
        org = get_object_or_404(Organization, pk=org_pk)
        self.check_object_permissions(request, org)

        thirty_days_ago = timezone.now() - timedelta(days=30)

        daily = (
            ChatLog.objects.filter(organization=org, created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        month_count = ChatLog.objects.filter(organization=org, created_at__gte=get_month_start()).count()
        total_count = ChatLog.objects.filter(organization=org).count()

        return Response({
            'daily': [{'date': d['date'].isoformat(), 'count': d['count']} for d in daily],
            'month_to_date': month_count,
            'monthly_limit': org.monthly_query_limit,
            'total_all_time': total_count,
        })


class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]

    def get(self, request, org_pk):
        org = get_object_or_404(Organization, pk=org_pk)
        self.check_object_permissions(request, org)

        logs = ChatLog.objects.filter(organization=org).exclude(session_id='')

        sessions = list(
            logs.values('session_id')
            .annotate(
                message_count=Count('id'),
                last_activity=Max('created_at'),
                thumbs_up=Count('id', filter=Q(feedback=1)),
                thumbs_down=Count('id', filter=Q(feedback=-1)),
            )
            .order_by('-last_activity')[:100]
        )

        # first question of each session, used as the list preview
        previews = {}
        rows = logs.filter(session_id__in=[s['session_id'] for s in sessions]).order_by('created_at').values('session_id', 'question')
        for row in rows:
            previews.setdefault(row['session_id'], row['question'])

        return Response({
            'sessions': [
                {
                    'session_id': s['session_id'],
                    'preview': previews.get(s['session_id'], '')[:120],
                    'message_count': s['message_count'],
                    'last_activity': s['last_activity'].isoformat(),
                    'thumbs_up': s['thumbs_up'],
                    'thumbs_down': s['thumbs_down'],
                }
                for s in sessions
            ],
            'summary': {
                'thumbs_up': logs.filter(feedback=1).count(),
                'thumbs_down': logs.filter(feedback=-1).count(),
            },
        })


class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]

    def get(self, request, org_pk, session_id):
        org = get_object_or_404(Organization, pk=org_pk)
        self.check_object_permissions(request, org)

        messages = list(ChatLog.objects.filter(organization=org, session_id=session_id).order_by('created_at'))
        if not messages:
            return Response({'detail': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'session_id': session_id,
            'messages': [
                {
                    'id': m.id,
                    'question': m.question,
                    'answer': m.answer,
                    'feedback': m.feedback,
                    'sources': m.sources,
                    'created_at': m.created_at.isoformat(),
                }
                for m in messages
            ],
        })