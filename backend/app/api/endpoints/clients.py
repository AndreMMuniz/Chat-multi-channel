from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.models import Client, User
from app.schemas.client import ClientCreate, ClientListResponse, ClientResponse, ClientUpdate
from app.schemas.common import create_error_response, create_paginated_response, create_response

router = APIRouter()


def _get_client_or_404(client_id: UUID, db: Session) -> Client:
    client = db.query(Client).filter(Client.id == client_id, Client.deleted_at.is_(None)).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client


@router.get("/clients")
@limiter.limit("60/minute")
async def list_clients(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = Query(default=None),
    client_type: Optional[str] = Query(default=None),
    country: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    query = db.query(Client).filter(Client.deleted_at.is_(None))

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Client.name.ilike(pattern)
            | Client.email.ilike(pattern)
            | Client.company_name.ilike(pattern)
        )
    if client_type:
        query = query.filter(Client.client_type == client_type)
    if country:
        query = query.filter(Client.country == country.upper())

    total = query.count()
    clients = query.order_by(Client.name).offset(skip).limit(limit).all()

    return create_paginated_response(
        data=[ClientListResponse.model_validate(c) for c in clients],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
    )


@router.post("/clients")
@limiter.limit("30/minute")
async def create_client(
    request: Request,
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    # deduplicação por email
    existing = db.query(Client).filter(
        Client.email == payload.email,
        Client.deleted_at.is_(None),
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Já existe um cliente com o e-mail {payload.email}",
        )

    client = Client(
        **payload.model_dump(exclude={"contact_id"}),
        contact_id=payload.contact_id,
        created_by_user_id=current_user.id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return create_response(ClientResponse.model_validate(client))


@router.get("/clients/{client_id}")
@limiter.limit("60/minute")
async def get_client(
    request: Request,
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    client = _get_client_or_404(client_id, db)
    return create_response(ClientResponse.model_validate(client))


@router.patch("/clients/{client_id}")
@limiter.limit("30/minute")
async def update_client(
    request: Request,
    client_id: UUID,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    client = _get_client_or_404(client_id, db)

    if payload.email and payload.email != client.email:
        conflict = db.query(Client).filter(
            Client.email == payload.email,
            Client.id != client_id,
            Client.deleted_at.is_(None),
        ).first()
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Já existe outro cliente com o e-mail {payload.email}",
            )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return create_response(ClientResponse.model_validate(client))


@router.delete("/clients/{client_id}", status_code=204)
@limiter.limit("30/minute")
async def delete_client(
    request: Request,
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    from datetime import datetime, timezone
    client = _get_client_or_404(client_id, db)
    client.deleted_at = datetime.now(timezone.utc)
    db.commit()
