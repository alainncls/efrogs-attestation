import React from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  disabled: boolean;
  onClick: () => Promise<void>;
}

const Panel = React.memo(({ title, disabled, onClick }: PanelProps) => {
  return (
    <div className="panel">
      <div className="signage-image">
        <div className="panel-title">{title}</div>
      </div>
      <div className="button-container">
        <div
          className={`button${disabled ? ' disabled' : ''}`}
          onClick={!disabled ? onClick : undefined}
        >
          <div className={`button-label${disabled ? ' disabled' : ''}`}>
            Issue attestation
          </div>
        </div>
      </div>
    </div>
  );
});

export default Panel;
