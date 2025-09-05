import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  ClockIcon, 
  TicketIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  UsersIcon,
  HomeIcon,
  CheckCircle2Icon
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof iconMap | React.ReactNode;
  description?: string;
  change?: number | string;
  isPositive?: boolean;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  className?: string;
}

const iconMap = {
  ticket: <TicketIcon className="h-4 w-4" />,
  clock: <ClockIcon className="h-4 w-4" />,
  'check-circle': <CheckCircle2Icon className="h-4 w-4" />,
  'alert-triangle': <AlertTriangleIcon className="h-4 w-4" />,
  user: <UserIcon className="h-4 w-4" />,
  users: <UsersIcon className="h-4 w-4" />,
  home: <HomeIcon className="h-4 w-4" />,
};

export function StatsCard({
  title,
  value,
  icon = 'ticket',
  description,
  change,
  isPositive = true,
  variant = 'default',
  isLoading = false,
  className,
  ...props
}: StatsCardProps) {
  const IconComponent = typeof icon === 'string' ? (iconMap[icon as keyof typeof iconMap] || null) : icon;

  if (isLoading) {
    return (
      <Card className={className} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mt-1" />
          {description && <Skeleton className="h-4 w-32 mt-2" />}
        </CardContent>
      </Card>
    );
  }

  const variantClasses = {
    default: 'text-foreground',
    destructive: 'text-destructive',
  };

  return (
    <Card className={className} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {IconComponent && (
          <div className={cn(
            'p-2 rounded-full',
            variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}>
            {IconComponent}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantClasses[variant])}>
          {value}
        </div>
        
        {(description || (change !== undefined && change !== 0)) && (
          <div className="flex items-center mt-1">
            {change !== undefined && change !== 0 && (
              <div className={cn(
                "inline-flex items-center text-xs font-medium mr-2",
                typeof change === 'number' && change >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                {typeof change === 'number' && (
                  change >= 0 ? (
                    <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                  )
                )}
                {typeof change === 'number' ? `${Math.abs(change)}%` : change}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
