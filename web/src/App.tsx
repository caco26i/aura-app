import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuraProvider } from './context/AuraContext';
import { AppShell } from './components/AppShell';
import { Home } from './pages/Home';
import { JourneyNew } from './pages/JourneyNew';
import { JourneyActive } from './pages/JourneyActive';
import { Emergency } from './pages/Emergency';
import { MapPage } from './pages/MapPage';
import { Trusted } from './pages/Trusted';
import { Settings } from './pages/Settings';
import './theme.css';

export default function App() {
  return (
    <AuraProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/journey/new" element={<JourneyNew />} />
            <Route path="/journey/active" element={<JourneyActive />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/trusted" element={<Trusted />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/emergency" element={<Emergency />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuraProvider>
  );
}
