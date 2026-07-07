export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type UserInput = Omit<User, "id" | "createdAt">;

export interface UserListParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface UserListResult {
  items: User[];
  total: number;
}
