import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import {
  captureFirstTouchAcquisitionIfNeeded,
  getAcquisitionTelemetry,
} from './observability/firstTouchAcquisition';
import { emitTelemetry } from './observability/auraTelemetry';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

captureFirstTouchAcquisitionIfNeeded();
const acquisition = getAcquisitionTelemetry();

emitTelemetry({
  category: 'auth',
  event: 'bootstrap',
  googleOAuth: Boolean(clientId),
  ...(acquisition ? { acquisition } : {}),
});

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(
  clientId ? <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider> : app,
);
