# AI-Powered Customer Complaint Management System

An AI-assisted complaint intake tool for pharmaceutical manufacturing quality assurance. Users upload or paste a customer complaint (email, PDF, DOCX, or plain text), and an AI agent automatically extracts structured fields — product, batch number, dates, severity, and more — into a review form. A human reviews, corrects, and saves the final record.

Built as a full-stack project covering document parsing, LLM-based structured extraction with confidence-aware model escalation, real-time streaming, and persistence. A built-in AI chat assistant helps answering questions about the extracted complaint.

## What it does

1. **Upload or paste** a complaint document (PDF, DOCX, TXT, EML, or raw text)
2. **AI extraction** parses the document and pulls out structured fields — customer info, product/batch details, complaint description, severity, and priority — each with a confidence score
3. **Review in the form** — AI-populated fields are visually distinguished from manual entry, and fields the AI couldn't confidently resolve (e.g. an ambiguous date like "early spring") are flagged for human review instead of being silently guessed or dropped
4. **Save** — the reviewed complaint is persisted to a Postgres database
5. **Ask questions**: A chat assistant answers questions about the loaded complaint, drawing on the original text and the current form values. It is read-only, and it says so when something isn't stated.

**Design highlights:**
- **Confidence-based model escalation** — the fast model handles clear documents on its own; only documents where it reports low average confidence get re-run through the more expensive, more capable model. This was validated with real test documents, not just assumed to work.
- **Honest uncertainty over hallucination** — unstated fields come back `null` rather than invented, and partially-known values (e.g. a partial batch number) are extracted as-is rather than completed with a guess.
- **Ambiguous dates are flagged, not silently dropped** — a two-default date-parsing technique distinguishes a fully-specified date from a vague one (e.g. "early spring"). Vague dates are kept as raw text and flagged `needs_review`, and the frontend renders those as an editable text field with a warning instead of feeding them into a strict date picker that would silently discard them.

**Note on model choice:** the original spec called for `gemma2-9b-it`, which Groq deprecated on August 8, 2025 in favor of `llama-3.1-8b-instant`. Groq subsequently deprecated `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` as well (announced June 17, 2026, shut down August 16, 2026), migrating to `openai/gpt-oss-20b` and `openai/gpt-oss-120b` respectively — the models currently used in this project.

## Demo
![Demo](./CMS_demo.gif)

## Release status

**Current release: v1.1**, tagged `v1.1`. (v1.0 was the first prototype.)

### What's included in v1.1

- **Document intake**: upload PDF, DOCX, TXT or EML files (up to 10 MB), or paste complaint text
- **AI extraction**: a LangGraph agent fills 13 form fields. A fast model (`openai/gpt-oss-20b`) runs first and escalates to a stronger one (`openai/gpt-oss-120b`) when its average confidence is at or below 0.65
- **Confidence-aware form**: AI-filled fields show a confidence badge and are visually distinct from manual entry
- **Ambiguous dates flagged, not guessed**: vague dates such as "early spring" are kept as text with a review warning
- **Live progress**: extraction progress streams to the UI over a WebSocket
- **AI assistant chat**: ask questions about the loaded complaint. Answers draw on the original text and the current form values and quote the supporting wording. Chat history is kept across Reset Form, with a divider marking each new complaint
- **Persistence**: reviewed complaints are saved to PostgreSQL and can be read back through the API
- **Deployed**: frontend, backend and database run on Render's free tier

### Not in v1.1

- No authentication, no complaint list view in the UI, and no editing after save (see Known limitations)
- The chat is read-only and cannot edit form fields
- No automated test suite

### Known Limitations
- The chat assistant can occasionally state conclusions the complaint does not support, or accept a premise the form doesn't back up. Always check its answers against the source text.

## Branching and release workflow

| Branch | Purpose | How it merges |
|---|---|---|
| `main` | Production; Render deploys from it | Only through a pull request |
| `development` | Integration branch | Receives features and fixes |
| `feature/*` | New behavior and larger changes | Pull request into `development` |
| `fix/*` | Small bug fixes | `git merge --no-ff` into `development` |

1. Create a branch from `development`. Name the branch according to the naming conventions above.
2. Build and test it locally.
3. Merge it into `development` and test again.
4. Open a pull request from `development` into `main`, review the full diff, and merge.
5. Tag the release on `main` (for example `v1.1`).

Pushing to `main` deploys. Other branches never do.
