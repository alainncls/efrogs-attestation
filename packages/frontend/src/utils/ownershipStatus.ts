import { linea, lineaSepolia } from 'wagmi/chains';

interface OwnershipStatusOptions {
  address?: string;
  chainId?: number;
  balance?: bigint;
  isLoading: boolean;
  hasError: boolean;
}

export const getOwnershipStatus = ({
  address,
  chainId,
  balance,
  isLoading,
  hasError,
}: OwnershipStatusOptions): string => {
  if (!address) return 'Connect a wallet';
  if (chainId !== linea.id && chainId !== lineaSepolia.id) {
    return 'Switch to Linea';
  }
  if (hasError) return 'Balance unavailable';
  if (isLoading || balance === undefined) return 'Checking…';

  const count = Number(balance);
  if (count === 0) return 'No eFrog found';
  return `You own ${count} eFrog${count === 1 ? '' : 's'}`;
};

export const canIssueAttestation = ({
  address,
  chainId,
  balance,
  isLoading,
  hasError,
}: OwnershipStatusOptions): boolean =>
  !!address &&
  (chainId === linea.id || chainId === lineaSepolia.id) &&
  !hasError &&
  !isLoading &&
  balance !== undefined &&
  balance > 0n;
