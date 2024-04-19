import {useEffect} from "react";
import './ConnectButton.css';

export default function ConnectButton() {
    useEffect(() => {
        const updateButtonStyle = async () => {
            const w3mButton = document.querySelector('w3m-button');
            if (!w3mButton) {
                return;
            }

            const shadowRoot = w3mButton.shadowRoot;
            if (!shadowRoot) {
                return;
            }

            const w3mConnectButton = shadowRoot.querySelector('w3m-connect-button');
            if (!w3mConnectButton) {
                return;
            }

            const shadowRoot2 = w3mConnectButton.shadowRoot;
            if (!shadowRoot2) {
                return;
            }

            const wuiConnectButton = shadowRoot2.querySelector('wui-connect-button');
            if (!wuiConnectButton) {
                return;
            }

            const shadowRoot3 = wuiConnectButton.shadowRoot;
            if (!shadowRoot3) {
                return;
            }

            const button = shadowRoot3.querySelector('button');
            if (!button) {
                return;
            }

            button.style.border = 'none';
        };

        updateButtonStyle();
    }, []);

    return <div className={'connect-button-container'}>
        <w3m-button/>
    </div>
}
