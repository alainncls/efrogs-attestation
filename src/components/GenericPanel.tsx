import React from 'react';
import './GenericPanel.css';

interface GenericPanelProps {
  title: string;
}

const GenericPanel = React.memo(({ title }: GenericPanelProps) => {
  return (
    <div className={'generic-panel'}>
      <div className="signage-image" />
      <div className={'generic-panel-title'}>{title}</div>
    </div>
  );
});

export default GenericPanel;
