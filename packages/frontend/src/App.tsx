import { lazy, Suspense, useCallback, useState } from 'react';
import './App.css';
import type {
  AttestationPayload,
  TransactionOptions,
} from '@verax-attestation-registry/verax-sdk';
import type * as VeraxSdkModule from '@verax-attestation-registry/verax-sdk';
import { useAccount, useReadContract } from 'wagmi';
import type { Address, Hex } from 'viem';
import Panel from './components/Panel.tsx';
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

const DEFAULT_ERROR_MESSAGE = 'Oops, something went wrong!';
const ATTESTATION_EXPIRATION_SECONDS = 2_592_000;

const ChainMismatchBanner = lazy(
  () => import('./components/ChainMismatchBanner.tsx'),
);
const DetailsModal = lazy(() => import('./components/DetailsModal.tsx'));
const TestnetRibbon = lazy(() => import('./components/TestnetRibbon.tsx'));

type VeraxSdkConstructor = typeof VeraxSdkModule.VeraxSdk;

const getEfrogsContractAddress = (chainId?: number) =>
  chainId === lineaSepolia.id ? TESTNET_EFROGS_CONTRACT : EFROGS_CONTRACT;

const createVeraxSdk = (
  VeraxSdk: VeraxSdkConstructor,
  chainId: number,
  address: Address,
) => {
  if (chainId === linea.id) {
    return new VeraxSdk(
      {
        ...VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND,
        subgraphUrl: LINEA_MAINNET_SUBGRAPH_URL,
      },
      address,
    );
  }

  if (chainId === lineaSepolia.id) {
    return new VeraxSdk(
      {
        ...VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND,
        subgraphUrl: LINEA_SEPOLIA_SUBGRAPH_URL,
      },
      address,
    );
  }

  return undefined;
};

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
    address: getEfrogsContractAddress(chainId),
    args: [address ?? '0x0'],
    chainId,
    query: {
      enabled: !!address && isValidChain,
    },
  });

  const issueAttestation = useCallback(async () => {
    if (!address || !chainId || !isValidChain || !balance) return;

    setTxHash(undefined);
    setAttestationId(undefined);
    setMessage(undefined);
    setIsModalOpen(true);

    try {
      const { VeraxSdk } =
        await import('@verax-attestation-registry/verax-sdk');
      const veraxSdk = createVeraxSdk(VeraxSdk, chainId, address);

      if (!veraxSdk) {
        setMessage(DEFAULT_ERROR_MESSAGE);
        return;
      }

      const portalAddress: Address =
        chainId === lineaSepolia.id ? TESTNET_PORTAL_ADDRESS : PORTAL_ADDRESS;
      const attestationPayload: AttestationPayload = {
        schemaId: SCHEMA_ID,
        expirationDate:
          Math.floor(Date.now() / 1000) + ATTESTATION_EXPIRATION_SECONDS,
        subject: address,
        attestationData: [
          {
            contract: getEfrogsContractAddress(chainId),
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
        const { waitForTransactionReceipt } = await import('viem/actions');
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
  }, [address, balance, chainId, isValidChain]);

  const disabled = !isConnected || !isValidChain || !address || !balance;

  const frogBalance = Number(balance ?? 0n);
  const walletStatus = address
    ? `You have ${frogBalance} eFrog${frogBalance === 1 ? '' : 's'}`
    : undefined;

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <Header />
      <main
        className={'main-container'}
        aria-describedby="application-description"
      >
        <p id="application-description" className="sr-only">
          Create on-chain ownership attestations for eFrogs NFTs using Verax on
          Linea.
        </p>
        {!isValidChain && isConnected ? (
          <Suspense fallback={null}>
            <ChainMismatchBanner />
          </Suspense>
        ) : null}
        {chainId === lineaSepolia.id ? (
          <Suspense fallback={null}>
            <TestnetRibbon onNftMinted={refetch} />
          </Suspense>
        ) : null}
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
        <Panel
          title="Attest your eFrogs"
          status={walletStatus}
          disabled={disabled}
          onClick={issueAttestation}
        />
        {isModalOpen ? (
          <Suspense fallback={null}>
            <DetailsModal
              attestationId={attestationId}
              txHash={txHash}
              isOpen={isModalOpen}
              onClose={closeModal}
              message={message}
            />
          </Suspense>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

export default App;
