# Changelog

Version history for the AI-Powered Customer Complaint Management System. Releases are tagged on `main`; `git tag` lists them, and they also appear under the repository's Tags view on GitHub.

## Versioning

Versions follow `MAJOR.MINOR.PATCH`:

- **MINOR** (v1.1 to v1.2): new features
- **PATCH** (v1.1 to v1.1.1): bug fixes and hotfixes
- **MAJOR**: breaking changes, such as API or database changes that need coordinated deployment

Everything in v1.x is a prototype.

To release: update this file on `development`, merge `development` into `main` through a pull request, then tag the release on `main` and fill in its date below.

## v1.1 (YYYY-MM-DD)

### Added
- AI assistant chat: `POST /chat` answers questions about the loaded complaint using the original text and the current form values, quotes the supporting wording, and returns a fixed reply when no complaint is loaded
- Chat history is kept across Reset Form, with a divider marking each new complaint
- "AI responses may contain errors" disclaimer under the chat input

### Changed
- Reset Form now also resets the extraction progress bar and status
- API base URL is defined once in `src/config.js`

### Known issues
- The chat assistant can accept a premise the form does not support, or state conclusions the complaint does not (tracked in a GitHub issue)

## v1.0 (2026-10-14)
First prototype.

### Added
- Document intake: upload PDF, DOCX, TXT or EML files (up to 10 MB), or paste complaint text
- LangGraph extraction agent: a fast model (`openai/gpt-oss-20b`) runs first and escalates to a stronger one (`openai/gpt-oss-120b`) when average confidence is at or below 0.65
- Confidence badges on AI-filled fields, and ambiguous dates flagged for review instead of guessed
- Live extraction progress over a WebSocket
- Save, list and fetch complaints through the API, stored in PostgreSQL
- Deployment on Render (static frontend, web service, Postgres)

### Known gaps
- The chat box was a placeholder
- No authentication, no complaint list view in the UI, no editing after save, no automated tests