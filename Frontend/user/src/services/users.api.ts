import { api } from './api';
import { MeResponse, RequestAccessPayload, User } from '../types';

export const usersApi = {
  me: () => api.get<MeResponse>('/users/me').then((r) => r.data),

  requestAccess: (body: RequestAccessPayload) =>
    api.post<User>('/users/me/request-access', body).then((r) => r.data),
};
