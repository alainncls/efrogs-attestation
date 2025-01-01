import { linea, lineaSepolia, mainnet } from 'wagmi/chains';
import { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'viem';

export const projectId: string = 'b90f66826134d75b644e3311789615da';
const infuraApiKey: string = '2VbuXFYphoB468fyFPinOmis7o5';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  linea,
  lineaSepolia,
  mainnet,
];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  transports: {
    [linea.id]: http(`https://linea-mainnet.infura.io/v3/${infuraApiKey}`),
    [lineaSepolia.id]: http(
      `https://linea-sepolia.infura.io/v3/${infuraApiKey}`,
    ),
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraApiKey}`),
  },
});
