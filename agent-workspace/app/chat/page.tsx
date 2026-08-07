/*
 * @Author: sunbingqing
 * @Date: 2026-08-06 17:10:43
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-08-06 17:15:02
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { redirect } from 'next/navigation';
import { createChat } from '@/util/chat-store';

export default async function Page() {
  const id = await createChat(); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page, see below
}