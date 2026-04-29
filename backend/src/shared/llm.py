"""LLM factory — builds a ChatOpenAI instance from GeneralSettings in DB."""

import os
from typing import Optional
from sqlalchemy.orm import Session


def get_llm(db: Optional[Session] = None):
    """
    Return a ChatOpenAI instance configured from GeneralSettings (if db provided)
    or from env vars as fallback.
    """
    from langchain_openai import ChatOpenAI

    model = os.getenv("DEFAULT_AI_MODEL", "gpt-4o-mini")
    provider = os.getenv("DEFAULT_AI_PROVIDER", "openrouter")
    api_key = os.getenv("OPENAI_API_KEY", "")

    if db is not None:
        try:
            from app.models.models import GeneralSettings
            cfg = db.query(GeneralSettings).first()
            if cfg:
                model = cfg.ai_model or model
                provider = cfg.ai_provider or provider
        except Exception:
            pass

    kwargs = dict(model=model, api_key=api_key, max_tokens=512, temperature=0.7)

    if provider == "openrouter":
        kwargs["base_url"] = "https://openrouter.ai/api/v1"

    return ChatOpenAI(**kwargs)
