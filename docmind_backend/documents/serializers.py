from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'file', 'original_filename', 'status', 'chunk_count',
                  'error_message', 'uploaded_at', 'processed_at']
        read_only_fields = ['original_filename', 'status', 'chunk_count',
                             'error_message', 'uploaded_at', 'processed_at']