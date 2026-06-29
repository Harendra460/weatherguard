/** Lifecycle of a user's access to the alert service. */
export enum UserStatus {
  /** Signed in but has not asked for access yet. */
  NEW = 'NEW',
  /** Has requested access; awaiting an admin decision. */
  PENDING = 'PENDING',
  /** Approved by an admin; eligible to receive alerts. */
  APPROVED = 'APPROVED',
  /** Explicitly rejected by an admin. */
  REJECTED = 'REJECTED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
