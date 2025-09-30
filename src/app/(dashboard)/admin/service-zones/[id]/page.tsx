"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Pencil, 
  Users, 
  MapPin, 
  BarChart3, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getServiceZone, getServiceZoneStats } from '@/services/zone.service';
import { useToast } from '@/components/ui/use-toast';
import type { ServiceZone } from '@/types/zone';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ServiceZoneStats {
  id: number;
  name: string;
  counts: {
    servicePersons: number;
    customers: number;
    tickets: number;
    activeTickets: number;
  };
  recentTickets: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    customer: {
      id: number;
      companyName: string | null;
    };
  }>;
}

export default function ServiceZoneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [zone, setZone] = useState<ServiceZone | null>(null);
  const [stats, setStats] = useState<ServiceZoneStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const zoneId = params?.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    const fetchZoneData = async () => {
      if (!zoneId) return;
      
      setIsLoading(true);
      try {
        const [zoneData, statsData] = await Promise.all([
          getServiceZone(zoneId),
          getServiceZoneStats(zoneId)
        ]);
        
        setZone(zoneData);
        setStats(statsData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch service zone details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchZoneData();
  }, [zoneId, toast]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'in_progress':
      case 'pending_parts':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading service zone details...</p>
      </div>
    );
  }

  if (!zone || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Service zone not found</p>
        <Button onClick={() => router.push('/admin/service-zones')}>
          Back to Service Zones
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/admin/service-zones')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{zone.name}</h1>
            <p className="text-muted-foreground">Service Zone Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={zone.isActive ? 'default' : 'secondary'}>
            {zone.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button onClick={() => router.push(`/admin/service-zones/${zone.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Persons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.servicePersons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.customers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.activeTickets}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Information */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm">{zone.name}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{zone.description || 'No description provided'}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{new Date(zone.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Service Persons */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Service Persons ({zone.servicePersons?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {zone.servicePersons && zone.servicePersons.length > 0 ? (
              <div className="space-y-2">
                {zone.servicePersons.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{person.user.name || person.user.email}</p>
                      <p className="text-sm text-muted-foreground">{person.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No service persons assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets ({stats.recentTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">#{ticket.id}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {ticket.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {ticket.customer.companyName || `Customer #${ticket.customer.id}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm capitalize">
                          {ticket.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getPriorityColor(ticket.priority)}
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No recent tickets</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
