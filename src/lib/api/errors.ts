import type { AxiosError } from 'axios';
import type { ApiErrorBody } from './types';

/**
 * Normalised error the whole app reasons about.
 *
 * The backend mixes shapes: Laravel validation (`{ message, errors }`), plain
 * `{ message }` for 401/404, and — when the `Accept` header is missing — a
 * full Symfony 500 with a `trace`. We collapse all of those into one type and
 * never surface raw traces to the user.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Field-level validation messages, if any. */
  readonly fields: Record<string, string[]>;
  /** True for 401 — the session is gone or was never established. */
  readonly isUnauthorized: boolean;
  readonly isNotFound: boolean;
  readonly isValidation: boolean;
  readonly isNetwork: boolean;
  /** Safe, human-facing text. Arabic, ready to render. */
  readonly userMessage: string;

  constructor(init: {
    status: number;
    message: string;
    fields?: Record<string, string[]>;
    isNetwork?: boolean;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.fields = init.fields ?? {};
    this.isNetwork = init.isNetwork ?? false;
    this.isUnauthorized = init.status === 401;
    this.isNotFound = init.status === 404;
    this.isValidation = init.status === 422 || Object.keys(this.fields).length > 0;
    this.userMessage = init.isNetwork
      ? 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.'
      : statusMessage(init.status);
  }

  /** First validation message for a given form field, if present. */
  fieldError(field: string): string | undefined {
    return this.fields[field]?.[0];
  }
}

function statusMessage(status: number): string {
  switch (status) {
    case 401:
      return 'يجب تسجيل الدخول للمتابعة.';
    case 403:
      return 'ليس لديك صلاحية لتنفيذ هذه العملية.';
    case 404:
      return 'لم نعثر على ما تبحث عنه.';
    case 419:
      return 'انتهت صلاحية الجلسة. من فضلك أعد تحميل الصفحة.';
    case 422:
      return 'تحقق من البيانات المدخلة وحاول مرة أخرى.';
    case 429:
      return 'طلبات كثيرة في وقت قصير. انتظر قليلاً ثم أعد المحاولة.';
    default:
      if (status >= 500) return 'حدث خطأ غير متوقع من الخادم. حاول مرة أخرى لاحقاً.';
      return 'حدث خطأ ما. حاول مرة أخرى.';
  }
}

/** Convert an Axios failure into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError<ApiErrorBody>;

  // Request never reached the server (offline, DNS, CORS, timeout).
  if (!axiosError.response) {
    return new ApiError({ status: 0, message: axiosError.message, isNetwork: true });
  }

  const { status, data } = axiosError.response;
  return new ApiError({
    status,
    message: data?.message ?? axiosError.message,
    fields: data?.errors,
  });
}
