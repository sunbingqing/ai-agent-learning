import json
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .database import get_connection, init_database

init_database()

app = FastAPI(title="Chat Storage API")


# 规定接口返回固定包含 id 和 messages
class ChatResponse(BaseModel):
    id: str
    messages: list[dict[str, Any]]


class SaveChatRequest(BaseModel):
    messages: list[dict[str, Any]]


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/chats", response_model=ChatResponse, status_code=201)
def create_chat():
    # Python 内置的随机会话 ID 生成器
    chat_id = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc).isoformat()

    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO chats (id, messages_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (chat_id, "[]", now, now),
        )
        connection.commit()
    finally:
        connection.close()

    return ChatResponse(id=chat_id, messages=[])


@app.get("/chats/{chat_id}", response_model=ChatResponse)
def get_chat(chat_id: str):
    connection = get_connection()

    try:
        row = connection.execute(
            "SELECT id, messages_json FROM chats WHERE id = ?",
            (chat_id,),
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=404, detail="会话不存在")

    return ChatResponse(
        id=row["id"],
        messages=json.loads(row["messages_json"]),
    )


@app.put("/chats/{chat_id}", response_model=ChatResponse)
def save_chat(chat_id: str, payload: SaveChatRequest):
    messages_json = json.dumps(payload.messages, ensure_ascii=False)
    now = datetime.now(timezone.utc).isoformat()

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE chats
            SET messages_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (messages_json, now, chat_id),
        )
        connection.commit()
    finally:
        connection.close()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="会话不存在")

    return ChatResponse(id=chat_id, messages=payload.messages)
