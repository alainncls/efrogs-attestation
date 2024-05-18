import { useEffect } from 'react';
import './ConnectButton.css';

const updateButtonStyle = () => {
  const w3mButton = document.querySelector('w3m-button');
  if (!w3mButton) return;

  const w3mConnectButton = w3mButton.shadowRoot?.querySelector('w3m-connect-button');
  if (!w3mConnectButton) return;

  const wuiConnectButton = w3mConnectButton.shadowRoot?.querySelector('wui-connect-button');
  if (!wuiConnectButton) return;

  const button = wuiConnectButton.shadowRoot?.querySelector('button');
  if (!button) return;

  button.style.border = 'none';

  const wuiText = button.querySelector('wui-text');
  if (!wuiText) return;

  const slot = wuiText.shadowRoot?.querySelector('slot');
  if (!slot) return;

  if (window.matchMedia('(max-width: 992px)').matches) {
    slot.style.fontSize = '32px';
  } else {
    slot.style.fontSize = '50px';
  }
};

export default function ConnectButton() {
  useEffect(() => {
    updateButtonStyle();
  }, []);

  return <div className={'connect-button-container'}>
    <w3m-button />
  </div>;
}
