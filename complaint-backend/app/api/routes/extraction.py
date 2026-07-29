from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import DocumentTextResponse, ExtractionRequest
from app.services.document_parser import parse_document, UnsupportedFileTypeError

router = APIRouter(prefix="/extraction", tags=["extraction"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB, matches the frontend's stated limit
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "eml"}


@router.post("/upload", response_model=DocumentTextResponse)
async def upload_document(file: UploadFile = File(...)):
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10MB size limit")

    try:
        raw_text = parse_document(file.filename, file_bytes)
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {e}")

    if not raw_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from this document")

    return DocumentTextResponse(filename=file.filename, char_count=len(raw_text), raw_text=raw_text)


@router.post("/text", response_model=DocumentTextResponse)
async def submit_text(payload: ExtractionRequest):
    raw_text = payload.text.strip()
    return DocumentTextResponse(filename="Pasted text", char_count=len(raw_text), raw_text=raw_text)