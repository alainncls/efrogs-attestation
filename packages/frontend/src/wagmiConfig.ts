import { lineaSepolia, mainnet } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';
import { createConfig, http } from 'wagmi';

export const walletConnectProjectId = 'b90f66826134d75b644e3311789615da';
const infuraApiKey: string = '2VbuXFYphoB468fyFPinOmis7o5';

const chains = [lineaSepolia, mainnet] as const;
export const wagmiConfig = createConfig(
  getDefaultConfig({
    walletConnectProjectId,
    appName: 'eFrogs Attestations',
    appDescription: 'Issue attestation of eFrogs ownership',
    appUrl: 'https://efrogs.alainnicolas.fr',
    appIcon: 'https://efrogs.alainnicolas.fr/favicon.jpg',
    chains,
    transports: {
      [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraApiKey}`),
      [lineaSepolia.id]: http(
        `https://linea-sepolia.infura.io/v3/${infuraApiKey}`,
      ),
    },
  }),
);
