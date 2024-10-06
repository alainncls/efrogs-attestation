import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import './TestnetRibbon.css';
import { EFROGS_CONTRACT, TESTNET_EFROGS_CONTRACT, TRANSACTION_VALUE } from '../utils/constants.ts';
import { useEffect } from 'react';

interface TestnetRibbonProps {
  onNftMinted: () => void;
}

const TestnetRibbon = ({ onNftMinted }: TestnetRibbonProps) => {
  const { address, chainId, chain } = useAccount();

  const {
    data: hash,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (isConfirmed) {
      onNftMinted();
    }
  }, [isConfirmed, onNftMinted]);

  const mintTestNft = () => {
    if (address) {
      console.log('Minting test NFT...');
      try {
        writeContract({
          address: chain?.testnet ? TESTNET_EFROGS_CONTRACT : EFROGS_CONTRACT,
          abi: [{
            type: 'function',
            name: 'createToken',
            stateMutability: 'payable',
            inputs: [
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
            ],
            outputs: [],
          }],
          functionName: 'createToken',
          args: [address ?? '0x0'],
          chainId,
          value: TRANSACTION_VALUE,
        });
      } catch (error) {
        console.error('Transaction failed:', error);
      }
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
    <div className="ribbon">
      <div>Testnet</div>
      <button className={'btn-mint'} onClick={mintTestNft}
              disabled={isPending || isConfirming}>{btnLabel()} </button>
    </div>
  );
};

export default TestnetRibbon;
