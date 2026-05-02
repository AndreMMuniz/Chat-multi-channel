"""
Agent registry — maps agent names to compiled LangGraph graphs.

Add new agents here as they're built.
"""

from typing import Any


_REGISTRY: dict[str, Any] = {}


def _load_registry() -> None:
    from src.agents.catalog.assistant_omini.graph import assistant_omini
    _REGISTRY["assistant_omini"] = assistant_omini


def get_agent(name: str = "assistant_omini") -> Any:
    """Return a compiled LangGraph graph by name."""
    if not _REGISTRY:
        _load_registry()
    agent = _REGISTRY.get(name)
    if agent is None:
        raise KeyError(f"Agent '{name}' not found. Available: {list(_REGISTRY)}")
    return agent


def list_agents() -> list[str]:
    if not _REGISTRY:
        _load_registry()
    return list(_REGISTRY.keys())
