from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.message_service import MessageService


@pytest.mark.asyncio
async def test_receive_from_channel_uses_agent_content_when_provided():
    db = MagicMock()
    conversation = SimpleNamespace(id="conv-1")
    message = SimpleNamespace(id="msg-1", content="Visible body")

    service = MessageService(db)
    service._creation.create_message = MagicMock(return_value=message)
    service._broadcast.broadcast_new_message = AsyncMock()
    service._enqueue_for_agent = AsyncMock()

    result = await service.receive_from_channel(
        conversation,
        "Visible body",
        agent_content="Visible body\n\nQuoted history",
    )

    assert result is message
    service._creation.create_message.assert_called_once_with(
        conversation=conversation,
        content="Visible body",
        inbound=True,
        message_type="TEXT",
        idempotency_key=None,
    )
    service._enqueue_for_agent.assert_awaited_once_with(
        message,
        conversation,
        agent_content="Visible body\n\nQuoted history",
    )
