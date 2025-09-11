'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Zap,
  Pause,
  Play,
  FileText
} from 'lucide-react';

type StatusOption = {
  value: string;
  label: string;
  isDestructive?: boolean;
  requiresComment?: boolean;
};

// Define TicketStatus enum to match Prisma schema exactly
export const TicketStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROCESS: 'IN_PROCESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  ONSITE_VISIT: 'ONSITE_VISIT',
  ONSITE_VISIT_PLANNED: 'ONSITE_VISIT_PLANNED',
  PO_NEEDED: 'PO_NEEDED',
  PO_RECEIVED: 'PO_RECEIVED',
  SPARE_PARTS_NEEDED: 'SPARE_PARTS_NEEDED',
  SPARE_PARTS_BOOKED: 'SPARE_PARTS_BOOKED',
  SPARE_PARTS_DELIVERED: 'SPARE_PARTS_DELIVERED',
  CLOSED_PENDING: 'CLOSED_PENDING',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  REOPENED: 'REOPENED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  PENDING: 'PENDING'
} as const;

type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

// Define valid status transitions based on backend logic
const validTransitions: Record<TicketStatusType, TicketStatusType[]> = {
  // Initial state - can be assigned or moved to pending
  [TicketStatus.OPEN]: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED, TicketStatus.PENDING],
  
  // Assigned state - can start working on it or schedule onsite visit
  [TicketStatus.ASSIGNED]: [
    TicketStatus.IN_PROCESS, 
    TicketStatus.ONSITE_VISIT, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Main working state - multiple possible next steps
  [TicketStatus.IN_PROCESS]: [
    TicketStatus.WAITING_CUSTOMER, 
    TicketStatus.ONSITE_VISIT,
    TicketStatus.PO_NEEDED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.CLOSED_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.RESOLVED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.ON_HOLD,
    TicketStatus.ESCALATED,
    TicketStatus.PENDING
  ],
  
  // Waiting for customer response
  [TicketStatus.WAITING_CUSTOMER]: [
    TicketStatus.IN_PROCESS, 
    TicketStatus.CLOSED_PENDING, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Onsite visit flow
  [TicketStatus.ONSITE_VISIT]: [
    TicketStatus.ONSITE_VISIT_PLANNED, 
    TicketStatus.IN_PROCESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.ONSITE_VISIT_PLANNED]: [
    TicketStatus.IN_PROCESS,
    TicketStatus.PO_NEEDED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.CLOSED_PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.PENDING
  ],
  
  // Purchase order flow
  [TicketStatus.PO_NEEDED]: [
    TicketStatus.PO_RECEIVED, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  [TicketStatus.PO_RECEIVED]: [
    TicketStatus.IN_PROCESS, 
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
    TicketStatus.IN_PROCESS, 
    TicketStatus.CANCELLED, 
    TicketStatus.PENDING
  ],
  
  // Closed pending and final states
  [TicketStatus.CLOSED_PENDING]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [], // Final state - no transitions out
  [TicketStatus.CANCELLED]: [], // Final state - no transitions out
  
  // Additional states
  [TicketStatus.REOPENED]: [TicketStatus.ASSIGNED, TicketStatus.IN_PROCESS, TicketStatus.PENDING],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.IN_PROCESS, TicketStatus.ON_HOLD, TicketStatus.ESCALATED, TicketStatus.PENDING],
  [TicketStatus.ON_HOLD]: [TicketStatus.IN_PROCESS, TicketStatus.IN_PROGRESS, TicketStatus.PENDING],
  [TicketStatus.ESCALATED]: [TicketStatus.IN_PROCESS, TicketStatus.IN_PROGRESS, TicketStatus.PENDING],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.PENDING],
  [TicketStatus.PENDING]: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROCESS]
};

