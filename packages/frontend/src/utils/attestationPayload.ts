import type { Address } from 'viem';

/**
 * The deployed schema is the single tuple `(address contract, uint256 balance)`,
 * so the SDK expects exactly one value: the tuple object.
 */
export const encodeEfrogsAttestationData = (
  contract: Address,
  balance: bigint,
): object[] => [{ contract, balance }];
