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
import { useEffect } from 'react';

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

  const mintTestNft = () => {
    if (address) {
      writeContract({
        address: TESTNET_EFROGS_CONTRACT,
        abi: EFROGS_NFT_ABI,
        functionName: 'createToken',
        args: [address],
        chainId,
        value: TRANSACTION_VALUE,
      });
    }
  };

  const btnLabel = () => {
    if (isPending) {
      return 'Confirming...';
    } else if (isConfirming) {
      return 'Minting...';
    } else if (isConfirmed) {
      return 'Test NFT Minted!';
    }

    return 'Mint a test eFrog NFT';
  };

  return (
    <div className="ribbon" role="status" aria-label="Testnet mode active">
      <span>Testnet</span>
      <button
        type="button"
        className="btn-mint"
        onClick={mintTestNft}
        disabled={isPending || isConfirming || !address}
        aria-busy={isPending || isConfirming}
      >
        {btnLabel()}
      </button>
    </div>
  );
};

export default TestnetRibbon;
