"""Summarize long conversation history to fit within the LLM context window."""

from typing import List
from sqlalchemy.orm import Session


SUMMARIZE_PROMPT = """Summarize the following customer support conversation in 3-5 sentences.
Focus on: the main issue, what was tried, and the current state.
Be concise and factual. Output only the summary, no preamble.

Conversation:
{history}
"""


async def summarize_history(messages: List[dict], db: Session) -> str:
    """
    Use the LLM to compress a long message list into a short summary string.
    Returns a plain-text summary.
    """
    from src.shared.llm import get_llm
    from src.agents.middleware.context import build_history_string
    from langchain_core.messages import HumanMessage

    history = build_history_string(messages)
    llm = get_llm(db)
    response = await llm.ainvoke([HumanMessage(content=SUMMARIZE_PROMPT.format(history=history))])
    return response.content.strip()
