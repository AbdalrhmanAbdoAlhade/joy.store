/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Laravel REST API (see API.md). */
  readonly VITE_API_BASE_URL?: string;
  /** Public store name used in titles and metadata. */
  readonly VITE_STORE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
