'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api/api-client';
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Zap,
  Pause,
  Play,
  FileText,
  MapPin,
  Navigation
} from 'lucide-react';
import { UserRole } from '@/types/user.types';

type StatusOption = {
  value: string;
  label: string;
  shortLabel: string;
  category: string;
  description: string;
  isDestructive?: boolean;
  requiresComment?: boolean;
};

// Define TicketStatus enum to match Prisma schema exactly
export const TicketStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROCESS: 'IN_PROCESS', // Note: Backend uses IN_PROGRESS but schema has IN_PROCESS
  IN_PROGRESS: 'IN_PROGRESS', // Controller uses this instead of IN_PROCESS
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  ONSITE_VISIT: 'ONSITE_VISIT',
  ONSITE_VISIT_PLANNED: 'ONSITE_VISIT_PLANNED',
  ONSITE_VISIT_STARTED: 'ONSITE_VISIT_STARTED',
  ONSITE_VISIT_REACHED: 'ONSITE_VISIT_REACHED',
  ONSITE_VISIT_IN_PROGRESS: 'ONSITE_VISIT_IN_PROGRESS',
  ONSITE_VISIT_RESOLVED: 'ONSITE_VISIT_RESOLVED',
  ONSITE_VISIT_PENDING: 'ONSITE_VISIT_PENDING',
  ONSITE_VISIT_COMPLETED: 'ONSITE_VISIT_COMPLETED',
  PO_NEEDED: 'PO_NEEDED',
  PO_REACHED: 'PO_REACHED',
  PO_RECEIVED: 'PO_RECEIVED',
  SPARE_PARTS_NEEDED: 'SPARE_PARTS_NEEDED',
  SPARE_PARTS_BOOKED: 'SPARE_PARTS_BOOKED',
  SPARE_PARTS_DELIVERED: 'SPARE_PARTS_DELIVERED',
  CLOSED_PENDING: 'CLOSED_PENDING',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  REOPENED: 'REOPENED',
  ON_HOLD: 'ON_HOLD',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  PENDING: 'PENDING'
} as const;

export type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

