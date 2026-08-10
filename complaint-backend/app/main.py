from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import extraction, complaints

app = FastAPI(title="Complaint Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extraction.router)
app.include_router(complaints.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}