const statusLabels: Record<TicketStatusType, string> = {
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.ASSIGNED]: 'Assigned',
  [TicketStatus.IN_PROCESS]: 'In Process',
  [TicketStatus.WAITING_CUSTOMER]: 'Waiting for Customer',
  [TicketStatus.ONSITE_VISIT]: 'Onsite Visit',
  [TicketStatus.ONSITE_VISIT_PLANNED]: 'Onsite Visit Planned',
  [TicketStatus.PO_NEEDED]: 'PO Needed',
  [TicketStatus.PO_RECEIVED]: 'PO Received',
  [TicketStatus.SPARE_PARTS_NEEDED]: 'Spare Parts Needed',
  [TicketStatus.SPARE_PARTS_BOOKED]: 'Spare Parts Booked',
  [TicketStatus.SPARE_PARTS_DELIVERED]: 'Spare Parts Delivered',
  [TicketStatus.CLOSED_PENDING]: 'Pending Closure',
  [TicketStatus.CLOSED]: 'Closed',
  [TicketStatus.CANCELLED]: 'Cancelled',
  [TicketStatus.REOPENED]: 'Reopened',
  [TicketStatus.IN_PROGRESS]: 'In Progress',
  [TicketStatus.ON_HOLD]: 'On Hold',
  [TicketStatus.ESCALATED]: 'Escalated',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.PENDING]: 'Pending'
};

type StatusChangeDialogProps = {
  isOpen: boolean;
  currentStatus: TicketStatusType;
  onClose: () => void;
  onStatusChange: (status: TicketStatusType, comments?: string) => Promise<void>;
};

export function StatusChangeDialog({ 
  isOpen, 
  currentStatus, 
  onClose, 
  onStatusChange 
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType | ''>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get valid status options based on current status
  const statusOptions = useMemo(() => {
    const validStatuses = validTransitions[currentStatus] || [];
    return validStatuses.map(status => ({
      value: status,
      label: statusLabels[status] || status.replace(/_/g, ' '),
      isDestructive: ['CANCELLED', 'CLOSED', 'ESCALATED'].includes(status),
      requiresComment: ['CANCELLED', 'CLOSED', 'RESOLVED', 'ESCALATED', 'ON_HOLD'].includes(status)
    }));
  }, [currentStatus]);

  const selectedOption = selectedStatus ? statusOptions.find(opt => opt.value === selectedStatus) : null;
  const showComments = selectedOption?.requiresComment;

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    if (!Object.values(TicketStatus).includes(selectedStatus as TicketStatusType)) {
      console.error('Invalid status selected');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onStatusChange(selectedStatus, comments || undefined);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setComments('');
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'ESCALATED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'ON_HOLD':
        return <Pause className="h-4 w-4" />;
      case 'IN_PROGRESS':
      case 'IN_PROCESS':
        return <Play className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'text-green-600';
      case 'CANCELLED':
        return 'text-red-600';
      case 'ESCALATED':
        return 'text-orange-600';
      case 'ON_HOLD':
        return 'text-yellow-600';
      case 'IN_PROGRESS':
      case 'IN_PROCESS':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
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
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={`py-3 ${option.isDestructive ? 'text-destructive' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(option.value)}>
                        {getStatusIcon(option.value)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {option.requiresComment && (
                          <span className="text-xs text-muted-foreground">Requires comment</span>
                        )}
                      </div>
                      {option.isDestructive && (
                        <Badge variant="destructive" className="ml-auto text-xs">Critical</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview of selected status */}
          {selectedStatus && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={getStatusColor(selectedStatus)}>
                    {getStatusIcon(selectedStatus)}
                  </div>
                  <div>
                    <p className="font-medium">New Status: {statusLabels[selectedStatus]}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOption?.isDestructive ? 'This action cannot be undone' : 'Status will be updated immediately'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-3">
              <Label htmlFor="comments" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {selectedStatus === 'CLOSED' ? 'Resolution Details' : 
                 selectedStatus === 'CANCELLED' ? 'Cancellation Reason' :
                 selectedStatus === 'ESCALATED' ? 'Escalation Details' :
                 selectedStatus === 'ON_HOLD' ? 'Hold Reason' : 'Additional Notes'}
                {selectedStatus === 'CLOSED' && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  selectedStatus === 'CLOSED' 
                    ? 'Describe how the issue was resolved...' 
                    : selectedStatus === 'CANCELLED'
                    ? 'Explain why this ticket is being cancelled...'
                    : selectedStatus === 'ESCALATED'
                    ? 'Provide escalation details and next steps...'
                    : selectedStatus === 'ON_HOLD'
                    ? 'Explain why this ticket is being put on hold...'
                    : 'Add any relevant notes or comments...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full resize-none"
                required={selectedStatus === 'CLOSED'}
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
            disabled={!selectedStatus || isSubmitting || (showComments && !comments.trim())}
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
