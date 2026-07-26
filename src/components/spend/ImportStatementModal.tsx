'use client';

import { useEffect, useRef, useState } from 'react';

import { ModalShell } from '../ModalShell';
import {
  ApiError,
  configureAccount,
  getImports,
  undoImport,
  uploadStatement,
  UnauthorizedError,
} from '@/lib/api';
import type { ImportSummary, ImportView, SpendAccount, StatementFormat } from '@/lib/types';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SpendAccount[];
  /** Called after anything that changes stored data, so the page can refetch. */
  onImported: () => void;
}

const RECENT_LIMIT = 5;

export function ImportStatementModal({
  isOpen,
  onClose,
  accounts,
  onImported,
}: ImportStatementModalProps) {
  // Direct-pay accounts (rent, utilities) have no statement to import — their
  // transactions are generated when the bill is marked paid, so offering an
  // upload for them would only produce a rejection.
  const importable = accounts.filter(
    (account) => account.statementFormat !== 'NONE' || !account.defaultCategory,
  );

  const [accountId, setAccountId] = useState<number | null>(null);
  const [format, setFormat] = useState<StatementFormat>('CHASE');
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<ImportView[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = importable.find((account) => account.id === accountId) ?? null;
  const needsSetup = selected != null && selected.statementFormat === 'NONE';

  const refreshRecent = () => {
    getImports(RECENT_LIMIT)
      .then(setRecent)
      .catch((err) => {
        if (err instanceof UnauthorizedError) return;
        console.error('Failed to load recent imports:', err);
      });
  };

  // Refreshed on each open rather than once on mount, so reopening after an
  // import elsewhere does not show a stale list.
  useEffect(() => {
    if (isOpen) refreshRecent();
  }, [isOpen]);

  const describe = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    return 'Something went wrong. Please try again.';
  };

  const handleEnable = async () => {
    if (accountId == null) return;
    setIsBusy(true);
    setError(null);
    try {
      await configureAccount(accountId, format);
      onImported();
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) setError(describe(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (accountId == null || !file) return;

    setIsBusy(true);
    setError(null);
    setResult(null);
    try {
      const summary = await uploadStatement(accountId, file);
      setResult(summary);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refreshRecent();
      onImported();
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) setError(describe(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleUndo = async (importId: number) => {
    if (!window.confirm('Remove this import and every transaction it brought in?')) return;
    setIsBusy(true);
    setError(null);
    try {
      await undoImport(importId);
      setResult(null);
      refreshRecent();
      onImported();
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) setError(describe(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Import statement"
      widthClassName="w-[680px] max-w-[calc(100vw-2rem)]"
      className="flex flex-col max-h-[85vh] overflow-y-auto"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Account</span>
          <select
            value={accountId ?? ''}
            onChange={(event) => {
              setAccountId(event.target.value ? Number(event.target.value) : null);
              setResult(null);
              setError(null);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[220px]"
          >
            <option value="">Choose an account...</option>
            {importable.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.statementFormat === 'NONE' ? ' (not set up)' : ` — ${account.statementFormat}`}
              </option>
            ))}
          </select>
        </label>

        {needsSetup ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Statement format</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as StatementFormat)}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              >
                <option value="CHASE">Chase</option>
                <option value="AMEX">American Express</option>
              </select>
            </label>
            <button
              onClick={handleEnable}
              disabled={isBusy}
              className="px-4 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              {isBusy ? 'Saving...' : 'Enable imports'}
            </button>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">CSV file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                disabled={accountId == null}
                className="text-sm file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-gray-200 file:text-gray-700 disabled:opacity-50"
              />
            </label>
            <button
              onClick={handleUpload}
              disabled={isBusy || accountId == null}
              className="px-4 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              {isBusy ? 'Importing...' : 'Upload'}
            </button>
          </>
        )}
      </div>

      {needsSetup && (
        <p className="mt-3 text-sm text-gray-500">
          This account has no statement format yet. Pick whose export it is, then upload.
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      )}

      {result && <ImportResult summary={result} />}

      {recent.length > 0 && <RecentImports imports={recent} onUndo={handleUndo} isBusy={isBusy} />}

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

/**
 * What the import did. The counts are the point: re-uploading an overlapping
 * export should show rows collapsing into duplicates rather than doubling the
 * data, and that is only visible if the numbers are reported.
 */
/**
 * Re-uploading a file already on record is a normal thing to do — it is how
 * rows removed by undoing an overlapping import get restored — so the three
 * outcomes are worth distinguishing rather than all reading as "done".
 */
function headline(summary: ImportSummary): string {
  if (!summary.alreadyImported) {
    return `Imported ${summary.filename} into ${summary.accountName}.`;
  }
  if (summary.inserted === 0) {
    return `${summary.filename} had already been imported — nothing changed.`;
  }
  return `Re-imported ${summary.filename} — ${summary.inserted} missing transaction${
    summary.inserted === 1 ? '' : 's'
  } restored.`;
}

function ImportResult({ summary }: { summary: ImportSummary }) {
  return (
    <div className="mt-4 text-sm bg-green-50 border border-green-200 rounded p-3 text-green-900">
      <p className="font-medium">{headline(summary)}</p>
      <p className="mt-1">
        {summary.rowCount} rows read · <strong>{summary.inserted} new</strong> ·{' '}
        {summary.duplicates} already present · {summary.payments} card payment
        {summary.payments === 1 ? '' : 's'} excluded from spending
        {summary.periodStart && summary.periodEnd
          ? ` · ${summary.periodStart} to ${summary.periodEnd}`
          : ''}
      </p>
      {summary.pendingClassification > 0 && (
        <p className="mt-2 text-amber-800">
          {summary.pendingClassification} of these are from merchants we have not seen
          before, so they are uncategorised until the classifier runs. Their amounts
          already count towards your totals.
        </p>
      )}
    </div>
  );
}

function RecentImports({
  imports,
  onUndo,
  isBusy,
}: {
  imports: ImportView[];
  onUndo: (id: number) => void;
  isBusy: boolean;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Recent imports
      </h3>
      <ul className="flex flex-col divide-y divide-gray-100">
        {imports.map((record) => (
          <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-sm">
              <span className="font-medium">{record.filename}</span>
              <span className="text-gray-500">
                {' '}
                → {record.accountName} · {record.insertedCount ?? 0} new
                {record.duplicateCount ? `, ${record.duplicateCount} duplicate` : ''}
                {' · '}
                {record.importedAt?.slice(0, 10)}
              </span>
            </span>
            <button
              onClick={() => onUndo(record.id)}
              disabled={isBusy}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Undo
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
