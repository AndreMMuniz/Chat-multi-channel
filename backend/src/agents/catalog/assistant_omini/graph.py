"""Compile the assistant_omini LangGraph StateGraph."""

from langgraph.graph import END, StateGraph

from src.agents.catalog.assistant_omini.agent import (
    AgentState,
    auto_reply_node,
    classify_node,
    load_context_node,
    suggest_node,
)


def build_graph():
    """Build and compile the assistant_omini graph."""
    graph = StateGraph(AgentState)

    graph.add_node("load_context", load_context_node)
    graph.add_node("classify", classify_node)
    graph.add_node("suggest", suggest_node)
    graph.add_node("auto_reply", auto_reply_node)

    graph.set_entry_point("load_context")
    graph.add_edge("load_context", "classify")
    graph.add_edge("classify", "suggest")
    graph.add_edge("suggest", "auto_reply")
    graph.add_edge("auto_reply", END)

    return graph.compile()


assistant_omini = build_graph()
