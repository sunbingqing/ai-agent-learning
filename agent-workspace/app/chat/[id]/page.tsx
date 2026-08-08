import { notFound } from 'next/navigation';
import { ChatNotFoundError, loadChat } from '@/util/chat-store';
import Chat from '@/components/chat';

async function loadChatOrShowNotFound(id: string) {
	try {
		return await loadChat(id);
	} catch (error) {
		if (error instanceof ChatNotFoundError) {
			notFound();
		}

		throw error;
	}
}

export default async function ChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const messages = await loadChatOrShowNotFound(id);

	return <Chat id={id} initialMessages={messages} />;
}
