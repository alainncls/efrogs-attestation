import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import './App.css';
import type {
  AttestationPayload,
  TransactionOptions,
} from '@verax-attestation-registry/verax-sdk';
import type * as VeraxSdkModule from '@verax-attestation-registry/verax-sdk';
import { useAccount, useReadContract } from 'wagmi';
import type { Address, Hex, TransactionReceipt } from 'viem';
import Panel from './components/Panel.tsx';
import {
  EFROGS_CONTRACT,
  EFROGS_NFT_ABI,
  EFROGS_PORTAL_ABI,
  PORTAL_ADDRESS,
  SCHEMA_ID,
  TESTNET_EFROGS_CONTRACT,
  TESTNET_PORTAL_ADDRESS,
  TRANSACTION_VALUE,
} from './utils/constants.ts';
import {
  ATTESTATION_EVENT_MISSING_MESSAGE,
  extractAttestationIdFromReceipt,
  isSupportedLineaChainId,
  RECEIPT_CLIENT_MISSING_MESSAGE,
  RECEIPT_REVERTED_MESSAGE,
  UNSUPPORTED_ORIGIN_CHAIN_MESSAGE,
  USER_REJECTED_MESSAGE,
} from './utils/attestationReceipt.ts';
import { linea, lineaSepolia } from 'wagmi/chains';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';
import { wagmiAdapter } from './wagmiConfig.ts';
import {
  canIssueAttestation,
  getOwnershipStatus,
} from './utils/ownershipStatus.ts';

const DEFAULT_ERROR_MESSAGE = 'Oops, something went wrong!';
const ATTESTATION_EXPIRATION_SECONDS = 2_592_000;

type OriginatingSubmission = {
  chainId: number;
  txHash?: Hex;
};

const ChainMismatchBanner = lazy(
  () => import('./components/ChainMismatchBanner.tsx'),
);
const DetailsModal = lazy(() => import('./components/DetailsModal.tsx'));
const TestnetRibbon = lazy(() => import('./components/TestnetRibbon.tsx'));

type VeraxSdkConstructor = typeof VeraxSdkModule.VeraxSdk;

const getEfrogsContractAddress = (chainId?: number) =>
  chainId === lineaSepolia.id ? TESTNET_EFROGS_CONTRACT : EFROGS_CONTRACT;

const getPortalAddress = (chainId: number): Address | undefined => {
  if (chainId === linea.id) return PORTAL_ADDRESS;
  if (chainId === lineaSepolia.id) return TESTNET_PORTAL_ADDRESS;
  return undefined;
};

const getLineaReceiptClient = (chainId: number) => {
  if (chainId === linea.id) {
    return wagmiAdapter.wagmiConfig.getClient({ chainId: linea.id });
  }
  if (chainId === lineaSepolia.id) {
    return wagmiAdapter.wagmiConfig.getClient({ chainId: lineaSepolia.id });
  }
  return undefined;
};

const createVeraxSdk = (
  VeraxSdk: VeraxSdkConstructor,
  chainId: number,
  address: Address,
) => {
  if (chainId === linea.id) {
    return new VeraxSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND, address);
  }

  if (chainId === lineaSepolia.id) {
    return new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND, address);
  }

  return undefined;
};

