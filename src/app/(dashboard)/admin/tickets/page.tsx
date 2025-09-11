"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/axios';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, RefreshCw, List, AlertCircle, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Ticket, TicketStatus, Priority } from '@/types/ticket';
import { AssignTicketDialog } from '@/components/tickets/AssignTicketDialog';

type ApiResponse = {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'assignedToZone'>('all');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 30,
    view: 'all',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 30,
    totalPages: 1,
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
        ...(activeTab === 'unassigned' && { view: 'unassigned' }),
        ...(activeTab === 'assignedToZone' && { view: 'assigned-to-zone' }),
      });

      const response = await api.get(`/tickets?${queryParams}`);
      const data: ApiResponse = response.data;
      setTickets(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tickets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters.page, filters.status, filters.priority, filters.limit, activeTab]);

  const handleAssignSuccess = async () => {
    await fetchTickets();
    setAssignDialogOpen(false);
    setSelectedTicketId(null);
  };

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      
      // Refresh the tickets list
      await fetchTickets();
      
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'default';
      case TicketStatus.ASSIGNED:
        return 'secondary';
      case TicketStatus.IN_PROCESS:
        return 'default';
      case TicketStatus.ONSITE_VISIT_PLANNED:
        return 'outline';
      case TicketStatus.ONSITE_VISIT:
        return 'default';
      case TicketStatus.CLOSED_PENDING:
        return 'secondary';
      case TicketStatus.CLOSED:
        return 'secondary';
      case TicketStatus.SPARE_PARTS_NEEDED:
        return 'outline';
      case TicketStatus.SPARE_PARTS_BOOKED:
        return 'secondary';
      case TicketStatus.SPARE_PARTS_DELIVERED:
        return 'default';
      case TicketStatus.PO_NEEDED:
        return 'outline';
      case TicketStatus.PO_RECEIVED:
        return 'secondary';
      case TicketStatus.CLOSED:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'outline';
      case Priority.MEDIUM:
        return 'secondary';
      case Priority.HIGH:
        return 'default';
      case Priority.CRITICAL:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-muted-foreground">Manage and track all support tickets</p>
          </div>
          <Button onClick={() => router.push('/admin/tickets/create')}>
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </div>
        
        <div className="flex space-x-2 border-b">
          <Button
            variant={activeTab === 'all' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className={`rounded-none border-b-2 ${activeTab === 'all' ? 'border-primary' : 'border-transparent'}`}
          >
            <List className="mr-2 h-4 w-4" />
            All Tickets
          </Button>
          <Button
            variant={activeTab === 'unassigned' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('unassigned')}
            className={`rounded-none border-b-2 ${activeTab === 'unassigned' ? 'border-primary' : 'border-transparent'}`}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Unassigned
          </Button>
          <Button
            variant={activeTab === 'assignedToZone' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('assignedToZone')}
            className={`rounded-none border-b-2 ${activeTab === 'assignedToZone' ? 'border-primary' : 'border-transparent'}`}
          >
            <Users className="mr-2 h-4 w-4" />
            Assigned to Zone Users
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="w-full pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROCESS">In Process</SelectItem>
                  <SelectItem value="ONSITE_VISIT_PLANNED">Onsite Visit Planned</SelectItem>
                  <SelectItem value="ONSITE_VISIT">Onsite Visit</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED_PENDING">Closed Pending</SelectItem>
                  <SelectItem value="SPARE_PARTS_NEEDED">Spare Parts Needed</SelectItem>
                  <SelectItem value="SPARE_PARTS_BOOKED">Spare Parts Booked</SelectItem>
                  <SelectItem value="SPARE_PARTS_DELIVERED">Spare Parts Delivered</SelectItem>
                  <SelectItem value="PO_NEEDED">PO Needed</SelectItem>
                  <SelectItem value="PO_RECEIVED">PO Received</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value, page: 1 })}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={fetchTickets}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading tickets...
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/tickets/${ticket.id}/list`)}
                    >
                      <TableCell className="font-medium">
                        <a 
                          href={`/admin/tickets/${ticket.id}/list`} 
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ticket.id}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`/admin/tickets/${ticket.id}/list`} 
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ticket.title}
                        </a>
                      </TableCell>
                      <TableCell>
                        {ticket.customer?.companyName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`/admin/tickets/${ticket.id}/list`} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status.replace(/_/g, ' ')}
                          </Badge>
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/tickets/${ticket.id}/list`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
                disabled={filters.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <TicketViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        ticket={selectedTicket!}
        onStatusChange={handleStatusChange}
      />

      {selectedTicketId !== null && (
        <AssignTicketDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          ticketId={selectedTicketId}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}

// Placeholder components - these would be implemented in separate files
function TicketViewDialog({ open, onOpenChange, ticket, onStatusChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
  onStatusChange: (ticketId: number, newStatus: TicketStatus) => Promise<void>;
}) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Ticket #{ticket.id}</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              &times;
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Title:</span> {ticket.title}</p>
                <p><span className="font-medium">Status:</span> {ticket.status}</p>
                <p><span className="font-medium">Priority:</span> {ticket.priority}</p>
                <p><span className="font-medium">Created:</span> {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                {ticket.assignedTo && (
                  <p><span className="font-medium">Assigned To:</span> {ticket.assignedTo.email}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Company:</span> {ticket.customer?.companyName || 'N/A'}</p>
                <p><span className="font-medium">Contact:</span> {ticket.customer?.contactName || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {ticket.customer?.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {ticket.customer?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded">
              {ticket.description}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              variant="default" 
              onClick={() => onStatusChange(ticket.id, TicketStatus.IN_PROCESS)}
              disabled={ticket.status === TicketStatus.IN_PROCESS}
            >
              Start Work
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => onStatusChange(ticket.id, TicketStatus.ASSIGNED)}
              disabled={ticket.status === TicketStatus.ASSIGNED}
            >
              Assign
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => onStatusChange(ticket.id, TicketStatus.CLOSED_PENDING)}
              disabled={ticket.status === TicketStatus.CLOSED_PENDING || ticket.status === TicketStatus.CLOSED}
            >
              Resolve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
