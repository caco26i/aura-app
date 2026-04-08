import type { CSSProperties } from 'react';
import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthError,
} from 'firebase/auth';
import { establishAuraBffSessionWithFirebaseIdToken } from '../api/auraBackendAuth';
import { SkipToContent } from '../components/SkipToContent';
import { firebaseAuthConfigured, getAuraFirebaseAuth } from '../lib/firebaseClient';
import { emitTelemetry } from '../observability/auraTelemetry';

const bffUrlConfigured = Boolean(import.meta.env.VITE_AURA_BFF_URL?.trim());

type Mode = 'sign_in' | 'sign_up';

function mapFirebaseAuthError(err: AuthError): string {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password (at least 6 characters).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function Auth() {
  const navigate = useNavigate();
  const formId = useId();
  const emailFieldId = `${formId}-email`;
  const passwordFieldId = `${formId}-password`;
  const [mode, setMode] = useState<Mode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const firebaseOk = firebaseAuthConfigured();
  const canSubmit = firebaseOk && bffUrlConfigured && email.trim() && password.length >= 6 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    const auth = getAuraFirebaseAuth();
    try {
      if (mode === 'sign_up') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        emitTelemetry({ category: 'auth', event: 'firebase_sign_up' });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        emitTelemetry({ category: 'auth', event: 'firebase_sign_in' });
      }
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setMessage('Signed in to Firebase but could not read a session token.');
        setBusy(false);
        return;
      }
      const ok = await establishAuraBffSessionWithFirebaseIdToken(idToken);
      if (!ok) {
        setMessage(
          'Could not link your Aura session. Check that the BFF is running, Firebase Admin is configured on the server, and CORS allows this origin.',
        );
        setBusy(false);
        return;
      }
      navigate('/settings', { replace: true });
    } catch (e) {
      const err = e as AuthError;
      setMessage('code' in err && typeof err.code === 'string' ? mapFirebaseAuthError(err) : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aura-m3-body" style={{ minHeight: '100%' }}>
      <SkipToContent />
      <main
        id="main-content"
        tabIndex={-1}
        style={{
          minHeight: '100dvh',
          padding: '28px 20px calc(40px + var(--aura-safe-area-bottom))',
          background: 'linear-gradient(160deg, var(--s1) 0%, var(--bg) 42%, var(--Pc) 100%)',
          color: 'var(--k1)',
          fontFamily: 'var(--fb), system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 400,
            margin: '0 auto',
            borderRadius: 'var(--r4)',
            padding: 28,
            background: 'rgba(255,255,255,0.88)',
            boxShadow: '0 24px 48px rgba(26, 16, 40, 0.12)',
            border: '1px solid var(--bd2)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img
              src="/aura-brand-logo.jpg"
              alt="Aura"
              width={96}
              height={96}
              style={{
                borderRadius: 24,
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(133, 116, 204, 0.25)',
              }}
            />
            <h1 style={{ margin: '16px 0 6px', fontSize: 26, fontWeight: 800, fontFamily: 'var(--fd), serif' }}>
              Aura account
            </h1>
            <p style={{ margin: 0, color: 'var(--k2)', fontSize: 15, lineHeight: 1.5 }}>
              Sign in or create an account with email. Material-style layout aligned with Aura&apos;s palette.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Sign in or create account"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign_in'}
              onClick={() => {
                setMode('sign_in');
                setMessage(null);
              }}
              style={segmentBtn(mode === 'sign_in')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'sign_up'}
              onClick={() => {
                setMode('sign_up');
                setMessage(null);
              }}
              style={segmentBtn(mode === 'sign_up')}
            >
              Create account
            </button>
          </div>

          {!firebaseOk ? (
            <p role="alert" style={{ color: 'var(--danger)', lineHeight: 1.55, margin: '0 0 16px' }}>
              Set <code>VITE_FIREBASE_*</code> in <code>.env.local</code> (see <code>web/.env.example</code>) to enable
              Firebase Authentication.
            </p>
          ) : null}
          {!bffUrlConfigured ? (
            <p role="alert" style={{ color: 'var(--danger)', lineHeight: 1.55, margin: '0 0 16px' }}>
              Set <code>VITE_AURA_BFF_URL</code> so the app can open a secure server session after Firebase sign-in.
            </p>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            style={{ display: 'grid', gap: 16 }}
          >
            <label htmlFor={emailFieldId} style={labelStyle}>
              Email
              <input
                id={emailFieldId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </label>
            <label htmlFor={passwordFieldId} style={labelStyle}>
              Password
              <input
                id={passwordFieldId}
                type="password"
                autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                minLength={6}
                required
              />
            </label>
            {message ? (
              <p role="status" style={{ margin: 0, color: 'var(--Pk)', fontSize: 15, lineHeight: 1.5 }}>
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
            >
              {busy ? 'Working…' : mode === 'sign_up' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 22, marginBottom: 0, textAlign: 'center', fontSize: 14, color: 'var(--k2)' }}>
            <Link to="/" style={{ fontWeight: 700, color: 'var(--Pk)' }}>
              Back to app
            </Link>
            {' · '}
            <Link to="/settings" style={{ fontWeight: 700, color: 'var(--Pk)' }}>
              Settings
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function segmentBtn(active: boolean): CSSProperties {
  return {
    padding: '12px 10px',
    borderRadius: 'var(--r3)',
    border: active ? '2px solid var(--P)' : '1px solid var(--bd2)',
    background: active ? 'var(--Pc)' : 'transparent',
    color: active ? 'var(--Pk)' : 'var(--k2)',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: 15,
    fontFamily: 'inherit',
  };
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--k2)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 14px',
  borderRadius: 'var(--r3)',
  border: '1px solid var(--bd2)',
  background: '#fff',
  fontSize: 16,
  outline: 'none',
  boxShadow: '0 0 0 0 transparent',
};

const primaryBtn: CSSProperties = {
  marginTop: 4,
  padding: '16px 18px',
  borderRadius: 'var(--r4)',
  border: 'none',
  background: 'var(--Pbg)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
