import { request } from './request';

export interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
  gender: 'female' | 'male';
  birthYear: number;
  age: number;
  wechatId: string;
  interests: string[];
  profileCompleted: boolean;
}

export async function login(code: string) {
  return request<{ token: string; user: UserInfo }>({
    url: '/auth/login',
    method: 'POST',
    data: { code },
  });
}

export async function getMe() {
  return request<UserInfo>({ url: '/users/me' });
}

export interface UpdateMeParams {
  nickname?: string;
  avatar?: string;
  gender?: 'female' | 'male';
  birthYear?: number;
  wechatId?: string;
  interests?: string[];
}

export async function updateMe(params: UpdateMeParams) {
  return request<UserInfo>({ url: '/users/me', method: 'PATCH', data: params });
}

export interface PublicUser {
  id: number;
  nickname: string;
  avatar: string;
  gender: string;
  age: number;
  interests: string[];
}

export async function getPublicUser(id: number) {
  return request<PublicUser>({ url: `/users/${id}/public` });
}
