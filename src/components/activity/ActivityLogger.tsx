'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Activity,
  Loader2,
  Calendar,
  User,
  FileText,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import api from '@/lib/api/axios';

interface ActivityLog {
  id: number;
  activityType: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  ticket?: {
    id: number;
    title: string;
    customer: {
      companyName: string;
    };
  };
}

const ACTIVITY_TYPES = [
  { value: 'TICKET_WORK', label: 'Ticket Work', icon: '🎫' },
  { value: 'BD_VISIT', label: 'BD Visit', icon: '🏢' },
  { value: 'PO_DISCUSSION', label: 'PO Discussion', icon: '💼' },
  { value: 'SPARE_REPLACEMENT', label: 'Spare Replacement', icon: '🔧' },
  { value: 'TRAVEL', label: 'Travel', icon: '🚗' },
  { value: 'TRAINING', label: 'Training', icon: '📚' },
  { value: 'MEETING', label: 'Meeting', icon: '👥' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: '⚙️' },
  { value: 'DOCUMENTATION', label: 'Documentation', icon: '📝' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
];

export function ActivityLogger() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeActivity, setActiveActivity] = useState<ActivityLog | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    activityType: '',
    title: '',
    description: '',
    location: '',
    ticketId: '',
  });

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities', {
        params: {
          limit: 10,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        },
      });
      setActivities(response.data.activities);
      
      // Find active activity (no end time)
      const active = response.data.activities.find((activity: ActivityLog) => !activity.endTime);
      setActiveActivity(active || null);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch activities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Start new activity
  const handleStartActivity = async () => {
    if (!formData.activityType || !formData.title) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Get current location
      let location = formData.location;
      if (navigator.geolocation && !location) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          });
          location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        } catch (error) {
          console.log('Could not get location:', error);
        }
      }

      const response = await api.post('/activities', {
        activityType: formData.activityType,
        title: formData.title,
        description: formData.description,
        location,
        ticketId: formData.ticketId ? parseInt(formData.ticketId) : undefined,
        startTime: new Date().toISOString(),
      });

      setActiveActivity(response.data.activity);
      setActivities(prev => [response.data.activity, ...prev]);
      
      // Reset form
      setFormData({
        activityType: '',
        title: '',
        description: '',
        location: '',
        ticketId: '',
      });
      setDialogOpen(false);

      toast({
        title: 'Activity Started',
        description: `Started "${formData.title}"`,
      });
    } catch (error: any) {
      console.error('Error starting activity:', error);
      
      // Handle specific check-in requirement error
      if (error.response?.data?.error === 'Check-in required') {
        toast({
          title: 'Check-in Required',
          description: error.response.data.message || 'You must check in before logging activities. Please check in first with your location.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to start activity',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // End active activity
  const handleEndActivity = async () => {
    if (!activeActivity) return;

    try {
      setSubmitting(true);
      
      const response = await api.put(`/activities/${activeActivity.id}`, {
        endTime: new Date().toISOString(),
      });

      setActiveActivity(null);
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activeActivity.id ? response.data.activity : activity
        )
      );

      toast({
        title: 'Activity Completed',
        description: `Completed "${activeActivity.title}" (${response.data.activity.duration} min)`,
      });
    } catch (error: any) {
      console.error('Error ending activity:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to end activity',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Ongoing';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get activity type info
  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type) || { label: type, icon: '📋' };
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={fetchActivities}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            {activeActivity && (
              <Button
                onClick={handleEndActivity}
                disabled={submitting}
                variant="destructive"
                size="sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                End Activity
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!!activeActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Log New Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="activityType">Activity Type *</Label>
                    <Select
                      value={formData.activityType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the activity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about the activity"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketId">Ticket ID (if applicable)</Label>
                    <Input
                      id="ticketId"
                      type="number"
                      value={formData.ticketId}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticketId: e.target.value }))}
                      placeholder="Enter ticket ID if this activity is related to a ticket"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location will be auto-detected if left empty"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartActivity}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Activity
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Activity */}
        {activeActivity && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                <span className="text-sm font-medium">{getActivityTypeInfo(activeActivity.activityType).icon}</span>
                <span className="text-sm font-medium">{getActivityTypeInfo(activeActivity.activityType).label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Started {new Date(activeActivity.startTime).toLocaleTimeString()}
              </span>
            </div>
            <h4 className="font-medium">{activeActivity.title}</h4>
            {activeActivity.description && (
              <p className="text-sm text-muted-foreground mt-1">{activeActivity.description}</p>
            )}
            {activeActivity.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[300px]" title={activeActivity.location}>
                  {activeActivity.location}
                </span>
              </div>
            )}
            {activeActivity.ticket && (
              <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                <FileText className="h-3 w-3" />
                <span>Ticket #{activeActivity.ticket.id}: {activeActivity.ticket.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Recent Activities */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Activities</h4>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities logged yet</p>
            </div>
          ) : (
            activities.filter(activity => activity.id !== activeActivity?.id).map((activity) => (
              <div key={activity.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getActivityTypeInfo(activity.activityType).icon}</span>
                    <Badge variant="outline" className="text-xs">
                      {getActivityTypeInfo(activity.activityType).label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(activity.duration)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.startTime).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="text-sm font-medium">{activity.title}</h5>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(activity.startTime).toLocaleTimeString()}</span>
                    {activity.endTime && (
                      <span> - {new Date(activity.endTime).toLocaleTimeString()}</span>
                    )}
                  </div>
                  {activity.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{activity.location}</span>
                    </div>
                  )}
                </div>
                {activity.ticket && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                    <FileText className="h-3 w-3" />
                    <span>#{activity.ticket.id}: {activity.ticket.title}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
