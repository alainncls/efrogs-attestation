# eFrogs Attestation

[![Netlify Status](https://api.netlify.com/api/v1/badges/1a846ac1-f1ed-436f-9c5d-ba59a7afe966/deploy-status)](https://app.netlify.com/sites/efrogs/deploys)

## 🐸 Overview

This project enables eFrogs NFT holders on Linea to create ownership attestations via
the [Verax Attestation Registry](https://www.ver.ax/). Initially developed during the Linea/eFrogs hackathon in April
2024 (2nd place), it is now available on mainnet.

🌐 Demo: [efrogs.alainnicolas.fr](https://efrogs.alainnicolas.fr)

## 📋 Prerequisites

- **Node.js** >= 22.21.1 (see `.nvmrc`)
- **pnpm** >= 10

```bash
# Install the correct Node.js version
nvm use

# Install pnpm if not already installed
corepack enable
corepack prepare pnpm@latest --activate
```

## 🛠 Technologies

- Frontend: React 19 + TypeScript + Vite 6
- Smart Contracts: Solidity 0.8.21 + Hardhat
- Attestations: Verax Attestation Registry
- Network: Linea (mainnet & Sepolia testnet)
- Deployment: Netlify

## 🚀 Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp packages/frontend/.env.example packages/frontend/.env
# Then edit .env with your API keys

# Start development server
pnpm dev

# Build for production
pnpm -r run build
```

## 🔧 Environment Variables

The frontend requires the following environment variables:

| Variable                        | Description                    | Required |
| ------------------------------- | ------------------------------ | -------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud Project ID | Yes      |
| `VITE_INFURA_API_KEY`           | Infura API Key for RPC         | Yes      |
| `VITE_GRAPH_API_KEY`            | The Graph API Key              | Yes      |

## 📊 Verax Data on Linea

### Portal

- Linea Sepolia: [
  `0x407e280281B812Adef69A91230659C9D738D82Cb`](https://explorer.ver.ax/linea-sepolia/portals/0x407e280281B812Adef69A91230659C9D738D82Cb)
- Linea Mainnet: [
  `0x5f47bCeB43B8114cf85d3Ac50e9850164dE2984e`](https://explorer.ver.ax/linea/portals/0x5f47bCeB43B8114cf85d3Ac50e9850164dE2984e)

### Schema

- Linea Sepolia: [
  `0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5`](https://explorer.ver.ax/linea-sepolia/schemas/0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5)
- Linea Mainnet: [
  `0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5`](https://explorer.ver.ax/linea/schemas/0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5)

## 🔗 Useful Links

- [eFrogs Website](https://efrogs.eth.limo/)
- [Verax Documentation](https://docs.ver.ax/)
- [Linea Network](https://linea.build/)

## 🤝 Contribution

Contributions are welcome! Feel free to open an issue or a pull request.
