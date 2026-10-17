import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import './App.css';
import { useAccount, useReadContract } from 'wagmi';
import type { Address, Hex } from 'viem';
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
import { encodeEfrogsAttestationData } from './utils/attestationPayload.ts';
import { linea, lineaSepolia } from 'wagmi/chains';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';
import { wagmiAdapter } from './wagmiConfig.ts';
import {
  canIssueAttestation,
  getOwnershipStatus,
} from './utils/ownershipStatus.ts';

const DEFAULT_ERROR_MESSAGE = 'Attestation failed';
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

    const attestationPayload = {
      schemaId: SCHEMA_ID,
      expirationDate: BigInt(
        Math.floor(Date.now() / 1000) + ATTESTATION_EXPIRATION_SECONDS,
      ),
      subject: originatingAddress,
      attestationData: encodeEfrogsAttestationData(
        originatingNftContract,
        originatingBalance,
      ),
    } as const;

    setSubmission({ chainId: originatingChainId });
    setAttestationId(undefined);
    setMessage(undefined);
    setIsModalOpen(true);

    if (!receiptClient) {
      setMessage(RECEIPT_CLIENT_MISSING_MESSAGE);
      return;
    }

    try {
      const { simulateContract, writeContract } = await import('@wagmi/core');

      if (!isSupportedLineaChainId(originatingChainId)) {
        setMessage(UNSUPPORTED_ORIGIN_CHAIN_MESSAGE);
        return;
      }

      const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
        address: originatingPortalAddress,
        abi: EFROGS_PORTAL_ABI,
        functionName: 'attest',
        args: [attestationPayload, []],
        value: fee,
        chainId: originatingChainId,
        account: originatingAddress,
      });
      const transactionHash = await writeContract(
        wagmiAdapter.wagmiConfig,
        request,
      );

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
      setMessage(
        e instanceof Error && e.message.includes('User rejected the request')
          ? USER_REJECTED_MESSAGE
          : DEFAULT_ERROR_MESSAGE,
      );
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
          aria-label="eFrog #645 on Element"
        >
          <div className="grooving-frog" aria-hidden="true"></div>
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
