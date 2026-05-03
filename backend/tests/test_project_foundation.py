from app.models.models import (
    OFFICIAL_PROJECT_STAGES,
    ChannelType,
    Contact,
    Conversation,
    ConversationStatus,
    DefaultRole,
    Message,
    MessageType,
    Project,
    ProjectPriority,
    ProjectSourceType,
    ProjectStage,
    ProjectStatus,
    User,
    UserType,
)


def test_official_project_stages_are_commercial_and_ordered():
    assert OFFICIAL_PROJECT_STAGES == [
        ("lead", "Lead", 1),
        ("qualification", "Qualification", 2),
        ("proposal", "Proposal", 3),
        ("negotiation", "Negotiation", 4),
        ("closed", "Closed", 5),
    ]


def test_project_model_persists_with_stage_and_message_provenance(db):
    user_type = UserType(name="Project Admin", base_role=DefaultRole.ADMIN, is_system=False)
    db.add(user_type)
    db.flush()

    creator = User(
        auth_id="auth-project-creator",
        email="creator@example.com",
        full_name="Creator User",
        user_type_id=user_type.id,
    )
    owner = User(
        auth_id="auth-project-owner",
        email="owner@example.com",
        full_name="Owner User",
        user_type_id=user_type.id,
    )
    db.add_all([creator, owner])

    contact = Contact(name="TechCorp")
    db.add(contact)
    db.flush()

    conversation = Conversation(
        contact_id=contact.id,
        assigned_user_id=owner.id,
        channel=ChannelType.WHATSAPP,
        status=ConversationStatus.OPEN,
    )
    db.add(conversation)
    db.flush()

    message = Message(
        conversation_id=conversation.id,
        owner_id=owner.id,
        content="Customer asked for onboarding support",
        inbound=True,
        message_type=MessageType.TEXT,
    )
    db.add(message)

    stages = [
        ProjectStage(key=key, label=label, position=position)
        for key, label, position in OFFICIAL_PROJECT_STAGES
    ]
    db.add_all(stages)
    db.flush()

    project = Project(
        title="Onboarding demand",
        description="Customer asked for onboarding support",
        stage="lead",
        status=ProjectStatus.OPEN,
        priority=ProjectPriority.MEDIUM,
        source_type=ProjectSourceType.MESSAGE,
        source_message_id=message.id,
        source_conversation_id=conversation.id,
        contact_name="TechCorp",
        channel=ChannelType.WHATSAPP,
        tag="onboarding",
        owner_user_id=owner.id,
        created_by_user_id=creator.id,
        progress=10,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    assert project.reference_code.startswith("PRJ-")
    assert project.stage == "lead"
    assert project.stage_definition.label == "Lead"
    assert project.source_type == ProjectSourceType.MESSAGE
    assert project.source_message.id == message.id
    assert project.source_conversation.id == conversation.id
    assert project.owner.full_name == "Owner User"
    assert project.created_by.full_name == "Creator User"
