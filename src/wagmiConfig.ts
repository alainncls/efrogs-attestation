import {defaultWagmiConfig} from "@web3modal/wagmi/react/config";
import {linea, lineaTestnet, mainnet} from "wagmi/chains";

export const walletConnectProjectId = 'b90f66826134d75b644e3311789615da'
const metadata = {
    name: 'eFrogs Attestation',
    description: 'Issue attestation of eFrogs ownership',
    url: 'https://example.org', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}
const chains = [lineaTestnet, linea, mainnet] as const
export const wagmiConfig = defaultWagmiConfig({
    chains,
    projectId: walletConnectProjectId,
    metadata,
    enableCoinbase: false
})
