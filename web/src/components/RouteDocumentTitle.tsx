import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'Aura';

/** Route-aware `document.title` for tabs, history, and assistive tech context (PDR §5). */
function titleForPath(pathname: string): string {
  switch (pathname) {
    case '/':
      return `Home · ${APP_NAME}`;
    case '/welcome':
      return `Welcome · ${APP_NAME}`;
    case '/emergency':
      return `Emergency · ${APP_NAME}`;
    case '/journey/new':
      return `New journey · ${APP_NAME}`;
    case '/journey/active':
      return `Live journey · ${APP_NAME}`;
    case '/map':
      return `Map intel · ${APP_NAME}`;
    case '/trusted':
      return `Trusted contacts · ${APP_NAME}`;
    case '/settings':
      return `Settings · ${APP_NAME}`;
    case '/cita':
      return `Modo Cita · ${APP_NAME}`;
    case '/transport':
      return `Modo Transporte · ${APP_NAME}`;
    case '/checkin':
      return `Check-in IA · ${APP_NAME}`;
    default:
      return APP_NAME;
  }
}

export function RouteDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return null;
}
