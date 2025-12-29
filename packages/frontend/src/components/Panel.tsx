import { useState } from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  disabled: boolean;
  onClick: () => Promise<void>;
}

export default function Panel({ title, disabled, onClick }: PanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="signage-image">
        <h1 className="panel-title">{title}</h1>
      </div>
      <div className="button-container">
        <button
          type="button"
          className={`button${disabled ? ' disabled' : ''}`}
          onClick={handleClick}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          aria-label={
            disabled
              ? 'Connect wallet to issue attestation'
              : 'Issue attestation'
          }
        >
          <span className={`button-label${disabled ? ' disabled' : ''}`}>
            {isLoading ? 'Processing...' : 'Issue attestation'}
          </span>
        </button>
      </div>
    </div>
  );
}
