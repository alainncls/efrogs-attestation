import React from 'react';
import './GenericPanel.css';

interface GenericPanelProps {
  title: string;
  subtitle?: string;
}

const GenericPanel = React.memo(({ title, subtitle }: GenericPanelProps) => {
  return (
    <div className={'generic-panel'}>
      <div className="signage-image" />
      <div className={'generic-panel-title'}>{title}</div>
      {subtitle && <div className={'generic-panel-subtitle'}>{subtitle}</div>}
    </div>
  );
});

export default GenericPanel;
