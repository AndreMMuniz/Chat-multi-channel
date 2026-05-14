"""
assistant_omini — the main LangGraph support agent.

State flows through 3 nodes:
  load_context -> classify -> suggest -> (optional) auto_reply
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional, TypedDict

from sqlalchemy.orm import Session

log = logging.getLogger(__name__)


class AgentState(TypedDict):
    conversation_id: str
    db: object
    raw_messages: List[dict]
    context_str: str
    was_summarized: bool
    classification: str
    suggestions: List[str]
    auto_reply: Optional[str]
    confidence: float


async def load_context_node(state: AgentState) -> AgentState:
    """Load conversation messages from DB and prepare context string."""
    from src.agents.middleware.context import load_context
    from src.agents.middleware.trim import prepare_context

    db: Session = state["db"]
    messages = load_context(state["conversation_id"], db)
    context_str, was_summarized = await prepare_context(messages, db)

    return {
        **state,
        "raw_messages": messages,
        "context_str": context_str,
        "was_summarized": was_summarized,
    }


async def classify_node(state: AgentState) -> AgentState:
    """Classify the conversation category using LLM."""
    from langchain_core.messages import HumanMessage
    from src.shared.llm import get_llm
    from src.agents.catalog.assistant_omini.prompts import CLASSIFY_PROMPT

    valid = {"support", "billing", "feedback", "spam", "other"}
    db: Session = state["db"]

    try:
        llm = get_llm(db)
        prompt = CLASSIFY_PROMPT.format(context=state["context_str"])
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        classification = response.content.strip().lower()
        if classification not in valid:
            classification = "other"
    except Exception as exc:
        log.warning("classify_node error: %s", exc)
        classification = "other"

    return {**state, "classification": classification}


async def suggest_node(state: AgentState) -> AgentState:
    """Generate 3 reply suggestions using LLM."""
    from langchain_core.messages import HumanMessage
    from src.shared.llm import get_llm
    from src.agents.catalog.assistant_omini.prompts import SUGGEST_PROMPT

    db: Session = state["db"]

    try:
        llm = get_llm(db)
        prompt = SUGGEST_PROMPT.format(context=state["context_str"])
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        suggestions = json.loads(raw)
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]
        suggestions = [str(s) for s in suggestions[:3]]
    except Exception as exc:
        log.warning("suggest_node error: %s", exc)
        suggestions = []

    return {**state, "suggestions": suggestions}


async def auto_reply_node(state: AgentState) -> AgentState:
    """Optionally generate a confident auto-reply. Only runs if AGENT_AUTO_REPLY=true."""
    from langchain_core.messages import HumanMessage
    from src.shared.config import get_settings
    from src.shared.llm import get_llm
    from src.agents.catalog.assistant_omini.prompts import AUTO_REPLY_PROMPT

    cfg = get_settings()
    if not cfg.AGENT_AUTO_REPLY:
        return {**state, "auto_reply": None, "confidence": 0.0}

    db: Session = state["db"]

    try:
        llm = get_llm(db)
        prompt = AUTO_REPLY_PROMPT.format(context=state["context_str"])
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        parsed = json.loads(response.content.strip())
        reply = parsed.get("reply")
        confidence = float(parsed.get("confidence", 0.0))

        if confidence < cfg.AGENT_AUTO_REPLY_CONFIDENCE:
            reply = None
    except Exception as exc:
        log.warning("auto_reply_node error: %s", exc)
        reply = None
        confidence = 0.0

    return {**state, "auto_reply": reply, "confidence": confidence}
