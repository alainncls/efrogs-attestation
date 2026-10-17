import { encodeAbiParameters, parseAbiParameters } from 'viem';
import type { Address, Hex } from 'viem';

const EFROGS_SCHEMA = parseAbiParameters('(address contract, uint256 balance)');

export const encodeEfrogsAttestationData = (
  contract: Address,
  balance: bigint,
): Hex => encodeAbiParameters(EFROGS_SCHEMA, [{ contract, balance }]);
