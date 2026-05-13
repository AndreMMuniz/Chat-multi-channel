from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.email_service import EmailService


def _make_email_service() -> EmailService:
    return EmailService(
        smtp_host="smtp.example.com",
        smtp_port=587,
        imap_host="imap.example.com",
        imap_port=993,
        address="support@example.com",
        password="secret",
    )


def test_split_visible_and_context_removes_reply_header_from_visible_body():
    body = (
        "Teste recebido. Em qua., 13 de mai. de 2026 às 19:14, "
        "test <test@munizandre.com> escreveu: > Teste recebido! "
        "Como posso ajudar você hoje? >"
    )

    visible, context = EmailService._split_visible_and_context(body)

    assert visible == "Teste recebido."
    assert context == body


@pytest.mark.asyncio
async def test_handle_inbound_stores_visible_body_and_keeps_full_context_for_agent():
    service = _make_email_service()
    db = MagicMock()
    contact = SimpleNamespace(
        email="test@munizandre.com",
        channel_identifier="test@munizandre.com",
        name="Andre",
    )
    conversation = SimpleNamespace(
        id="conv-1",
        contact=contact,
        thread_id="test@munizandre.com",
    )
    body = (
        "Teste recebido. Em qua., 13 de mai. de 2026 às 19:14, "
        "test <test@munizandre.com> escreveu: > Teste recebido! "
        "Como posso ajudar você hoje? >"
    )

    with patch.object(
        EmailService,
        "_find_email_conversation_by_sender",
        return_value=conversation,
    ), patch(
        "app.services.message_service.MessageService.receive_from_channel",
        new_callable=AsyncMock,
    ) as mock_receive:
        await service._handle_inbound(db, "test <test@munizandre.com>", body)

    mock_receive.assert_awaited_once_with(
        conversation,
        "Teste recebido.",
        agent_content=body,
    )
