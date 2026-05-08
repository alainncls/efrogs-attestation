import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './wagmiConfig.ts';
import { initializeAppKit } from './appkit.ts';

const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initializeAppKit().catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.error('AppKit initialization failed:', error);
      }
    });
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
