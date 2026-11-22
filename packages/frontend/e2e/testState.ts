export interface TestState {
  complete: (kind: 'success' | 'error') => void;
  setBalance: (value: `${bigint}` | 'loading' | 'error') => void;
  setIdentity: (address: string | undefined, chainId: number) => void;
  hideTrigger: (hidden: boolean) => void;
  retryCount: () => number;
}

declare global {
  interface Window {
    efrogTest: TestState;
  }
}
