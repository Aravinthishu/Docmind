from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from organizations.models import Organization
from organizations.permissions import IsOrgMember
from .models import Document
from .serializers import DocumentSerializer
from .ingestion import ingest_document
from .tasks import ingest_document_task

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_organization(self):
        org = Organization.objects.get(pk=self.kwargs['org_pk'])
        self.check_object_permissions(self.request, org)
        return org

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsOrgMember()]

    def get_queryset(self):
        return Document.objects.filter(organization=self.get_organization())

    def perform_create(self, serializer):
        org = self.get_organization()
        document = serializer.save(
            organization=org,
            original_filename=self.request.FILES['file'].name
        )
        ingest_document_task.delay(document.id)

    def perform_destroy(self, instance):
        from .ingestion import get_chroma_client, get_collection_name
        try:
            client = get_chroma_client()
            collection = client.get_collection(get_collection_name(instance.organization))
            ids = [f"doc{instance.id}_chunk{i}" for i in range(instance.chunk_count)]
            if ids:
                collection.delete(ids=ids)
        except Exception:
            pass  # collection may not exist if ingestion never completed
        instance.delete()