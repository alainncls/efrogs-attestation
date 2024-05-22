import './ConnectButton.css';
import { ConnectKitButton } from 'connectkit';

export default function ConnectButton() {
  return <div className={'connect-button-container'}>
    <ConnectKitButton label={'CONNECT WALLET'} />
  </div>;
}
