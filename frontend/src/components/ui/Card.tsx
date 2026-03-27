interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`compact-card bg-[var(--surface)] rounded-[8px] border border-[var(--border)] p-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`compact-card-header border-b border-[var(--border)] pb-1.5 mb-1.5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`text-sm leading-5 font-semibold text-[var(--foreground)] ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`compact-card-content p-0 m-0 ${className}`}>{children}</div>;
}
