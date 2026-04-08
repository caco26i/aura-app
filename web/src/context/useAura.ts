import { useContext } from 'react';
import { AuraContext } from './auraContext';

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error('useAura must be used within AuraProvider');
  return ctx;
}
