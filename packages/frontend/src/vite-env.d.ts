/// <reference types="vite/client" />
/// <reference types="@reown/appkit/react" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_INFURA_API_KEY: string;
  readonly VITE_GRAPH_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
