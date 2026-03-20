export interface AdminUser {
  userID: number;
  nickname: string;
  email: string;
  roleID: number;
  roleLabel: string;
  isVerified: boolean;
}

export interface AdminRole {
  roleID: number;
  roleLabel: string;
}
