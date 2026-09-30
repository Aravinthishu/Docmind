from django.db import models
from organizations.models import Organization


class ChatLog(models.Model):
    class Feedback(models.IntegerChoices):
        DOWN = -1, 'Not helpful'
        NONE = 0, 'No feedback'
        UP = 1, 'Helpful'

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='chat_logs')
    session_id = models.CharField(max_length=100, blank=True, db_index=True)
    question = models.TextField()
    answer = models.TextField()
    feedback = models.SmallIntegerField(choices=Feedback.choices, default=Feedback.NONE)
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization.name}: {self.question[:50]}"