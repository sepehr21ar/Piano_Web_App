from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventTrackIn

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/track")
async def track_event(
    payload: EventTrackIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = Event(user_id=user.id, type=payload.type, payload_json=payload.payload_json)
    db.add(event)
    await db.commit()
    return {"ok": True}
