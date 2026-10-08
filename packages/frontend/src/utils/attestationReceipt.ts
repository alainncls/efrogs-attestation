import { decodeEventLog, isAddressEqual, type Address, type Hex } from 'viem';
import { linea, lineaSepolia } from 'wagmi/chains';

/**
 * Confirmed from @verax-attestation-registry/verax-sdk@5.4.0
 * VeraxSdk.DEFAULT_LINEA_MAINNET.attestationRegistryAddress and
 * VeraxSdk.DEFAULT_LINEA_SEPOLIA.attestationRegistryAddress.
 * Topic is keccak256("AttestationRegistered(bytes32)").
 */
export const LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS: Address =
  '0x3de3893aa4Cdea029e84e75223a152FD08315138';
export const LINEA_SEPOLIA_ATTESTATION_REGISTRY_ADDRESS: Address =
  '0xDaf3C3632327343f7df0Baad2dc9144fa4e1001F';

export const ATTESTATION_REGISTERED_EVENT_TOPIC: Hex =
  '0xfe10586889e06530420fe4a0d86aa4f7afc3c9dc84b0c77b731a9615496ef18a';

const ATTESTATION_REGISTERED_EVENT = {
  type: 'event',
  name: 'AttestationRegistered',
  inputs: [
    {
      name: 'attestationId',
      type: 'bytes32',
      indexed: true,
    },
  ],
} as const;

export const USER_REJECTED_MESSAGE = 'User denied transaction signature';
export const RECEIPT_REVERTED_MESSAGE =
  'Transaction reverted on the originating network. No attestation was registered.';
export const ATTESTATION_EVENT_MISSING_MESSAGE =
  'The transaction receipt did not include a Verax AttestationRegistered event from the originating registry. No attestation ID was recorded.';
export const RECEIPT_CLIENT_MISSING_MESSAGE =
  'Could not open a receipt client for the originating Linea network. The attestation was not submitted.';
export const UNSUPPORTED_ORIGIN_CHAIN_MESSAGE =
  'The originating network is not Linea mainnet or Linea Sepolia. The attestation was not submitted.';

const REGISTRY_BY_CHAIN_ID: Record<number, Address> = {
  [linea.id]: LINEA_MAINNET_ATTESTATION_REGISTRY_ADDRESS,
  [lineaSepolia.id]: LINEA_SEPOLIA_ATTESTATION_REGISTRY_ADDRESS,
};

export const isSupportedLineaChainId = (
  chainId?: number,
): chainId is typeof linea.id | typeof lineaSepolia.id =>
  chainId === linea.id || chainId === lineaSepolia.id;

export const getAttestationRegistryAddress = (
  chainId: number,
): Address | undefined => REGISTRY_BY_CHAIN_ID[chainId];

export const getTransactionExplorerUrl = (
  chainId: number,
  txHash: Hex,
): string | undefined => {
  if (chainId === linea.id) {
    return `https://lineascan.build/tx/${txHash}`;
  }
  if (chainId === lineaSepolia.id) {
    return `https://sepolia.lineascan.build/tx/${txHash}`;
  }
  return undefined;
};

export const getAttestationExplorerUrl = (
  chainId: number,
  attestationId: Hex,
): string | undefined => {
  if (chainId === linea.id) {
    return `https://explorer.ver.ax/linea/attestations/${attestationId}`;
  }
  if (chainId === lineaSepolia.id) {
    return `https://explorer.ver.ax/linea-sepolia/attestations/${attestationId}`;
  }
  return undefined;
};

type ReceiptLog = {
  address: Address;
  data?: Hex;
  topics: readonly Hex[];
};

export const extractAttestationIdFromReceipt = (
  chainId: number,
  logs: readonly ReceiptLog[] | undefined,
): Hex | undefined => {
  const registryAddress = getAttestationRegistryAddress(chainId);
  if (!registryAddress || !logs?.length) {
    return undefined;
  }

  for (const log of logs) {
    const topic0 = log.topics[0];
    const topic1 = log.topics[1];
    if (!topic0 || !topic1) {
      continue;
    }
    if (!isAddressEqual(log.address, registryAddress)) {
      continue;
    }
    if (topic0.toLowerCase() !== ATTESTATION_REGISTERED_EVENT_TOPIC) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: [ATTESTATION_REGISTERED_EVENT],
        data: log.data ?? '0x',
        topics: [topic0, topic1],
      });
      if (
        decoded.eventName === 'AttestationRegistered' &&
        decoded.args.attestationId
      ) {
        return decoded.args.attestationId;
      }
    } catch {
      continue;
    }
  }

  return undefined;
};
