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

// Activity types with enhanced metadata
const ACTIVITY_TYPES = [
  { 
    value: "TICKET_WORK", 
    label: "Ticket Work", 
    icon: "🎫",
    color: "bg-blue-100 text-blue-800",
    stages: ['STARTED', 'WORK_IN_PROGRESS', 'TESTING', 'DOCUMENTATION', 'COMPLETED']
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
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [stageNotes, setStageNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Filter active activities (those without endTime)
    const active = activities.filter(activity => !activity.endTime);
    setActiveActivities(active);
  }, [activities]);

  const getActivityType = (type: string) => {
    return ACTIVITY_TYPES.find(at => at.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  };

  const getCurrentStage = (activity: Activity): string => {
    if (!activity.ActivityStage || activity.ActivityStage.length === 0) {
      return 'STARTED';
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
    return sortedStages[0]?.stage || 'STARTED';
  };

  const getNextAvailableStages = (activity: Activity): string[] => {
    const activityType = getActivityType(activity.activityType);
    const currentStage = getCurrentStage(activity);
    const currentIndex = activityType.stages.indexOf(currentStage);
    
    if (currentIndex === -1) return activityType.stages;
    
    // Return next stages and option to complete current stage
    const nextStages = activityType.stages.slice(currentIndex + 1);
    return nextStages;
  };

  const handleStageTransition = async (activity: Activity, newStage: string) => {
    setSelectedActivity(activity);
    setSelectedStage(newStage);
    setShowStageDialog(true);
  };

  const confirmStageTransition = async () => {
    if (!selectedActivity || !selectedStage) return;

    setLoading(true);
    try {
      // Get current location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude}, ${position.coords.longitude}`
          };
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      }

      // Complete current stage if exists
      const currentStage = getCurrentStage(selectedActivity);
      if (currentStage && selectedActivity.ActivityStage) {
        const activeStageRecord = selectedActivity.ActivityStage.find(stage => 
          stage.stage === currentStage && !stage.endTime
        );
        
        if (activeStageRecord) {
          const updateResponse = await apiClient.patch(`/activities/${selectedActivity.id}/stages/${activeStageRecord.id}`, {
            endTime: new Date().toISOString(),
            notes: stageNotes || undefined,
            ...(location && {
              latitude: location.latitude,
              longitude: location.longitude,
              location: location.address
            })
          });
          console.log('Stage update response:', updateResponse);
        }
      }

      // Start new stage
      const newStageResponse = await apiClient.post(`/activities/${selectedActivity.id}/stages`, {
        stage: selectedStage,
        startTime: new Date().toISOString(),
        notes: stageNotes || undefined,
        ...(location && {
          latitude: location.latitude,
          longitude: location.longitude,
          location: location.address
        })
      });
      console.log('New stage creation response:', newStageResponse);

      // If this is the COMPLETED stage, also end the activity
      if (selectedStage === 'COMPLETED') {
        const activityEndResponse = await apiClient.patch(`/activities/${selectedActivity.id}`, {
          endTime: new Date().toISOString(),
          ...(location && {
            latitude: location.latitude,
            longitude: location.longitude,
            location: location.address
          })
        });
        console.log('Activity end response:', activityEndResponse);
      }

      toast({
        title: "Stage Updated",
        description: `Activity stage changed to ${STAGE_DEFINITIONS[selectedStage]?.label || selectedStage}`,
      });

      // Reset dialog state first
      setShowStageDialog(false);
      setSelectedActivity(null);
      setSelectedStage('');
      setStageNotes('');

      // Refresh data - let the parent component handle timing
      if (onActivityChange) {
        console.log('ActivityStatusManager: Calling onActivityChange callback after stage update');
        onActivityChange();
      } else {
        console.warn('ActivityStatusManager: onActivityChange callback is not provided');
      }

    } catch (error) {
      console.error('Error updating activity stage:', error);
      toast({
        title: "Error",
        description: "Failed to update activity stage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                      {currentStage !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedActivity(activity)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Stage Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{activityType.stages.indexOf(currentStage) + 1} / {activityType.stages.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((activityType.stages.indexOf(currentStage) + 1) / activityType.stages.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Activity Status Selection Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Update Activity Status</span>
              <Badge variant="outline" className="ml-2">
                {selectedActivity && `#${selectedActivity.id}`}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-6">
              {/* Activity Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{selectedActivity.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Activity Type:</span> {getActivityType(selectedActivity.activityType).label}
                  </div>
                  <div>
                    <span className="font-medium">Started:</span> {new Date(selectedActivity.startTime).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Current Status:</span> 
                    {(() => {
                      const currentStage = getCurrentStage(selectedActivity);
                      const stageInfo = STAGE_DEFINITIONS[currentStage];
                      return (
                        <Badge variant="outline" className="ml-1">
                          {stageInfo?.icon} {stageInfo?.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  {selectedActivity.location && (
                    <div>
                      <span className="font-medium">Location:</span> 
                      <span className="ml-1 text-xs">{selectedActivity.location.length > 30 ? selectedActivity.location.substring(0, 30) + '...' : selectedActivity.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select New Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const activityType = getActivityType(selectedActivity.activityType);
                    const currentStage = getCurrentStage(selectedActivity);
                    const nextStages = getNextAvailableStages(selectedActivity);
                    
                    // Add complete option if not already completed and not already in nextStages
                    const allOptions = currentStage !== 'COMPLETED' && !nextStages.includes('COMPLETED') 
                      ? [...nextStages, 'COMPLETED'] 
                      : nextStages;
                    
                    return allOptions.map((stage) => {
                      const stageInfo = STAGE_DEFINITIONS[stage];
                      const requiresLocation = ['TRAVELING', 'ARRIVED', 'ONSITE_VISIT', 'EXECUTION', 'TESTING', 'CUSTOMER_HANDOVER'].includes(stage);
                      
                      return (
                        <button
                          key={stage}
                          onClick={() => {
                            setSelectedStage(stage);
                            setShowStageDialog(true);
                          }}
                          className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            selectedStage === stage
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{stageInfo?.icon}</span>
                            <span className="font-medium text-sm">{stageInfo?.label}</span>
                            {requiresLocation && (
                              <MapPin className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{stageInfo?.description}</p>
                          {requiresLocation && (
                            <p className="text-xs text-blue-600 mt-1">📍 Location will be captured</p>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Transition Confirmation Dialog */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Confirm Status Update
            </DialogTitle>
            <DialogDescription>
              {selectedActivity && selectedStage && (
                <>
                  Update <strong>{selectedActivity.title}</strong> to <strong>{STAGE_DEFINITIONS[selectedStage]?.label || selectedStage}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Status Preview */}
            {selectedStage && STAGE_DEFINITIONS[selectedStage] && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <span className="text-lg">{STAGE_DEFINITIONS[selectedStage].icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">{STAGE_DEFINITIONS[selectedStage].label}</div>
                    <div className="text-sm text-blue-700">{STAGE_DEFINITIONS[selectedStage].description}</div>
                  </div>
                </div>
                
                {/* Location Indicator */}
                {['TRAVELING', 'ARRIVED', 'ONSITE_VISIT', 'EXECUTION', 'TESTING', 'CUSTOMER_HANDOVER'].includes(selectedStage) && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-blue-100 rounded">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Your location will be automatically captured</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder={`Add notes about ${STAGE_DEFINITIONS[selectedStage]?.label?.toLowerCase() || 'this status change'}...`}
                rows={3}
                className="w-full"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStageDialog(false);
                  setSelectedStage('');
                  setStageNotes('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStageTransition}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
