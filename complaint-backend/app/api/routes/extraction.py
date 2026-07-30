import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect

from app.models.schemas import (
    DocumentTextResponse,
    ExtractionRequest,
    ExtractionProgressMessage,
    WSExtractionRequest,
)
from app.services.document_parser import parse_document, UnsupportedFileTypeError
from app.services.extraction_agent import (
    extract_with_fast_model,
    extract_with_powerful_model,
    route_after_fast_extraction,
)

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

@router.websocket("/ws")
async def extraction_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        payload = WSExtractionRequest.model_validate_json(raw)

        state = {
            "raw_text": payload.raw_text,
            "model_used": "",
            "extraction_result": None,
            "needs_escalation": False,
            "error": None,
        }

        await websocket.send_json(
            ExtractionProgressMessage(status="progress", progress=10).model_dump(mode="json")
        )

        # Run the blocking Groq call in a thread so it doesn't freeze the event loop
        state = await asyncio.to_thread(extract_with_fast_model, state)

        await websocket.send_json(
            ExtractionProgressMessage(status="progress", progress=55).model_dump(mode="json")
        )

        if route_after_fast_extraction(state) == "escalate":
            await websocket.send_json(
                ExtractionProgressMessage(status="progress", progress=75).model_dump(mode="json")
            )
            state = await asyncio.to_thread(extract_with_powerful_model, state)
            await websocket.send_json(
                ExtractionProgressMessage(status="progress", progress=95).model_dump(mode="json")
            )

        if state.get("error") or state.get("extraction_result") is None:
            await websocket.send_json(
                ExtractionProgressMessage(
                    status="error",
                    error=state.get("error") or "Extraction failed with no result",
                ).model_dump(mode="json")
            )
        else:
            await websocket.send_json(
                ExtractionProgressMessage(
                    status="complete",
                    progress=100,
                    result=state["extraction_result"],
                ).model_dump(mode="json")
            )

    except WebSocketDisconnect:
        pass
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed