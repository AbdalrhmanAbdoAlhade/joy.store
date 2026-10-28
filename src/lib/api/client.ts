import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { toApiError } from './errors';

/**
 * Base URL of the Laravel REST API. See API.md for the discovered surface.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://toy.backend.rouqy-jewellery.com/api/v1';

/**
 * Origin of the backend host — media (product photos, banners) lives under
 * `{origin}/storage/…` while the API itself is under `/api/v1/…`.
 */
export const API_ORIGIN = new URL(API_BASE_URL).origin;

/**
 * Turn a stored media path (`banners/x.jpg`) into a full URL. Absolute URLs
 * pass through untouched so the helper is safe on either payload shape.
 */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
}

/**
 * Token holder kept deliberately outside the Zustand store.
 *
 * The auth store depends on the endpoints, and the endpoints depend on this
 * client — a plain module-scoped holder breaks that cycle cleanly.
 */
let accessToken: string | null = null;

export const authSession = {
  get token(): string | null {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered by the auth store so a dead token can clear the session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

/**
 * Endpoints where a 401 is an expected answer (wrong password, expired
 * token on logout) and must not wipe the session.
 */
const SILENT_401 = [/\/auth\/login$/, /\/auth\/register$/, /\/auth\/logout$/];

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  // The backend returns HTTP 500 (instead of 401) on protected routes when
  // this header is missing — see API.md, gotcha #1. Never remove it.
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use((config) => {
  const token = authSession.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    if (
      apiError.isUnauthorized &&
      !SILENT_401.some((pattern) => pattern.test(error.config?.url ?? ''))
    ) {
      unauthorizedHandler?.();
    }
    return Promise.reject(apiError);
  },
);

/**
 * Thin wrapper that always rejects with an `ApiError`, so callers can catch a
 * single type and never touch an Axios shape.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * `GET /products` and friends return Laravel's paginated envelope, while
 * categories/brands/search return `{ data: [] }`. This normalises both.
 */
export function unwrapList<T>(payload: { data: T[] } | T[]): T[] {
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

/**
 * Single-resource endpoints (`/products/{slug}`, `/categories/{slug}`, …)
 * wrap the resource in `{ data: {...} }`, while some (reviews) return the
 * resource at the root. This unwraps only when `data` is a plain object, so
 * paginated envelopes — where `data` is an array — stay untouched.
 */
export function unwrapItem<T>(payload: { data: T } | T): T {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'data' in payload &&
    payload.data !== null &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  return payload as T;
}
