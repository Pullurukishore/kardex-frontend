"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, RefreshCw, List, AlertCircle, Users, Clock, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import api from '@/lib/api/axios';

type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROCESS' | 'WAITING_CUSTOMER' | 'ONSITE_VISIT' | 
  'ONSITE_VISIT_PLANNED' | 'PO_NEEDED' | 'PO_RECEIVED' | 'SPARE_PARTS_NEEDED' | 
  'SPARE_PARTS_BOOKED' | 'SPARE_PARTS_DELIVERED' | 'CLOSED_PENDING' | 'CLOSED' | 
  'CANCELLED' | 'REOPENED' | 'IN_PROGRESS' | 'ON_HOLD' | 'ESCALATED' | 'RESOLVED' | 'PENDING';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    companyName: string;
  };
  assignedTo?: {
    id: number;
    email: string;
    name?: string;
  };
  zone?: {
    id: number;
    name: string;
  };
};

type ApiResponse = {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function ServicePersonTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 30,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 30,
    totalPages: 1,
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        assignedToMe: 'true',
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
        ...(activeTab === 'assigned' && { view: 'assigned' }),
        ...(activeTab === 'unassigned' && { view: 'unassigned' }),
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
  }, [filters, activeTab]);

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }));
  };

  const handlePriorityChange = (value: string) => {
    setFilters(prev => ({ ...prev, priority: value, page: 1 }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      OPEN: { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="h-4 w-4" /> },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
      RESOLVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
      CLOSED: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="h-4 w-4" /> },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
      ASSIGNED: { color: 'bg-purple-100 text-purple-800', icon: <Users className="h-4 w-4" /> },
      ONSITE_VISIT: { color: 'bg-orange-100 text-orange-800', icon: <MapPin className="h-4 w-4" /> },
    };

    const defaultStatus = { color: 'bg-gray-100 text-gray-800', icon: <List className="h-4 w-4" /> };
    const { color, icon } = statusMap[status] || defaultStatus;

    return (
      <Badge className={`inline-flex items-center gap-1 ${color}`}>
        {icon}
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={priorityMap[priority] || 'bg-gray-100 text-gray-800'}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Tickets</h1>
            <p className="text-blue-100">View and manage your assigned service tickets</p>
          </div>
          <Button 
            onClick={() => router.push('/service-person/tickets/create')}
            className="bg-white text-blue-700 hover:bg-blue-50 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="px-4 py-2"
        >
          All Tickets
        </Button>
        <Button
          variant={activeTab === 'assigned' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('assigned')}
          className="px-4 py-2"
        >
          Assigned to Me
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10 w-full sm:w-96"
                  value={filters.search}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 text-muted-foreground mr-2" />
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
              <Button variant="outline" size="icon" onClick={fetchTickets} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                        Loading tickets...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No tickets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>{ticket.customer?.companyName || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/service-person/tickets/${ticket.id}/list`)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}