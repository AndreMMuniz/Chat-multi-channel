# Deferred Work

## Deferred from: code review of 8-1-staging-migration-validation (2026-04-30)

- FK constraint names (`messages_owner_id_fkey`, `conversations_assigned_user_id_fkey`) derivados por convenção, não confirmados via query no DB real. Se a naming convention do Supabase diferir, `alembic downgrade` falharia. Validar ao rodar o runbook de staging.
- `head -50` no Quick Reference de `MIGRATIONS.md` não é nativo no Windows. Deploy target é Linux (Railway), então sem impacto operacional — mas pode confundir devs em Windows.

## Deferred from: code review of 8-2-environment-variables-documentation (2026-04-30)

- `src/shared/config.py` lê `OPENAI_API_KEY` diretamente, sem o fallback OPENROUTER que `app/core/config.py` implementa. Um operador que sete apenas `OPENROUTER_API_KEY` terá AI suggestions funcionando na camada principal mas não na camada de agentes. Inconsistência arquitetural pre-existente — corrigir quando refatorar a camada de configuração.

## Deferred from: code review of 8-4-redis-streams-queue-migration (2026-04-30)

- Sem teste para `put_nowait` no `RedisStreamQueue` — o `asyncio.create_task` criado não é verificado nos testes. Cobrir quando houver infra de testes com Redis real ou mock de event loop mais robusto.
