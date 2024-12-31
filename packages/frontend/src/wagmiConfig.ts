import { linea, lineaSepolia, mainnet } from 'wagmi/chains';
import { http } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const walletConnectProjectId = 'b90f66826134d75b644e3311789615da';
const infuraApiKey: string = '2VbuXFYphoB468fyFPinOmis7o5';

export const wagmiConfig = getDefaultConfig({
  chains: [linea, lineaSepolia, mainnet],
  transports: {
    [linea.id]: http(`https://linea-mainnet.infura.io/v3/${infuraApiKey}`),
    [lineaSepolia.id]: http(
      `https://linea-sepolia.infura.io/v3/${infuraApiKey}`,
    ),
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraApiKey}`),
  },

  projectId: walletConnectProjectId,

  appName: 'eFrogs Attestations',
  appDescription: 'Issue attestation of eFrogs ownership',
  appUrl: 'https://efrogs.alainnicolas.fr',
  appIcon: 'https://efrogs.alainnicolas.fr/favicon.jpg',
});
