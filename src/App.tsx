import {useEffect, useMemo, useState} from 'react'
import './App.css'
import {VeraxSdk} from "@verax-attestation-registry/verax-sdk";
import {useAccount, useReadContract} from "wagmi";
import {waitForTransactionReceipt} from "viem/actions";
import {Hex} from "viem";
import {wagmiConfig} from "./wagmiConfig.ts";
import GenericButton from "./components/GenericButton.tsx";
import ConnectButton from "./components/ConnectButton.tsx";
import GenericPanel from "./components/GenericPanel.tsx";

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

    const handleSubmit = async () => {
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

    const title = () => {
        if (!address) {
            return 'Check your eFrogs';
        } else {
            if (tokensOwned === 0) {
                return 'You have 0 eFrog';
            }
            if (tokensOwned === 1) {
                return 'You have 1 eFrog';
            }
            return `You have ${tokensOwned} eFrogs`;
        }
    }

    const disabled = useMemo(() => Boolean(address) && (!veraxSdk || tokensOwned < 1), [address, veraxSdk, tokensOwned]);
    const label = useMemo(() => !address || disabled ? undefined : 'Issue attestation', [address, disabled]);

    return (
        <>
            <div className={'main-container'}>
                <a href="https://element.market/assets/linea/0x194395587d7b169e63eaf251e86b1892fa8f1960/645"
                   target="_blank" rel="noopener noreferrer"
                   className="link">
                    <div className="grooving-frog"></div>
                </a>
                <GenericPanel title={title()}/>
                <GenericButton disabled={disabled}
                               label={label}
                               onClick={handleSubmit}>
                    <ConnectButton/>
                </GenericButton>
                {txHash && <div className={'message'}>Transaction Hash: <a
                  href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://goerli.lineascan.build/tx/'}${txHash}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(txHash)}</a></div>}
                {txHash && !attestationId && <div className={'message pending'}>Transaction pending...</div>}
                {attestationId && <div className={'message success'}>Attestation ID: <a
                  href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-testnet/attestations/'}${attestationId}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(attestationId)}</a></div>}
            </div>
        </>
    );
}

export default App
