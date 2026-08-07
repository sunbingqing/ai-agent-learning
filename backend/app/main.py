from fastapi import FastAPI
from .database import init_database

init_database()

app = FastAPI(title="Chat Storage API")


@app.get("/health")
def health_check():
    return {"status": "ok"}
