'use client';

import { useEffect, useState } from 'react';

import { LoginModal } from './LoginModal';
import { getBalance, UnauthorizedError } from '@/lib/api';
import { clearAuthHeader, getAuthHeader, setUnauthorizedHandler, storeAuthHeader } from '@/lib/auth';

// 'checking' is the brief pre-mount state before we've read localStorage; it
// renders nothing so the prerendered HTML and first client render match.
type Status = 'checking' | 'locked' | 'unlocked';

/**
 * Gates the whole app behind the API password. While locked, only the login
 * modal renders — the children (which fetch data) never mount, so no
 * unauthenticated request is made. Any 401 during use re-locks the app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read the stored credential after mount rather than during render:
  // localStorage is unavailable while prerendering, so reading it in render
  // would desync the server and client HTML (hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(getAuthHeader() ? 'unlocked' : 'locked');
  }, []);

  // A 401 from any API call clears the credential and returns to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setBusy(false);
      setError('Your session ended. Please enter the password again.');
      setStatus('locked');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const submitPassword = async (password: string) => {
    setError(null);

    try {
      storeAuthHeader(password);
    } catch {
      // btoa throws on non-ASCII passwords.
      setError('Password must use only standard (ASCII) characters.');
      return;
    }

    // Validate against a real endpoint so a wrong password is reported here,
    // instead of flashing the app and bouncing back on the first data fetch.
    setBusy(true);
    try {
      await getBalance();
      setStatus('unlocked');
    } catch (err) {
      clearAuthHeader();
      setBusy(false);
      setError(
        err instanceof UnauthorizedError
          ? 'Incorrect password. Please try again.'
          : 'Could not reach the server. Please try again.',
      );
    }
  };

  if (status === 'checking') return null;
  if (status === 'unlocked') return <>{children}</>;
  return <LoginModal busy={busy} error={error} onSubmit={submitPassword} />;
}
