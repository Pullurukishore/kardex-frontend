import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, User, Clock } from 'lucide-react';
import api from '@/lib/api/axios';

interface ActivityItem {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTE';
  description: string;
  data: {
    status?: string;
    notes?: string;
    content?: string;
    [key: string]: any;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function TicketActivity({ ticketId }: { ticketId: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get(`/tickets/${ticketId}/activity`);
        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity found for this ticket.
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return <Activity className="h-4 w-4 text-white" />;
      case 'NOTE':
        return <User className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-white" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return 'bg-blue-500';
      case 'NOTE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatStatusName = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center ring-8 ring-background`}>
                    {getActivityIcon(activity.type)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {activity.user?.name?.charAt(0).toUpperCase() || activity.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {activity.user?.name || activity.user?.email?.split('@')[0] || 'Unknown User'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.user?.role?.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === 'STATUS_CHANGE' ? (
                        <>
                          {activity.description} <Badge variant="outline" className="ml-1">{formatStatusName(activity.data.status || '')}</Badge>
                          {activity.data.notes && (
                            <span className="block mt-1 text-xs italic">"{activity.data.notes}"</span>
                          )}
                        </>
                      ) : (
                        <>
                          {activity.description}
                          {activity.data.content && (
                            <span className="block mt-1 text-xs italic">"{activity.data.content}"</span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                    <time dateTime={activity.createdAt.toString()}>
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
