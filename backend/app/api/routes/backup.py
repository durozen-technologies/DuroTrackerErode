import os
import subprocess
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.core.config import settings

router = APIRouter()

def delete_file(file_path: str):
    if os.path.exists(file_path):
        os.remove(file_path)

@router.get("/download")
async def download_backup(secret: str, background_tasks: BackgroundTasks):
    if secret != settings.BACKUP_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid backup secret key")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"durotracker_backup_{timestamp}.dump"
    backup_path = f"/tmp/{backup_filename}"
    
    try:
        # We must use PGPASSWORD environment variable for pg_dump to authenticate without a prompt
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
        
        # Run pg_dump
        subprocess.check_call([
            "pg_dump",
            "-h", settings.POSTGRES_SERVER,
            "-p", str(settings.POSTGRES_PORT),
            "-U", settings.POSTGRES_USER,
            "-F", "c",  # Custom format (compressed)
            "-f", backup_path,
            settings.POSTGRES_DB
        ], env=env)
        
        # Schedule the file to be deleted after it is returned
        background_tasks.add_task(delete_file, backup_path)
        
        return FileResponse(
            path=backup_path,
            filename=backup_filename,
            media_type="application/octet-stream"
        )
        
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Database backup failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
