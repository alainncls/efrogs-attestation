import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { useAccount, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'viem/actions';
import { Hex } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import GenericButton from './components/GenericButton.tsx';
import ConnectButton from './components/ConnectButton.tsx';
import GenericPanel from './components/GenericPanel.tsx';

function App() {
  const [veraxSdk, setVeraxSdk] = useState<VeraxSdk>();
  const [txHash, setTxHash] = useState<Hex>();
  const [attestationId, setAttestationId] = useState<Hex>();
  const { address, chainId, isConnected } = useAccount();

  const eFrogsContract = '0x35c134262605bc69B3383EA132A077d09d8df061';
  const { data: balance } = useReadContract({
    abi: [{
      type: 'function',
      name: 'balanceOf',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ type: 'uint256' }],
    }],
    functionName: 'balanceOf',
    address: eFrogsContract,
    args: [address ?? '0x0'],
    chainId: 59141,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (chainId && address) {
      const sdkConf =
        chainId === 59144 ? VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND : VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND;
      const sdk = new VeraxSdk(sdkConf, address);
      setVeraxSdk(sdk);
    }
  }, [chainId, address]);

  const issueAttestation = useCallback(async () => {
    if (address && veraxSdk && balance) {
      try {
        let receipt = await veraxSdk.portal.attest(
          '0x0Cb56F201E7aFe02E542E2D2D42c34d4ce7203F7',
          {
            schemaId: '0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5',
            expirationDate: Math.floor(Date.now() / 1000) + 2592000,
            subject: address,
            attestationData: [{ contract: eFrogsContract, balance }],
          },
          [],
          false,
          100000000000000n,
        );

        if (receipt.transactionHash) {
          setTxHash(receipt.transactionHash);
          receipt = await waitForTransactionReceipt(wagmiConfig.getClient(), {
            hash: receipt.transactionHash,
          });
          setAttestationId(receipt.logs?.[0].topics[1]);
        } else {
          alert(`Oops, something went wrong!`);
        }
      } catch (e) {
        console.error(e);
        alert(`Oops, something went wrong: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  }, [address, veraxSdk, balance]);

  const disabled = useMemo(() => isConnected && (!address || !veraxSdk || !balance), [isConnected, address, veraxSdk, balance]);
  const title = useMemo(() => {
    if (!address) return 'Attest your eFrogs';
    return `You have ${Number(balance) || 0} eFrog${Number(balance) === 1 ? '' : 's'}`;
  }, [address, balance]);

  return (
    <>
      <div className={'main-container'}>
        <a href="https://element.market/assets/linea/0x194395587d7b169e63eaf251e86b1892fa8f1960/645"
           target="_blank" rel="noopener noreferrer"
           className="link">
          <div className="grooving-frog"></div>
        </a>
        <GenericPanel title={title} />
        <GenericButton disabled={disabled}
                       label={address ? 'Issue attestation' : undefined}
                       onClick={issueAttestation}>
          <ConnectButton />
        </GenericButton>
        {txHash && <div className={'message'}>Transaction Hash: <a
          href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://goerli.lineascan.build/tx/'}${txHash}`}
          target="_blank" rel="noopener noreferrer">{txHash}</a></div>}
        {attestationId && <div className={'message success'}>Attestation ID: <a
          href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-sepolia/attestations/'}${attestationId}`}
          target="_blank" rel="noopener noreferrer">{attestationId}</a></div>}
      </div>
    </>
  );
}

export default App;
