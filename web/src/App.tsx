import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FirebaseProfileSync } from './components/FirebaseProfileSync';
import { AuraProvider } from './context/AuraContext';
import { AuraErrorBoundary } from './components/AuraErrorBoundary';
import { AppShell } from './components/AppShell';
import { RouteAnnouncer } from './components/RouteAnnouncer';
import { RouteDocumentTitle } from './components/RouteDocumentTitle';
import { RequireOnboarding } from './components/RequireOnboarding';
import './theme.css';
import './styles/aura-m3.css';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const JourneyNew = lazy(() => import('./pages/JourneyNew').then((m) => ({ default: m.JourneyNew })));
const JourneyActive = lazy(() =>
  import('./pages/JourneyActive').then((m) => ({ default: m.JourneyActive })),
);
const Emergency = lazy(() => import('./pages/Emergency').then((m) => ({ default: m.Emergency })));
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const Trusted = lazy(() => import('./pages/Trusted').then((m) => ({ default: m.Trusted })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })));
const Welcome = lazy(() => import('./pages/Welcome').then((m) => ({ default: m.Welcome })));
const ModoCita = lazy(() => import('./pages/ModoCita').then((m) => ({ default: m.ModoCita })));
const ModoTransporte = lazy(() =>
  import('./pages/ModoTransporte').then((m) => ({ default: m.ModoTransporte })),
);
const CheckinInteligente = lazy(() =>
  import('./pages/CheckinInteligente').then((m) => ({ default: m.CheckinInteligente })),
);

function RouteFallback() {
  return (
    <div className="aura-m3-app" role="status" aria-live="polite" style={{ padding: '1.5rem' }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuraProvider>
      <FirebaseProfileSync />
      <BrowserRouter>
        <RouteDocumentTitle />
        <RouteAnnouncer />
        <AuraErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route element={<RequireOnboarding />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/journey/new" element={<JourneyNew />} />
                  <Route path="/journey/active" element={<JourneyActive />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/trusted" element={<Trusted />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/cita" element={<ModoCita />} />
                  <Route path="/transport" element={<ModoTransporte />} />
                  <Route path="/checkin" element={<CheckinInteligente />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuraErrorBoundary>
      </BrowserRouter>
    </AuraProvider>
  );
}
