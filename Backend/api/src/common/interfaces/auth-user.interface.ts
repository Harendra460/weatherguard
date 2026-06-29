import { UserRole, UserStatus } from '../enums/user.enums';

/** Shape attached to req.user after JWT validation. */
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
