from celery import shared_task
from .models import Document
from .ingestion import ingest_document


@shared_task(bind=True, max_retries=2)
def ingest_document_task(self, document_id):
    try:
        document = Document.objects.get(id=document_id)
        ingest_document(document)
    except Document.DoesNotExist:
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)