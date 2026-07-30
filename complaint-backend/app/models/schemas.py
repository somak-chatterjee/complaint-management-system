from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum
from datetime import datetime
from dateutil import parser as date_parser
from pydantic import model_validator


def normalize_date_string(raw: str) -> tuple[Optional[str], bool]:
    """
    Attempts to normalize a messy LLM-extracted date string to ISO format.
    Returns (normalized_value, needs_review).
    Uses two different default dates to detect whether the parser had
    to guess a missing day/month/year — if the two parses disagree,
    the original string was incomplete.
    """
    default_a = datetime(1904, 1, 1)
    default_b = datetime(2004, 12, 31)
    try:
        parsed_a = date_parser.parse(raw, fuzzy=True, default=default_a)
        parsed_b = date_parser.parse(raw, fuzzy=True, default=default_b)
    except (ValueError, OverflowError):
        return raw, True  # totally unparseable — keep raw, flag it

    if parsed_a.date() == parsed_b.date():
        return parsed_a.strftime("%Y-%m-%d"), False  # fully specified date
    else:
        return raw, True  # ambiguous/partial — keep original raw string, flag it

class DocumentTextResponse(BaseModel):
    filename: str
    char_count: int
    raw_text: str

class ExtractedField(BaseModel):
    """A single extracted value plus how confident the model is about it."""
    value: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class ExtractedDateField(ExtractedField):
    """
    Same as ExtractedField, but normalizes `value` to ISO format (YYYY-MM-DD)
    when the date is fully specified. If the date is partial or ambiguous,
    the raw LLM output is kept as-is and `needs_review` is set, so the
    frontend can visually flag it instead of silently trusting a guess.
    """
    needs_review: bool = False

    @model_validator(mode="after")
    def normalize(self):
        if self.value:
            normalized, needs_review = normalize_date_string(self.value)
            self.value = normalized
            self.needs_review = needs_review
        return self


class Severity(str, Enum):
    CRITICAL = "Critical"
    MAJOR = "Major"
    MINOR = "Minor"


class Priority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class ExtractedField(BaseModel):
    """A single extracted value plus how confident the model is about it."""
    value: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class ComplaintExtraction(BaseModel):
    """
    Structured output the LLM must produce. Field names here match
    the Redux `complaintFormSlice` field keys exactly, so the frontend
    can map this response directly without renaming anything.
    """
    complaintSource: ExtractedField = ExtractedField()
    customerName: ExtractedField = ExtractedField()
    productName: ExtractedField = ExtractedField()
    productStrength: ExtractedField = ExtractedField()
    batchNumber: ExtractedField = ExtractedField()
    manufacturingDate: ExtractedDateField = ExtractedDateField()
    expiryDate: ExtractedDateField = ExtractedDateField()
    quantityAffected: ExtractedField = ExtractedField()
    complaintType: ExtractedField = ExtractedField()
    complaintDate: ExtractedDateField = ExtractedDateField()
    complaintDescription: ExtractedField = ExtractedField()
    initialSeverity: Optional[Severity] = None
    priority: Optional[Priority] = None

    @field_validator("initialSeverity", "priority", mode="before")
    @classmethod
    def unwrap_if_object(cls, v):
        """Tolerate the model occasionally wrapping these in the
        {value, confidence} shape used for text fields, instead of
        the plain string the schema actually expects."""
        if isinstance(v, dict) and "value" in v:
            return v["value"]
        return v


class ExtractionRequest(BaseModel):
    """Used when the user pastes text instead of uploading a file."""
    text: str = Field(..., min_length=1)


class ExtractionProgressMessage(BaseModel):
    """
    Shape of each message sent over the WebSocket during extraction.
    `status` lets the frontend distinguish a progress tick from the
    final payload without guessing from message content.
    """
    status: str  # "progress" | "field_extracted" | "complete" | "error"
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    field_name: Optional[str] = None
    field_value: Optional[ExtractedField] = None
    result: Optional[ComplaintExtraction] = None
    error: Optional[str] = None


class ComplaintRecord(BaseModel):
    """Full complaint as persisted in the database, once saved."""
    id: Optional[int] = None
    complaintSource: Optional[str] = None
    customerName: Optional[str] = None
    productName: Optional[str] = None
    productStrength: Optional[str] = None
    batchNumber: Optional[str] = None
    manufacturingDate: Optional[str] = None
    expiryDate: Optional[str] = None
    quantityAffected: Optional[str] = None
    complaintType: Optional[str] = None
    complaintDate: Optional[str] = None
    complaintDescription: Optional[str] = None
    initialSeverity: Optional[Severity] = None
    priority: Optional[Priority] = None
    status: str = "Pending Triage"