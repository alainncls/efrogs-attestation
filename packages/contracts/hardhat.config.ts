import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const { INFURA_KEY, PRIVATE_KEY, LINEASCAN_API_KEY } = process.env;

if (
  INFURA_KEY === undefined ||
  PRIVATE_KEY === undefined ||
  LINEASCAN_API_KEY === undefined
) {
  throw new Error(
    'INFURA_KEY, PRIVATE_KEY or LINEASCAN_API_KEY is not set in .env file',
  );
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.21',
        settings: {
          evmVersion: 'paris',
        },
      },
    ],
  },
  defaultNetwork: 'linea-goerli',
  networks: {
    'linea-goerli': {
      url: `https://linea-goerli.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    'linea-sepolia': {
      url: `https://linea-sepolia.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    linea: {
      url: `https://linea-mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: './src',
  },
  etherscan: {
    apiKey: {
      'linea-goerli': LINEASCAN_API_KEY,
      'linea-sepolia': LINEASCAN_API_KEY,
      linea: LINEASCAN_API_KEY,
    },
    customChains: [
      {
        network: 'linea-goerli',
        chainId: 59140,
        urls: {
          apiURL: 'https://api-testnet.lineascan.build/api',
          browserURL: 'https://goerli.lineascan.build',
        },
      },
      {
        network: 'linea-sepolia',
        chainId: 59141,
        urls: {
          apiURL: 'https://api-sepolia.lineascan.build/api',
          browserURL: 'https://sepolia.lineascan.build',
        },
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.lineascan.build/api',
          browserURL: 'https://lineascan.build',
        },
      },
    ],
  },
};

export default config;
