# AMIT CODING PREFERENCES v1.0.0
Session: Startup

## 🧠 Learned Principles
### Testing & Verification
- **Graduated Verification**: Always run `pytest` (backend) or `npm test` (frontend) after EVERY change.
- **Fail-Safe**: If tests fail, STOP and fix immediately. Do not proceed to next task.

### Standards
- **Docker/Environment**: Maintain Strict separation of `.env` configuration. Ensure `docker-compose` compatibility.
- **FastAPI**: Preserve all existing endpoints. Use Pydantic models for validation.
- **Frontend**: ensure `VITE_API_BASE_URL` is used. React components should be functional and typed.

## ❌ Rejected Patterns
- (None yet)

## ✅ Approved Patterns
- **Directory Structure**: Keep code in the defined modular structure (`backend/`, `frontend/`).
