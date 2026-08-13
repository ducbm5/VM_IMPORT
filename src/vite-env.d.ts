/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_WEB_APP_URL?: string;
  readonly VITE_GOOGLE_FOLDER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
