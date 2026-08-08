import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conversation unavailable | AI Chat',
};

export default function ChatNotFound() {
  return (
    <main className="min-h-full bg-[#f5f5f2] px-4 py-6 text-[#1d1d1b] sm:px-6 sm:py-10">
      <section className="mx-auto flex h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(28,28,25,0.08)] sm:h-[calc(100dvh-5rem)]">
        <header className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-base font-semibold tracking-[-0.02em]">AI Chat</p>
            <p className="mt-0.5 text-sm text-[#797974]">DeepSeek assistant</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f2f2ef] px-3 py-1 text-xs font-medium text-[#5d5d58]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b8b8b2]" aria-hidden="true" />
            Conversation unavailable
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-7">
          <div className="max-w-md text-center">
            <p className="font-mono text-xs font-medium tracking-[0.22em] text-[#8a8a83]">
              ERROR 404
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-[#252522] sm:text-4xl">
              This conversation isn&apos;t here.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#797974] sm:text-[15px]">
              这个会话可能已被删除，或链接并不属于当前的本地数据库。创建一个新会话继续吧。
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="rounded-xl bg-[#20201e] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#393936]"
                href="/chat"
              >
                Start a new chat
              </Link>
              <Link
                className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#3c3c38] transition-colors hover:bg-[#f5f5f2]"
                href="/"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <footer className="border-t border-black/[0.07] px-5 py-4 text-center text-xs text-[#92928c] sm:px-7">
          Tip: bookmark the chat link after the first message is saved.
        </footer>
      </section>
    </main>
  );
}
