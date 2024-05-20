import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { wagmiConfig } from './wagmiConfig.ts';
import { ConnectKitProvider } from 'connectkit';

const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Readonly<Web3ProviderProps>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            '--ck-font-family': '"Jersey 10", sans-serif',
            '--ck-connectbutton-background': 'none',
            '--ck-connectbutton-font-size': '40px',
            '--ck-connectbutton-hover-background': 'transparent',
            '--ck-connectbutton-active-background': 'transparent',
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
