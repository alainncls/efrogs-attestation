import type { Address } from 'viem';

/**
 * Verax SDK 5.4.0 declares object[] but ABI-encodes schema fields
 * positionally. Keep the runtime tuple here until the SDK fixes its type.
 */
export const encodeEfrogsAttestationData = (
  contract: Address,
  balance: bigint,
): object[] => [contract, balance] as unknown as object[];
