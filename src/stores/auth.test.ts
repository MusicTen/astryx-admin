import { beforeEach, expect, test } from 'vitest';
import { useAuthStore } from './auth';

beforeEach(() => {
  useAuthStore.getState().logout();
});

test('login 保存 token 与用户，logout 清空', () => {
  useAuthStore.getState().login('t1', { id: '1', name: 'admin', email: 'a@b.c' });
  expect(useAuthStore.getState().token).toBe('t1');
  expect(useAuthStore.getState().user?.name).toBe('admin');

  useAuthStore.getState().logout();
  expect(useAuthStore.getState().token).toBeNull();
  expect(useAuthStore.getState().user).toBeNull();
});
