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
  Pencil,
  ArrowLeft,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/axios';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROCESS' | 'WAITING_CUSTOMER' | 'ONSITE_VISIT' | 
  'ONSITE_VISIT_PLANNED' | 'PO_NEEDED' | 'PO_RECEIVED' | 'SPARE_PARTS_NEEDED' | 
  'SPARE_PARTS_BOOKED' | 'SPARE_PARTS_DELIVERED' | 'CLOSED_PENDING' | 'CLOSED' | 
  'CANCELLED' | 'REOPENED' | 'IN_PROGRESS' | 'ON_HOLD' | 'ESCALATED' | 'RESOLVED' | 'PENDING';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ServicePerson {
  id: number;
  email: string;
  serviceZones: Array<{
    serviceZone: {
      id: number;
      name: string;
    };
  }>;
}

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
    address?: string;
  };
  contact?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  asset?: {
    id: number;
    machineId: string;
    model: string;
    serialNo?: string;
    location?: string;
    status: string;
  };
  assignedTo?: ServicePerson;
  owner?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  zone?: {
    id: number;
    name: string;
  };
  statusHistory?: Array<{
    id: number;
    status: TicketStatus;
    changedAt: string;
    notes?: string;
    changedBy?: {
      id: number;
      email: string;
      name?: string;
      role?: string;
    };
  }>;
};

