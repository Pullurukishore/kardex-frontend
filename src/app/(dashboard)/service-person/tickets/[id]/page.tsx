"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  MessageSquare, 
  Activity,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Wrench,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Ticket } from '@/types/ticket';
import { apiClient } from '@/lib/api/api-client';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { TicketComments } from '@/components/tickets/TicketComments';
import { TicketStatusDialogWithLocation } from '@/components/tickets/TicketStatusDialogWithLocation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

type LocationData = {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
};

export default function ServicePersonTicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/tickets/${id}`);
      const ticketData = response.data || response;
      
      if (ticketData) {
        setTicket(ticketData);
        setStatusHistory(ticketData.statusHistory || []);
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    newStatus: string, 
    comment?: string, 
    location?: LocationData,
    activityData?: any
  ) => {
    try {
      // Update ticket status
      const statusPayload: any = { 
        status: newStatus,
        comments: comment || undefined
      };

      if (location) {
        statusPayload.location = location;
      }

      await apiClient.patch(`/tickets/${id}/status`, statusPayload);

      // Create activity log if provided
      if (activityData) {
        try {
          const activityPayload = {
            activityType: activityData.activityType,
            title: activityData.title,
            ticketId: parseInt(id as string),
            latitude: activityData.location?.latitude?.toString(),
            longitude: activityData.location?.longitude?.toString(),
            metadata: activityData.metadata ? JSON.stringify(activityData.metadata) : null,
            startTime: new Date().toISOString()
          };

          await apiClient.post('/activities', activityPayload);
        } catch (activityError) {
          console.error('Error creating activity log:', activityError);
          // Don't fail the status update if activity logging fails
        }
      }

      toast({
        title: 'Success',
        description: `Ticket status updated to ${newStatus.replace('_', ' ').toLowerCase()}`,
        variant: 'default'
      });

      // Refresh ticket data
      await fetchTicketDetails();

    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update ticket status',
        variant: 'destructive'
      });
    }
  };

  const addComment = async (content: string) => {
    try {
      await apiClient.post(`/tickets/${id}/comments`, { content });
      toast({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'default'
      });
      await fetchTicketDetails();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Ticket not found</p>
        <Link href="/service-person/dashboard">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/service-person/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
            <p className="text-gray-600">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <Button onClick={() => setIsStatusDialogOpen(true)}>
            <Wrench className="h-4 w-4 mr-2" />
            Update Status
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.description || 'No description provided'}
                  </p>
                </div>

                {ticket.errorDetails && (
                  <div>
                    <h4 className="font-medium mb-2">Error Details</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.errorDetails}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{ticket.customer?.companyName || 'N/A'}</span>
                      </div>
                      {ticket.contact && (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{ticket.contact.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{ticket.contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{ticket.contact.email}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Asset Information</h4>
                    {ticket.asset ? (
                      <div className="space-y-2">
                        <div><strong>Model:</strong> {ticket.asset.model}</div>
                        <div><strong>Serial:</strong> {ticket.asset.serialNumber}</div>
                        <div><strong>Location:</strong> {(ticket.asset as any).location || 'N/A'}</div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No asset information</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'comments' && (
            <TicketComments
              ticketId={parseInt(id as string)}
            />
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusHistory.length > 0 ? (
                    statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={history.status} />
                            <span className="text-sm text-gray-500">
                              {format(new Date(history.changedAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {history.changedBy && (
                            <p className="text-sm text-gray-600">
                              by {history.changedBy.name || history.changedBy.email}
                            </p>
                          )}
                          {history.note && (
                            <p className="text-sm text-gray-700 mt-1">{history.note}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No status history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium">
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <StatusBadge status={ticket.status} />
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned To</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {ticket.assignedTo.name?.charAt(0) || ticket.assignedTo.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {ticket.assignedTo.name || ticket.assignedTo.email}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setIsStatusDialogOpen(true)}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <TicketStatusDialogWithLocation
        ticket={ticket ? {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          customer: ticket.customer ? {
            companyName: ticket.customer.companyName
          } : undefined,
          asset: ticket.asset ? {
            serialNumber: ticket.asset.serialNumber || 'N/A',
            model: ticket.asset.model || 'N/A'
          } : undefined
        } : null}
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onStatusUpdate={() => {
          fetchTicketDetails();
          toast({
            title: 'Status Updated',
            description: 'Ticket status has been updated successfully'
          });
        }}
        accuracyThreshold={50}
      />
    </div>
  );
}
