'use client';

import { useState } from 'react';

interface LoginModalProps {
  /** True while the entered password is being checked against the server. */
  busy: boolean;
  error: string | null;
  onSubmit: (password: string) => void;
}

/**
 * Password-only login gate. The username is fixed server-side, so it is not
 * shown or entered. Not dismissable: the app is not rendered until this passes.
 */
export function LoginModal({ busy, error, onSubmit }: LoginModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || password === '') return;
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Password required">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold mb-1">Joint Account Manager</h2>
        <p className="text-sm text-gray-600 mb-6">Enter the password to continue.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={busy}
            aria-label="Password"
            className="w-full p-3 border rounded-lg mb-3 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />

          {error && (
            <p className="text-sm text-red-600 mb-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || password === ''}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:hover:bg-blue-500"
          >
            {busy ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
