import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      token: null,
      user: null,
      login: (token, user) =>
        set((state) => {
          state.token = token;
          state.user = user;
        }),
      logout: () =>
        set((state) => {
          state.token = null;
          state.user = null;
        }),
    })),
    { name: 'astryx-admin-auth' },
  ),
);
