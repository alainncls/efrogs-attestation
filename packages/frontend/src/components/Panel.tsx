import { memo, useCallback, useState } from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  status?: string;
  disabled: boolean;
  onClick: () => Promise<void>;
}

function Panel({ title, status, disabled, onClick }: PanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, onClick]);

  return (
    <div className="panel">
      <div className="signage">
        <picture className="signage-art" aria-hidden="true">
          <source
            media="(min-width: 992px)"
            srcSet="/signage.webp"
            type="image/webp"
          />
          <source media="(min-width: 992px)" srcSet="/signage.png" />
          <source srcSet="/signage-phone.webp" type="image/webp" />
          <img
            className="signage-image"
            src="/signage-phone.png"
            alt=""
            width="300"
            height="419"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="signage-content">
          <h1 className="panel-title">{title}</h1>
          {status ? (
            <p className="panel-status" aria-live="polite">
              {status}
            </p>
          ) : null}
        </div>
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

export default memo(Panel);
