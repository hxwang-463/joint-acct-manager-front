import { useEffect } from 'react';

import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Tailwind width classes for the panel, e.g. "w-96". */
  widthClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Backdrop + centered panel shared by every modal: locks background scroll,
 * closes on backdrop click and on Escape.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  widthClassName = 'w-96',
  className = '',
  children,
}: ModalShellProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${widthClassName} bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl ${className}`}
      >
        <h2 className="text-xl font-bold mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
