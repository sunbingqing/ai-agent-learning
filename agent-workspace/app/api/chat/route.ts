/*
 * @Author: sunbingqing
 * @Date: 2026-08-05 18:18:29
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-08-06 10:55:27
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { createOpenAI } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const companyAI = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const result = streamText({
    model: companyAI.chat('xmyun@alibaba/deepseek-v4-pro'),
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}