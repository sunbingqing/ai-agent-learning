/*
 * @Author: sunbingqing
 * @Date: 2026-08-05 18:18:29
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-08-07 10:08:36
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { createOpenAI } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from 'ai';
import { saveChat } from '@/util/chat-store';

export async function POST(req: Request) {
  try {
    const { messages, id } = await req.json();

    if (!messages || messages.length === 0) {
      return Response.json({ error: '请提供至少一条消息。' }, { status: 400 });
    }

    const baseURL = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!baseURL || !apiKey) {
      return Response.json(
        { error: '模型服务尚未配置，请联系管理员。' },
        { status: 503 },
      );
    }

    const companyAI = createOpenAI({ baseURL, apiKey });
    const result = streamText({
      model: companyAI.chat('xmyun@alibaba/deepseek-v4-pro'),
      messages: await convertToModelMessages(messages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        onEnd: async ({ messages }) => {
          await saveChat({ chatId: id, messages });
        },
        onError: () => '模型服务暂时不可用，请稍后重试。',
      }),
    });
  } catch {
    return Response.json(
      { error: '请求处理失败，请稍后重试。' },
      { status: 500 },
    );
  }
}
