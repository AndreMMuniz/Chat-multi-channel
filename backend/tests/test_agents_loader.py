from src.agents.loader import get_agent, list_agents


def test_loader_registers_assistant_omini():
    agent = get_agent("assistant_omini")

    assert agent is not None
    assert "assistant_omini" in list_agents()
