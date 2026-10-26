'use client';

import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricCard({
  label,
  value,
  variant = 'default',
  size = 'md',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-4 motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-150 hover:shadow-sm hover:border-primary/35 motion-safe:hover:-translate-y-0.5',
        variant === 'primary' && 'border-primary',
        className
      )}
    >
      <div
        className={cn(
          'font-serif tabular-nums',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'danger' && 'text-danger'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
