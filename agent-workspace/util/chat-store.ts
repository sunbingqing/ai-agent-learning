import { UIMessage } from 'ai';

type ChatResponse = {
  id: string;
  messages: UIMessage[];
};

function getFastApiBaseUrl(): string {
  const baseUrl = process.env.FASTAPI_BASE_URL;

  if (!baseUrl) {
    throw new Error('FASTAPI_BASE_URL is not configured');
  }

  return baseUrl.replace(/\/$/, '');
}

async function ensureSuccess(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const detail = await response.text();
  throw new Error(
    `Chat storage API request failed (${response.status}): ${detail}`,
  );
}

export async function createChat(): Promise<string> {
  const response = await fetch(`${getFastApiBaseUrl()}/chats`, {
    method: 'POST',
    cache: 'no-store',
  });

  await ensureSuccess(response);

  const chat = (await response.json()) as ChatResponse;
  return chat.id;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const response = await fetch(
    `${getFastApiBaseUrl()}/chats/${encodeURIComponent(id)}`,
    { cache: 'no-store' },
  );

  await ensureSuccess(response);

  const chat = (await response.json()) as ChatResponse;
  return chat.messages;
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  const response = await fetch(
    `${getFastApiBaseUrl()}/chats/${encodeURIComponent(chatId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      cache: 'no-store',
    },
  );

  await ensureSuccess(response);
}
