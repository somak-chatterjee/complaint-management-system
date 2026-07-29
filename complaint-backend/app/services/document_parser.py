import io
from email import policy
from email.parser import BytesParser

from docx import Document as DocxDocument
from pypdf import PdfReader


class UnsupportedFileTypeError(Exception):
    pass


def parse_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def parse_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs]
    return "\n".join(paragraphs).strip()


def parse_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace").strip()


def parse_eml(file_bytes: bytes) -> str:
    msg = BytesParser(policy=policy.default).parsebytes(file_bytes)
    body = msg.get_body(preferencelist=("plain", "html"))
    if body is None:
        return ""
    return body.get_content().strip()


def parse_document(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return parse_pdf(file_bytes)
    elif ext == "docx":
        return parse_docx(file_bytes)
    elif ext == "txt":
        return parse_txt(file_bytes)
    elif ext == "eml":
        return parse_eml(file_bytes)
    else:
        raise UnsupportedFileTypeError(f"Unsupported file type: .{ext}")