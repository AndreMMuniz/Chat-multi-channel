"""Trim message list to stay within context window budget."""

from typing import List, Tuple
from sqlalchemy.orm import Session

from src.shared.config import get_settings


def should_summarize(messages: List[dict]) -> bool:
    """Return True if the history is long enough to warrant summarization."""
    return len(messages) > get_settings().AGENT_SUMMARIZE_THRESHOLD


def trim_to_window(messages: List[dict], keep_last: int = 10) -> List[dict]:
    """Return the last `keep_last` messages (always keeps most recent context)."""
    return messages[-keep_last:] if len(messages) > keep_last else messages


async def prepare_context(
    messages: List[dict], db: Session
) -> Tuple[str, bool]:
    """
    Decide whether to summarize or trim, then return:
    - context_str: string ready to inject into the prompt
    - was_summarized: True if LLM summarization was used
    """
    from src.agents.middleware.context import build_history_string
    from src.agents.middleware.summarize import summarize_history

    if should_summarize(messages):
        summary = await summarize_history(messages, db)
        # Append last 5 messages verbatim so agent has recent context
        recent = build_history_string(trim_to_window(messages, keep_last=5))
        return f"[Summary of earlier conversation]\n{summary}\n\n[Recent messages]\n{recent}", True

    return build_history_string(messages), False
