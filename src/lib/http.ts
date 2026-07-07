import ky, { HTTPError } from 'ky';
import { useAuthStore } from '../stores/auth';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const UNAUTHORIZED = 401;

export const http = ky.create({
  prefix: '/api',
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const { token } = useAuthStore.getState();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
    beforeError: [
      ({ error }) => {
        if (!(error instanceof HTTPError)) return error;
        const { status } = error.response;
        if (status === UNAUTHORIZED) {
          useAuthStore.getState().logout();
        }
        const body = (error.data ?? {}) as { code?: string; message?: string };
        return new ApiError(
          status,
          body.code ?? 'UNKNOWN',
          body.message ?? `请求失败（HTTP ${status}）`,
        );
      },
    ],
  },
});

export function fetcher<T>(path: string): Promise<T> {
  return http.get(path).json<T>();
}
