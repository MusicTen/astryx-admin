import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { HttpResponse, http as mswHttp } from 'msw';
import { setupServer } from 'msw/node';
import { useAuthStore } from '../stores/auth';
import { ApiError, fetcher, http } from './http';

const server = setupServer(
  mswHttp.get('*/api/ping', ({ request }) =>
    HttpResponse.json({ auth: request.headers.get('Authorization') }),
  ),
  mswHttp.get('*/api/forbidden', () =>
    HttpResponse.json({ code: 'FORBIDDEN', message: '无权限' }, { status: 403 }),
  ),
  mswHttp.get('*/api/expired', () => HttpResponse.json({}, { status: 401 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => useAuthStore.getState().logout());

test('自动注入 Authorization 头', async () => {
  useAuthStore.getState().login('tok', { id: '1', name: 'a', email: 'a@b.c' });
  const res = await fetcher<{ auth: string }>('ping');
  expect(res.auth).toBe('Bearer tok');
});

test('非 2xx 抛 ApiError（含 code/message）', async () => {
  const err = await http
    .get('forbidden')
    .json()
    .catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(403);
  expect((err as ApiError).code).toBe('FORBIDDEN');
  expect((err as ApiError).message).toBe('无权限');
});

test('401 清空登录态', async () => {
  useAuthStore.getState().login('tok', { id: '1', name: 'a', email: 'a@b.c' });
  await http
    .get('expired')
    .json()
    .catch(() => undefined);
  expect(useAuthStore.getState().token).toBeNull();
});
