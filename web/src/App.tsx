import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuraProvider } from './context/AuraContext';
import { AuraErrorBoundary } from './components/AuraErrorBoundary';
import { AppShell } from './components/AppShell';
import { RequireOnboarding } from './components/RequireOnboarding';
import { Home } from './pages/Home';
import { JourneyNew } from './pages/JourneyNew';
import { JourneyActive } from './pages/JourneyActive';
import { Emergency } from './pages/Emergency';
import { MapPage } from './pages/MapPage';
import { Trusted } from './pages/Trusted';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';
import './theme.css';

export default function App() {
  return (
    <AuraProvider>
      <BrowserRouter>
        <AuraErrorBoundary>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route element={<RequireOnboarding />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/journey/new" element={<JourneyNew />} />
                <Route path="/journey/active" element={<JourneyActive />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/trusted" element={<Trusted />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuraErrorBoundary>
      </BrowserRouter>
    </AuraProvider>
  );
}
