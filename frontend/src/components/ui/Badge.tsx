type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants = {
  default: 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
  success: 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
  warning: 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
  danger: 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
  info: 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
