# Chat Multi-Channel — Claude Context

## Deploy (CRÍTICO — ler antes de qualquer mudança de infra)
Migrações Alembic rodam na **release phase** do Railway (`railway.toml`), **nunca** no lifespan do FastAPI.
Toda chamada HTTP no lifespan deve ser **fire-and-forget** (`asyncio.create_task`) com timeout explícito.
Ver `DEPLOY.md` para o checklist completo e o ADR.

## Stack
- Backend: FastAPI + SQLAlchemy + Alembic → Railway
- Frontend: Next.js 14+ + Tailwind + Shadcn/UI → Vercel
- Database: Supabase (PostgreSQL + Auth)
- WebSocket: `/api/v1/chat/ws`

## Padrões importantes
- Credenciais sensíveis usam `EncryptedString` (AES-256) — ver `backend/app/core/encryption.py`
- Rate limiting via `slowapi` — ver `backend/app/core/limiter.py`
- Tokens em HttpOnly cookies (não localStorage)
