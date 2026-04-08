import { Navigate, Outlet } from 'react-router-dom';
import { useAura } from '../context/useAura';

/** Sends first-time users to `/welcome` before shell routes (see UX spec §2). */
export function RequireOnboarding() {
  const { onboardingCompleted } = useAura();
  if (!onboardingCompleted) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}
