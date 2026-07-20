type Variant = 'confirm' | 'cancel' | 'subtle';

const VARIANT_CLASSES: Record<Variant, string> = {
  confirm:
    'px-2 sm:px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm hover:shadow',
  cancel:
    'px-2 sm:px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow',
  subtle: 'px-2 sm:px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100',
};

interface ActionButtonProps {
  variant: Variant;
  onClick: () => void;
  icon: React.ReactNode;
  /** Hidden on small screens, where the icon carries the meaning. */
  label: string;
}

export function ActionButton({ variant, onClick, icon, label }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-1 text-sm transition-all duration-200 ${VARIANT_CLASSES[variant]}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
