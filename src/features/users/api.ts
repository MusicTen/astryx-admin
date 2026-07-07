import { http } from "../../lib/http";
import type { User, UserInput, UserListParams, UserListResult } from "./types";

export function usersKey(params: UserListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    keyword: params.keyword,
  });
  return `users?${search.toString()}`;
}

export function fetchUsers(params: UserListParams): Promise<UserListResult> {
  return http.get(usersKey(params)).json<UserListResult>();
}

export function createUser(input: UserInput): Promise<User> {
  return http.post("users", { json: input }).json<User>();
}

export function updateUser(id: string, input: UserInput): Promise<User> {
  return http.put(`users/${id}`, { json: input }).json<User>();
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`users/${id}`).json();
}
