import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAura } from '../context/useAura';

export function Settings() {
  const { settings, updateSettings, clearLocalAuraData } = useAura();
  const clearDialogRef = useRef<HTMLDialogElement>(null);

  const openClearDialog = () => {
    clearDialogRef.current?.showModal();
  };

  const closeClearDialog = () => {
    clearDialogRef.current?.close();
  };

  const confirmClear = () => {
    closeClearDialog();
    clearLocalAuraData();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>

      <section style={section} aria-labelledby="data-on-device-heading">
        <h2 id="data-on-device-heading" style={h2}>
          Your data on this device
        </h2>
        <ul style={bulletList}>
          <li>Journeys, contacts, map layer choices, and safety defaults are saved in this browser.</li>
          <li>Clearing site data or using &quot;Clear local Aura data&quot; below removes them from this device.</li>
        </ul>
        <p style={{ color: 'var(--aura-muted)', marginTop: 12, lineHeight: 1.5 }}>
          Saved in this browser. Connect Aura for sync when available.
        </p>
      </section>

      <section style={section} aria-labelledby="safety-defaults-heading">
        <h2 id="safety-defaults-heading" style={h2}>
          Safety defaults
        </h2>

        <label htmlFor="settings-display-name" style={label}>
          Display name (home header)
          <input
            id="settings-display-name"
            value={settings.displayName}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            placeholder="e.g. Sofia García"
            style={field}
            autoComplete="name"
          />
        </label>

        <label htmlFor="settings-voice-keyword" style={label}>
          Voice keyword phrase
          <input
            id="settings-voice-keyword"
            value={settings.voiceKeyword}
            onChange={(e) => updateSettings({ voiceKeyword: e.target.value })}
            style={field}
          />
        </label>

        <label htmlFor="settings-silent-trigger-ms" style={label}>
          Silent trigger window (ms)
          <input
            id="settings-silent-trigger-ms"
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

        <label htmlFor="settings-journey-timer-minutes" style={label}>
          Default journey timer (minutes)
          <input
            id="settings-journey-timer-minutes"
            type="number"
            min={1}
            value={settings.timerDefaultMinutes}
            onChange={(e) => updateSettings({ timerDefaultMinutes: Number(e.target.value) || 1 })}
            style={field}
          />
        </label>

        <fieldset
          aria-describedby="settings-privacy-sharing"
          style={{ border: '1px solid var(--aura-border)', borderRadius: 12, padding: 12, marginTop: 12 }}
        >
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

          <div
            id="settings-privacy-sharing"
            style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--aura-border)' }}
          >
            <h3 style={{ fontSize: 16, margin: '0 0 8px', fontWeight: 800 }}>Privacy &amp; sharing</h3>
            <p role="note" style={{ color: 'var(--aura-muted)', lineHeight: 1.55, margin: 0, fontSize: 15 }}>
              <strong>Approximate</strong> location is better for routine map and journey views when you want less
              pinpoint detail. <strong>Precise</strong> location is intended when you share live location on an active
              journey so trusted contacts can see where you are accurately. Your browser may still ask permission when
              you use the map or start a journey.
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <Link to="/welcome?review=location" style={learnMoreLink}>
                Learn more about journeys and location
              </Link>
            </p>
          </div>
        </fieldset>
      </section>

      <section style={section} aria-labelledby="reset-heading">
        <h2 id="reset-heading" style={h2}>
          Reset Aura on this device
        </h2>
        <p style={{ color: 'var(--aura-muted)', lineHeight: 1.55, marginTop: 0 }}>
          Remove all Aura data stored in this browser. You can set everything up again afterward.
        </p>
        <button type="button" onClick={openClearDialog} style={destructiveBtn}>
          Clear local Aura data
        </button>
      </section>

      <dialog
        ref={clearDialogRef}
        aria-labelledby="clear-dialog-title"
        style={{
          maxWidth: 420,
          width: 'calc(100% - 32px)',
          borderRadius: 16,
          border: '1px solid var(--aura-border)',
          padding: 20,
          background: 'var(--aura-card)',
          color: 'var(--aura-text)',
        }}
      >
        <h2 id="clear-dialog-title" style={{ marginTop: 0, fontSize: 18 }}>
          Clear local Aura data?
        </h2>
        <p style={{ color: 'var(--aura-muted)', lineHeight: 1.55, marginBottom: 20 }}>
          This removes contacts, active journey, settings, and onboarding status from this browser. It does not delete
          server history if you used a live account.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={closeClearDialog} style={secondaryBtn}>
            Cancel
          </button>
          <button type="button" onClick={confirmClear} style={destructiveSolidBtn}>
            Clear data
          </button>
        </div>
      </dialog>
    </div>
  );
}

const section: CSSProperties = { marginTop: 28 };
const h2: CSSProperties = { fontSize: 18, margin: '0 0 12px', fontWeight: 800 };
const bulletList: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: 'var(--aura-muted)',
  lineHeight: 1.55,
};
const label: CSSProperties = { display: 'block', fontWeight: 700, marginTop: 14 };
const field: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
};
const learnMoreLink: CSSProperties = {
  fontWeight: 700,
  color: 'var(--aura-text)',
};
const destructiveBtn: CSSProperties = {
  marginTop: 12,
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'transparent',
  color: 'var(--aura-text)',
  fontWeight: 700,
  cursor: 'pointer',
};
const secondaryBtn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'var(--aura-canvas)',
  fontWeight: 700,
  cursor: 'pointer',
};
const destructiveSolidBtn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#b42318',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};
