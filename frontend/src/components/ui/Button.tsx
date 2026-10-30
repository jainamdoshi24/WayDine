import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        {
          'text-sm px-3.5 py-2': size === 'sm',
          'text-sm px-4 py-2.5': size === 'md',
          'text-base px-5 py-3': size === 'lg',
        },
        {
          'bg-[#2563eb] text-white hover:bg-[#1e4fc2] active:bg-[#1e4fc2] shadow-sm': variant === 'primary',
          'bg-white text-[#1a2540] border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm': variant === 'secondary',
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
          'bg-white text-[#2563eb] border border-[#2563eb] hover:bg-[#eff6ff]': variant === 'outline',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
        },
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon && iconPosition === 'left' ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {!loading && icon && iconPosition === 'right' ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
    </button>
  );
}
