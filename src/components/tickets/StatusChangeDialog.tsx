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
import { UserRole } from '@/types/user.types';

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

export type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

// Simple status options based on user role
const getAvailableStatuses = (userRole?: UserRole): TicketStatusType[] => {
  const baseStatuses = [
    TicketStatus.OPEN,
    TicketStatus.ASSIGNED,
    TicketStatus.IN_PROCESS,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_CUSTOMER,
    TicketStatus.ONSITE_VISIT,
    TicketStatus.ONSITE_VISIT_PLANNED,
    TicketStatus.PO_NEEDED,
    TicketStatus.PO_RECEIVED,
    TicketStatus.SPARE_PARTS_NEEDED,
    TicketStatus.SPARE_PARTS_BOOKED,
    TicketStatus.SPARE_PARTS_DELIVERED,
    TicketStatus.RESOLVED,
    TicketStatus.ON_HOLD,
    TicketStatus.ESCALATED,
    TicketStatus.PENDING,
    TicketStatus.CANCELLED,
    TicketStatus.CLOSED_PENDING
  ];

  // Only admin can set to CLOSED
  if (userRole === UserRole.ADMIN) {
    return [...baseStatuses, TicketStatus.CLOSED];
  }

  return baseStatuses;
};

type StatusChangeDialogProps = {
  isOpen: boolean;
  currentStatus: TicketStatusType;
  userRole?: UserRole;
  onClose: () => void;
  onStatusChange: (status: TicketStatusType, comments?: string) => Promise<void>;
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

  // Get available status options based on user role
  const statusOptions = useMemo(() => {
    const availableStatuses = getAvailableStatuses(userRole);
    
    // Filter out current status from options
    const filteredStatuses = availableStatuses.filter(status => status !== currentStatus);
    
    return filteredStatuses.map(status => ({
      value: status,
      label: status.replace(/_/g, ' '),
      isDestructive: ['CANCELLED', 'CLOSED', 'ESCALATED'].includes(status),
      requiresComment: ['CANCELLED', 'CLOSED', 'RESOLVED', 'ESCALATED', 'ON_HOLD'].includes(status)
    }));
  }, [currentStatus, userRole]);

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
      case TicketStatus.IN_PROCESS:
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
      case TicketStatus.IN_PROCESS:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
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
              <SelectContent className="max-h-[500px] overflow-y-auto">
                {statusOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={`py-2.5 px-3 ${option.isDestructive ? 'text-destructive' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={getStatusColor(option.value)}>
                        {getStatusIcon(option.value)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{option.label}</span>
                        {option.requiresComment && (
                          <span className="text-xs text-muted-foreground block">Requires comment</span>
                        )}
                      </div>
                      {option.isDestructive && (
                        <Badge variant="destructive" className="ml-2 text-xs px-2 py-0">Critical</Badge>
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
                    <p className="font-medium">New Status: {selectedStatus.replace(/_/g, ' ')}</p>
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
                {selectedStatus === TicketStatus.CLOSED ? 'Resolution Details' : 
                 selectedStatus === TicketStatus.CANCELLED ? 'Cancellation Reason' :
                 selectedStatus === TicketStatus.ESCALATED ? 'Escalation Details' :
                 selectedStatus === TicketStatus.ON_HOLD ? 'Hold Reason' : 'Additional Notes'}
                {selectedStatus === TicketStatus.CLOSED && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  selectedStatus === TicketStatus.CLOSED 
                    ? 'Describe how the issue was resolved...' 
                    : selectedStatus === TicketStatus.CANCELLED
                    ? 'Explain why this ticket is being cancelled...'
                    : selectedStatus === TicketStatus.ESCALATED
                    ? 'Provide escalation details and next steps...'
                    : selectedStatus === TicketStatus.ON_HOLD
                    ? 'Explain why this ticket is being put on hold...'
                    : 'Add any relevant notes or comments...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full resize-none"
                required={selectedStatus === TicketStatus.CLOSED}
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
