import type { CSSProperties } from 'react';
import { useAura } from '../context/useAura';

export function Settings() {
  const { settings, updateSettings } = useAura();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Safety settings</h1>
      <p style={{ color: 'var(--aura-muted)' }}>Values persist locally; sync strategy in docs.</p>

      <label style={label}>
        Voice keyword phrase
        <input
          value={settings.voiceKeyword}
          onChange={(e) => updateSettings({ voiceKeyword: e.target.value })}
          aria-label="Voice keyword phrase"
          style={field}
        />
      </label>

      <label style={label}>
        Silent trigger window (ms)
        <input
          type="range"
          min={400}
          max={2000}
          step={50}
          value={settings.silentTriggerMs}
          onChange={(e) => updateSettings({ silentTriggerMs: Number(e.target.value) })}
          aria-valuemin={400}
          aria-valuemax={2000}
          aria-valuenow={settings.silentTriggerMs}
          style={{ width: '100%', marginTop: 8 }}
        />
        <span role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--aura-muted)' }}>
          {settings.silentTriggerMs} ms
        </span>
      </label>

      <label style={label}>
        Default journey timer (minutes)
        <input
          type="number"
          min={1}
          value={settings.timerDefaultMinutes}
          onChange={(e) => updateSettings({ timerDefaultMinutes: Number(e.target.value) || 1 })}
          style={field}
        />
      </label>

      <fieldset style={{ border: '1px solid var(--aura-border)', borderRadius: 12, padding: 12, marginTop: 12 }}>
        <legend style={{ fontWeight: 700 }}>Location precision</legend>
        <label style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="radio"
            name="loc"
            checked={settings.locationPrecision === 'approximate'}
            onChange={() => updateSettings({ locationPrecision: 'approximate' })}
          />
          Approximate (privacy-first)
        </label>
        <label style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="radio"
            name="loc"
            checked={settings.locationPrecision === 'precise'}
            onChange={() => updateSettings({ locationPrecision: 'precise' })}
          />
          Precise (when sharing live location)
        </label>
      </fieldset>
    </div>
  );
}

const label: CSSProperties = { display: 'block', fontWeight: 700, marginTop: 14 };
const field: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
};
