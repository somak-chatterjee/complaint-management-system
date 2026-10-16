import logging

from fastapi import APIRouter, HTTPException
from groq import APIError, RateLimitError

from app.models.schemas import ChatRequest, ChatResponse
from app.services.extraction_agent import client, FAST_MODEL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

MAX_SOURCE_CHARS = 6000
MAX_HISTORY = 8

SYSTEM_PROMPT = """You are an assistant helping a pharmaceutical quality assurance reviewer with a customer complaint.
You are given the original complaint text and the current values of the intake form.

Rules:
- Answer using only the complaint text and form values below. If the answer is not there, say so; do not guess.
- When asked about a form value, point to the wording in the complaint that supports it, or say it was inferred.
- You cannot change the form. If a value looks wrong, suggest what to enter and let the reviewer edit it.
- Do not give medical or regulatory advice. For safety questions, state what the complaint reports and recommend QA review.
- Keep answers under 120 words.
- Reply in plain text only. Do not use markdown, asterisks, bullets or headings.
- When you explain a value, quote the supporting phrase from the complaint in double quotation marks, including any hedging words such as "as far as I know".

COMPLAINT TEXT:
{source}

CURRENT FORM VALUES:
{form}
"""


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    raw = (payload.raw_text or "").strip()
    form = {k: v for k, v in payload.form.items() if v}

    if not raw and not form:
        return ChatResponse(reply="There is no complaint loaded yet. Upload or paste one first, then ask me about it.")

    source = raw[:MAX_SOURCE_CHARS] or "(the original complaint text is not available; rely only on the form values below)"
    form_text = "\n".join(f"- {k}: {v}" for k, v in form.items()) or "(form is empty)"

    history = payload.history[-MAX_HISTORY:]
    while history and history[0].role == "assistant":
        history = history[1:]  # drop the leading greeting; the conversation should start with the user

    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(source=source, form=form_text)}]
    messages += [{"role": m.role, "content": m.text} for m in history]
    messages.append({"role": "user", "content": payload.message})

    try:
        response = client.chat.completions.create(model=FAST_MODEL, messages=messages, temperature=0.2)
    except RateLimitError:
        raise HTTPException(status_code=429, detail="The AI service is busy. Please try again in a minute.")
    except APIError:
        logger.exception("Groq chat call failed")
        raise HTTPException(status_code=502, detail="The AI service returned an error. Please try again.")

    reply = (response.choices[0].message.content or "").strip()
    reply = reply.replace("**", "").replace("`", "").replace("\u2011", "-")
    return ChatResponse(reply=reply or "I couldn't produce an answer. Please try rephrasing.")