export default function ZoneTicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('OPEN');
  const [statusComments, setStatusComments] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [servicePersons, setServicePersons] = useState<ServicePerson[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load ticket details';
      
      // Check if it's an authentication/authorization error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this ticket',
          variant: 'destructive',
        });
        // Only redirect on auth errors
        setTimeout(() => router.push('/zone'), 2000);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        // Don't redirect on other errors, stay on page
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: TicketStatus, comments?: string) => {
    if (!ticket) return;
    
    try {
      setIsUpdatingStatus(true);
      await api.patch(`/tickets/${ticket.id}/status`, { 
        status: newStatus,
        comments: comments || `Status changed to ${newStatus}`
      });
      
      await fetchTicketDetails();
      
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });
      
      setIsStatusDialogOpen(false);
      setStatusComments('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update ticket status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignToUser = async (userId: string, note: string) => {
    if (!ticket) return;
    
    try {
      setIsAssigning(true);
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
      
      setIsAssignDialogOpen(false);
      setSelectedUserId('');
      setAssignNote('');
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign ticket';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchServicePersons = async () => {
    try {
      // First try the zone-specific service persons endpoint
      let response;
      try {
        response = await api.get('/zone-dashboard/service-persons');
        console.log('Zone service persons response:', response.data);
      } catch (zoneError) {
        console.log('Zone service persons endpoint failed, falling back to all service persons:', zoneError);
        response = await api.get('/service-persons');
        console.log('All service persons response:', response.data);
      }
      
      // Handle different response structures
      const servicePersonsData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
          ? response.data 
          : [];
          
      console.log('Processed service persons data:', servicePersonsData);
      setServicePersons(servicePersonsData);
      
      if (servicePersonsData.length === 0) {
        toast({
          title: 'No Service Persons',
          description: 'No service persons are available for assignment in your zone',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching service persons:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Failed to load service persons';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      // Don't redirect on error, just show the error
    }
  };

  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROCESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ONSITE_VISIT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CLOSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority: Priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loading ? 'Loading ticket details...' : 'Ticket not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="hover:bg-indigo-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id}</h1>
          <p className="text-gray-600">Zone Ticket Management</p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Ticket Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-xl text-gray-900">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusBadgeColor(ticket.status)} border`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`${getPriorityBadgeColor(ticket.priority)} border`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Created {formatDistanceToNow(new Date(ticket.createdAt))} ago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-600">{ticket.zone?.name || 'No Zone'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
                  </div>

                  {/* Customer Information */}
                  {ticket.customer && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4 text-indigo-600" />
                        Customer Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Company:</span>
                          <span className="font-medium">{ticket.customer.companyName}</span>
                        </div>
                        {ticket.customer.address && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-right max-w-xs">{ticket.customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {ticket.contact && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Contact Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {ticket.contact.name?.charAt(0) || ticket.contact.email?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="font-medium">{ticket.contact.name || ticket.contact.email?.split('@')[0] || 'Unknown Contact'}</div>
                            {ticket.contact.role && (
                              <div className="text-sm text-gray-600">{ticket.contact.role}</div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{ticket.contact.email}</span>
                          </div>
                          {ticket.contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{ticket.contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Asset Information */}
                  {ticket.asset && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-indigo-600" />
                        Asset Details
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Machine ID:</span>
                          <span className="font-medium">{ticket.asset.machineId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{ticket.asset.model}</span>
                        </div>
                        {ticket.asset.serialNo && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Serial Number:</span>
                            <span className="font-medium">{ticket.asset.serialNo}</span>
                          </div>
                        )}
                        {ticket.asset.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{ticket.asset.location}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className="text-xs">
                            {ticket.asset.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.statusHistory.slice(0, 5).map((history, index) => (
                      <div key={history.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          {index === 0 ? (
                            <CheckCircle className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-indigo-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
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
                          <p className="text-sm text-gray-700">
                            Changed status to{' '}
                            <Badge className={`${getStatusBadgeColor(history.status)} text-xs ml-1`}>
                              {history.status.replace(/_/g, ' ')}
                            </Badge>
                          </p>
                          {history.notes && (
                            <p className="text-xs text-gray-600 italic mt-1">
                              "{history.notes}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No activity history available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned To</h4>
                    {ticket.assignedTo ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {ticket.assignedTo?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {ticket.assignedTo?.email?.split('@')[0] || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-600">{ticket.assignedTo?.email || 'No email'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm p-3 bg-gray-50 rounded-lg">
                        Unassigned
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Created By</h4>
                    {ticket.owner ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            {ticket.owner.name?.charAt(0) || ticket.owner.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {ticket.owner.name || ticket.owner.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-600">{ticket.owner.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">System</div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
                  
                  {/* Status Change Button */}
                  <Button 
                    onClick={() => {
                      setSelectedStatus(ticket.status);
                      setIsStatusDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full justify-start h-12 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-full bg-blue-100 group-hover:bg-blue-200 mr-3 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Change Status</div>
                        <div className="text-xs text-blue-600 opacity-80">Update ticket status</div>
                      </div>
                    </div>
                  </Button>

                  {/* Assign to Service Person Button */}
                  <Button 
                    onClick={() => {
                      fetchServicePersons();
                      setIsAssignDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full justify-start h-12 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 mr-3 transition-colors">
                        <UserPlus className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Assign to Service Person</div>
                        <div className="text-xs text-emerald-600 opacity-80">Send to field technician</div>
                      </div>
                    </div>
                  </Button>
                  
                  {ticket.status === 'OPEN' && (
                    <Button 
                      onClick={() => handleStatusChange('IN_PROCESS', 'Started working on ticket')}
                      className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Start Work
                    </Button>
                  )}

                  {(ticket.status === 'IN_PROCESS' || ticket.status === 'ASSIGNED') && (
                    <Button 
                      onClick={() => handleStatusChange('ONSITE_VISIT', 'Scheduled onsite visit')}
                      variant="outline"
                      className="w-full justify-start hover:bg-purple-50 hover:border-purple-300"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Schedule Visit
                    </Button>
                  )}

                  {(ticket.status === 'IN_PROCESS' || ticket.status === 'ONSITE_VISIT') && (
                    <Button 
                      onClick={() => handleStatusChange('RESOLVED', 'Issue resolved')}
                      variant="outline"
                      className="w-full justify-start hover:bg-green-50 hover:border-green-300"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ticket Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ticket ID:</span>
                  <span className="font-medium">#{ticket.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{format(new Date(ticket.updatedAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zone:</span>
                  <span className="font-medium">{ticket.zone?.name || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Change Ticket Status</DialogTitle>
                <DialogDescription>
                  Update the status of ticket #{ticket?.id}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={(value: TicketStatus) => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[280px]" 
                  position="popper"
                  sideOffset={4}
                >
                  <div className="max-h-[280px] overflow-y-scroll overscroll-contain" style={{scrollbarWidth: 'thin'}}>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROCESS">In Process</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_CUSTOMER">Waiting Customer</SelectItem>
                    <SelectItem value="ONSITE_VISIT">Onsite Visit</SelectItem>
                    <SelectItem value="ONSITE_VISIT_PLANNED">Onsite Visit Planned</SelectItem>
                    <SelectItem value="PO_NEEDED">PO Needed</SelectItem>
                    <SelectItem value="PO_RECEIVED">PO Received</SelectItem>
                    <SelectItem value="SPARE_PARTS_NEEDED">Spare Parts Needed</SelectItem>
                    <SelectItem value="SPARE_PARTS_BOOKED">Spare Parts Booked</SelectItem>
                    <SelectItem value="SPARE_PARTS_DELIVERED">Spare Parts Delivered</SelectItem>
                    <SelectItem value="CLOSED_PENDING">Closed Pending</SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add a note about this status change..."
                value={statusComments}
                onChange={(e) => setStatusComments(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsStatusDialogOpen(false);
                setStatusComments('');
              }}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleStatusChange(selectedStatus, statusComments)}
              disabled={isUpdatingStatus}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isUpdatingStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Service Person Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Assign to Service Person</DialogTitle>
                <DialogDescription>
                  Assign ticket #{ticket?.id} to a service person
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servicePerson">Service Person</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service person" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[200px]" 
                  position="popper"
                  sideOffset={4}
                >
                  <div className="max-h-[200px] overflow-y-scroll overscroll-contain" style={{scrollbarWidth: 'thin'}}>
                    {servicePersons.map((person: ServicePerson) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {person.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{person.email.split('@')[0]}</div>
                            {person.serviceZones?.[0]?.serviceZone?.name && (
                              <div className="text-xs text-gray-500">{person.serviceZones[0].serviceZone.name}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignNote">Assignment Note (Optional)</Label>
              <Textarea
                id="assignNote"
                placeholder="Add a note for the assigned service person..."
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedUserId('');
                setAssignNote('');
              }}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleAssignToUser(selectedUserId, assignNote)}
              disabled={isAssigning || !selectedUserId}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
