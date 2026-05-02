# Deployment Guide

## Stack
- **Backend:** FastAPI → Railway (`backend/`)
- **Frontend:** Next.js → Vercel (auto-deploy from `main` branch, root dir: `frontend/`)
- **Database:** Supabase (PostgreSQL)

## Como funciona o deploy do backend

```
Push para main
    ↓
Railway build (Nixpacks)
    ↓
Release phase: alembic upgrade head  ← migrations rodam AQUI
    ↓ (só avança se migration passar)
Start phase: uvicorn main:app        ← servidor sobe SEM migrations
    ↓
Health check: GET /health
    ↓
Tráfego roteado para novo container
```

O container antigo continua servindo tráfego durante a release phase. Se a migration falhar, o deploy é abortado e o container antigo permanece em produção.

## Regras de ouro

### 1. Migrations NUNCA no lifespan do FastAPI
```python
# ❌ ERRADO — bloqueia Uvicorn durante startup
@asynccontextmanager
async def lifespan(app):
    await run_migrations()
    yield

# ✅ CORRETO — migrations rodam via railway.toml releaseCommand
```

### 2. Chamadas externas no lifespan devem ser fire-and-forget
```python
# ❌ ERRADO — bloqueia startup se Telegram API estiver lenta
await telegram_service.set_webhook(webhook_url)

# ✅ CORRETO — não bloqueia startup
asyncio.create_task(telegram_service.set_webhook(webhook_url))
```

### 3. Toda chamada httpx precisa de timeout explícito
```python
# ❌ ERRADO
async with httpx.AsyncClient() as client:

# ✅ CORRETO
async with httpx.AsyncClient(timeout=15.0) as client:
```

## ADR-001: Migrations como Release Command

**Data:** 2026-05-02  
**Contexto:** Alembic rodando no lifespan do FastAPI ou chamadas HTTP sem timeout bloqueavam Uvicorn por 4+ minutos a cada deploy, causando drops de WebSocket em produção.  
**Decisão:** Migrations rodam via `railway.toml [deploy] releaseCommand`. Lifespan deve conter apenas inicialização leve e non-blocking.  
**Enforcement:** `railway.toml` garante a separação. Nunca adicionar alembic no `backend/main.py`.

## Checklist para qualquer deploy que toque o schema

```
[ ] Nova migration é backward-compatible com o código em produção?
[ ] alembic upgrade head foi testado localmente?
[ ] Nenhuma chamada alembic foi adicionada ao lifespan de main.py?
[ ] Toda nova chamada HTTP no lifespan tem timeout explícito?
[ ] Toda nova chamada HTTP no lifespan é fire-and-forget (create_task)?
```
