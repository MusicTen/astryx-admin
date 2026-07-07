import { http } from "../../lib/http";
import type { AuthUser } from "../../stores/auth";

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export function login(input: LoginInput): Promise<LoginResult> {
  return http.post("auth/login", { json: input }).json<LoginResult>();
}
