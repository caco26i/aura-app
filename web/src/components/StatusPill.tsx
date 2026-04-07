import type { JourneyTrackState } from '../types';

const labels: Record<JourneyTrackState, string> = {
  on_track: 'On track',
  delay: 'Slight delay',
  deviation: 'Route deviation',
};

export function StatusPill({ state }: { state: JourneyTrackState }) {
  const tone =
    state === 'on_track'
      ? 'var(--aura-status-ok)'
      : state === 'delay'
        ? 'var(--aura-status-warn)'
        : 'var(--aura-status-alert)';

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'var(--aura-card)',
        border: `1px solid ${tone}`,
        color: tone,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {labels[state]}
    </span>
  );
}
