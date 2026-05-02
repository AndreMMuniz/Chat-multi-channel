"""Shared config for the agent layer — thin wrapper over the existing app config."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database (reuse existing)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # LLM
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_AI_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "gpt-4o-mini")
    DEFAULT_AI_PROVIDER: str = os.getenv("DEFAULT_AI_PROVIDER", "openrouter")

    # Agent behaviour
    AGENT_CONTEXT_MESSAGES: int = int(os.getenv("AGENT_CONTEXT_MESSAGES", "20"))
    AGENT_SUMMARIZE_THRESHOLD: int = int(os.getenv("AGENT_SUMMARIZE_THRESHOLD", "30"))
    AGENT_AUTO_REPLY: bool = os.getenv("AGENT_AUTO_REPLY", "false").lower() == "true"
    AGENT_AUTO_REPLY_CONFIDENCE: float = float(os.getenv("AGENT_AUTO_REPLY_CONFIDENCE", "0.9"))

    # Worker
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "4"))
    WORKER_QUEUE_MAXSIZE: int = int(os.getenv("WORKER_QUEUE_MAXSIZE", "1000"))

    # Redis Streams (optional — falls back to asyncio.Queue when unset)
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    REDIS_STREAM_KEY: str = os.getenv("REDIS_STREAM_KEY", "agent_queue")
    REDIS_CONSUMER_GROUP: str = os.getenv("REDIS_CONSUMER_GROUP", "workers")
    REDIS_MAX_RETRIES: int = int(os.getenv("REDIS_MAX_RETRIES", "3"))


@lru_cache
def get_settings() -> AgentSettings:
    return AgentSettings()
