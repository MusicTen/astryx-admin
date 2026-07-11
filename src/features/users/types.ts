export type UserRole = "admin" | "editor" | "viewer";
export type UserStatus = "active" | "suspended" | "invited";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type UserInput = Omit<User, "id" | "createdAt">;

export interface UserListParams {
  page: number;
  pageSize: number;
  keyword: string;
  statuses?: UserStatus[];
  roles?: UserRole[];
}
