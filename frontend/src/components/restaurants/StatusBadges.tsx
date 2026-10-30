import { AccessibilityInfo } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface AccessBadgeProps {
  info: AccessibilityInfo;
  size?: 'sm' | 'xs';
}

export function AccessBadge({ info, size = 'sm' }: AccessBadgeProps) {
  const config = {
    confirmed_same_side: {
      icon: <CheckCircle2 className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      label: 'Access confirmed',
      className: 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]',
    },
    uncertain: {
      icon: <HelpCircle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      label: 'Access unverified',
      className: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
    },
    opposite_side: {
      icon: <AlertTriangle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      label: 'Opposite side',
      className: 'bg-red-50 text-red-600 border-red-200',
    },
  }[info.status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full border',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      config.className
    )}>
      {config.icon}
      {config.label}
    </span>
  );
}

interface EtaBadgeProps {
  label: string;
  isOpen: boolean | null;
  closingWarning: boolean;
  size?: 'sm' | 'xs';
}

export function EtaStatusBadge({ label, isOpen, closingWarning, size = 'sm' }: EtaBadgeProps) {
  let className = 'bg-slate-100 text-slate-500 border-slate-200';
  let icon = <HelpCircle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;

  if (isOpen === false) {
    className = 'bg-red-50 text-red-600 border-red-200';
    icon = <AlertTriangle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
  } else if (closingWarning) {
    className = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = <AlertTriangle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
  } else if (isOpen === true) {
    className = 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]';
    icon = <CheckCircle2 className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />;
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full border truncate',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
      className
    )}>
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}
