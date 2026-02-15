from pydantic import BaseModel


class EventTrackIn(BaseModel):
    type: str
    payload_json: dict | None = None
