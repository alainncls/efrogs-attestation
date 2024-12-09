import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Conf, VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { useAccount, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'viem/actions';
import { Hex } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import GenericButton from './components/GenericButton.tsx';
import ConnectButton from './components/ConnectButton.tsx';
import GenericPanel from './components/GenericPanel.tsx';
import DetailsModal from './components/DetailsModal.tsx';
import TestnetRibbon from './components/TestnetRibbon.tsx';
import {
  EFROGS_CONTRACT,
  PORTAL_ADDRESS,
  SCHEMA_ID,
  TESTNET_EFROGS_CONTRACT,
  TESTNET_PORTAL_ADDRESS,
  TRANSACTION_VALUE,
} from './utils/constants.ts';
import { linea, lineaSepolia } from 'wagmi/chains';
import { switchChain } from '@wagmi/core';

const DEFAULT_ERROR_MESSAGE = 'Oops, something went wrong!';

function App() {
  const [veraxSdk, setVeraxSdk] = useState<VeraxSdk>();
  const [txHash, setTxHash] = useState<Hex>();
  const [attestationId, setAttestationId] = useState<Hex>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>();

  const { address, chainId, isConnected } = useAccount();

  useEffect(() => {
    if (chainId !== lineaSepolia.id && chainId !== linea.id) {
      switchChain(wagmiConfig, { chainId: linea.id });
    }
  }, [chainId]);

  const { data: balance, refetch } = useReadContract({
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    address:
      chainId === lineaSepolia.id ? TESTNET_EFROGS_CONTRACT : EFROGS_CONTRACT,
    args: [address ?? '0x0'],
    chainId,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (chainId && address) {
      let sdkConf: Conf = VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND;
      if (chainId === linea.id) {
        sdkConf.subgraphUrl =
          'https://gateway.thegraph.com/api/649414afdd14301c7a2f6d141f717ed1/subgraphs/id/ESRDQ5djmucKeqxNz7JGVHr621sjGEEsY6M6JibjJ9u3';
      } else if (chainId === lineaSepolia.id) {
        sdkConf = VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND;
        sdkConf.subgraphUrl =
          'https://gateway.thegraph.com/api/649414afdd14301c7a2f6d141f717ed1/subgraphs/id/2gfRmZ1e1uJKpCQsUrvxJmRivNa7dvvuULoc8SJabR8v';
      }

      const sdk = new VeraxSdk(sdkConf, address);

      setVeraxSdk(sdk);
    }
  }, [chainId, address]);

  const issueAttestation = useCallback(async () => {
    if (address && veraxSdk && balance) {
      setTxHash(undefined);
      setAttestationId(undefined);
      setMessage(undefined);
      setIsModalOpen(true);

      try {
        let receipt = await veraxSdk.portal.attestV2(
          chainId === lineaSepolia.id ? TESTNET_PORTAL_ADDRESS : PORTAL_ADDRESS,
          {
            schemaId: SCHEMA_ID,
            expirationDate: Math.floor(Date.now() / 1000) + 2592000,
            subject: address,
            attestationData: [
              {
                contract:
                  chainId === lineaSepolia.id
                    ? TESTNET_EFROGS_CONTRACT
                    : EFROGS_CONTRACT,
                balance,
              },
            ],
          },
          [],
          false,
          TRANSACTION_VALUE,
        );

        if (receipt.transactionHash) {
          setTxHash(receipt.transactionHash);
          receipt = await waitForTransactionReceipt(wagmiConfig.getClient(), {
            hash: receipt.transactionHash,
          });
          setAttestationId(receipt.logs?.[0].topics[1]);
        } else {
          setMessage(DEFAULT_ERROR_MESSAGE);
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          if (e.message.includes('User rejected the request')) {
            setMessage('User denied transaction signature');
          } else {
            setMessage(`${DEFAULT_ERROR_MESSAGE} - ${e.message}`);
          }
        } else {
          setMessage(DEFAULT_ERROR_MESSAGE);
        }
      }
    }
  }, [address, veraxSdk, balance, chainId]);

  const disabled = useMemo(
    () => isConnected && (!address || !veraxSdk || !balance),
    [isConnected, address, veraxSdk, balance],
  );

  const title = useMemo(() => {
    if (!address) return 'Attest your eFrogs';
    return `You have ${Number(balance) || 0} eFrog${Number(balance) === 1 ? '' : 's'}`;
  }, [address, balance]);

  const toggleModal = useCallback(() => {
    setIsModalOpen(!isModalOpen);
  }, [isModalOpen]);

  return (
    <>
      <div className={'main-container'}>
        {chainId === lineaSepolia.id && <TestnetRibbon onNftMinted={refetch} />}
        <a
          href="https://element.market/assets/linea/0x194395587d7b169e63eaf251e86b1892fa8f1960/645"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          <div className="grooving-frog"></div>
        </a>
        <GenericPanel title={title} />
        <GenericButton
          disabled={disabled}
          label={address ? 'Issue attestation' : undefined}
          onClick={issueAttestation}
        >
          <ConnectButton />
        </GenericButton>
        <DetailsModal
          attestationId={attestationId}
          txHash={txHash}
          isOpen={isModalOpen}
          onClose={toggleModal}
          message={message}
        />
      </div>
    </>
  );
}

export default App;
