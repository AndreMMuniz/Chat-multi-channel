from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Conversation, Message
from app.schemas.chat import ConversationResponse, ConversationUpdate, MessageResponse
from app.core.websocket import manager

router = APIRouter()

# --- WebSockets ---
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We can receive pings or commands from frontend if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- REST Endpoints ---
@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all conversations (used by the frontend dashboard)."""
    conversations = db.query(Conversation).order_by(Conversation.last_message_date.desc().nulls_last()).offset(skip).limit(limit).all()
    return conversations

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(conversation_id: UUID, db: Session = Depends(get_db)):
    """Get all messages for a specific conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return messages

@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(conversation_id: UUID, update_data: ConversationUpdate, db: Session = Depends(get_db)):
    """Update conversation status, tag, or read state."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(conversation, key, value)
        
    db.commit()
    db.refresh(conversation)
    
    # Broadcast the change via WebSocket
    await manager.broadcast_json({
        "type": "conversation_updated",
        "data": {
            "id": str(conversation.id),
            "status": conversation.status.value if conversation.status else None,
            "tag": conversation.tag.value if conversation.tag else None,
            "is_unread": conversation.is_unread
        }
    })
    
    return conversation

from app.schemas.chat import MessageCreate
from app.models.models import ChannelType, Contact
from app.services.telegram_service import telegram_service

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(conversation_id: UUID, message_data: MessageCreate, db: Session = Depends(get_db)):
    """Send a message from the dashboard to a conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Save message in DB
    new_message = Message(
        conversation_id=conversation.id,
        content=message_data.content,
        inbound=False,
        owner_id=message_data.owner_id,
        message_type=message_data.message_type,
        image=message_data.image,
        file=message_data.file
    )
    db.add(new_message)
    
    # Update conversation status
    conversation.last_message = message_data.content
    conversation.is_unread = False
    
    db.commit()
    db.refresh(new_message)
    
    # Send to external channel
    contact = db.query(Contact).filter(Contact.id == conversation.contact_id).first()
    print(f"Sending to channel: {conversation.channel}")
    # Robust enum comparison
    channel_name = conversation.channel.name if hasattr(conversation.channel, "name") else str(conversation.channel).upper()
    if "TELEGRAM" in channel_name:
        print(f"Sending via Telegram to {contact.channel_identifier}")
        await telegram_service.send_message(contact.channel_identifier, message_data.content)
    # else handle WHATSAPP, EMAIL, etc.
    
    # Broadcast to WebSocket to update other connected dashboard clients
    await manager.broadcast_json({
        "type": "new_message",
        "data": {
            "id": str(new_message.id),
            "conversation_id": str(conversation.id),
            "content": new_message.content,
            "inbound": False,
            "created_at": new_message.created_at.isoformat() if new_message.created_at else None
        }
    })
    
    return new_message
