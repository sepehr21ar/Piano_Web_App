import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings


class Storage:
    def __init__(self) -> None:
        self.base_path = Path(settings.storage_path).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _safe_join(self, relative_path: str) -> Path:
        full = (self.base_path / relative_path).resolve()
        if not str(full).startswith(str(self.base_path)):
            raise ValueError("Invalid storage path")
        return full

    async def save_upload(self, upload: UploadFile, folder: str) -> str:
        ext = Path(upload.filename or "").suffix
        file_key = f"{folder}/{uuid.uuid4().hex}{ext}"
        dest = self._safe_join(file_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        content = await upload.read()
        dest.write_bytes(content)
        return file_key

    def get_path(self, file_key: str) -> Path:
        return self._safe_join(file_key)


storage = Storage()
