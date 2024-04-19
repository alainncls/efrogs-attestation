import {ReactNode} from 'react';
import './GenericButton.css';

interface GenericButtonProps {
    children: ReactNode;
    disabled: boolean;
    label?: string | undefined;
    onClick?: (() => Promise<void>) | undefined;
}

export default function GenericButton({children, disabled, label, onClick}: GenericButtonProps) {
    return <div className={`generic-button ${disabled ? 'disabled' : ''}`}>
        {label && <div className={'generic-button-label'} onClick={onClick}>{label}</div>}
        <div>{children}</div>
    </div>
}
