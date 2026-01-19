import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md',
        'dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700',
        className
      )}
    >
      {children}
    </kbd>
  );
}
