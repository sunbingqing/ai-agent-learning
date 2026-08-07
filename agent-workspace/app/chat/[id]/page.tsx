import { loadChat } from "@/util/chat-store";
import Chat from '@/components/chat';

export default async function ChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const messages = await loadChat(id);

	return <Chat id={id} initialMessages={messages} />;
}
