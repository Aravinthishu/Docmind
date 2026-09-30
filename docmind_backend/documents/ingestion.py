from django.conf import settings
from django.utils import timezone
import chromadb
from sentence_transformers import SentenceTransformer

from .chunking import chunk_text
from .text_extraction import extract_text

_model = None
_chroma_client = None


def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=str(settings.BASE_DIR / 'chroma_db'))
    return _chroma_client


def get_collection_name(organization):
    return f"org_{organization.id}"


def ingest_document(document):
    document.status = document.Status.PROCESSING
    document.save(update_fields=['status'])

    try:
        text = extract_text(document.file.path)
        chunks = chunk_text(text)

        if not chunks:
            raise ValueError("No extractable text found in document")

        embeddings = get_embedding_model().encode(chunks).tolist()

        client = get_chroma_client()
        collection = client.get_or_create_collection(get_collection_name(document.organization))

        # idempotent: wipe this document's earlier chunks first (re-index or Celery retry)
        collection.delete(where={"document_id": document.id})

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=[f"doc{document.id}_chunk{i}" for i in range(len(chunks))],
            metadatas=[
                {"document_id": document.id, "filename": document.original_filename, "chunk_index": i}
                for i in range(len(chunks))
            ],
        )

        document.status = document.Status.COMPLETED
        document.chunk_count = len(chunks)
        document.error_message = None
        document.processed_at = timezone.now()
        document.save(update_fields=['status', 'chunk_count', 'error_message', 'processed_at'])

    except Exception as e:
        document.status = document.Status.FAILED
        document.error_message = str(e)
        document.save(update_fields=['status', 'error_message'])
        raise