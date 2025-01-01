import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { networks, projectId, wagmiAdapter } from './wagmiConfig.ts';
import LineaMainnetIcon from './assets/linea-mainnet.svg';
import LineaSepoliaIcon from './assets/linea-sepolia.svg';

const queryClient = new QueryClient();

const metadata = {
  name: 'eFrogs Attestations',
  description: 'Issue attestation of eFrogs ownership',
  url: 'https://efrogs.alainnicolas.fr',
  icons: ['https://efrogs.alainnicolas.fr/favicon.jpg'],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: networks[0],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
    history: false,
  },
  coinbasePreference: 'eoaOnly',
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family':
      'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    '--w3m-accent': '#CB7763',
  },
  chainImages: {
    59144: LineaMainnetIcon,
    59141: LineaSepoliaIcon,
  },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
