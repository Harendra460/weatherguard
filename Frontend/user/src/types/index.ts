export enum UserStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface AlertPreferences {
  city?: string;
  lat?: number;
  lon?: number;
}

export interface User {
  _id: string;
  email: string;
  provider: string;
  displayName?: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  requestedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
  telegramChatId?: string;
  preferences?: AlertPreferences;
  createdAt?: string;
}

export interface MeResponse {
  user: User;
  telegramDeepLink?: string;
}

export interface RequestAccessPayload {
  city: string;
  lat?: number;
  lon?: number;
}