function App() {
  const [submission, setSubmission] = useState<OriginatingSubmission>();
  const [attestationId, setAttestationId] = useState<Hex>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>();
  const panelTriggerRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const { address, chainId, isConnected } = useAccount();

  const isValidChain = isSupportedLineaChainId(chainId);

  const {
    data: balance,
    error: balanceError,
    isPending: isBalanceLoading,
    refetch,
  } = useReadContract({
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
    const originatingChainId = chainId;
    const originatingAddress = address;
    const originatingBalance = balance;
    const originatingPortalAddress = isSupportedLineaChainId(originatingChainId)
      ? getPortalAddress(originatingChainId)
      : undefined;
    const originatingNftContract = isSupportedLineaChainId(originatingChainId)
      ? getEfrogsContractAddress(originatingChainId)
      : undefined;
    const fee = TRANSACTION_VALUE;
    const receiptClient = isSupportedLineaChainId(originatingChainId)
      ? getLineaReceiptClient(originatingChainId)
      : undefined;

    if (
      !originatingAddress ||
      !isSupportedLineaChainId(originatingChainId) ||
      !originatingBalance ||
      !originatingPortalAddress ||
      !originatingNftContract
    ) {
      return;
    }

    const attestationPayload: AttestationPayload = {
      schemaId: SCHEMA_ID,
      expirationDate:
        Math.floor(Date.now() / 1000) + ATTESTATION_EXPIRATION_SECONDS,
      subject: originatingAddress,
      attestationData: [
        {
          contract: originatingNftContract,
          balance: originatingBalance,
        },
      ],
    };
    const validationPayload: string[] = [];
    const options: TransactionOptions = {
      waitForConfirmation: false,
      value: fee,
      customAbi: EFROGS_PORTAL_ABI,
    };

    setSubmission({ chainId: originatingChainId });
    setAttestationId(undefined);
    setMessage(undefined);
    setIsModalOpen(true);

    if (!receiptClient) {
      setMessage(RECEIPT_CLIENT_MISSING_MESSAGE);
      return;
    }

    try {
      const { VeraxSdk } =
        await import('@verax-attestation-registry/verax-sdk');

      if (!isSupportedLineaChainId(originatingChainId)) {
        setMessage(UNSUPPORTED_ORIGIN_CHAIN_MESSAGE);
        return;
      }

      const veraxSdk = createVeraxSdk(
        VeraxSdk,
        originatingChainId,
        originatingAddress,
      );

      if (!veraxSdk) {
        setMessage(DEFAULT_ERROR_MESSAGE);
        return;
      }

      const submitted: Partial<TransactionReceipt> =
        await veraxSdk.portal.attest(
          originatingPortalAddress,
          attestationPayload,
          validationPayload,
          options,
        );
      const transactionHash = submitted.transactionHash;

      if (!transactionHash) {
        setMessage(DEFAULT_ERROR_MESSAGE);
        return;
      }

      setSubmission({
        chainId: originatingChainId,
        txHash: transactionHash,
      });

      const { waitForTransactionReceipt } = await import('viem/actions');
      const confirmed = await waitForTransactionReceipt(receiptClient, {
        hash: transactionHash,
      });

      if (confirmed.status !== 'success') {
        setAttestationId(undefined);
        setMessage(RECEIPT_REVERTED_MESSAGE);
        return;
      }

      const registeredAttestationId = extractAttestationIdFromReceipt(
        originatingChainId,
        confirmed.logs,
      );
      if (!registeredAttestationId) {
        setAttestationId(undefined);
        setMessage(ATTESTATION_EVENT_MISSING_MESSAGE);
        return;
      }

      setAttestationId(registeredAttestationId);
    } catch (e) {
      console.error(e);
      setAttestationId(undefined);
      if (e instanceof Error) {
        if (e.message.includes('User rejected the request')) {
          setMessage(USER_REJECTED_MESSAGE);
        } else {
          setMessage(`${DEFAULT_ERROR_MESSAGE} - ${e.message}`);
        }
      } else {
        setMessage(DEFAULT_ERROR_MESSAGE);
      }
    }
  }, [address, balance, chainId]);

  const ownership = {
    address,
    chainId,
    balance,
    isLoading: isBalanceLoading,
    hasError: !!balanceError,
  };
  const disabled = !isConnected || !canIssueAttestation(ownership);
  const walletStatus = getOwnershipStatus(ownership);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <Header />
      <main
        ref={mainRef}
        tabIndex={-1}
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
          onRetry={balanceError ? () => void refetch() : undefined}
          triggerRef={panelTriggerRef}
        />
        {isModalOpen && submission ? (
          <Suspense fallback={null}>
            <DetailsModal
              attestationId={attestationId}
              chainId={submission.chainId}
              txHash={submission.txHash}
              isOpen={isModalOpen}
              onClose={closeModal}
              message={message}
              returnFocusRef={panelTriggerRef}
              fallbackFocusRef={mainRef}
            />
          </Suspense>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

export default App;
