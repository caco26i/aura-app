import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuraSOSButton } from './AuraSOSButton';

const navItem: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '10px 4px',
  fontSize: 11,
  textDecoration: 'none',
  color: 'var(--aura-muted)',
  borderRadius: 12,
};

export function AppShell() {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '16px 16px 96px' }}>
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          gap: 4,
          padding: '10px 12px calc(10px + var(--aura-safe-area-bottom))',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--aura-border)',
        }}
      >
        <NavLink to="/" end style={navItem}>
          {({ isActive }) => (
            <span style={{ color: isActive ? 'var(--aura-text)' : undefined, fontWeight: 600 }}>Home</span>
          )}
        </NavLink>
        <NavLink to="/journey/active" style={navItem}>
          {({ isActive }) => (
            <span style={{ color: isActive ? 'var(--aura-text)' : undefined, fontWeight: 600 }}>Journey</span>
          )}
        </NavLink>
        <NavLink to="/map" style={navItem}>
          {({ isActive }) => (
            <span style={{ color: isActive ? 'var(--aura-text)' : undefined, fontWeight: 600 }}>Map</span>
          )}
        </NavLink>
        <NavLink to="/trusted" style={navItem}>
          {({ isActive }) => (
            <span style={{ color: isActive ? 'var(--aura-text)' : undefined, fontWeight: 600 }}>Trusted</span>
          )}
        </NavLink>
        <NavLink to="/settings" style={navItem}>
          {({ isActive }) => (
            <span style={{ color: isActive ? 'var(--aura-text)' : undefined, fontWeight: 600 }}>Settings</span>
          )}
        </NavLink>
      </nav>
      <AuraSOSButton />
    </div>
  );
}
