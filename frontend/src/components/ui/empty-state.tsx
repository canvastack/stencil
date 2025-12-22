import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("p-12", className)}>
      <div className="text-center">
        <Icon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
