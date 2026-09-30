from django.core.management.base import BaseCommand

from documents.models import Document
from documents.ingestion import ingest_document
from documents.tasks import ingest_document_task


class Command(BaseCommand):
    help = "Re-chunk and re-embed existing documents with the current chunking strategy."

    def add_arguments(self, parser):
        parser.add_argument('--org', type=int, help='Only re-index this organization id')
        parser.add_argument('--sync', action='store_true', help='Run here instead of queuing to Celery')

    def handle(self, *args, **opts):
        docs = Document.objects.exclude(status=Document.Status.PROCESSING)
        if opts['org']:
            docs = docs.filter(organization_id=opts['org'])

        total = docs.count()
        self.stdout.write(f"Re-indexing {total} document(s)...")

        for doc in docs:
            if opts['sync']:
                try:
                    ingest_document(doc)
                    self.stdout.write(self.style.SUCCESS(f"  ok      {doc.original_filename}"))
                except Exception as e:
                    self.stderr.write(f"  failed  {doc.original_filename}: {e}")
            else:
                ingest_document_task.delay(doc.id)
                self.stdout.write(f"  queued  {doc.original_filename}")