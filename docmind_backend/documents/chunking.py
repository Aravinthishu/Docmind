import re

SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]


def _split(text, size, separators):
    """Recursively split text into pieces of at most `size` characters,
    preferring the most natural boundary (paragraph > line > sentence > word)."""
    if len(text) <= size:
        return [text]
    if not separators:
        return [text[i:i + size] for i in range(0, len(text), size)]

    sep, rest = separators[0], separators[1:]
    if sep not in text:
        return _split(text, size, rest)

    parts = text.split(sep)
    pieces = []
    for i, part in enumerate(parts):
        part = part + sep if i < len(parts) - 1 else part
        pieces.extend(_split(part, size, rest) if len(part) > size else [part])
    return pieces


def chunk_text(text, size=900, overlap=150):
    """Chunks stay close to `size` characters. The overlap carried into the next
    chunk can push a chunk slightly over that."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []

    pieces = _split(text, size, SEPARATORS)

    chunks, current = [], ""
    for piece in pieces:
        if current and len(current) + len(piece) > size:
            chunks.append(current.strip())
            tail = current[-overlap:] if overlap else ""
            space = tail.find(" ")
            tail = tail[space + 1:] if space != -1 else tail  # start overlap on a word boundary
            current = tail + piece
        else:
            current += piece

    if current.strip():
        chunks.append(current.strip())
    return [c for c in chunks if c]