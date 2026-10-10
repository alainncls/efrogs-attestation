import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hex } from 'viem';
import { linea, lineaSepolia } from 'wagmi/chains';
import DetailsModal from '../src/components/DetailsModal.tsx';
import Panel from '../src/components/Panel.tsx';
import {
  canIssueAttestation,
  getOwnershipStatus,
} from '../src/utils/ownershipStatus.ts';
import '../src/index.css';
import '../src/App.css';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const TX_HASH = `0x${'ab'.repeat(32)}` as Hex;
const ATTESTATION_ID = `0x${'cd'.repeat(32)}` as Hex;

type TestState = {
  complete: (kind: 'success' | 'error') => void;
  setBalance: (value: string | 'loading' | 'error') => void;
  setIdentity: (address: string | undefined, chainId: number) => void;
  hideTrigger: (hidden: boolean) => void;
  retryCount: () => number;
};

declare global {
  interface Window {
    efrogTest: TestState;
  }
}

export function ModalHarness() {
  const mainRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resolverRef = useRef<(() => void) | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(ADDRESS);
  const [chainId, setChainId] = useState(linea.id);
  const [balance, setBalance] = useState<bigint | undefined>(1n);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submissionChainId, setSubmissionChainId] = useState(linea.id);
  const [txHash, setTxHash] = useState<Hex>();
  const [attestationId, setAttestationId] = useState<Hex>();
  const [message, setMessage] = useState<string>();
  const [issueCount, setIssueCount] = useState(0);
  const [hideTrigger, setHideTrigger] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const complete = useCallback((kind: 'success' | 'error') => {
    if (kind === 'success') {
      setTxHash(TX_HASH);
      setAttestationId(ATTESTATION_ID);
    } else {
      setMessage('User denied transaction signature');
    }
    resolverRef.current?.();
  }, []);

  useEffect(() => {
    window.efrogTest = {
      complete,
      setBalance: (value) => {
        setBalanceError(value === 'error');
        setIsBalanceLoading(value === 'loading');
        setBalance(
          value === 'loading' || value === 'error' ? undefined : BigInt(value),
        );
      },
      setIdentity: (nextAddress, nextChainId) => {
        setAddress(nextAddress);
        setChainId(nextChainId);
      },
      hideTrigger: setHideTrigger,
      retryCount: () => retryCount,
    };
  }, [complete, retryCount]);

  const ownership = {
    address,
    chainId,
    balance,
    isLoading: isBalanceLoading,
    hasError: balanceError,
  };
  const disabled = !canIssueAttestation(ownership);

  return (
    <main ref={mainRef} tabIndex={-1} className="main-container">
      <h1>Ownership test</h1>
      <p role="status">{getOwnershipStatus(ownership)}</p>
      <p data-testid="issue-count">{issueCount}</p>
      <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
        Retry balance
      </button>
      <button type="button" onClick={() => setChainId(lineaSepolia.id)}>
        Select Sepolia
      </button>
      {!hideTrigger ? (
        <Panel
          title="Attest your eFrogs"
          status={getOwnershipStatus(ownership)}
          disabled={disabled}
          triggerRef={triggerRef}
          onRetry={
            balanceError ? () => setRetryCount((count) => count + 1) : undefined
          }
          onClick={() => {
            setIssueCount((count) => count + 1);
            setSubmissionChainId(chainId);
            setTxHash(undefined);
            setAttestationId(undefined);
            setMessage(undefined);
            setModalOpen(true);
            return new Promise<void>((resolve) => {
              resolverRef.current = resolve;
            });
          }}
        />
      ) : null}
      {modalOpen ? (
        <DetailsModal
          isOpen={modalOpen}
          chainId={submissionChainId}
          txHash={txHash}
          attestationId={attestationId}
          message={message}
          onClose={() => setModalOpen(false)}
          returnFocusRef={triggerRef}
          fallbackFocusRef={mainRef}
        />
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<ModalHarness />);
