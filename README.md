# eFrogs Attestation

[![Netlify Status](https://api.netlify.com/api/v1/badges/1a846ac1-f1ed-436f-9c5d-ba59a7afe966/deploy-status)](https://app.netlify.com/sites/efrogs/deploys)

## 🐸 Overview

This project enables eFrogs NFT holders on Linea to create ownership attestations via
the [Verax Attestation Registry](https://www.ver.ax/). Initially developed during the Linea/eFrogs hackathon in April
2024 (2nd place), it is now available on Linea Mainnet.

🌐 Demo: [efrogs.alainnicolas.fr](https://efrogs.alainnicolas.fr)

## 📁 Project Structure

This is a pnpm monorepo with two packages:

```
packages/
├── contracts/   # Solidity smart contracts (Hardhat)
└── frontend/    # React SPA (Vite + wagmi + Reown AppKit)
```

## 🏗️ How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│ EFrogsPortal │────▶│ Verax Registry  │
│  (React)    │     │  (Solidity)  │     │  (Attestations) │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ User Wallet │     │ eFrogs NFT   │
│  (wagmi)    │     │  Contract    │
└─────────────┘     └──────────────┘
```

1. User connects their wallet via Reown AppKit (WalletConnect)
2. Frontend queries the eFrogs NFT contract for user's balance
3. If balance > 0, user can create an attestation
4. User pays **0.0001 ETH** fee to the Portal
5. Portal verifies ownership on-chain and creates a Verax attestation
6. Attestation is stored with schema: `(address tokenContract, uint256 balance)`
7. Attestation expires after 30 days

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

- Frontend: React 19 + TypeScript + Vite 7
- Smart Contracts: Solidity 0.8.21 + Hardhat 3
- Wallet Connection: wagmi v3 + viem v2 + Reown AppKit
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
```

## 🔧 Environment Variables

### Frontend (`packages/frontend/.env`)

| Variable                        | Description                    | Required |
|---------------------------------|--------------------------------|----------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud Project ID | Yes      |
| `VITE_INFURA_API_KEY`           | Infura API Key for RPC         | Yes      |
| `VITE_GRAPH_API_KEY`            | The Graph API Key              | Yes      |

### Contracts (`packages/contracts/.env`)

| Variable            | Description                        | Required       |
|---------------------|------------------------------------|----------------|
| `INFURA_KEY`        | Infura API Key                     | Yes            |
| `PRIVATE_KEY`       | Deployer private key (with 0x)     | Yes            |
| `ETHERSCAN_API_KEY` | Lineascan API Key for verification | Yes            |
| `ROUTER_ADDRESS`    | Verax Router address               | For deployment |
| `EFROGS_ADDRESS`    | eFrogs NFT contract address        | For deployment |

## 📜 Available Scripts

### Root (monorepo)

```bash
pnpm dev              # Start frontend dev server
pnpm lint             # Run ESLint + Solhint on all packages
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Check Prettier formatting
pnpm format:fix       # Auto-fix formatting
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Hardhat tests
```

### Contracts (`packages/contracts`)

```bash
pnpm compile                               # Compile Solidity contracts
pnpm deploy:portal --network linea         # Deploy portal to mainnet
pnpm deploy:portal --network linea-sepolia # Deploy portal to testnet
pnpm deploy:nft --network linea-sepolia    # Deploy test NFT (testnet only)
```

### Frontend (`packages/frontend`)

```bash
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm preview          # Preview production build
```

## 📊 Deployed Contracts

### eFrogs NFT

| Network       | Address                                                                                                                            |
|---------------|------------------------------------------------------------------------------------------------------------------------------------|
| Linea Mainnet | [`0x194395587d7b169e63eaf251e86b1892fa8f1960`](https://lineascan.build/address/0x194395587d7b169e63eaf251e86b1892fa8f1960)         |
| Linea Sepolia | [`0x35c134262605bc69B3383EA132A077d09d8df061`](https://sepolia.lineascan.build/address/0x35c134262605bc69B3383EA132A077d09d8df061) |

### EFrogsPortal (Verax)

| Network       | Address                                                                                                                                  |
|---------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Linea Mainnet | [`0x5f47bCeB43B8114cf85d3Ac50e9850164dE2984e`](https://explorer.ver.ax/linea/portals/0x5f47bCeB43B8114cf85d3Ac50e9850164dE2984e)         |
| Linea Sepolia | [`0x407e280281B812Adef69A91230659C9D738D82Cb`](https://explorer.ver.ax/linea-sepolia/portals/0x407e280281B812Adef69A91230659C9D738D82Cb) |

### Attestation Schema

| Network       | Schema ID                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Linea Mainnet | [`0x5dc8bc...d2f5`](https://explorer.ver.ax/linea/schemas/0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5)         |
| Linea Sepolia | [`0x5dc8bc...d2f5`](https://explorer.ver.ax/linea-sepolia/schemas/0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5) |

**Schema structure:** `(address tokenContract, uint256 balance)`

## 🔀 Fork & Adapt

To adapt this project for your own NFT collection:

### 1. Smart Contract

Modify `packages/contracts/src/EFrogsPortal.sol`:

- Update constructor to accept your NFT contract address
- Adjust the `fee` if needed (default: 0.0001 ETH)
- Optionally create a new Verax schema for your data structure

### 2. Deploy & Register

```bash
# Set environment variables
export ROUTER_ADDRESS=0x... # Verax Router (see docs.ver.ax)
export EFROGS_ADDRESS=0x... # Your NFT contract

# Deploy
pnpm --filter contracts deploy:portal --network linea-sepolia
```

The deploy script automatically:

- Deploys the portal contract
- Verifies on Lineascan
- Registers the portal with Verax

### 3. Frontend Constants

Update `packages/frontend/src/utils/constants.ts`:

- `EFROGS_CONTRACT` / `TESTNET_EFROGS_CONTRACT`: Your NFT addresses
- `PORTAL_ADDRESS` / `TESTNET_PORTAL_ADDRESS`: Your portal addresses
- `SCHEMA_ID`: Your schema ID (if created new)
- Subgraph URLs if using custom indexing

### 4. Branding

- Replace assets in `packages/frontend/public/`
- Update styles in `packages/frontend/src/App.css`

## 🔗 Useful Links

- [eFrogs Website](https://efrogs.eth.limo/)
- [Verax Documentation](https://docs.ver.ax/)
- [Linea Network](https://linea.build/)
- [Reown AppKit](https://docs.reown.com/appkit/overview)
- [wagmi Documentation](https://wagmi.sh/)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contribution

Contributions are welcome! Feel free to open an issue or a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
