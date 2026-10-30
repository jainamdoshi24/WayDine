import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className, hover, onClick, selected }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        hover && 'transition-all duration-200 cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_6px_rgba(0,0,0,0.08)]',
        selected && 'ring-2 ring-blue-500 border-blue-300',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 pt-4 pb-3', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 pb-4', className)}>{children}</div>;
}
