<!--
  Copilot Instructions for LLM Council
  Short, actionable guidance for AI coding agents to be productive in this repo
-->

# Quick orientation
- This repository implements a 3-stage LLM “Council”: collect responses, anonymized peer rankings, and a chairman synthesis.
- The primary developer entry points are `backend/` (FastAPI orchestration) and `frontend/` (React UI). Start with `CLAUDE.md` and `README.md` for motivation and quick context.

# Key files to read first
- `backend/config.py` — model lists, API key env, `DATA_DIR`.
- `backend/openrouter.py` — OpenRouter client, `query_model()` & `query_models_parallel()`.
- `backend/council.py` — The orchestration and important parsing logic (critical: stage 2 prompt & `parse_ranking_from_text()`).
- `backend/main.py` — HTTP endpoints (including streaming SSE) and CORS settings.
- `backend/storage.py` — Simple JSON storage for conversations in `data/conversations`.
- `frontend/src/api.js` — API shape and SSE decoding (used by UI components)
- `frontend/src/components/*` — UI interpretation of stage data (especially `Stage2.jsx` for de-anonymization and parsed rankings).

# Big-picture architecture notes
- Backend runs async using `httpx.AsyncClient`. Most heavy work happens in `run_full_council()` which orchestrates stages 1–3 and returns metadata.
- Frontend uses optimistic updates and SSE streaming (`/message/stream`) to progressively render stages. The event types are `stage1_start|complete`, `stage2_start|complete`, `stage3_start|complete`, `title_complete`, `complete`, `error`.
- Storage is ephemeral file-based JSON — metadata like `label_to_model` is returned in API responses but not persisted.

# Project-specific conventions
- Stage 2 strict ranking format: models are asked to include a `FINAL RANKING:` block and numbered lines like `1. Response A`. This exact format enables reliable parsing (see `parse_ranking_from_text()`); otherwise fallback regex is used.
- Anonymization: stage 2 uses `Response A`, `Response B`, ... mapping to actual model names via `label_to_model` returned in the metadata. The frontend replaces labels for display (see `Stage2.jsx` de-anonymization logic).
- Role/message format: All calls to an LLM send an array of `{ role, content }` messages. Preserve this structure when adding new endpoints or test harnesses.
- Relative imports: Backend uses relative imports; run the app as a module to avoid import issues: `python -m backend.main` or use `uv run` to automatically activate the project's venv.

# Typical developer workflows (command cheat sheet)
- Setup dependencies:
  - Backend: `uv sync` (Astral `uv` tool ensures the python environment matches `pyproject.toml`)
  - Frontend: `cd frontend && npm install`
- Configure your OpenRouter API key: create `.env` at project root with `OPENROUTER_API_KEY=...`.
- Run locally:
  - Start backend: `uv run python -m backend.main` (or `python -m backend.main` if you already have a venv)
  - Start frontend: `cd frontend && npm run dev`
  - Or run `./start.sh` (it runs the backend and frontend together; note it uses `uv run` for the backend)
- Stream testing (SSE): POST to `/api/conversations/<id>/message/stream` and parse `data: <JSON>` events, or use curl with `-N`.

# Integration & external dependencies
- OpenRouter API: The code expects the OpenRouter JSON response structure `choices[0].message.content`. If you switch providers, adapt `backend/openrouter.py` accordingly.
- CORS: default frontend dev ports are 5173 (Vite) and 3000 — update `backend/main.py` if your local environment differs.

# Safety & failure modes (how agents should handle them)
- Graceful degradation is part of the design: the system continues if some models fail. `stage1_collect_responses()` filters None results.
- Parsing robustness: `parse_ranking_from_text()` prefers the explicit `FINAL RANKING:`/numbered format and falls back to pattern matching of `Response [A-Z]`.
- If the chairman model fails, `stage3_synthesize_final()` returns a user-friendly error string. Tests should assert this fallback works.

# Examples for common tasks
- Add a model to the council:
  - Edit `backend/config.py` and add to `COUNCIL_MODELS`. Re-run backend and test a simple query in the UI.
- Verify stream end-to-end (manual):
  1. Create a conversation: POST `/api/conversations` → get id
  2. Stream: `curl -N -H 'Content-Type: application/json' -d '{"content":"Explain recursion"}' http://localhost:8001/api/conversations/<id>/message/stream`
  3. Watch SSE events for `stage1_start`, `stage1_complete`, etc.

# Testing and recommended improvements
- There are no repository tests for OpenRouter interactions (CLAUDE.md references `test_openrouter.py` which is not present). Add tests for:
  - `backend/openrouter.query_model()` using `httpx` mocking (respx or AsyncMock)
  - `backend/council.parse_ranking_from_text()` with multiple malformed/clean ranking samples
  - `backend/council.run_full_council()` end-to-end with mocked LLM outputs
- For UI: add a test harness that simulates SSE event sequences to validate `App.jsx` streaming updates.

# PR & agent changes etiquette
- Keep changes small and focused (e.g., prompt improvements as small commits). Update CLAUDE.md if you change multi-model behavior.
- If changing the Stage 2 ranked format, update `parse_ranking_from_text()` and ensure the frontend still de-anonymizes properly.
- If you expose new metadata from the backend (e.g., per-model timing), make sure the frontend knows the shape and gracefully ignores unknown fields.

# Final notes (quick pitfalls)
- Always run backend as a module when iterating to avoid relative import issues: `python -m backend.main`.
- Backend default port is **8001** (see `backend/main.py`); frontend expects this host in `frontend/src/api.js`.
- `OPENROUTER_API_KEY` must be set in the `.env` before running backend.

If anything here is unclear or you want the agent to include code examples or tests for any particular function or flow, please tell me which area to expand.
