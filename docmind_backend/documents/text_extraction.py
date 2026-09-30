from pathlib import Path
from pypdf import PdfReader

def extract_text(file_path):
    ext = Path(file_path).suffix.lower()
    if ext == '.pdf':
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}")