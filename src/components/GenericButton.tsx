import {ReactNode, useEffect, useState} from 'react';
import './GenericButton.css';

interface GenericButtonProps {
    children: ReactNode;
    disabled: boolean;
    label?: string | undefined;
    onClick?: (() => Promise<void>) | undefined;
}

export default function GenericButton({children, disabled, label, onClick}: GenericButtonProps) {
    const [buttonHeight, setButtonHeight] = useState('auto');

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setButtonHeight(`${img.height}px`);
        }
        img.src = disabled ? 'button_disabled_source.png' : '/button_enabled.png';
    }, [disabled]);

    return <div className={`generic-button${disabled ? ' disabled' : ''}${label ? ' with-label' : ''}`}
                onClick={onClick}
                style={{height: buttonHeight}}>
        {label ? <div className={`generic-button-label${disabled ? ' disabled' : ''}`}>{label}</div> :
            <div>{children}</div>}
    </div>
}
