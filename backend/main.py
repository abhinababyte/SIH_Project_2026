import uvicorn

from app.core.config import DEBUG, HOST, PORT
from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)
