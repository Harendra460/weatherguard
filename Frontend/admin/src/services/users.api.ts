import { api } from './api';
import { MeResponse, User, UserStatus } from '../types';

export const usersApi = {
  me: () => api.get<MeResponse>('/users/me').then((r) => r.data),

  requestAccess: (body: { city: string; lat?: number; lon?: number }) =>
    api.post<User>('/users/me/request-access', body).then((r) => r.data),

  listPending: () => api.get<User[]>('/users/pending').then((r) => r.data),

  listAll: () => api.get<User[]>('/users').then((r) => r.data),

  decide: (id: string, decision: UserStatus.APPROVED | UserStatus.REJECTED) =>
    api.patch<User>(`/users/${id}/decision`, { decision }).then((r) => r.data),

  runAlertsNow: () => api.post<{ sent: number }>('/weather/run-now').then((r) => r.data),
};
