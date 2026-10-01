import { request } from './request';

export type NotificationType = 'newApply' | 'applyApproved' | 'applyRejected' | 'requestClosed';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  relatedId: number;
  title: string;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(page = 1, pageSize = 20) {
  return request<{ list: NotificationItem[]; total: number }>({
    url: `/notifications?page=${page}&pageSize=${pageSize}`,
  });
}

export async function unreadCount() {
  return request<{ count: number }>({ url: '/notifications/unread-count' });
}

export async function markRead(id: number) {
  return request<null>({ url: `/notifications/${id}/read`, method: 'PATCH' });
}

export async function markAllRead() {
  return request<null>({ url: '/notifications/read-all', method: 'PATCH' });
}
