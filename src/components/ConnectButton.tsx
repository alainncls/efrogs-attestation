import { useEffect } from 'react';
import './ConnectButton.css';

const updateButtonStyle = async () => {
  const w3mButton = document.querySelector('w3m-button');
  if (!w3mButton) return;

  const w3mConnectButton = w3mButton.shadowRoot?.querySelector('w3m-connect-button');
  if (!w3mConnectButton) return;

  const wuiConnectButton = w3mConnectButton.shadowRoot?.querySelector('wui-connect-button');
  if (!wuiConnectButton) return;

  const shadowRoot = wuiConnectButton.shadowRoot;
  if (!shadowRoot) return;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
      * {
        background-color: transparent !important;
        border: none !important;
        cursor: pointer !important;
        font-size: 40px !important;
        color: #FFFFFF !important;
      }
   `);

  shadowRoot.adoptedStyleSheets = [sheet];
};

export default function ConnectButton() {
  useEffect(() => {
    updateButtonStyle();
  }, []);

  return <div className={'connect-button-container'}>
    <w3m-button />
  </div>;
}
