import { defineConfig } from 'hardhat/config';
import hardhatViem from '@nomicfoundation/hardhat-viem';
import hardhatVerify from '@nomicfoundation/hardhat-verify';

process.loadEnvFile();

const { INFURA_KEY, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

if (!INFURA_KEY || !PRIVATE_KEY || !ETHERSCAN_API_KEY) {
  throw new Error(
    'INFURA_KEY, PRIVATE_KEY or ETHERSCAN_API_KEY is not set in .env file',
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
    'linea-sepolia': {
      type: 'http',
      url: `https://linea-sepolia.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 59141,
    },
    linea: {
      type: 'http',
      url: `https://linea-mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 59144,
    },
  },
  paths: {
    sources: './src',
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    },
  },
});
