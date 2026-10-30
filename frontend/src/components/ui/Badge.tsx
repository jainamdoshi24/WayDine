import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'subtle' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        {
          'bg-[#eff6ff] text-[#1e4fc2] border border-[#dbeafe]': variant === 'default',
          'bg-[#f0fdf4] text-[#15803d] border border-[#dcfce7]': variant === 'success',
          'bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]': variant === 'warning',
          'bg-slate-100 text-slate-600 border border-slate-200': variant === 'subtle',
          'bg-white text-slate-600 border border-slate-200': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
