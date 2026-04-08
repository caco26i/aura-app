import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAura } from '../context/useAura';
import { emitTelemetry } from '../observability/auraTelemetry';

type Step = 0 | 1 | 2;

export function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationReview = searchParams.get('review') === 'location';
  const { onboardingCompleted, setOnboardingCompleted } = useAura();
  const [step, setStep] = useState<Step>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = `welcome-step-${step}-title`;

  useEffect(() => {
    if (onboardingCompleted && !locationReview) {
      navigate('/', { replace: true });
    }
  }, [onboardingCompleted, navigate, locationReview]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, locationReview]);

  const finish = (source: 'finish' | 'skip') => {
    setOnboardingCompleted(true);
    emitTelemetry({ category: 'app', event: 'onboarding_completed', source });
    navigate('/', { replace: true });
  };

  if (locationReview) {
    return (
      <div
        style={{
          minHeight: '100%',
          padding: '24px 20px calc(32px + var(--aura-safe-area-bottom))',
          background: 'linear-gradient(180deg, var(--aura-lavender-wash), var(--aura-canvas))',
          color: 'var(--aura-text)',
        }}
      >
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <h1
            ref={headingRef}
            style={{ marginTop: 0, fontSize: 26, lineHeight: 1.2 }}
            tabIndex={-1}
            id="welcome-review-location-title"
          >
            Journeys and location
          </h1>
          <p style={{ color: 'var(--aura-muted)', lineHeight: 1.55, fontSize: 16 }}>
            When you start a journey or use the map, your browser may ask for location. You can choose approximate or
            precise sharing in Settings.
          </p>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            style={{ ...primaryBtn, marginTop: 24, width: '100%' }}
          >
            Back to settings
          </button>
        </div>
      </div>
    );
  }

  if (onboardingCompleted) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '24px 20px calc(32px + var(--aura-safe-area-bottom))',
        background: 'linear-gradient(180deg, var(--aura-lavender-wash), var(--aura-canvas))',
        color: 'var(--aura-text)',
      }}
    >
      <div aria-live="polite" style={{ maxWidth: 440, margin: '0 auto' }}>
        {step === 0 ? (
          <>
            <h1
              ref={headingRef}
              id={titleId}
              style={{ marginTop: 0, fontSize: 26, lineHeight: 1.2 }}
              tabIndex={-1}
            >
              Welcome to Aura
            </h1>
            <p style={{ color: 'var(--aura-muted)', lineHeight: 1.55, fontSize: 16 }}>
              Aura helps you share journey progress with people you trust and reach them quickly if you need help. Your
              contacts and settings stay on this device until you connect a live Aura account.
            </p>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h1 ref={headingRef} id={titleId} style={{ marginTop: 0, fontSize: 26, lineHeight: 1.2 }} tabIndex={-1}>
              Emergency (SOS)
            </h1>
            <ul
              style={{
                margin: '12px 0 0',
                paddingLeft: 20,
                color: 'var(--aura-muted)',
                lineHeight: 1.55,
                fontSize: 16,
              }}
            >
              <li style={{ marginBottom: 10 }}>The SOS button always opens a confirmation screen.</li>
              <li style={{ marginBottom: 10 }}>You choose visible or silent alert.</li>
              <li>Silent alerts need extra steps so they are harder to trigger by accident.</li>
            </ul>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h1 ref={headingRef} id={titleId} style={{ marginTop: 0, fontSize: 26, lineHeight: 1.2 }} tabIndex={-1}>
              Journeys and location
            </h1>
            <p style={{ color: 'var(--aura-muted)', lineHeight: 1.55, fontSize: 16 }}>
              When you start a journey or use the map, your browser may ask for location. You can choose approximate or
              precise sharing in Settings.
            </p>
          </>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 28, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
        {step < 2 ? (
          <button type="button" onClick={() => setStep((s) => (s + 1) as Step)} style={primaryBtn}>
            Continue
          </button>
        ) : (
          <button type="button" onClick={() => finish('finish')} style={primaryBtn}>
            Get started
          </button>
        )}
        {step === 0 ? (
          <button type="button" onClick={() => finish('skip')} style={secondaryBtn}>
            Skip for now
          </button>
        ) : null}
      </div>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  padding: '16px 18px',
  borderRadius: 16,
  border: 'none',
  background: 'var(--aura-text)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 16,
};

const secondaryBtn: CSSProperties = {
  padding: '14px 18px',
  borderRadius: 16,
  border: '1px solid var(--aura-border)',
  background: 'var(--aura-card)',
  color: 'var(--aura-muted)',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 15,
};
