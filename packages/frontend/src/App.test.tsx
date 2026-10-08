import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hex } from 'viem';
import { linea, lineaSepolia } from 'wagmi/chains';
import App from './App.tsx';
import {
  EFROGS_CONTRACT,
  EFROGS_PORTAL_ABI,
  PORTAL_ADDRESS,
  SCHEMA_ID,
  TESTNET_EFROGS_CONTRACT,
  TESTNET_PORTAL_ADDRESS,
  TRANSACTION_VALUE,
} from './utils/constants.ts';
import {
  ATTESTATION_EVENT_MISSING_MESSAGE,
  ATTESTATION_REGISTERED_EVENT_TOPIC,
  LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS,
  LINEA_SEPOLIA_ATTESTATION_REGISTRY_ADDRESS,
  RECEIPT_REVERTED_MESSAGE,
  USER_REJECTED_MESSAGE,
} from './utils/attestationReceipt.ts';

const ACCOUNT_A = '0x1111111111111111111111111111111111111111' as Address;
const ACCOUNT_B = '0x2222222222222222222222222222222222222222' as Address;
const TX_HASH = `0x${'ab'.repeat(32)}` as Hex;
const ATTESTATION_ID = `0x${'cd'.repeat(32)}` as Hex;
const UNRELATED_ID = `0x${'11'.repeat(32)}` as Hex;
const WRONG_TOPIC = `0x${'22'.repeat(32)}` as Hex;
const WRONG_REGISTRY = '0x3333333333333333333333333333333333333333' as Address;

type SubmittedTx = { transactionHash?: Hex };
type ConfirmedReceipt = {
  status: 'success' | 'reverted';
  transactionHash: Hex;
  logs: Array<{
    address: Address;
    data: Hex;
    topics: readonly Hex[];
  }>;
};

const harness = vi.hoisted(() => {
  const wallet = {
    address: '0x1111111111111111111111111111111111111111' as Address,
    chainId: 59144 as number,
    isConnected: true,
    balance: 2n,
  };
  const clients = {
    59144: { id: 'linea-mainnet-receipt-client' },
    59141: { id: 'linea-sepolia-receipt-client' },
  };
  const attest = vi.fn();
  const waitForTransactionReceipt = vi.fn();
  const getClient = vi.fn();
  const constructed: Array<{ conf: unknown; address: string }> = [];

  class VeraxSdk {
    static DEFAULT_LINEA_MAINNET_FRONTEND = { id: 'mainnet-frontend' };
    static DEFAULT_LINEA_SEPOLIA_FRONTEND = { id: 'sepolia-frontend' };
    portal: { attest: typeof attest };

    constructor(conf: unknown, address: string) {
      constructed.push({ conf, address });
      this.portal = { attest };
    }
  }

  return {
    wallet,
    clients,
    attest,
    waitForTransactionReceipt,
    getClient,
    constructed,
    VeraxSdk,
  };
});

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: harness.wallet.address,
    chainId: harness.wallet.chainId,
    isConnected: harness.wallet.isConnected,
  }),
  useChainId: () => harness.wallet.chainId,
  useReadContract: () => ({
    data: harness.wallet.balance,
    refetch: vi.fn(),
  }),
  useSwitchChain: () => ({
    switchChain: vi.fn(),
    isPending: false,
  }),
  useWriteContract: () => ({
    data: undefined,
    isPending: false,
    writeContract: vi.fn(),
    error: null,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}));

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: harness.waitForTransactionReceipt,
}));

vi.mock('@verax-attestation-registry/verax-sdk', () => ({
  VeraxSdk: harness.VeraxSdk,
}));

