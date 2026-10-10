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
}: OwnershipStatusOptions): string | undefined => {
  if (!address) return undefined;
  if (chainId !== linea.id && chainId !== lineaSepolia.id) {
    return 'Switch to Linea to check eFrog ownership.';
  }
  if (hasError) return 'Could not load eFrog balance. Retry.';
  if (isLoading || balance === undefined) return 'Checking eFrog ownership...';

  const count = Number(balance);
  return `You have ${count} eFrog${count === 1 ? '' : 's'}`;
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
