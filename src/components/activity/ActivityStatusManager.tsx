'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  Activity,
  ArrowRight,
  Timer,
  Navigation,
  Settings,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import { StatusChangeDialog, TicketStatusType } from '@/components/tickets/StatusChangeDialog';
import { UserRole } from '@/types/user.types';

// Map TicketStatus to StageType (from Prisma schema)
const TICKET_STATUS_TO_STAGE_TYPE: Record<string, string> = {
  'IN_PROGRESS': 'WORK_IN_PROGRESS',
  'WAITING_CUSTOMER': 'WORK_IN_PROGRESS', // Customer interaction is still work
  'ONSITE_VISIT_STARTED': 'TRAVELING',
  'ONSITE_VISIT_REACHED': 'ARRIVED',
  'ONSITE_VISIT_IN_PROGRESS': 'WORK_IN_PROGRESS',
  'ONSITE_VISIT_RESOLVED': 'COMPLETED',
  'ONSITE_VISIT_COMPLETED': 'COMPLETED',
  'CLOSED_PENDING': 'COMPLETED',
  'CLOSED': 'COMPLETED',
  'RESOLVED': 'COMPLETED',
  'ASSIGNED': 'STARTED',
  'ON_HOLD': 'WORK_IN_PROGRESS'
};

// Activity types with enhanced metadata
const ACTIVITY_TYPES = [
  { 
    value: "TICKET_WORK",
    label: "Ticket Work", 
    icon: "🎫",
    color: "bg-blue-100 text-blue-800",
    stages: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'ONSITE_VISIT_STARTED', 'ONSITE_VISIT_REACHED', 'ONSITE_VISIT_IN_PROGRESS', 'ONSITE_VISIT_RESOLVED', 'ONSITE_VISIT_COMPLETED', 'CLOSED_PENDING']
  },
  { 
    value: "PO_DISCUSSION", 
    label: "PO Discussion", 
    icon: "💼",
    color: "bg-purple-100 text-purple-800",
    stages: ['STARTED', 'TRAVELING', 'ARRIVED', 'PLANNING', 'DOCUMENTATION', 'COMPLETED']
  },
  { 
    value: "SPARE_REPLACEMENT", 
    label: "Spare Replacement", 
    icon: "🔧",
    color: "bg-orange-100 text-orange-800",
    stages: ['STARTED', 'TRAVELING', 'ARRIVED', 'ASSESSMENT', 'EXECUTION', 'TESTING', 'CUSTOMER_HANDOVER', 'COMPLETED']
  },
  { 
    value: "TRAVEL", 
    label: "Travel", 
    icon: "🚗",
    color: "bg-green-100 text-green-800",
    stages: ['STARTED', 'TRAVELING', 'ARRIVED', 'COMPLETED']
  },
  { 
    value: "TRAINING", 
    label: "Training", 
    icon: "📚",
    color: "bg-indigo-100 text-indigo-800",
    stages: ['STARTED', 'PREPARATION', 'WORK_IN_PROGRESS', 'DOCUMENTATION', 'COMPLETED']
  },
  { 
    value: "REVIEW_MEETING", 
    label: "Review Meeting", 
    icon: "👥",
    color: "bg-pink-100 text-pink-800",
    stages: ['STARTED', 'TRAVELING', 'ARRIVED', 'PLANNING', 'DOCUMENTATION', 'COMPLETED']
  },
  { 
    value: "RELOCATION", 
    label: "Relocation", 
    icon: "📦",
    color: "bg-yellow-100 text-yellow-800",
    stages: ['STARTED', 'PREPARATION', 'TRAVELING', 'ARRIVED', 'EXECUTION', 'CLEANUP', 'COMPLETED']
  },
  { 
    value: "MAINTENANCE_PLANNED", 
    label: "Maintenance Planned", 
    icon: "🔧",
    color: "bg-teal-100 text-teal-800",
    stages: ['STARTED', 'PREPARATION', 'TRAVELING', 'ARRIVED', 'ASSESSMENT', 'EXECUTION', 'TESTING', 'CLEANUP', 'COMPLETED']
  },
  { 
    value: "INSTALLATION", 
    label: "Installation", 
    icon: "🔨",
    color: "bg-red-100 text-red-800",
    stages: ['STARTED', 'PREPARATION', 'TRAVELING', 'ARRIVED', 'PLANNING', 'EXECUTION', 'TESTING', 'CUSTOMER_HANDOVER', 'COMPLETED']
  },
  { 
    value: "DOCUMENTATION", 
    label: "Documentation", 
    icon: "📝",
    color: "bg-gray-100 text-gray-800",
    stages: ['STARTED', 'PREPARATION', 'WORK_IN_PROGRESS', 'DOCUMENTATION', 'COMPLETED']
  },
  { 
    value: "WORK_FROM_HOME", 
    label: "Work From Home", 
    icon: "🏠",
    color: "bg-emerald-100 text-emerald-800",
    stages: ['STARTED', 'WORK_IN_PROGRESS', 'COMPLETED']
  },
  { 
    value: "OTHER", 
    label: "Other", 
    icon: "📋",
    color: "bg-slate-100 text-slate-800",
    stages: ['STARTED', 'WORK_IN_PROGRESS', 'COMPLETED']
  },
];

