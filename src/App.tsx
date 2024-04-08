import {FormEvent, useEffect, useState} from 'react'
import './App.css'
import {VeraxSdk} from "@verax-attestation-registry/verax-sdk";
import {useAccount, useReadContract} from "wagmi";
import ConnectButton from "./components/ConnectButton.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import {waitForTransactionReceipt} from "viem/actions";
import {Hex} from "viem";
import {wagmiConfig} from "./wagmiConfig.ts";

function App() {
    const [veraxSdk, setVeraxSdk] = useState<VeraxSdk>();
    const [txHash, setTxHash] = useState<Hex>();
    const [attestationId, setAttestationId] = useState<Hex>();
    const [tokensOwned, setTokensOwned] = useState<number>(0);

    const {address, chainId} = useAccount();

    const schemaId = "0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71"
    const portalId = "0x95b852f4d6b7b10151646440107af491514422e3"

    const {data: balance} = useReadContract({
        abi: [{
            type: 'function',
            name: 'balanceOf',
            stateMutability: 'view',
            inputs: [{name: 'account', type: 'address'}],
            outputs: [{type: 'uint256'}],
        }],
        functionName: 'balanceOf',
        address: '0x194395587d7b169E63eaf251E86B1892fA8f1960',
        args: [address ?? '0x0'],
        chainId: 59144,
        query: {
            enabled: !!address,
        }
    })

    useEffect(() => {
        if (balance) {
            setTokensOwned(Number(balance))
        }
    }, [balance]);

    useEffect(() => {
        if (chainId && address) {
            const sdkConf =
                chainId === 59144 ? VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND : VeraxSdk.DEFAULT_LINEA_TESTNET_FRONTEND;
            const sdk = new VeraxSdk(sdkConf, address);
            setVeraxSdk(sdk);
        }
    }, [chainId, address]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setTxHash(undefined);
        setAttestationId(undefined);
        await issueAttestation();
    };

    const issueAttestation = async () => {
        if (address && veraxSdk) {
            try {
                let receipt = await veraxSdk.portal.attest(
                    portalId,
                    {
                        schemaId,
                        expirationDate: Math.floor(Date.now() / 1000) + 2592000,
                        subject: address,
                        attestationData: [{}],
                    },
                    [],
                    false,
                    100000000000000n,
                );

                if (receipt.transactionHash) {
                    setTxHash(receipt.transactionHash)
                    receipt = await waitForTransactionReceipt(wagmiConfig.getClient(), {
                        hash: receipt.transactionHash,
                    });
                    setAttestationId(receipt.logs?.[0].topics[1])
                } else {
                    alert(`Oops, something went wrong!`);
                }
            } catch (e) {
                console.log(e);
                if (e instanceof Error) {
                    alert(`Oops, something went wrong: ${e.message}`);
                }
            }
        }
    };

    const truncateHexString = (hexString: string) => {
        return `${hexString.slice(0, 7)}...${hexString.slice(hexString.length - 5, hexString.length)}`
    }

    return (
        <>
            <Header/>
            <div className={'main-container'}>
                <ConnectButton/>
                <form onSubmit={handleSubmit}>
                    <div className={'tokens-owned'}>You own {tokensOwned} eFrogs NFT(s)</div>
                    <button type="submit" disabled={!address || !veraxSdk || tokensOwned < 1}>Issue attestation</button>
                </form>
                {txHash && <div className={'message'}>Transaction Hash: <a
                  href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://goerli.lineascan.build/tx/'}${txHash}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(txHash)}</a></div>}
                {txHash && !attestationId && <div className={'message pending'}>Transaction pending...</div>}
                {attestationId && <div className={'message success'}>Attestation ID: <a
                  href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-testnet/attestations/'}${attestationId}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(attestationId)}</a></div>}
            </div>
            <Footer/>
        </>
    );
}

export default App
