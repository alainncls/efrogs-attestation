import { defineConfig } from 'hardhat/config';
import hardhatViem from '@nomicfoundation/hardhat-viem';
import hardhatVerify from '@nomicfoundation/hardhat-verify';

try {
  process.loadEnvFile();
} catch (error) {
  if ((error as { code?: string }).code !== 'ENOENT') {
    throw error;
  }
}

const { INFURA_KEY, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;
const LINEA_NETWORKS = ['linea-sepolia', 'linea'];
const PRIVATE_KEY_REGEX = /^0x[0-9a-fA-F]{64}$/;

const requestedNetworkFlagIndex = process.argv.indexOf('--network');
const requestedNetwork =
  requestedNetworkFlagIndex === -1
    ? undefined
    : process.argv[requestedNetworkFlagIndex + 1];

const hasRemoteNetworkConfig =
  !!INFURA_KEY &&
  !!ETHERSCAN_API_KEY &&
  !!PRIVATE_KEY &&
  PRIVATE_KEY_REGEX.test(PRIVATE_KEY);

if (
  requestedNetwork &&
  LINEA_NETWORKS.includes(requestedNetwork) &&
  !hasRemoteNetworkConfig
) {
  throw new Error(
    'INFURA_KEY, PRIVATE_KEY and ETHERSCAN_API_KEY must be set with valid deployment values',
  );
}

export default defineConfig({
  plugins: [hardhatViem, hardhatVerify],
  solidity: {
    compilers: [
      {
        version: '0.8.21',
        settings: {
          evmVersion: 'shanghai',
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    ...(hasRemoteNetworkConfig
      ? {
          'linea-sepolia': {
            type: 'http' as const,
            url: `https://linea-sepolia.infura.io/v3/${INFURA_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 59141,
          },
          linea: {
            type: 'http' as const,
            url: `https://linea-mainnet.infura.io/v3/${INFURA_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 59144,
          },
        }
      : {}),
  },
  paths: {
    sources: './src',
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY ?? '',
    },
  },
});
