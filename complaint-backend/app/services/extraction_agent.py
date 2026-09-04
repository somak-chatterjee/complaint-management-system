import json
from typing import TypedDict, Optional

from groq import Groq
from langgraph.graph import StateGraph, END
from pydantic import ValidationError

from app.core.config import settings
from app.models.schemas import ComplaintExtraction

client = Groq(api_key=settings.groq_api_key)

FAST_MODEL = "openai/gpt-oss-20b"
POWERFUL_MODEL = "openai/gpt-oss-120b"
CONFIDENCE_ESCALATION_THRESHOLD = 0.6

EXTRACTION_PROMPT_TEMPLATE = """You are a pharmaceutical quality assurance assistant. Extract complaint details from the text below into STRICT JSON matching this schema exactly. Respond with ONLY the JSON object — no preamble, no markdown fences, no explanation.

Field notes:
- complaintSource: the CHANNEL the complaint came through (e.g. "Customer Email", "Phone Call", "Distributor Report", "Physician Report"), NOT the person's name.
- customerName: the name of the person or organization who filed the complaint.
- initialSeverity and priority must be plain string values only (for example "Minor" or "Medium") — do NOT wrap them in an object like the other fields.

Schema:
{{
    "complaintSource": {{"value": string or null, "confidence": float 0-1 or null}},
    "customerName": {{"value": string or null, "confidence": float 0-1 or null}},
    "productName": {{"value": string or null, "confidence": float 0-1 or null}},
    "productStrength": {{"value": string or null, "confidence": float 0-1 or null}},
    "batchNumber": {{"value": string or null, "confidence": float 0-1 or null}},
    "manufacturingDate": {{"value": string or null, "confidence": float 0-1 or null}},
    "expiryDate": {{"value": string or null, "confidence": float 0-1 or null}},
    "quantityAffected": {{"value": string or null, "confidence": float 0-1 or null}},
    "complaintType": {{"value": string or null, "confidence": float 0-1 or null}},
    "complaintDate": {{"value": string or null, "confidence": float 0-1 or null}},
    "complaintDescription": {{"value": string or null, "confidence": float 0-1 or null}},
    "initialSeverity": "Critical" or "Major" or "Minor" or null,
    "priority": "High" or "Medium" or "Low" or null
}}

Confidence should reflect how explicitly the text states each value — high (0.8+) if directly stated, lower if you had to infer it.

Text to extract from:
\"\"\"{raw_text}\"\"\"
"""


class ExtractionState(TypedDict):
    raw_text: str
    model_used: str
    extraction_result: Optional[ComplaintExtraction]
    needs_escalation: bool
    error: Optional[str]


def _call_groq_and_parse(raw_text: str, model: str) -> ComplaintExtraction:
    prompt = EXTRACTION_PROMPT_TEMPLATE.format(raw_text=raw_text)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    data = json.loads(content)
    return ComplaintExtraction.model_validate(data)


TEXT_FIELDS = [
    "complaintSource", "customerName", "productName", "productStrength",
    "batchNumber", "quantityAffected", "complaintType", "complaintDescription",
]


def _average_confidence(result: ComplaintExtraction) -> float:
    scores = [
        getattr(result, name).confidence or 0.0
        for name in TEXT_FIELDS
    ]
    return sum(scores) / len(scores) if scores else 0.0


def extract_with_fast_model(state: ExtractionState) -> ExtractionState:
    try:
        result = _call_groq_and_parse(state["raw_text"], FAST_MODEL)
        avg_conf = _average_confidence(result)
        return {
            **state,
            "extraction_result": result,
            "model_used": FAST_MODEL,
            "needs_escalation": avg_conf <= CONFIDENCE_ESCALATION_THRESHOLD,
            "error": None,
        }
    except (json.JSONDecodeError, ValidationError) as e:
        return {**state, "error": str(e), "needs_escalation": True}


def extract_with_powerful_model(state: ExtractionState) -> ExtractionState:
    try:
        result = _call_groq_and_parse(state["raw_text"], POWERFUL_MODEL)
        return {**state, "extraction_result": result, "model_used": POWERFUL_MODEL, "error": None}
    except (json.JSONDecodeError, ValidationError) as e:
        return {**state, "error": str(e)}


def route_after_fast_extraction(state: ExtractionState) -> str:
    return "escalate" if state.get("needs_escalation") else "done"


def build_extraction_graph():
    graph = StateGraph(ExtractionState)
    graph.add_node("extract_fast", extract_with_fast_model)
    graph.add_node("extract_powerful", extract_with_powerful_model)

    graph.set_entry_point("extract_fast")
    graph.add_conditional_edges(
        "extract_fast",
        route_after_fast_extraction,
        {"escalate": "extract_powerful", "done": END},
    )
    graph.add_edge("extract_powerful", END)

    return graph.compile()


extraction_graph = build_extraction_graph()