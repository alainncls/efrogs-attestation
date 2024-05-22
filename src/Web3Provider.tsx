import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { wagmiConfig } from './wagmiConfig.ts';
import { ConnectKitProvider } from 'connectkit';

const queryClient = new QueryClient();

interface CustomTheme {
  '--ck-font-family': string;
  '--ck-connectbutton-color': string;
  '--ck-connectbutton-background': string;
  '--ck-connectbutton-hover-background': string;
  '--ck-connectbutton-active-background': string;
  '--ck-connectbutton-font-size'?: string;
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Readonly<Web3ProviderProps>) {

  const customTheme: CustomTheme = {
    '--ck-font-family': '"Jersey 10", sans-serif',
    '--ck-connectbutton-color': '#F1D199',
    '--ck-connectbutton-background': 'none',
    '--ck-connectbutton-hover-background': 'transparent',
    '--ck-connectbutton-active-background': 'transparent',
  };

  if (window.innerWidth >= 1800) {
    customTheme['--ck-connectbutton-font-size'] = '60px';
  } else {
    customTheme['--ck-connectbutton-font-size'] = '40px';
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark" customTheme={customTheme}>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
