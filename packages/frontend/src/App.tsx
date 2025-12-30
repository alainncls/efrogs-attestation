import { useCallback, useMemo, useState } from 'react';
import './App.css';
import type {
  AttestationPayload,
  TransactionOptions,
} from '@verax-attestation-registry/verax-sdk';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { useAccount, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'viem/actions';
import type { Address, Hex } from 'viem';
import Panel from './components/Panel.tsx';
import DetailsModal from './components/DetailsModal.tsx';
import TestnetRibbon from './components/TestnetRibbon.tsx';
import {
  EFROGS_CONTRACT,
  EFROGS_NFT_ABI,
  EFROGS_PORTAL_ABI,
  LINEA_MAINNET_SUBGRAPH_URL,
  LINEA_SEPOLIA_SUBGRAPH_URL,
  PORTAL_ADDRESS,
  SCHEMA_ID,
  TESTNET_EFROGS_CONTRACT,
  TESTNET_PORTAL_ADDRESS,
  TRANSACTION_VALUE,
} from './utils/constants.ts';
import { linea, lineaSepolia } from 'wagmi/chains';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';
import { wagmiAdapter } from './wagmiConfig.ts';
import ChainMismatchBanner from './components/ChainMismatchBanner.tsx';

const DEFAULT_ERROR_MESSAGE = 'Oops, something went wrong!';

function App() {
  const [txHash, setTxHash] = useState<Hex>();
  const [attestationId, setAttestationId] = useState<Hex>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>();

  const { address, chainId, isConnected } = useAccount();

  const isValidChain = chainId === linea.id || chainId === lineaSepolia.id;

  const { data: balance, refetch } = useReadContract({
    abi: EFROGS_NFT_ABI,
    functionName: 'balanceOf',
    address:
      chainId === lineaSepolia.id ? TESTNET_EFROGS_CONTRACT : EFROGS_CONTRACT,
    args: [address ?? '0x0'],
    chainId,
    query: {
      enabled: !!address && isValidChain,
    },
  });

  const veraxSdk = useMemo(() => {
    if (!chainId || !address || !isValidChain) {
      return undefined;
    }

    if (chainId === linea.id) {
      const sdkConf = {
        ...VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND,
        subgraphUrl: LINEA_MAINNET_SUBGRAPH_URL,
      };
      return new VeraxSdk(sdkConf, address);
    }

    if (chainId === lineaSepolia.id) {
      const sdkConf = {
        ...VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND,
        subgraphUrl: LINEA_SEPOLIA_SUBGRAPH_URL,
      };
      return new VeraxSdk(sdkConf, address);
    }

    return undefined;
  }, [chainId, address, isValidChain]);

  const issueAttestation = useCallback(async () => {
    if (address && veraxSdk && balance) {
      setTxHash(undefined);
      setAttestationId(undefined);
      setMessage(undefined);
      setIsModalOpen(true);

      try {
        const portalAddress: Address =
          chainId === lineaSepolia.id ? TESTNET_PORTAL_ADDRESS : PORTAL_ADDRESS;
        const attestationPayload: AttestationPayload = {
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
        };
        const validationPayload: string[] = [];
        const options: TransactionOptions = {
          waitForConfirmation: false,
          value: TRANSACTION_VALUE,
          customAbi: EFROGS_PORTAL_ABI,
        };

        let receipt = await veraxSdk.portal.attest(
          portalAddress,
          attestationPayload,
          validationPayload,
          options,
        );

        if (receipt.transactionHash) {
          setTxHash(receipt.transactionHash);
          receipt = await waitForTransactionReceipt(
            wagmiAdapter.wagmiConfig.getClient(),
            {
              hash: receipt.transactionHash,
            },
          );
          setAttestationId(receipt.logs?.[0]?.topics[1]);
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
    () =>
      !isConnected ||
      !isValidChain ||
      (isConnected && (!address || !veraxSdk || !balance)),
    [isConnected, isValidChain, address, veraxSdk, balance],
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
        <Header />
        {!isValidChain && isConnected && <ChainMismatchBanner />}
        {chainId === lineaSepolia.id && <TestnetRibbon onNftMinted={refetch} />}
        <a
          href="https://element.market/assets/linea/0x194395587d7b169e63eaf251e86b1892fa8f1960/645"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          aria-label="View eFrog #645 on Element Market"
        >
          <div
            className="grooving-frog"
            role="img"
            aria-label="Dancing frog animation"
          ></div>
        </a>
        <Panel title={title} disabled={disabled} onClick={issueAttestation} />
        <DetailsModal
          attestationId={attestationId}
          txHash={txHash}
          isOpen={isModalOpen}
          onClose={toggleModal}
          message={message}
        />
        <Footer />
      </div>
    </>
  );
}

export default App;