// Stage definitions with enhanced metadata
const STAGE_DEFINITIONS: Record<string, { label: string; icon: string; color: string; description: string }> = {
  // Generic stages
  'STARTED': { label: 'Started', icon: '🚀', color: 'bg-blue-100 text-blue-800', description: 'Activity has begun' },
  'TRAVELING': { label: 'Traveling', icon: '🚗', color: 'bg-yellow-100 text-yellow-800', description: 'En route to location' },
  'ARRIVED': { label: 'Arrived', icon: '📍', color: 'bg-green-100 text-green-800', description: 'Reached destination' },
  'WORK_IN_PROGRESS': { label: 'In Progress', icon: '⚡', color: 'bg-orange-100 text-orange-800', description: 'Work is ongoing' },
  'COMPLETED': { label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-800', description: 'Activity finished' },
  'ASSESSMENT': { label: 'Assessment', icon: '🔍', color: 'bg-purple-100 text-purple-800', description: 'Evaluating situation' },
  'PLANNING': { label: 'Planning', icon: '📋', color: 'bg-indigo-100 text-indigo-800', description: 'Planning approach' },
  'EXECUTION': { label: 'Execution', icon: '🔧', color: 'bg-red-100 text-red-800', description: 'Executing the work' },
  'TESTING': { label: 'Testing', icon: '🧪', color: 'bg-cyan-100 text-cyan-800', description: 'Testing results' },
  'DOCUMENTATION': { label: 'Documentation', icon: '📝', color: 'bg-gray-100 text-gray-800', description: 'Documenting work' },
  'CUSTOMER_HANDOVER': { label: 'Customer Handover', icon: '🤝', color: 'bg-pink-100 text-pink-800', description: 'Handing over to customer' },
  'PREPARATION': { label: 'Preparation', icon: '🧰', color: 'bg-violet-100 text-violet-800', description: 'Preparing for work' },
  'CLEANUP': { label: 'Cleanup', icon: '🧹', color: 'bg-amber-100 text-amber-800', description: 'Cleaning up work area' },
  
  // Ticket-specific workflow stages (using actual TicketStatus enum values)
  'IN_PROGRESS': { label: 'Start Work', icon: '🔧', color: 'bg-blue-100 text-blue-800', description: 'Begin working on this ticket' },
  'ONSITE_VISIT_STARTED': { label: 'Travel to Site', icon: '🚗', color: 'bg-yellow-100 text-yellow-800', description: 'Traveling to customer location' },
  'ONSITE_VISIT_REACHED': { label: 'Arrived at Site', icon: '📍', color: 'bg-green-100 text-green-800', description: 'Reached customer location' },
  'ONSITE_VISIT_IN_PROGRESS': { label: 'Working Onsite', icon: '🔨', color: 'bg-orange-100 text-orange-800', description: 'Currently working at customer site' },
  'ONSITE_VISIT_RESOLVED': { label: 'Complete Work', icon: '✅', color: 'bg-green-100 text-green-800', description: 'Work completed at customer site' },
  'ONSITE_VISIT_COMPLETED': { label: 'Onsite Visit Completed', icon: '🏁', color: 'bg-green-100 text-green-800', description: 'Onsite visit has been completed' },
  'CLOSED_PENDING': { label: 'Closed Pending', icon: '⏳', color: 'bg-yellow-100 text-yellow-800', description: 'Ticket closed pending final confirmation' },
  'WAITING_CUSTOMER': { label: 'Waiting for Customer', icon: '⏳', color: 'bg-amber-100 text-amber-800', description: 'Waiting for customer response or availability' },
};

interface Activity {
  id: number;
  activityType: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  metadata?: any;
  ticketId?: number;
  ticket?: {
    id: number;
    title: string;
    status: string;
    priority: string;
  };
  ActivityStage?: ActivityStage[];
}

interface ActivityStage {
  id: number;
  stage: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  notes?: string;
}

interface ActivityStatusManagerProps {
  activities?: Activity[];
  onActivityChange?: () => void;
}

export default function ActivityStatusManager({ activities = [], onActivityChange }: ActivityStatusManagerProps) {
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [stageNotes, setStageNotes] = useState<string>('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [stageLocation, setStageLocation] = useState<{lat: number, lng: number, address?: string} | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Filter active activities (those without endTime, including WORK_FROM_HOME)
    const active = activities.filter(activity => !activity.endTime);
    setActiveActivities(active);
  }, [activities]);

  const getActivityType = (type: string) => {
    return ACTIVITY_TYPES.find(at => at.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  };

  const getCurrentStage = (activity: Activity): string => {
    if (!activity.ActivityStage || activity.ActivityStage.length === 0) {
      // Return appropriate starting stage based on activity type
      return activity.activityType === 'TICKET_WORK' ? 'IN_PROGRESS' : 'STARTED';
    }
    
    // Find the latest stage without endTime (current active stage)
    const activeStage = activity.ActivityStage.find(stage => !stage.endTime);
    if (activeStage) {
      return activeStage.stage;
    }
    
    // If all stages are completed, return the last one
    const sortedStages = activity.ActivityStage.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    return sortedStages[0]?.stage || (activity.activityType === 'TICKET_WORK' ? 'IN_PROGRESS' : 'STARTED');
  };

  const getNextAvailableStages = (activity: Activity): string[] => {
    const activityType = getActivityType(activity.activityType);
    const currentStage = getCurrentStage(activity);
    
    // For TICKET_WORK, show all available states (no restrictions)
    if (activity.activityType === 'TICKET_WORK') {
      // Return all stages except the current one and exclude final state if already reached
      return activityType.stages.filter(stage => 
        stage !== currentStage && 
        !(currentStage === 'CLOSED_PENDING' && stage === 'CLOSED_PENDING')
      );
    }
    
    // Default linear progression for other activity types
    const currentIndex = activityType.stages.indexOf(currentStage);
    if (currentIndex === -1) return activityType.stages;
    
    const nextStages = activityType.stages.slice(currentIndex + 1);
    return nextStages;
  };

  // Check if a stage requires location capture - ALL stages now require location
  const requiresLocation = (stage: string): boolean => {
    // All stages require location tracking for better activity monitoring
    return true;
  };

  const captureStageLocation = async (): Promise<void> => {
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

      const { latitude, longitude } = position.coords;
      console.log('Stage location GPS Accuracy:', position.coords.accuracy, 'meters');
      
      // Check if accuracy is good enough (less than 30 meters)
      if (position.coords.accuracy > 30) {
        console.warn('Stage location: GPS accuracy is poor:', position.coords.accuracy, 'meters');
      }
      
      // Try to get address from coordinates using backend geocoding service
      let address = '';
      try {
        console.log('Stage location: Calling backend geocoding service...');
        const response = await apiClient.get(`/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`);
        
        if (response.data?.success && response.data?.data?.address) {
          address = response.data.data.address;
          console.log('Stage location: Backend geocoding successful:', address);
        } else {
          console.log('Stage location: Backend geocoding returned no address');
        }
      } catch (geocodeError) {
        console.warn('Stage location: Backend geocoding failed:', geocodeError);
      }

      setStageLocation({ 
        lat: latitude, 
        lng: longitude, 
        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
      });
      
      toast({
        title: "Location Captured",
        description: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Stage location capture error:', error);
      toast({
        title: "Location Error",
        description: "Failed to capture location. Please ensure location services are enabled.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // Auto-capture location when location-required stage is selected
  useEffect(() => {
    if (selectedStage && requiresLocation(selectedStage) && !stageLocation && !isCapturingLocation) {
      console.log('Auto-capturing location for stage:', selectedStage);
      captureStageLocation();
    }
  }, [selectedStage]);

  const handleStageUpdate = async () => {
    if (!selectedActivity || !selectedStage) {
      console.error('No activity or stage selected');
      return;
    }

    // Check if location is required but not captured
    if (requiresLocation(selectedStage) && !stageLocation) {
      toast({
        title: "Location Required",
        description: "Location is required for this stage. Please allow location access.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingStage(true);

      // End current stage if exists
      const currentStage = getCurrentStage(selectedActivity);
      if (currentStage && selectedActivity.ActivityStage) {
        const activeStageObj = selectedActivity.ActivityStage.find(s => !s.endTime);
        if (activeStageObj) {
          await apiClient.put(`/activities/${selectedActivity.id}/stages/${activeStageObj.id}`, {
            endTime: new Date().toISOString()
          });
        }
      }

      // Prepare location data if captured
      const locationString = stageLocation 
        ? `${stageLocation.lat}, ${stageLocation.lng}`
        : undefined;

      // Create new stage
      await apiClient.post(`/activities/${selectedActivity.id}/stages`, {
        stage: selectedStage,
        notes: stageNotes || undefined,
        startTime: new Date().toISOString(),
        location: locationString,
        latitude: stageLocation?.lat,
        longitude: stageLocation?.lng
      });

      toast({
        title: "Stage Updated",
        description: `Activity stage changed to ${STAGE_DEFINITIONS[selectedStage]?.label || selectedStage}`,
      });

      // Close dialog and refresh
      setShowStageDialog(false);
      setSelectedActivity(null);
      setSelectedStage('');
      setStageNotes('');
      setStageLocation(null);

      // Refresh data
      if (onActivityChange) {
        setTimeout(() => {
          onActivityChange();
        }, 100);
      }
    } catch (error) {
      console.error('Error updating activity stage:', error);
      toast({
        title: "Error",
        description: "Failed to update activity stage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleStatusChange = async (status: TicketStatusType, comments?: string, location?: any) => {
    if (!selectedActivity) {
      console.error('No activity selected');
      return;
    }
    
    if (!selectedActivity.ticketId) {
      console.error('Activity has no associated ticket ID:', selectedActivity);
      toast({
        title: "Error",
        description: "This activity is not associated with a ticket. Cannot update status.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the same approach as admin and zone users - update ticket status directly
      const requestData = {
        status,
        comments: comments || `Status changed to ${status}`,
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp: location.timestamp || new Date().toISOString()
          }
        })
      };

      console.log('ActivityStatusManager: Updating ticket status with data:', requestData);
      console.log('ActivityStatusManager: Ticket ID:', selectedActivity.ticketId);

      // Update ticket status using the same endpoint as admin/zone users
      const response = await apiClient.patch(`/tickets/${selectedActivity.ticketId}/status`, requestData);
      console.log('Ticket status update response:', response);

      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${status}`,
      });

      // Close dialog and refresh data
      setShowStatusDialog(false);
      setSelectedActivity(null);

      // Refresh data - call parent callback immediately for UI responsiveness
      if (onActivityChange) {
        console.log('ActivityStatusManager: Calling onActivityChange callback after status update');
        // Add small delay to ensure backend processing is complete
        setTimeout(() => {
          onActivityChange();
        }, 100);
      } else {
        console.warn('ActivityStatusManager: onActivityChange callback is not provided');
      }

    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (activeActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Status Manager
          </CardTitle>
          <CardDescription>
            No active activities. Start an activity to manage its status and stages.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Activities ({activeActivities.length})
          </CardTitle>
          <CardDescription>
            Manage the status and stages of your ongoing activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeActivities.map((activity) => {
            const activityType = getActivityType(activity.activityType);
            const currentStage = getCurrentStage(activity);
            const nextStages = getNextAvailableStages(activity);
            const stageInfo = STAGE_DEFINITIONS[currentStage];

            return (
              <Card key={activity.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{activityType.icon}</span>
                        <Badge className={activityType.color}>
                          {activityType.label}
                        </Badge>
                        <Badge variant="outline" className={stageInfo?.color}>
                          {stageInfo?.icon} {stageInfo?.label}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1">{activity.title}</h3>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                      )}
                      
                      {/* Current Ticket Status */}
                      {activity.ticket && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Current Ticket Status:</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {activity.ticket.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {formatDuration(activity.startTime)}
                        </div>
                        {activity.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate max-w-32">{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Update Status button for TICKET_WORK activities */}
                      {activity.activityType === 'TICKET_WORK' && activity.ticketId && currentStage !== 'CLOSED_PENDING' && currentStage !== 'CLOSED' && currentStage !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowStatusDialog(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Update Status
                        </Button>
                      )}
                      
                      {/* Update Stage button for non-TICKET_WORK activities (excluding WORK_FROM_HOME) */}
                      {activity.activityType !== 'TICKET_WORK' && activity.activityType !== 'WORK_FROM_HOME' && currentStage !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowStageDialog(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Update Stage
                        </Button>
                      )}
                    </div>
                  </div>
                  
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Ticket Status Change Dialog */}
      <StatusChangeDialog
        isOpen={showStatusDialog}
        currentStatus={selectedActivity?.ticket?.status as TicketStatusType || 'IN_PROGRESS'}
        userRole={UserRole.SERVICE_PERSON}
        onClose={() => {
          setShowStatusDialog(false);
          setSelectedActivity(null);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Activity Stage Update Dialog */}
      <Dialog open={showStageDialog} onOpenChange={(open) => !open && setShowStageDialog(false)}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4 text-purple-600" />
              Update Stage
            </DialogTitle>
            <DialogDescription className="text-sm">
              Progress to next stage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Current Stage */}
            <div className="bg-muted p-2 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Stage</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{STAGE_DEFINITIONS[getCurrentStage(selectedActivity || {} as Activity)]?.icon}</span>
                <span className="font-semibold text-sm">
                  {STAGE_DEFINITIONS[getCurrentStage(selectedActivity || {} as Activity)]?.label}
                </span>
              </div>
            </div>

            {/* Next Stage Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Select Next Stage</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose next stage..." />
                </SelectTrigger>
                <SelectContent>
                  {getNextAvailableStages(selectedActivity || {} as Activity).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <div className="flex items-center gap-2">
                        <span>{STAGE_DEFINITIONS[stage]?.icon}</span>
                        <span>{STAGE_DEFINITIONS[stage]?.label || stage}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Notes (Optional)</label>
              <Textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Add notes about this stage..."
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Location Capture - Required for all stages */}
            {selectedStage && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">
                    Location (Required)
                  </label>
                  {!stageLocation && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureStageLocation}
                      disabled={isCapturingLocation}
                    >
                      {isCapturingLocation ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Capturing...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 mr-1" />
                          Capture Location
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Auto-capturing state for all stages */}
                {isCapturingLocation && (
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Navigation className="h-3 w-3 animate-spin" />
                      <span className="text-xs font-medium">Capturing location...</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Required for all stage updates</p>
                  </div>
                )}
                
                {/* Location captured with details */}
                {stageLocation && (
                  <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 text-green-700 mb-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">Location Captured</span>
                        </div>
                        <p className="text-xs text-green-800">📍 {stageLocation.address}</p>
                        <p className="text-xs text-green-600">
                          {stageLocation.lat.toFixed(4)}, {stageLocation.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-green-600">
                          Auto-captured for tracking
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {selectedStage && (
              <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <ArrowRight className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Next:</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm">{STAGE_DEFINITIONS[selectedStage]?.icon}</span>
                  <span className="text-xs font-semibold text-purple-900">
                    {STAGE_DEFINITIONS[selectedStage]?.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStageDialog(false);
                setSelectedActivity(null);
                setSelectedStage('');
                setStageNotes('');
                setStageLocation(null);
              }}
              disabled={isUpdatingStage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStageUpdate}
              disabled={!selectedStage || isUpdatingStage}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUpdatingStage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Stage
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
