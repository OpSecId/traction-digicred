/// <reference types="vite/client" />

declare module 'qrcode.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{ value: string; size?: number; level?: string }, unknown, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_MARKETPLACE_ICON?: string;
}
