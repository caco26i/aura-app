import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import { emitTelemetry } from './observability/auraTelemetry';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

emitTelemetry({
  category: 'auth',
  event: 'bootstrap',
  googleOAuth: Boolean(clientId),
});

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(
  clientId ? <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider> : app,
);
