import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import './TestnetRibbon.css';
import {
  EFROGS_NFT_ABI,
  TESTNET_EFROGS_CONTRACT,
  TRANSACTION_VALUE,
} from '../utils/constants.ts';
import { memo, useCallback, useEffect } from 'react';

interface TestnetRibbonProps {
  onNftMinted: () => void;
}

const TestnetRibbon = ({ onNftMinted }: TestnetRibbonProps) => {
  const { address, chainId } = useAccount();

  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      onNftMinted();
    }
  }, [isConfirmed, onNftMinted]);

  useEffect(() => {
    if (error && import.meta.env.DEV) {
      console.error('Mint transaction failed:', error);
    }
  }, [error]);

  const mintTestNft = useCallback(() => {
    if (!address) return;

    writeContract({
      address: TESTNET_EFROGS_CONTRACT,
      abi: EFROGS_NFT_ABI,
      functionName: 'createToken',
      args: [address],
      chainId,
      value: TRANSACTION_VALUE,
    });
  }, [address, chainId, writeContract]);

  const buttonLabel = isPending
    ? 'Confirming...'
    : isConfirming
      ? 'Minting...'
      : isConfirmed
        ? 'Test NFT Minted!'
        : 'Mint a test eFrog NFT';
  const isMinting = isPending || isConfirming;

  return (
    <div className="ribbon" role="status" aria-label="Testnet mode active">
      <span>Testnet</span>
      <button
        type="button"
        className="btn-mint"
        onClick={mintTestNft}
        disabled={isMinting || !address}
        aria-busy={isMinting}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default memo(TestnetRibbon);
