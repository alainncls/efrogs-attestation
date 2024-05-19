import React from 'react';
import { useAccount } from 'wagmi';
import './DetailsModal.css';
import { Hex } from 'viem';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: Hex;
  attestationId?: Hex;
  message?: string;
}

const DetailsModal = ({ isOpen, onClose, txHash, attestationId, message }: DetailsModalProps) => {
  const { chainId } = useAccount();

  const truncateHexString = (hexString: string) => {
    return `${hexString.slice(0, 7)}...${hexString.slice(hexString.length - 5, hexString.length)}`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return isOpen ? (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        {!message &&
          <>
            {!txHash && !attestationId &&
              <div className={'message pending'}>User validation pending...</div>}
            {txHash && !attestationId && <div className={'message pending'}>Transaction pending...</div>}
          </>
        }

        {message && <div className={'message error'}>{message}</div>}
        
        {txHash && <div className={'message'}>Transaction Hash: <a
          href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://sepolia.lineascan.build/tx/'}${txHash}`}
          target="_blank" rel="noopener noreferrer">{truncateHexString(txHash)}</a></div>}
        {attestationId && <div className={'message success'}>Attestation ID: <a
          href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-sepolia/attestations/'}${attestationId}`}
          target="_blank" rel="noopener noreferrer">{truncateHexString(attestationId)}</a></div>}
      </div>
    </div>
  ) : null;
};

export default DetailsModal;