// Valid status transitions based on backend business logic
const validTransitions: Record<TicketStatusType, TicketStatusType[]> = {
  // Initial state - can be assigned or moved to pending
  [TicketStatus.OPEN]: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED, TicketStatus.PENDING],
  
  // Assigned state - can start working on it or schedule onsite visit
  [TicketStatus.ASSIGNED]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.ONSITE_VISIT, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // IN_PROCESS (legacy) - same as IN_PROGRESS
  [TicketStatus.IN_PROCESS]: [
    TicketStatus.WAITING_CUSTOMER, 
    TicketStatus.ONSITE_VISIT,
    TicketStatus.PO_NEEDED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.CLOSED_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.RESOLVED,
    TicketStatus.ON_HOLD,
    TicketStatus.ESCALATED,
    TicketStatus.PENDING
  ],
  
  // Main working state - multiple possible next steps
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.WAITING_CUSTOMER, 
    TicketStatus.ONSITE_VISIT,
    TicketStatus.PO_NEEDED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.CLOSED_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.RESOLVED,
    TicketStatus.ON_HOLD,
    TicketStatus.ESCALATED,
    TicketStatus.PENDING
  ],
  
  // Waiting for customer response
  [TicketStatus.WAITING_CUSTOMER]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.ONSITE_VISIT,
    TicketStatus.CLOSED_PENDING, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Onsite visit flow - comprehensive lifecycle
  [TicketStatus.ONSITE_VISIT]: [
    TicketStatus.ONSITE_VISIT_PLANNED, 
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_PLANNED]: [
    TicketStatus.ONSITE_VISIT_STARTED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_STARTED]: [
    TicketStatus.ONSITE_VISIT_REACHED,
    TicketStatus.ONSITE_VISIT_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_REACHED]: [
    TicketStatus.ONSITE_VISIT_IN_PROGRESS,
    TicketStatus.ONSITE_VISIT_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_IN_PROGRESS]: [
    TicketStatus.ONSITE_VISIT_RESOLVED,
    TicketStatus.ONSITE_VISIT_PENDING,
    TicketStatus.PO_NEEDED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_RESOLVED]: [
    TicketStatus.ONSITE_VISIT_COMPLETED,
    TicketStatus.CLOSED_PENDING,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_PENDING]: [
    TicketStatus.ONSITE_VISIT_IN_PROGRESS,
    TicketStatus.ONSITE_VISIT_COMPLETED,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_COMPLETED]: [
    TicketStatus.CLOSED_PENDING,
    TicketStatus.IN_PROGRESS,
    TicketStatus.PENDING
  ],
  
  // Purchase order flow
  [TicketStatus.PO_NEEDED]: [
    TicketStatus.PO_REACHED,
    TicketStatus.PO_RECEIVED, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.PO_REACHED]: [
    TicketStatus.PO_RECEIVED,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  [TicketStatus.PO_RECEIVED]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Spare parts flow
  [TicketStatus.SPARE_PARTS_NEEDED]: [
    TicketStatus.SPARE_PARTS_BOOKED, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.SPARE_PARTS_BOOKED]: [
    TicketStatus.SPARE_PARTS_DELIVERED, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.SPARE_PARTS_DELIVERED]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Closing flow
  [TicketStatus.CLOSED_PENDING]: [
    TicketStatus.CLOSED, 
    TicketStatus.REOPENED, 
    TicketStatus.PENDING
  ],
  
  // Final state - no transitions out except REOPENED
  [TicketStatus.CLOSED]: [
    TicketStatus.REOPENED
  ],
  
  // Cancelled state - can be reopened
  [TicketStatus.CANCELLED]: [
    TicketStatus.REOPENED, 
    TicketStatus.PENDING
  ],
  
  // Reopened ticket - goes back to assigned or in process
  [TicketStatus.REOPENED]: [
    TicketStatus.ASSIGNED, 
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // On hold state - temporarily paused
  [TicketStatus.ON_HOLD]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  // Escalated state - needs attention
  [TicketStatus.ESCALATED]: [
    TicketStatus.IN_PROGRESS, 
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  // Resolved state - ready for closing
  [TicketStatus.RESOLVED]: [
    TicketStatus.CLOSED, 
    TicketStatus.REOPENED, 
    TicketStatus.PENDING
  ],
  
  // Pending state - initial or temporary state
  [TicketStatus.PENDING]: [
    TicketStatus.OPEN, 
    TicketStatus.ASSIGNED, 
    TicketStatus.IN_PROGRESS
  ]
};

// Get available status transitions based on current status and user role
const getAvailableStatuses = (currentStatus: TicketStatusType, userRole?: UserRole): TicketStatusType[] => {
  const availableTransitions = validTransitions[currentStatus] || [];
  
  // Filter based on user role permissions
  return availableTransitions.filter(status => {
    // Only admin can set to CLOSED
    if (status === TicketStatus.CLOSED && userRole !== UserRole.ADMIN) {
      return false;
    }
    return true;
  });
};

type LocationData = {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
};

type StatusChangeDialogProps = {
  isOpen: boolean;
  currentStatus: TicketStatusType;
  userRole?: UserRole;
  onClose: () => void;
  onStatusChange: (status: TicketStatusType, comments?: string, location?: LocationData) => Promise<void>;
};

export function StatusChangeDialog({ 
  isOpen, 
  currentStatus, 
  userRole,
  onClose, 
  onStatusChange 
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType | ''>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, address?: string} | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Check if status requires location capture (onsite visit statuses)
  const requiresLocation = (status: TicketStatusType): boolean => {
    const onsiteStatuses: TicketStatusType[] = [
      TicketStatus.ONSITE_VISIT_STARTED,
      TicketStatus.ONSITE_VISIT_REACHED,
      TicketStatus.ONSITE_VISIT_IN_PROGRESS,
      TicketStatus.ONSITE_VISIT_RESOLVED,
      TicketStatus.ONSITE_VISIT_COMPLETED
    ];
    return onsiteStatuses.includes(status);
  };

  // Capture current location
  const captureLocation = async (): Promise<void> => {
    setIsCapturingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000, // Increased timeout for better accuracy
          maximumAge: 0 // No cache - always get fresh location
        });
      });
      
      console.log('StatusChangeDialog GPS Accuracy:', position.coords.accuracy, 'meters');
      
      // Check if accuracy is good enough (less than 30 meters)
      if (position.coords.accuracy > 30) {
        console.warn('StatusChangeDialog: GPS accuracy is poor:', position.coords.accuracy, 'meters');
      }

      const { latitude, longitude } = position.coords;
      
      // Try to get address from coordinates using backend geocoding service
      let address = '';
      try {
        console.log('StatusChangeDialog: Calling backend geocoding service...');
        const response = await apiClient.get(`/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`);
        
        if (response.data?.success && response.data?.data?.address) {
          address = response.data.data.address;
          console.log('StatusChangeDialog: Backend geocoding successful:', address);
        } else {
          console.log('StatusChangeDialog: Backend geocoding returned no address');
        }
      } catch (geocodeError) {
        console.warn('StatusChangeDialog: Backend geocoding failed:', geocodeError);
      }

      setCurrentLocation({
        lat: latitude,
        lng: longitude,
        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    } catch (error) {
      console.error('Error capturing location:', error);
      alert('Failed to capture location. Please ensure location services are enabled.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // Auto-capture location when onsite visit status is selected
  useEffect(() => {
    if (selectedStatus && requiresLocation(selectedStatus) && !currentLocation) {
      captureLocation();
    }
  }, [selectedStatus]);

  // Add custom CSS for better scrolling support
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .status-dropdown-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgb(203 213 225) transparent;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
      }
      
      .status-dropdown-scroll::-webkit-scrollbar {
        width: 8px;
      }
      
      .status-dropdown-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .status-dropdown-scroll::-webkit-scrollbar-thumb {
        background-color: rgb(203 213 225);
        border-radius: 4px;
      }
      
      .status-dropdown-scroll::-webkit-scrollbar-thumb:hover {
        background-color: rgb(148 163 184);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Status display mapping for shorter, cleaner names
  const getStatusDisplayInfo = (status: TicketStatusType) => {
    const statusMap: Record<TicketStatusType, { label: string; shortLabel: string; category: string; description: string }> = {
      [TicketStatus.OPEN]: { label: 'Open', shortLabel: 'Open', category: 'Basic', description: 'Ticket is open and awaiting assignment' },
      [TicketStatus.ASSIGNED]: { label: 'Assigned', shortLabel: 'Assigned', category: 'Basic', description: 'Assigned to a technician' },
      [TicketStatus.IN_PROCESS]: { label: 'In Process', shortLabel: 'In Process', category: 'Basic', description: 'Work is being processed' },
      [TicketStatus.IN_PROGRESS]: { label: 'In Progress', shortLabel: 'In Progress', category: 'Basic', description: 'Work is currently being done' },
      [TicketStatus.WAITING_CUSTOMER]: { label: 'Waiting Customer', shortLabel: 'Wait Customer', category: 'Basic', description: 'Waiting for customer response' },
      [TicketStatus.RESOLVED]: { label: 'Resolved', shortLabel: 'Resolved', category: 'Completion', description: 'Issue has been resolved' },
      [TicketStatus.CLOSED]: { label: 'Closed', shortLabel: 'Closed', category: 'Completion', description: 'Ticket is closed and complete' },
      [TicketStatus.CLOSED_PENDING]: { label: 'Pending Closure', shortLabel: 'Pending Close', category: 'Completion', description: 'Awaiting admin approval to close' },
      [TicketStatus.ONSITE_VISIT]: { label: 'Onsite Visit', shortLabel: 'Onsite', category: 'Onsite', description: 'Requires onsite visit' },
      [TicketStatus.ONSITE_VISIT_PLANNED]: { label: 'Visit Planned', shortLabel: 'Visit Planned', category: 'Onsite', description: 'Onsite visit is scheduled' },
      [TicketStatus.ONSITE_VISIT_STARTED]: { label: 'Visit Started', shortLabel: 'Visit Started', category: 'Onsite', description: 'Technician started journey' },
      [TicketStatus.ONSITE_VISIT_REACHED]: { label: 'Visit Reached', shortLabel: 'Reached Site', category: 'Onsite', description: 'Technician reached location (auto-transitions to In Progress)' },
      [TicketStatus.ONSITE_VISIT_IN_PROGRESS]: { label: 'Visit In Progress', shortLabel: 'Work Onsite', category: 'Onsite', description: 'Work in progress at site' },
      [TicketStatus.ONSITE_VISIT_RESOLVED]: { label: 'Visit Resolved', shortLabel: 'Site Resolved', category: 'Onsite', description: 'Onsite work completed' },
      [TicketStatus.ONSITE_VISIT_PENDING]: { label: 'Visit Pending', shortLabel: 'Site Pending', category: 'Onsite', description: 'Onsite visit paused' },
      [TicketStatus.ONSITE_VISIT_COMPLETED]: { label: 'Visit Completed', shortLabel: 'Site Complete', category: 'Onsite', description: 'Returned from site' },
      [TicketStatus.PO_NEEDED]: { label: 'PO Needed', shortLabel: 'PO Needed', category: 'Purchase', description: 'Purchase order required' },
      [TicketStatus.PO_REACHED]: { label: 'PO Reached', shortLabel: 'PO Reached', category: 'Purchase', description: 'Purchase order delivered' },
      [TicketStatus.PO_RECEIVED]: { label: 'PO Received', shortLabel: 'PO Received', category: 'Purchase', description: 'Purchase order received' },
      [TicketStatus.SPARE_PARTS_NEEDED]: { label: 'Parts Needed', shortLabel: 'Parts Needed', category: 'Parts', description: 'Spare parts required' },
      [TicketStatus.SPARE_PARTS_BOOKED]: { label: 'Parts Booked', shortLabel: 'Parts Booked', category: 'Parts', description: 'Spare parts ordered' },
      [TicketStatus.SPARE_PARTS_DELIVERED]: { label: 'Parts Delivered', shortLabel: 'Parts Ready', category: 'Parts', description: 'Spare parts delivered' },
      [TicketStatus.ON_HOLD]: { label: 'On Hold', shortLabel: 'On Hold', category: 'Special', description: 'Ticket temporarily paused' },
      [TicketStatus.ESCALATED]: { label: 'Escalated', shortLabel: 'Escalated', category: 'Special', description: 'Escalated to higher level' },
      [TicketStatus.PENDING]: { label: 'Pending', shortLabel: 'Pending', category: 'Special', description: 'Awaiting further action' },
      [TicketStatus.CANCELLED]: { label: 'Cancelled', shortLabel: 'Cancelled', category: 'Special', description: 'Ticket has been cancelled' },
      [TicketStatus.REOPENED]: { label: 'Reopened', shortLabel: 'Reopened', category: 'Special', description: 'Previously closed ticket reopened' }
    };
    return statusMap[status] || { label: status.replace(/_/g, ' '), shortLabel: status.replace(/_/g, ' '), category: 'Other', description: '' };
  };

  // Get available status options based on current status and user role
  const statusOptions = useMemo(() => {
    const availableStatuses = getAvailableStatuses(currentStatus, userRole);
    
    return availableStatuses.map(status => {
      const displayInfo = getStatusDisplayInfo(status);
      return {
        value: status,
        label: displayInfo.label,
        shortLabel: displayInfo.shortLabel,
        category: displayInfo.category,
        description: displayInfo.description,
        isDestructive: ['CANCELLED', 'CLOSED', 'ESCALATED'].includes(status),
        requiresComment: ['CANCELLED', 'CLOSED', 'CLOSED_PENDING', 'RESOLVED', 'ESCALATED', 'ON_HOLD', 'ONSITE_VISIT_PLANNED'].includes(status)
      };
    });
  }, [currentStatus, userRole]);

  const selectedOption = selectedStatus ? statusOptions.find(opt => opt.value === selectedStatus) : null;
  const showComments = selectedOption?.requiresComment;

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    if (!Object.values(TicketStatus).includes(selectedStatus as TicketStatusType)) {
      console.error('Invalid status selected');
      return;
    }

    // Check if location is required but not captured
    if (requiresLocation(selectedStatus) && !currentLocation) {
      alert('Location is required for onsite visit statuses. Please allow location access.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare location data if required
      const locationData: LocationData | undefined = requiresLocation(selectedStatus) && currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            address: currentLocation.address,
            timestamp: new Date().toISOString()
          }
        : undefined;

      // Call onStatusChange with location data
      await onStatusChange(selectedStatus, comments || undefined, locationData);
      
      // Auto-transition from ONSITE_VISIT_REACHED to ONSITE_VISIT_IN_PROGRESS
      if (selectedStatus === TicketStatus.ONSITE_VISIT_REACHED) {
        try {
          // Wait a moment for the first status change to be processed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Automatically transition to in progress
          await onStatusChange(
            TicketStatus.ONSITE_VISIT_IN_PROGRESS, 
            'Automatically transitioned to in progress after reaching site',
            locationData
          );
        } catch (error) {
          console.error('Error in automatic status transition:', error);
          // Don't show error to user as the main status change was successful
        }
      }
      
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setComments('');
    setCurrentLocation(null);
    setIsCapturingLocation(false);
    onClose();
  };

  const getStatusIcon = (status: TicketStatusType) => {
    switch (status) {
      case TicketStatus.RESOLVED:
      case TicketStatus.CLOSED:
        return <CheckCircle className="h-4 w-4" />;
      case TicketStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      case TicketStatus.ESCALATED:
        return <AlertTriangle className="h-4 w-4" />;
      case TicketStatus.ON_HOLD:
        return <Pause className="h-4 w-4" />;
      case TicketStatus.IN_PROGRESS:
        return <Play className="h-4 w-4" />;
      case TicketStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatusType) => {
    switch (status) {
      case TicketStatus.RESOLVED:
      case TicketStatus.CLOSED:
        return 'text-green-600';
      case TicketStatus.CANCELLED:
        return 'text-red-600';
      case TicketStatus.ESCALATED:
        return 'text-orange-600';
      case TicketStatus.ON_HOLD:
        return 'text-yellow-600';
      case TicketStatus.IN_PROGRESS:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Update Ticket Status
          </DialogTitle>
          <DialogDescription>
            Change the current status of this ticket. Some status changes may require additional information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status Card */}
          <Card className="border-2 border-muted">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                  <div className="flex items-center gap-2">
                    <div className={`${getStatusColor(currentStatus)}`}>
                      {getStatusIcon(currentStatus)}
                    </div>
                    <StatusBadge status={currentStatus} />
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label htmlFor="status" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select New Status
            </Label>
            <Select 
              value={selectedStatus}
              onValueChange={(value: string) => setSelectedStatus(value as TicketStatusType)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full h-12 text-left">
                <SelectValue placeholder="Choose a new status..." />
              </SelectTrigger>
              <SelectContent 
                className="max-h-[60vh] min-w-[400px] overflow-y-scroll overscroll-contain"
                position="popper"
                sideOffset={4}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                <div 
                  className="max-h-[55vh] status-dropdown-scroll"
                  style={{ 
                    touchAction: 'pan-y',
                    overflowY: 'scroll'
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {/* Group options by category */}
                  {['Basic', 'Onsite', 'Purchase', 'Parts', 'Completion', 'Special'].map(category => {
                    const categoryOptions = statusOptions.filter(option => option.category === category);
                    if (categoryOptions.length === 0) return null;
                    
                    return (
                      <div key={category} className="mb-2">
                        {/* Category Header */}
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b sticky top-0 z-10">
                          📋 {category} Status
                        </div>
                        
                        {/* Category Options */}
                        <div className="py-1">
                          {categoryOptions.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              className={`py-3 px-3 mx-1 my-0.5 rounded-md cursor-pointer hover:bg-accent/80 focus:bg-accent ${option.isDestructive ? 'text-destructive hover:text-destructive' : ''}`}
                            >
                              <div className="flex items-center gap-3 w-full min-w-0">
                                <div className={`${getStatusColor(option.value)} flex-shrink-0`}>
                                  {getStatusIcon(option.value)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-sm">{option.shortLabel}</span>
                                    {option.isDestructive && (
                                      <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4 flex-shrink-0">!</Badge>
                                    )}
                                    {option.requiresComment && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 flex-shrink-0">Note</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground block leading-tight">{option.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Preview of selected status */}
          {selectedStatus && selectedOption && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={getStatusColor(selectedStatus)}>
                    {getStatusIcon(selectedStatus)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">New Status: {selectedOption.shortLabel}</p>
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                        {selectedOption.category}
                      </Badge>
                      {selectedStatus === TicketStatus.ONSITE_VISIT_REACHED && (
                        <Badge variant="secondary" className="text-xs px-2 py-0 h-5 bg-blue-100 text-blue-700">
                          Auto-Transition
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedOption.description}
                    </p>
                    {selectedStatus === TicketStatus.ONSITE_VISIT_REACHED && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Will automatically change to "Visit In Progress" after reaching site
                        </p>
                      </div>
                    )}
                    {selectedOption.isDestructive && (
                      <p className="text-xs text-destructive mt-1 font-medium">
                        ⚠️ This action cannot be undone
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Capture Section for Onsite Visit Statuses */}
          {selectedStatus && requiresLocation(selectedStatus) && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-blue-900">Location Required</p>
                    <Badge variant="secondary" className="text-xs">Onsite Visit</Badge>
                  </div>
                  
                  {isCapturingLocation ? (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Navigation className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Capturing location...</span>
                    </div>
                  ) : currentLocation ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Location captured successfully</span>
                      </div>
                      <div className="bg-white p-3 rounded-md border">
                        <p className="text-sm font-medium text-gray-900">📍 {currentLocation.address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Time: {new Date().toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={captureLocation}
                        className="text-xs"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Recapture Location
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        Location is required for onsite visit tracking. Click below to capture your current location.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={captureLocation}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Capture Location
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-3">
              <Label htmlFor="comments" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {selectedStatus === TicketStatus.CLOSED ? 'Resolution Summary' : 
                 selectedStatus === TicketStatus.CLOSED_PENDING ? 'Resolution Summary' :
                 selectedStatus === TicketStatus.CANCELLED ? 'Cancellation Reason' :
                 selectedStatus === TicketStatus.ESCALATED ? 'Escalation Details' :
                 selectedStatus === TicketStatus.RESOLVED ? 'Resolution Summary' :
                 selectedStatus === TicketStatus.ON_HOLD ? 'Hold Reason' :
                 selectedStatus === TicketStatus.ONSITE_VISIT_PLANNED ? 'Visit Planning Details' : 'Additional Notes'}
                {(selectedStatus === TicketStatus.CLOSED || selectedStatus === TicketStatus.CLOSED_PENDING || selectedStatus === TicketStatus.RESOLVED || selectedStatus === TicketStatus.ONSITE_VISIT_PLANNED) && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  selectedStatus === TicketStatus.CLOSED 
                    ? 'Provide detailed resolution summary: What was the issue? How was it fixed? What parts were used? Any follow-up required?' 
                    : selectedStatus === TicketStatus.CLOSED_PENDING
                    ? 'Provide detailed resolution summary: What was the issue? How was it fixed? What parts were used? Any follow-up required?'
                    : selectedStatus === TicketStatus.RESOLVED
                    ? 'Provide detailed resolution summary: What was the issue? How was it fixed? What parts were used? Any follow-up required?'
                    : selectedStatus === TicketStatus.CANCELLED
                    ? 'Explain why this ticket is being cancelled...'
                    : selectedStatus === TicketStatus.ESCALATED
                    ? 'Provide escalation details and next steps...'
                    : selectedStatus === TicketStatus.ON_HOLD
                    ? 'Explain why this ticket is being put on hold...'
                    : selectedStatus === TicketStatus.ONSITE_VISIT_PLANNED
                    ? 'Provide visit planning details: When is the visit scheduled? Who will visit? What equipment/parts are needed? Customer contact details? Special instructions or access requirements?'
                    : 'Add any relevant notes or comments...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full resize-none"
                required={selectedStatus === TicketStatus.CLOSED || selectedStatus === TicketStatus.CLOSED_PENDING || selectedStatus === TicketStatus.RESOLVED || selectedStatus === TicketStatus.ONSITE_VISIT_PLANNED}
              />
              <p className="text-xs text-muted-foreground">
                {comments.length}/500 characters
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange}
            disabled={!selectedStatus || isSubmitting || (showComments && !comments.trim()) || 
              ((selectedStatus === TicketStatus.CLOSED || selectedStatus === TicketStatus.CLOSED_PENDING || selectedStatus === TicketStatus.RESOLVED || selectedStatus === TicketStatus.ONSITE_VISIT_PLANNED) && !comments.trim()) ||
              (requiresLocation(selectedStatus) && !currentLocation)}
            variant={selectedOption?.isDestructive ? 'destructive' : 'default'}
            className="px-6 font-medium"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
