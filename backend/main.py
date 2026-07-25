import uvicorn
import multiprocessing

# Expose the FastAPI 'app' object so `uvicorn main:app` commands work
from app.main import app 

def start_server():
    """
    Production-grade entry point for the FastAPI application.
    """
    # A standard formula for production workers is (2 * CPU cores) + 1
    workers = multiprocessing.cpu_count() * 2 + 1
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,         # Hot-reloading should be strictly False in production
        workers=workers,      # Run multiple worker processes
        log_level="info",
        proxy_headers=True,   # Trust proxy headers if running behind Nginx/Traefik/ALB
        forwarded_allow_ips="*"
    )

if __name__ == "__main__":
    start_server()
