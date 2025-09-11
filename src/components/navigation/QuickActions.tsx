"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Settings, BarChart3, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Create Ticket',
      description: 'Submit a new support ticket',
      icon: Plus,
      href: '/admin/tickets/create',
      variant: 'default' as const
    },
    {
      title: 'View Tickets',
      description: 'Manage all tickets',
      icon: BarChart3,
      href: '/admin/tickets',
      variant: 'outline' as const
    },
    {
      title: 'Manage Users',
      description: 'User administration',
      icon: Users,
      href: '/admin/users',
      variant: 'outline' as const
    },
    {
      title: 'Notifications',
      description: 'View notifications',
      icon: Bell,
      href: '/admin/notifications',
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-2"
                onClick={() => router.push(action.href)}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium text-xs">{action.title}</div>
                  <div className="text-xs text-muted-foreground hidden md:block">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
