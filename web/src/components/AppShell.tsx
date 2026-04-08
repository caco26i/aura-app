import { NavLink, Outlet } from 'react-router-dom';

function NavItem({
  to,
  end,
  label,
  icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: string;
}) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nbi${isActive ? ' on' : ''}`}>
      <div className="nbi-ind">
        <span className="mi material-symbols-rounded">{icon}</span>
      </div>
      <span className="nbi-l">{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="aura-m3-app">
      <main className="aura-m3-main">
        <Outlet />
      </main>
      <nav className="nbar" aria-label="Primary">
        <NavItem to="/" end label="Home" icon="home" />
        <NavItem to="/cita" label="Cita" icon="favorite" />
        <NavItem to="/transport" label="Transp." icon="directions_car" />
        <NavItem to="/checkin" label="Check-in" icon="check_circle" />
        <NavItem to="/emergency" label="SOS" icon="emergency" />
      </nav>
    </div>
  );
}
