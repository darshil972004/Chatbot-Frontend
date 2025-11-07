/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_ADMIN_PANEL_API_BASE?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_ADMIN_PANEL_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
