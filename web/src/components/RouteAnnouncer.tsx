import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Visually hidden; polite live region for route + hash changes (see AURA-189). */
const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function messageForRoute(pathname: string, hash: string): string {
  if (pathname === '/settings' && hash === '#settings-privacy-and-visibility') {
    return 'Settings. Privacy and visibility.';
  }
  if (pathname === '/settings') {
    return 'Settings.';
  }
  return '';
}

export function RouteAnnouncer() {
  const { pathname, hash } = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(messageForRoute(pathname, hash));
  }, [pathname, hash]);

  return (
    <div id="route-announcer-status" role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
      {message}
    </div>
  );
}
