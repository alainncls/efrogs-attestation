import { memo } from 'react';
import './Header.css';

function Header() {
  return (
    <header className={'header'}>
      <appkit-button balance={'hide'} />
    </header>
  );
}

export default memo(Header);
