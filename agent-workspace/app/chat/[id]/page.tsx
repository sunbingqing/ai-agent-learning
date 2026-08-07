/*
 * @Author: sunbingqing
 * @Date: 2026-08-06 18:22:24
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-08-07 09:54:59
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

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