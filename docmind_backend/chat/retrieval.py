import hashlib
import logging
import re

from django.conf import settings
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from documents.ingestion import get_embedding_model, get_chroma_client, get_collection_name

logger = logging.getLogger(__name__)

RERANK_MODEL = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
CANDIDATES = 10   # how many each retriever (vector, BM25) contributes
RERANK_POOL = 8   # how many fused candidates go to the cross-encoder
FINAL_K = 4       # chunks that reach the LLM
RRF_K = 60

_reranker = None
_bm25_cache = {}  # org_id -> index built from that org's chunks


def _tokenize(text):
    return re.findall(r"\w+", text.lower())


def get_reranker():
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(RERANK_MODEL)
    return _reranker


def _get_collection(org):
    try:
        return get_chroma_client().get_collection(get_collection_name(org))
    except Exception:
        return None


def _get_bm25(org, collection):
    """Build the keyword index once per org and reuse it until the org's chunks change."""
    ids = collection.get(include=[])['ids']
    if not ids:
        return None

    signature = hashlib.md5('|'.join(sorted(ids)).encode()).hexdigest()
    cached = _bm25_cache.get(org.id)
    if cached and cached['signature'] == signature:
        return cached

    data = collection.get(include=['documents', 'metadatas'])
    cached = {
        'signature': signature,
        'ids': data['ids'],
        'docs': data['documents'],
        'metas': data['metadatas'],
        'bm25': BM25Okapi([_tokenize(d) for d in data['documents']]),
    }
    _bm25_cache[org.id] = cached
    return cached


def _vector_search(collection, query, n):
    embedding = get_embedding_model().encode([query]).tolist()
    res = collection.query(
        query_embeddings=embedding,
        n_results=min(n, collection.count()),
        include=['documents', 'metadatas'],
    )
    return res['ids'][0], res['documents'][0], res['metadatas'][0]


def _bm25_search(cached, query, n):
    tokens = _tokenize(query)
    if not tokens:
        return []
    scores = cached['bm25'].get_scores(tokens)
    top = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n]
    return [i for i in top if scores[i] > 0]


def retrieve(org, query, mode='full', final_k=FINAL_K):
    """
    mode:
      'vector'  embeddings only (what we had before)
      'hybrid'  vector + BM25, merged with Reciprocal Rank Fusion
      'full'    hybrid, then cross-encoder rerank and a relevance cutoff

    Returns a list of {'text', 'filename', 'score'}, best first.
    """
    collection = _get_collection(org)
    if collection is None or collection.count() == 0:
        return []

    v_ids, v_docs, v_metas = _vector_search(collection, query, CANDIDATES)
    pool = {cid: (doc, meta) for cid, doc, meta in zip(v_ids, v_docs, v_metas)}

    def result(cid, score=None):
        text, meta = pool[cid]
        return {'text': text, 'filename': (meta or {}).get('filename', ''), 'score': score}

    if mode == 'vector':
        return [result(cid) for cid in v_ids[:final_k]]

    cached = _get_bm25(org, collection)
    bm_ids = []
    if cached:
        for i in _bm25_search(cached, query, CANDIDATES):
            cid = cached['ids'][i]
            bm_ids.append(cid)
            pool.setdefault(cid, (cached['docs'][i], cached['metas'][i]))

    fused = {}
    for ranking in (v_ids, bm_ids):
        for rank, cid in enumerate(ranking):
            fused[cid] = fused.get(cid, 0) + 1 / (RRF_K + rank + 1)
    ranked = sorted(fused, key=fused.get, reverse=True)

    if mode == 'hybrid':
        return [result(cid) for cid in ranked[:final_k]]

    # full: cross-encoder reads (question, chunk) together
    candidates = ranked[:RERANK_POOL]
    scores = get_reranker().predict([(query, pool[cid][0]) for cid in candidates])
    scored = sorted(zip(candidates, (float(s) for s in scores)), key=lambda x: x[1], reverse=True)

    logger.info("rerank scores for %r: %s", query[:60], [round(s, 2) for _, s in scored])

    min_score = getattr(settings, 'RAG_MIN_RERANK_SCORE', None)
    return [
        result(cid, s)
        for cid, s in scored[:final_k]
        if min_score is None or s >= min_score
    ]