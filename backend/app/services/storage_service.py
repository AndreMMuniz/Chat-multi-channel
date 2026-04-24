import uuid
from typing import Optional
from fastapi import UploadFile
from app.core.database import get_supabase

class StorageService:
    def __init__(self):
        self.supabase = get_supabase()
        self.bucket_name = "chat-attachments"

    async def upload_file(self, file: UploadFile, folder: str = "general") -> Optional[str]:
        """
        Uploads a file to Supabase Storage and returns the public URL.
        """
        try:
            # Generate a unique filename
            ext = file.filename.split(".")[-1] if "." in file.filename else ""
            filename = f"{folder}/{uuid.uuid4()}.{ext}"
            
            # Read file content
            content = await file.read()
            
            # Upload to Supabase
            # Note: We use the service role key (via settings.supabase_key) to bypass RLS if needed
            # but ideally the bucket should be public-read if we want public URLs easily.
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=filename,
                file=content,
                file_options={"content-type": file.content_type}
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(filename)
            return public_url
            
        except Exception as e:
            print(f"Error uploading to Supabase: {e}")
            return None

storage_service = StorageService()
