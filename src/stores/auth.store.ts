import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authSession, setUnauthorizedHandler } from '@/lib/api/client';
import { auth as authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import type { LoginPayload, RegisterPayload, User } from '@/lib/api/types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  /** Persisted bearer token. Mirrored into `authSession` for the axios client. */
  token: string | null;
  user: User | null;
  status: AuthStatus;
  /** Human-facing error from the last auth attempt. */
  error: string | null;
  /** True while we are re-validating a persisted token against `/auth/me`. */
  hydrating: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Called on boot to restore the session from the persisted token. */
  hydrate: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

/** Accepts both `{ token }` and `{ data: { token } }` envelopes. */
function readToken(payload: { token?: string; data?: { token?: string } }): string | null {
  return payload.token ?? payload.data?.token ?? null;
}

function readUser(payload: { user?: User; data?: { user?: User } }): User | null {
  return payload.user ?? payload.data?.user ?? null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: 'idle',
      error: null,
      hydrating: false,

      async login(payload) {
        set({ status: 'loading', error: null });
        try {
          const response = await authApi.login(payload);
          const token = readToken(response);
          authSession.set(token);
          set({ token, user: readUser(response), status: 'authenticated' });
        } catch (error) {
          set({ status: 'anonymous', error: toMessage(error) });
          throw error;
        }
      },

      async register(payload) {
        set({ status: 'loading', error: null });
        try {
          const response = await authApi.register(payload);
          const token = readToken(response);
          authSession.set(token);
          set({ token, user: readUser(response), status: 'authenticated' });
        } catch (error) {
          set({ status: 'anonymous', error: toMessage(error) });
          throw error;
        }
      },

      async logout() {
        try {
          // Best effort — a dead token should not block the local sign-out.
          if (get().token) await authApi.logout();
        } catch {
          /* ignore */
        } finally {
          authSession.clear();
          set({ token: null, user: null, status: 'anonymous', error: null });
        }
      },

      async hydrate() {
        const token = get().token;
        if (!token) {
          set({ status: 'anonymous', hydrating: false });
          return;
        }

        authSession.set(token);
        set({ hydrating: true });
        try {
          const user = await authApi.me();
          set({ user, status: 'authenticated', hydrating: false });
        } catch (error) {
          // 401 means the token is no longer valid anywhere else either.
          if (error instanceof ApiError && error.isUnauthorized) {
            authSession.clear();
            set({ token: null, user: null, status: 'anonymous', hydrating: false });
          } else {
            // Network or 5xx: keep the token, stay optimistic, retry later.
            set({ status: 'authenticated', hydrating: false });
          }
        }
      },

      clearError: () => set({ error: null }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'joy.auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const firstFieldError = Object.values(error.fields)[0]?.[0];
    return firstFieldError ?? error.userMessage;
  }
  return 'حدث خطأ ما. حاول مرة أخرى.';
}

/** Wire the axios 401 response to a session reset. Called once at boot. */
setUnauthorizedHandler(() => {
  authSession.clear();
  useAuthStore.setState({ token: null, user: null, status: 'anonymous' });
});
