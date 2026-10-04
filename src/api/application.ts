import { request } from './request';
import type { ActivityType, RequestStatus, Paged } from './requestApi';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicantWithWechat {
  id: number;
  nickname: string;
  avatar: string;
  gender: string;
  age: number;
  interests: string[];
  wechatId: string | null;
}

export interface ApplicationItem {
  id: number;
  applicant: ApplicantWithWechat;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

export async function applyRequest(requestId: number, message: string) {
  return request<{ id: number; status: ApplicationStatus; createdAt: string }>({
    url: `/requests/${requestId}/applications`,
    method: 'POST',
    data: { message },
  });
}

export async function listApplicationsByRequest(
  requestId: number,
  status?: ApplicationStatus,
  page = 1,
  pageSize = 50,
) {
  const qs = `page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
  return request<Paged<ApplicationItem>>({ url: `/requests/${requestId}/applications?${qs}` });
}

export async function reviewApplication(id: number, action: 'approve' | 'reject') {
  return request<{ id: number; status: ApplicationStatus; applicantWechatId?: string }>({
    url: `/applications/${id}`,
    method: 'PATCH',
    data: { action },
  });
}

export interface MyApplicationItem {
  id: number;
  status: ApplicationStatus;
  message: string;
  createdAt: string;
  request: {
    id: number;
    type: ActivityType;
    title: string;
    activityTime: string;
    destination: string;
    coverImage: string | null;
    status: RequestStatus;
    expired: boolean;
  } | null;
  publisherWechatId: string | null;
}

export async function myApplications(page = 1, pageSize = 10) {
  return request<Paged<MyApplicationItem>>({
    url: `/users/me/applications?page=${page}&pageSize=${pageSize}`,
  });
}