vi.mock('./wagmiConfig.ts', () => ({
  projectId: 'placeholder',
  networks: [{ id: 59144 }, { id: 59141 }, { id: 1 }],
  wagmiAdapter: {
    wagmiConfig: {
      getClient: (parameters?: { chainId?: number }) =>
        harness.getClient(parameters),
    },
  },
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let attestGate = deferred<SubmittedTx>();
let receiptGate = deferred<ConfirmedReceipt>();

const registeredLog = (registry: Address, attestationId: Hex) => ({
  address: registry,
  data: '0x' as Hex,
  topics: [ATTESTATION_REGISTERED_EVENT_TOPIC, attestationId] as const,
});

const unrelatedLog = (attestationId: Hex = UNRELATED_ID) => ({
  address: WRONG_REGISTRY,
  data: '0x' as Hex,
  topics: [ATTESTATION_REGISTERED_EVENT_TOPIC, attestationId] as const,
});

function resetWallet(chainId: number = linea.id, balance = 2n) {
  harness.wallet.address = ACCOUNT_A;
  harness.wallet.chainId = chainId;
  harness.wallet.isConnected = true;
  harness.wallet.balance = balance;
}

function renderApp() {
  return render(<App />);
}

function issueButton(): HTMLButtonElement {
  return screen.getByRole('button', {
    name: 'Issue attestation',
  }) as HTMLButtonElement;
}

function clickIssue() {
  fireEvent.click(issueButton());
}

async function flushAttestCall() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function successReceipt(
  registry: Address,
  attestationId: Hex = ATTESTATION_ID,
): ConfirmedReceipt {
  return {
    status: 'success',
    transactionHash: TX_HASH,
    logs: [
      unrelatedLog(),
      {
        address: registry,
        data: '0x',
        topics: [WRONG_TOPIC, UNRELATED_ID],
      },
      registeredLog(registry, attestationId),
    ],
  };
}

describe('issue attestation receipt context', () => {
  beforeEach(() => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
      };
    }
    resetWallet();
    harness.constructed.length = 0;
    attestGate = deferred<SubmittedTx>();
    receiptGate = deferred<ConfirmedReceipt>();
    harness.attest.mockReset();
    harness.waitForTransactionReceipt.mockReset();
    harness.getClient.mockReset();
    harness.attest.mockImplementation(() => attestGate.promise);
    harness.waitForTransactionReceipt.mockImplementation(
      () => receiptGate.promise,
    );
    harness.getClient.mockImplementation(
      (parameters?: { chainId?: number }) => {
        const requestedChainId = parameters?.chainId ?? harness.wallet.chainId;
        if (requestedChainId === linea.id) {
          return harness.clients[59144];
        }
        if (requestedChainId === lineaSepolia.id) {
          return harness.clients[59141];
        }
        return { id: `live-${requestedChainId}` };
      },
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.mocked(console.error).mockRestore();
  });

  it('keeps the panel busy after the modal closes and attests once', async () => {
    renderApp();
    clickIssue();

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(issueButton().disabled).toBe(true);
    expect(issueButton().getAttribute('aria-busy')).toBe('true');
    expect(issueButton().textContent).toContain('Processing...');

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(issueButton().disabled).toBe(true);
    expect(issueButton().getAttribute('aria-busy')).toBe('true');
    fireEvent.click(issueButton());

    await flushAttestCall();
    expect(harness.attest).toHaveBeenCalledTimes(1);

    attestGate.resolve({ transactionHash: TX_HASH });
    receiptGate.resolve(
      successReceipt(LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS),
    );

    await waitFor(() => {
      expect(issueButton().disabled).toBe(false);
    });
    expect(harness.attest).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uses the decoded registry event instead of the first unrelated log', async () => {
    const { rerender } = renderApp();
    clickIssue();
    await flushAttestCall();
    attestGate.resolve({ transactionHash: TX_HASH });
    receiptGate.resolve(
      successReceipt(LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS),
    );

    const attestationLink = await screen.findByRole('link', {
      name: /View attestation/,
    });
    expect(attestationLink.getAttribute('href')).toBe(
      `https://explorer.ver.ax/linea/attestations/${ATTESTATION_ID}`,
    );
    expect(
      screen
        .getByRole('link', { name: /View transaction/ })
        .getAttribute('href'),
    ).toBe(`https://lineascan.build/tx/${TX_HASH}`);
    expect(document.body.textContent).not.toContain(UNRELATED_ID);

    harness.wallet.chainId = lineaSepolia.id;
    rerender(<App />);
    expect(
      screen
        .getByRole('link', { name: /View attestation/ })
        .getAttribute('href'),
    ).toBe(`https://explorer.ver.ax/linea/attestations/${ATTESTATION_ID}`);
    expect(
      screen
        .getByRole('link', { name: /View transaction/ })
        .getAttribute('href'),
    ).toBe(`https://lineascan.build/tx/${TX_HASH}`);
  });

  it('keeps the originating Sepolia payload, client, and explorer links after a switch', async () => {
    resetWallet(lineaSepolia.id, 3n);
    const { rerender } = renderApp();
    clickIssue();
    harness.wallet.chainId = linea.id;
    harness.wallet.address = ACCOUNT_B;
    harness.wallet.balance = 9n;
    rerender(<App />);

    expect(await screen.findByText('User validation pending...')).toBeTruthy();
    await flushAttestCall();

    expect(harness.getClient.mock.calls).toEqual([
      [{ chainId: lineaSepolia.id }],
    ]);
    expect(harness.constructed).toEqual([
      {
        conf: harness.VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND,
        address: ACCOUNT_A,
      },
    ]);
    expect(harness.attest).toHaveBeenCalledWith(
      TESTNET_PORTAL_ADDRESS,
      expect.objectContaining({
        schemaId: SCHEMA_ID,
        subject: ACCOUNT_A,
        attestationData: [{ contract: TESTNET_EFROGS_CONTRACT, balance: 3n }],
      }),
      [],
      expect.objectContaining({
        waitForConfirmation: false,
        value: TRANSACTION_VALUE,
        customAbi: EFROGS_PORTAL_ABI,
      }),
    );

    attestGate.resolve({ transactionHash: TX_HASH });
    const txLink = await screen.findByRole('link', {
      name: /View transaction/,
    });
    expect(txLink.getAttribute('href')).toBe(
      `https://sepolia.lineascan.build/tx/${TX_HASH}`,
    );
    expect(harness.waitForTransactionReceipt).toHaveBeenCalledWith(
      harness.clients[59141],
      { hash: TX_HASH },
    );
    expect(harness.getClient.mock.calls).toEqual([
      [{ chainId: lineaSepolia.id }],
    ]);

    receiptGate.resolve(
      successReceipt(LINEA_SEPOLIA_ATTESTATION_REGISTRY_ADDRESS),
    );
    const attestationLink = await screen.findByRole('link', {
      name: /View attestation/,
    });
    expect(attestationLink.getAttribute('href')).toBe(
      `https://explorer.ver.ax/linea-sepolia/attestations/${ATTESTATION_ID}`,
    );
    expect(document.body.textContent).not.toContain(UNRELATED_ID);
  });

  it('does not publish an attestation id when the receipt reverts', async () => {
    renderApp();
    clickIssue();
    await flushAttestCall();
    attestGate.resolve({ transactionHash: TX_HASH });
    receiptGate.resolve({
      status: 'reverted',
      transactionHash: TX_HASH,
      logs: [
        registeredLog(
          LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS,
          ATTESTATION_ID,
        ),
      ],
    });

    expect(await screen.findByText(RECEIPT_REVERTED_MESSAGE)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /View attestation/ })).toBeNull();
    expect(
      screen
        .getByRole('link', { name: /View transaction/ })
        .getAttribute('href'),
    ).toBe(`https://lineascan.build/tx/${TX_HASH}`);
  });

  it('does not publish an attestation id when the registry event is missing', async () => {
    renderApp();
    clickIssue();
    await flushAttestCall();
    attestGate.resolve({ transactionHash: TX_HASH });
    receiptGate.resolve({
      status: 'success',
      transactionHash: TX_HASH,
      logs: [],
    });

    expect(
      await screen.findByText(ATTESTATION_EVENT_MISSING_MESSAGE),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: /View attestation/ })).toBeNull();
  });

  it('rejects a matching topic from the wrong registry and a wrong topic from the registry', async () => {
    renderApp();
    clickIssue();
    await flushAttestCall();
    attestGate.resolve({ transactionHash: TX_HASH });
    receiptGate.resolve({
      status: 'success',
      transactionHash: TX_HASH,
      logs: [
        unrelatedLog(UNRELATED_ID),
        {
          address: LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS,
          data: '0x',
          topics: [WRONG_TOPIC, ATTESTATION_ID],
        },
      ],
    });

    expect(
      await screen.findByText(ATTESTATION_EVENT_MISSING_MESSAGE),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: /View attestation/ })).toBeNull();
    expect(document.body.textContent).not.toContain(ATTESTATION_ID);
    expect(document.body.textContent).not.toContain(UNRELATED_ID);
  });

  it('keeps wallet rejection distinct from a success id', async () => {
    renderApp();
    clickIssue();
    await flushAttestCall();
    attestGate.reject(new Error('User rejected the request.'));

    expect(await screen.findByText(USER_REJECTED_MESSAGE)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /View attestation/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /View transaction/ })).toBeNull();
    await waitFor(() => {
      expect(issueButton().disabled).toBe(false);
    });
    expect(harness.waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('submits the captured mainnet portal, nft, and fee', async () => {
    resetWallet(linea.id, 4n);
    renderApp();
    clickIssue();
    await flushAttestCall();

    expect(harness.attest).toHaveBeenCalledWith(
      PORTAL_ADDRESS,
      expect.objectContaining({
        schemaId: SCHEMA_ID,
        subject: ACCOUNT_A,
        attestationData: [{ contract: EFROGS_CONTRACT, balance: 4n }],
      }),
      [],
      expect.objectContaining({
        value: TRANSACTION_VALUE,
        customAbi: EFROGS_PORTAL_ABI,
      }),
    );
    expect(harness.constructed[0]?.conf).toBe(
      harness.VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND,
    );
    attestGate.resolve({ transactionHash: undefined });
    expect(await screen.findByText('Oops, something went wrong!')).toBeTruthy();
  });
});
