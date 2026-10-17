import { describe, expect, it } from 'vitest';
import { decodeAbiParameters, getAddress, parseAbiParameters } from 'viem';
import { EFROGS_CONTRACT } from './constants.ts';
import { encodeEfrogsAttestationData } from './attestationPayload.ts';

describe('encodeEfrogsAttestationData', () => {
  it('matches the portal decoding of (address, uint256)', () => {
    const data = encodeEfrogsAttestationData(EFROGS_CONTRACT, 7n);

    expect(
      decodeAbiParameters(parseAbiParameters('address, uint256'), data),
    ).toEqual([getAddress(EFROGS_CONTRACT), 7n]);
  });
});
