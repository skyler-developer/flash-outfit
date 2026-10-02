import type { ActivityType } from '@/pages/publish/constants';
import { request } from './request';
import type { PublicUser } from './auth';

export type { ActivityType };
export type RequestStatus = 'recruiting' | 'grouped' | 'finished' | 'cancelled';

export interface RequestListItem {
  id: number;
  type: ActivityType;
  activityTime: string;
  destination: string;
  city: string;
  genderPreference: 'all' | 'female' | 'male';
  ageRange: [number, number];
  descriptionSummary: string;
  coverImage: string | null;
  distanceKm: number | null;
  expired: boolean;
  status: RequestStatus;
  approvedCount: number;
  maxMembers: number;
  myApplicationStatus: 'pending' | 'approved' | 'rejected' | null;
  publisher: { id: number; nickname: string; avatar: string } | null;
}

export interface RequestDetail {
  id: number;
  type: ActivityType;
  activityTime: string;
  destination: string;
  location: { lat?: number | null; lng?: number | null; city: string };
  genderPreference: 'all' | 'female' | 'male';
  ageRange: [number, number];
  description: string;
  photos: string[];
  maxMembers: number;
  autoCloseOnGrouped: boolean;
  approvedCount: number;
  pendingCount: number;
  status: RequestStatus;
  expired: boolean;
  isPublisher: boolean;
  applicable: boolean;
  applicableReason: string | null;
  myApplicationStatus: 'pending' | 'approved' | 'rejected' | null;
  publisher: {
    id: number;
    nickname: string;
    avatar: string;
    gender: string;
    age: number;
    interests: string[];
  } | null;
}

export interface ListRequestsParams {
  page?: number;
  pageSize?: number;
  type?: string;
  timeRange?: 'weekend' | 'd7' | 'd30' | 'all';
  lat?: number;
  lng?: number;
  distance?: number;
  city?: string;
  sortBy?: 'distance' | 'time';
  onlyApplicable?: boolean;
}

export interface Paged<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listRequests(params: ListRequestsParams) {
  const query: Record<string, string | number> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query[k] = String(v);
  });
  const qs = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return request<Paged<RequestListItem>>({ url: `/requests${qs ? `?${qs}` : ''}` });
}

export async function getRequest(id: number) {
  return request<RequestDetail>({ url: `/requests/${id}` });
}

export interface CreateRequestParams {
  type: ActivityType;
  activityTime: string;
  destination: string;
  location: { lat?: number | null; lng?: number | null; city: string };
  genderPreference: 'all' | 'female' | 'male';
  ageRange: [number, number];
  description: string;
  photos: string[];
  maxMembers?: number;
  autoCloseOnGrouped?: boolean;
}

export async function createRequest(params: CreateRequestParams) {
  return request<RequestDetail>({ url: '/requests', method: 'POST', data: params });
}

export async function updateRequest(id: number, params: Partial<CreateRequestParams> & { status?: 'finished' }) {
  return request<RequestDetail>({ url: `/requests/${id}`, method: 'PATCH', data: params });
}

export async function deleteRequest(id: number) {
  return request<null>({ url: `/requests/${id}`, method: 'DELETE' });
}

export interface MyPublishedItem {
  id: number;
  status: RequestStatus;
  expired: boolean;
  approvedCount: number;
  pendingCount: number;
  coverImage: string | null;
  activityTime: string;
  destination: string;
  type: ActivityType;
  maxMembers: number;
}

export async function myPublishedRequests(page = 1, pageSize = 10) {
  return request<Paged<MyPublishedItem>>({
    url: `/users/me/requests?page=${page}&pageSize=${pageSize}`,
  });
}

export type { PublicUser };
