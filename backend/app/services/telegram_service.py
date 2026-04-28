import httpx
from sqlalchemy.orm import Session
from app.models.models import Contact, Conversation, ChannelType
from app.core.config import settings

class TelegramService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def process_update(self, update: dict, db: Session):
        """Process incoming Telegram webhook update."""
        if "message" not in update:
            return

        message_data = update["message"]
        chat_id = str(message_data["chat"]["id"])
        text = message_data.get("text", "")
        
        # If it's not a text message, we skip for now or handle appropriately
        if not text:
            text = "[Non-text message]"
        
        first_name = message_data["from"].get("first_name", "Unknown")
        username = message_data["from"].get("username", "")

        # 1. Find or create contact
        contact = db.query(Contact).filter(Contact.channel_identifier == chat_id).first()
        if not contact:
            contact = Contact(
                name=first_name,
                channel_identifier=chat_id,
            )
            db.add(contact)
            db.commit()
            db.refresh(contact)

        # 2. Find or create conversation
        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.channel == ChannelType.TELEGRAM
        ).first()

        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                channel=ChannelType.TELEGRAM,
                thread_id=chat_id
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # Update conversation status
        conversation.last_message = text
        conversation.is_unread = True
        db.commit()

        # 3. Create message + broadcast via MessageService
        from app.services.message_service import MessageService
        msg_svc = MessageService(db)
        await msg_svc.receive_from_channel(
            conversation=conversation,
            content=text,
            message_type="TEXT",
        )

    async def send_message(self, chat_id: str, text: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/sendMessage",
                json={"chat_id": chat_id, "text": text}
            )
            if response.status_code != 200:
                print(f"Telegram sendMessage error: {response.status_code} - {response.text}")
            return response.status_code == 200

    async def set_webhook(self, url: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/setWebhook",
                json={"url": url}
            )
            data = response.json()
            print(f"Telegram setWebhook: {data}")
            return data.get("ok", False)

    async def get_webhook_info(self) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_url}/getWebhookInfo")
            return response.json()

telegram_service = TelegramService()
