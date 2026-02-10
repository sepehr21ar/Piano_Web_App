from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.utils.storage import storage

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{file_key:path}")
async def get_media(file_key: str):
    path = storage.get_path(file_key)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)
