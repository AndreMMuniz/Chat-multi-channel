# Deferred Work

## Deferred from: code review of 8-1-staging-migration-validation (2026-04-30)

- FK constraint names (`messages_owner_id_fkey`, `conversations_assigned_user_id_fkey`) derivados por convenção, não confirmados via query no DB real. Se a naming convention do Supabase diferir, `alembic downgrade` falharia. Validar ao rodar o runbook de staging.
- `head -50` no Quick Reference de `MIGRATIONS.md` não é nativo no Windows. Deploy target é Linux (Railway), então sem impacto operacional — mas pode confundir devs em Windows.

## Deferred from: code review of 8-2-environment-variables-documentation (2026-04-30)

- `src/shared/config.py` lê `OPENAI_API_KEY` diretamente, sem o fallback OPENROUTER que `app/core/config.py` implementa. Um operador que sete apenas `OPENROUTER_API_KEY` terá AI suggestions funcionando na camada principal mas não na camada de agentes. Inconsistência arquitetural pre-existente — corrigir quando refatorar a camada de configuração.

## Deferred from: code review of 8-4-redis-streams-queue-migration (2026-04-30)

- Sem teste para `put_nowait` no `RedisStreamQueue` — o `asyncio.create_task` criado não é verificado nos testes. Cobrir quando houver infra de testes com Redis real ou mock de event loop mais robusto.

## Deferred from: code review of Epic 8 stories (2026-04-30)

- **sys.exit(1) at module load without graceful shutdown** (`backend/main.py`) — follows pre-existing `_validate_encryption_key` pattern; both functions use `sys.exit` before ASGI lifecycle. Revisit if container orchestration issues appear in production.
- **IP rate-limit on auth bypassable via proxy cycling** (`auth.py`) — known limitation of IP-based limiting, pre-existed this story. Mitigate with external WAF or Cloudflare if needed.
- **`db` potentially unbound in login auto-provisioning branch** (`auth.py:94`) — pre-existing bug in login handler. Test before production with fresh deployment.
- **Race condition on simultaneous first-time login** (`auth.py`) — two concurrent requests for new user can create duplicate profiles. Add DB-level unique constraint or distributed lock.
- **`asyncio.create_task` for delivery alerts can be silently dropped on request cancellation** (`message_service.py`) — fire-and-forget pattern without lifecycle management.
- **`send_from_dashboard` swallows `ChannelDeliveryError`** (`message_service.py`) — caller receives `Message(delivery_status=FAILED)` with no exception signal.
- **SQLite strips timezone in test assertions** (`test_message_service.py:293`) — `first_response_at` comparison works in SQLite but PostgreSQL timezone round-trip is not covered.
- **`mockMessages` glob in E2E fixtures matches POST /messages** (`e2e/fixtures.ts:95`) — unintended send calls in tests without `mockSendMessage` silently return empty via catch-all.
- **Coverage gate CI 70% vs DoD 80% per service** (`.github/workflows/pytest.yml:33`) — gate kept conservative intentionally; all 5 services already exceed 80% locally. Raise to 80% if services fall below threshold in future.

## Deferred from: code review of 8-10-telegram-bot-configuration-ui (2026-05-02)

- **Sensitive fields (`telegram_bot_token`, `whatsapp_access_token`, etc.) returned in `SettingsOut`** (`config_routes.py`) — pre-existing pattern for all channel credentials; review if settings API should mask secrets in a future hardening sprint.
- **`set_webhook` in `telegram_service.py` has no timeout** — pre-existing; add `timeout=` parameter to all `httpx.AsyncClient()` calls when refactoring the service.
- **Webhook URL not validated as HTTPS** (`config_routes.py`) — pre-existing; Telegram rejects non-HTTPS webhooks silently; add validation when building a config validation layer.
- **`model_dump(exclude_unset=True)` called twice in `update_settings`** (`config_routes.py`) — capture once and reuse; deterministic in practice but worth cleaning up.
- **`body: dict` in `test_connection` instead of a typed Pydantic model** (`telegram.py`) — replace with `class TestConnectionRequest(BaseModel): token: str` for schema generation and validation.
- **`json.data ?? json` response shape fallback** (`settings/page.tsx`) — use `json.data !== undefined ? json.data : json` to handle a null `data` field correctly.
- **Token not sanitized before URL interpolation in `test_connection`** (`telegram.py`) — Telegram rejects non-conformant tokens anyway; add explicit format validation (`^\d+:[A-Za-z0-9_-]+$`) if exposed publicly.
