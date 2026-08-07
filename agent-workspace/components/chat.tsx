'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { UIMessage } from 'ai';

type ChatProps = {
	id: string;
	initialMessages: UIMessage[];
};

export default function Chat({
    id,
    initialMessages
}: ChatProps) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, regenerate, clearError, error, status } = useChat({
    id,
    messages: initialMessages,
  });
  const isSending = status === 'submitted' || status === 'streaming';
  const isWaitingForResponse = status === 'submitted';

  const handleRetry = () => {
    if (isSending) {
      return;
    }

    clearError();
    regenerate();
  };

  return (
    <main className="min-h-full bg-[#f5f5f2] px-4 py-6 text-[#1d1d1b] sm:px-6 sm:py-10">
      <section className="mx-auto flex h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(28,28,25,0.08)] sm:h-[calc(100dvh-5rem)]">
        <header className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-base font-semibold tracking-[-0.02em]">AI Chat</p>
            <p className="mt-0.5 text-sm text-[#797974]">DeepSeek assistant</p>
          </div>
          <span className="rounded-full bg-[#f2f2ef] px-3 py-1 text-xs font-medium text-[#5d5d58]">
            Online
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-7 sm:px-7 sm:py-9" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="my-auto max-w-sm">
              <p className="text-2xl font-semibold tracking-[-0.04em] text-[#252522]">
                How can I help?
              </p>
              <p className="mt-2 text-sm leading-6 text-[#7b7b75]">
                Start a conversation. Your responses will appear here.
              </p>
            </div>
          )}

          {messages.map(message => {
            const isUser = message.role === 'user';

            return (
              <article
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${
                    isUser
                      ? 'rounded-br-md bg-[#20201e] text-white'
                      : 'rounded-bl-md bg-[#f1f1ee] text-[#292926]'
                  }`}
                >
                  <p
                    className={`mb-1.5 text-xs font-medium ${
                      isUser ? 'text-white/60' : 'text-[#85857e]'
                    }`}
                  >
                    {isUser ? 'You' : 'DeepSeek'}
                  </p>
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-6">
                    {message.parts.map((part, i) => {
                      if (part.type !== 'text') {
                        return null;
                      }

                      return <p key={`${message.id}-${i}`}>{part.text}</p>;
                    })}
                  </div>
                </div>
              </article>
            );
          })}

          {isWaitingForResponse && (
            <div className="flex justify-start" aria-label="DeepSeek 正在回复">
              <div className="rounded-2xl rounded-bl-md bg-[#f1f1ee] px-4 py-3 text-sm text-[#6f6f69]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex gap-1" aria-hidden="true">
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b8b84] [animation-delay:-0.3s]" />
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b8b84] [animation-delay:-0.15s]" />
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b8b84]" />
                  </span>
                  DeepSeek is responding
                </span>
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <div>
                <p className="font-medium">消息发送失败</p>
                <p className="mt-0.5 text-red-700">请检查网络后重试；若仍失败，请稍后再试。</p>
              </div>
              <button
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSending}
                onClick={handleRetry}
                type="button"
              >
                重试
              </button>
            </div>
          )}
        </div>

        <form
          className="border-t border-black/[0.07] bg-white p-4 sm:p-5"
          onSubmit={e => {
            e.preventDefault();
            const text = input.trim();

            if (!text || isSending) {
              return;
            }

            clearError();
            sendMessage({ text });
            setInput('');
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fafaf8] p-2 pl-4 transition-colors focus-within:border-black/30 focus-within:bg-white">
            <input
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[#969690]"
              value={input}
              placeholder="Message DeepSeek..."
              disabled={isSending}
              onChange={e => setInput(e.currentTarget.value)}
            />
            <button
              className="rounded-xl bg-[#20201e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#393936] disabled:cursor-not-allowed disabled:bg-[#d5d5cf]"
              disabled={isSending || !input.trim()}
              type="submit"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
