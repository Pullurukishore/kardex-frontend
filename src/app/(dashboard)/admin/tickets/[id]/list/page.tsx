"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  UserPlus,
  Wrench,
  Pencil
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Ticket } from '@/types/ticket';
import api from '@/lib/api/axios';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { TicketActivity } from '@/components/tickets/TicketActivity';
import { TicketComments } from '@/components/tickets/TicketComments';
import { TicketDetails } from '@/components/tickets/TicketDetails';
import { AssignTicketDialog } from '@/components/tickets/AssignTicketDialog';
import { StatusChangeDialog } from '@/components/tickets/StatusChangeDialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED' | 'PENDING' | 'ASSIGNED' | 'REOPENED' | 'ON_HOLD';

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        toast({
          title: 'Error',
          description: 'Failed to load ticket details',
          variant: 'destructive',
        });
        router.push('/admin/tickets');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTicket();
    }
  }, [id, router, toast]);

  const handleStatusChange = async (status: string, comments?: string) => {
    if (!ticket) return;
    
    try {
      await api.patch(`/tickets/${ticket.id}/status`, { 
        status,
        comments: comments || `Status changed to ${status}`
      });
      
      await fetchTicketDetails();
      
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleAssignToUser = async (userId: string, note: string) => {
    if (!ticket) return;
    
    try {
      await api.patch(`/tickets/${ticket.id}/assign`, { 
        assignedToId: parseInt(userId),
        note 
      });
      
      // Update ticket status to ASSIGNED if it's not already
      if (ticket.status !== 'ASSIGNED') {
        await api.patch(`/tickets/${ticket.id}/status`, { 
          status: 'ASSIGNED',
          comments: 'Ticket assigned to service person'
        });
      }
      
      // Refresh ticket data
      await fetchTicketDetails();
      
      toast({
        title: 'Success',
        description: 'Ticket assigned successfully',
      });
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign ticket';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p>{loading ? 'Loading ticket details...' : 'Ticket not found'}</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <span className="sr-only">Go back</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={ticket.status} />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md" 
                        onClick={() => setIsStatusDialogOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Change Status
                      </Button>
                    </div>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(ticket.createdAt))} ago
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{ticket.description}</p>
                </div>

                {ticket.contact && (
                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>{ticket.contact.name}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                          <rect width="20" height="16" x="2" y="4" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                        <span>{ticket.contact.email}</span>
                      </div>
                      {ticket.contact.phone && (
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          <span>{ticket.contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ticket.asset && (
                  <div>
                    <h3 className="font-medium mb-2">Asset Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Machine ID:</span>
                        <span>{ticket.asset.machineId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span>{ticket.asset.model}</span>
                      </div>
                      {ticket.asset.serialNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serial Number:</span>
                          <span>{ticket.asset.serialNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TicketActivity ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Details</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={activeTab === 'details' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('details')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  <Button 
                    variant={activeTab === 'comments' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('comments')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'details' ? (
 <TicketDetails ticket={ticket} onStatusChange={async (status) => {
                  try {
                    await api.patch(`/tickets/${ticket.id}`, { status });
                    setTicket({ ...ticket, status });
                  } catch (error) {
                    console.error('Error updating status:', error);
                  }
                }} />
              ) : (
                <TicketComments ticketId={ticket.id} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Ticket #{ticket.id}
                  </h1>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className="text-sm text-muted-foreground">
                      Created on {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

            <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Assignment</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Assigned To</span>
                  <div className="flex items-center">
                    {ticket.assignedTo ? (
                      <>
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback>
                            {ticket.assignedTo.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{ticket.assignedTo.name || ticket.assignedTo.email}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Zone</span>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    {ticket.zone?.name || 'No zone assigned'}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created By</span>
                  <span>{ticket.owner?.email || 'System'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</div>
                <Button 
                  onClick={() => {
                    // Open dialog for zone user assignment
                    setIsAssignDialogOpen(true);
                  }}
                  disabled={!ticket}
                  variant="outline"
                  className="w-full justify-start h-12 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 mr-3 transition-colors">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Assign to Zone User</div>
                      <div className="text-xs text-emerald-600 opacity-80">Delegate to zone coordinator</div>
                    </div>
                  </div>
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      // Directly open service person selection
                      const servicePersons = await api.get('/service-persons');
                      if (servicePersons.data.length === 0) {
                        toast({
                          title: 'No Service Persons',
                          description: 'There are no service persons available for assignment',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setIsAssignDialogOpen(true);
                    } catch (error) {
                      console.error('Error fetching service persons:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to load service persons. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={!ticket}
                  variant="outline"
                  className="w-full justify-start h-12 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full bg-blue-100 group-hover:bg-blue-200 mr-3 transition-colors">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Assign to Service Person</div>
                      <div className="text-xs text-blue-600 opacity-80">Send to field technician</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.statusHistory?.length ? (
                  <div className="space-y-3">
                    {ticket.statusHistory.slice(0, 5).map((history, index) => (
                      <div key={history.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-background flex items-center justify-center border">
                          {index === 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {history.changedBy?.name?.charAt(0) || history.changedBy?.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {history.changedBy?.name || history.changedBy?.email?.split('@')[0] || 'Unknown User'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {history.changedBy?.role?.replace('_', ' ').toLowerCase() || 'user'}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            Changed status to <StatusBadge status={history.status} />
                          </p>
                          {history.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              "{history.notes}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No status history available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignTicketDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        ticketId={ticket.id}
        onSuccess={fetchTicketDetails}
        zoneId={ticket.zone?.id}
      />
      
      <StatusChangeDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        currentStatus={ticket.status}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
