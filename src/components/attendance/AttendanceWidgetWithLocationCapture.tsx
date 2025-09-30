'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  LogIn, 
  LogOut,
  Loader2,
  AlertCircle,
  RotateCcw,
  Navigation,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import LocationCapture from '@/components/location/LocationCapture';
import { LocationResult } from '@/services/LocationService';

interface AttendanceStatus {
  isCheckedIn: boolean;
  attendance?: {
    id: number;
    checkInAt: string;
    checkOutAt?: string;
    checkInAddress?: string;
    checkOutAddress?: string;
    totalHours?: number;
    status: 'CHECKED_IN' | 'CHECKED_OUT' | 'EARLY_CHECKOUT';
  };
}

interface AttendanceStats {
  totalHours: number;
  avgHoursPerDay: number;
  totalDaysWorked: number;
}

interface AttendanceWidgetWithLocationCaptureProps {
  onStatusChange?: () => void;
  accuracyThreshold?: number; // Default 100m for attendance
  initialData?: any; // Initial attendance data from server
}

export function AttendanceWidgetWithLocationCapture({ 
  onStatusChange,
  accuracyThreshold = 100,
  initialData
}: AttendanceWidgetWithLocationCaptureProps = {}) {
  const [status, setStatus] = useState<AttendanceStatus | null>(initialData || null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<LocationResult | null>(null);
  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | 're-checkin' | null>(null);
  const [showEarlyCheckoutConfirm, setShowEarlyCheckoutConfirm] = useState(false);
  const [earlyCheckoutData, setEarlyCheckoutData] = useState<any>(null);
  const { toast } = useToast();

  // Request deduplication to prevent React StrictMode double calls
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestInProgress, setRequestInProgress] = useState<string | null>(null);
  const REQUEST_COOLDOWN = 2000; // 2 seconds cooldown between requests

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialData) {
      fetchAttendanceStatus();
    }
    fetchAttendanceStats();
  }, [initialData]);

  // Handle initial data changes
  useEffect(() => {
    console.log('AttendanceWidget: Initial data received:', initialData);
    if (initialData) {
      setStatus(initialData);
      setLoading(false);
    }
  }, [initialData]);

  const fetchAttendanceStatus = async () => {
    try {
      const response = await apiClient.get('/attendance/status');
      console.log('AttendanceWidget: Fetched attendance status:', response.data);
      console.log('AttendanceWidget: isCheckedIn:', response.data?.isCheckedIn);
      console.log('AttendanceWidget: attendance status:', response.data?.attendance?.status);
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await apiClient.get('/attendance/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  };

  const handleLocationCapture = (result: LocationResult) => {
    console.log('AttendanceWidget: Location captured:', result);
    
    // Validate location data
    if (!result || !result.location || 
        typeof result.location.latitude !== 'number' || 
        typeof result.location.longitude !== 'number') {
      console.error('AttendanceWidget: Invalid location data received:', result);
      toast({
        title: 'Invalid Location Data',
        description: 'Please try capturing your location again',
        variant: 'destructive',
      });
      return;
    }

    setCapturedLocation(result);
    setShowLocationCapture(false);
    
    // Show success message
    toast({
      title: 'Location Captured',
      description: `Location accuracy: ±${Math.round(result.location.accuracy || 0)}m`,
    });

    // If there's a pending action, execute it
    if (pendingAction === 'checkin') {
      executeCheckIn(result);
    } else if (pendingAction === 'checkout') {
      executeCheckOut(result);
    } else if (pendingAction === 're-checkin') {
      executeReCheckIn(result);
    }
  };

  const handleLocationError = (error: string) => {
    console.error('AttendanceWidget: Location error:', error);
    toast({
      title: 'Location Error',
      description: error,
      variant: 'destructive',
    });
  };

  const handleCheckIn = () => {
    setPendingAction('checkin');
    setShowLocationCapture(true);
  };

  const handleReCheckIn = () => {
    setPendingAction('re-checkin');
    setShowLocationCapture(true);
  };

  const handleCheckOut = () => {
    setPendingAction('checkout');
    setShowLocationCapture(true);
  };

  const executeCheckIn = async (locationResult: LocationResult) => {
    // Prevent duplicate requests (React StrictMode protection)
    const now = Date.now();
    const requestKey = 'checkin';
    
    if (requestInProgress === requestKey) {
      console.log('AttendanceWidget: Check-in request already in progress, skipping duplicate');
      return;
    }
    
    if (now - lastRequestTime < REQUEST_COOLDOWN) {
      console.log('AttendanceWidget: Check-in request too soon after last request, skipping');
      return;
    }

    setActionLoading(true);
    setPendingAction(null);
    setRequestInProgress(requestKey);
    setLastRequestTime(now);
    
    try {
      console.log('AttendanceWidget: Executing check-in with location:', locationResult);
      
      const requestData = {
        latitude: locationResult.location.latitude,
        longitude: locationResult.location.longitude,
        address: locationResult.address,
        accuracy: locationResult.location.accuracy,
        timestamp: locationResult.location.timestamp?.toISOString()
      };

      console.log('AttendanceWidget: Sending check-in request with data:', requestData);

      const response = await apiClient.post('/attendance/checkin', requestData);

      if (response.data.success) {
        await fetchAttendanceStatus();
        await fetchAttendanceStats();
        
        toast({
          title: 'Checked In Successfully',
          description: locationResult.address || 'Location recorded',
        });

        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: 'Check-in Failed',
        description: error.response?.data?.message || 'Failed to check in',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setRequestInProgress(null);
    }
  };

  const executeCheckOut = async (locationResult: LocationResult) => {
    // Prevent duplicate requests (React StrictMode protection)
    const now = Date.now();
    const requestKey = 'checkout';
    
    if (requestInProgress === requestKey) {
      console.log('AttendanceWidget: Check-out request already in progress, skipping duplicate');
      return;
    }
    
    if (now - lastRequestTime < REQUEST_COOLDOWN) {
      console.log('AttendanceWidget: Check-out request too soon after last request, skipping');
      return;
    }

    setActionLoading(true);
    setPendingAction(null);
    setRequestInProgress(requestKey);
    setLastRequestTime(now);
    
    try {
      console.log('AttendanceWidget: Executing check-out with location:', locationResult);
      
      const requestData = {
        latitude: locationResult.location.latitude,
        longitude: locationResult.location.longitude,
        address: locationResult.address,
        accuracy: locationResult.location.accuracy,
        timestamp: locationResult.location.timestamp?.toISOString()
      };

      console.log('AttendanceWidget: Sending check-out request with data:', requestData);

      const response = await apiClient.post('/attendance/checkout', requestData);

      if (response.data.success) {
        console.log('Regular checkout successful, response:', response.data);
        
        // Immediately update local status to reflect checkout
        setStatus(prevStatus => {
          if (!prevStatus) return null;
          return {
            ...prevStatus,
            isCheckedIn: false,
            attendance: prevStatus.attendance ? {
              ...prevStatus.attendance,
              checkOutAt: new Date().toISOString(),
              status: response.data.data?.status || 'CHECKED_OUT',
              totalHours: response.data.data?.totalHours
            } : undefined
          };
        });
        
        await fetchAttendanceStatus();
        await fetchAttendanceStats();
        setCapturedLocation(null); // Clear location after checkout
        
        toast({
          title: 'Checked Out Successfully',
          description: `Total hours: ${formatHours(response.data.data?.totalHours)}h`,
        });

        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error: any) {
      console.error('Check-out failed:', error);
      
      // Handle early checkout confirmation
      if (error.response?.status === 400 && error.response?.data?.requiresConfirmation) {
        console.log('Early checkout confirmation required:', error.response.data);
        setEarlyCheckoutData({
          locationResult,
          confirmationData: error.response.data
        });
        setShowEarlyCheckoutConfirm(true);
        return; // Don't show error toast, show confirmation dialog instead
      }
      
      toast({
        title: 'Check-out Failed',
        description: error.response?.data?.message || 'Failed to check out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setRequestInProgress(null);
    }
  };

  const executeEarlyCheckOut = async (confirmed: boolean) => {
    if (!earlyCheckoutData) return;
    
    setShowEarlyCheckoutConfirm(false);
    
    if (!confirmed) {
      setEarlyCheckoutData(null);
      return;
    }

    const { locationResult } = earlyCheckoutData;
    
    setActionLoading(true);
    setPendingAction(null);
    
    try {
      const requestData = {
        latitude: locationResult.location.latitude,
        longitude: locationResult.location.longitude,
        address: locationResult.address,
        accuracy: locationResult.location.accuracy,
        timestamp: locationResult.location.timestamp?.toISOString(),
        confirmEarlyCheckout: true // Add confirmation flag
      };

      console.log('AttendanceWidget: Executing confirmed early check-out with data:', requestData);

      const response = await apiClient.post('/attendance/checkout', requestData);

      if (response.data.success) {
        console.log('Checkout successful, response:', response.data);
        
        // Immediately update local status to reflect checkout
        setStatus(prevStatus => {
          if (!prevStatus) return null;
          return {
            ...prevStatus,
            isCheckedIn: false,
            attendance: prevStatus.attendance ? {
              ...prevStatus.attendance,
              checkOutAt: new Date().toISOString(),
              status: response.data.data?.status || 'CHECKED_OUT',
              totalHours: response.data.data?.totalHours
            } : undefined
          };
        });
        
        // Fetch fresh data from server
        await fetchAttendanceStatus();
        await fetchAttendanceStats();
        setCapturedLocation(null);
        
        toast({
          title: 'Checked Out Successfully',
          description: `Total hours: ${formatHours(response.data.data?.totalHours)}h`,
        });

        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error: any) {
      console.error('Confirmed check-out failed:', error);
      toast({
        title: 'Check-out Failed',
        description: error.response?.data?.message || 'Failed to check out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setEarlyCheckoutData(null);
    }
  };

  const executeReCheckIn = async (locationResult: LocationResult) => {
    setActionLoading(true);
    setPendingAction(null);
    
    try {
      const requestData = {
        attendanceId: status?.attendance?.id,
        latitude: locationResult.location.latitude,
        longitude: locationResult.location.longitude,
        address: locationResult.address,
        accuracy: locationResult.location.accuracy,
        timestamp: locationResult.location.timestamp?.toISOString()
      };

      console.log('AttendanceWidget: Sending re-check-in request with data:', requestData);

      const response = await apiClient.post('/attendance/re-checkin', requestData);

      if (response.data.success) {
        // Immediately update local status to reflect re-check-in
        setStatus(prevStatus => {
          if (!prevStatus) return null;
          return {
            ...prevStatus,
            isCheckedIn: true,
            attendance: prevStatus.attendance ? {
              ...prevStatus.attendance,
              checkOutAt: undefined,
              checkOutAddress: undefined,
              status: 'CHECKED_IN' as const,
              totalHours: undefined
            } : undefined
          };
        });
        
        await fetchAttendanceStatus();
        await fetchAttendanceStats();
        
        toast({
          title: 'Re-Checked In Successfully',
          description: locationResult.address || 'Location recorded',
        });

        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error: any) {
      console.error('Re-check-in failed:', error);
      toast({
        title: 'Re-Check-in Failed',
        description: error.response?.data?.message || 'Failed to re-check in',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHours = (hours: string | number | undefined, decimals: number = 2): string => {
    if (!hours) return '0';
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    return isNaN(numHours) ? '0' : numHours.toFixed(decimals);
  };

  const getStatusBadge = () => {
    if (!status) return null;

    if (status.isCheckedIn) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Checked In
        </Badge>
      );
    } else {
      const hasAttendanceToday = status.attendance && 
        (status.attendance.status === 'CHECKED_OUT' || status.attendance.status === 'EARLY_CHECKOUT');
      
      if (hasAttendanceToday) {
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Can Re-Check In
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Ready to Check In
          </Badge>
        );
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading attendance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Early Checkout Confirmation Modal */}
      {showEarlyCheckoutConfirm && earlyCheckoutData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                  Early Check-out Confirmation
                </h2>
                <button
                  onClick={() => executeEarlyCheckOut(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  {earlyCheckoutData.confirmationData.message}
                </p>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-800">
                      Current time: {new Date(earlyCheckoutData.confirmationData.checkoutTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm mt-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-800">
                      Scheduled end: {new Date(earlyCheckoutData.confirmationData.scheduledTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => executeEarlyCheckOut(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => executeEarlyCheckOut(true)}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Confirm Early Check-out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Capture Modal */}
      {showLocationCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Location Required for {pendingAction === 'checkin' ? 'Check-in' : 'Check-out'}
                </h2>
                <button
                  onClick={() => {
                    setShowLocationCapture(false);
                    setPendingAction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                We need your location to record your {pendingAction === 'checkin' ? 'check-in' : 'check-out'} for attendance tracking.
              </p>
              <LocationCapture
                onLocationCapture={handleLocationCapture}
                onError={handleLocationError}
                accuracyThreshold={accuracyThreshold}
                showAddress={true}
                title={`Capture Location for ${pendingAction === 'checkin' ? 'Check-in' : 'Check-out'}`}
                subtitle="This helps us verify your work location"
              />
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Attendance</CardTitle>
              <CardDescription>Track your daily work hours</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {status?.attendance && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Check-in Time:</span>
                <span className="font-medium">{formatTime(status.attendance.checkInAt)}</span>
              </div>
              
              {status.attendance.checkOutAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Check-out Time:</span>
                  <span className="font-medium">{formatTime(status.attendance.checkOutAt)}</span>
                </div>
              )}
              
              {status.attendance.totalHours && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">{formatHours(status.attendance.totalHours)}h</span>
                </div>
              )}

              {/* Location Info */}
              {(status.attendance.checkInAddress || capturedLocation) && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">Location:</p>
                      <p className="text-xs text-gray-800 truncate">
                        {capturedLocation?.address || status.attendance.checkInAddress || 'Not available'}
                      </p>
                      {capturedLocation?.location.accuracy && (
                        <p className="text-xs text-gray-500">
                          Accuracy: ±{Math.round(capturedLocation.location.accuracy)}m
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Captured Location Preview */}
          {capturedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Location Ready</span>
              </div>
              <p className="text-xs text-green-700 truncate">{capturedLocation.address}</p>
              <p className="text-xs text-green-600">
                Accuracy: ±{Math.round(capturedLocation.location.accuracy || 0)}m
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCapturedLocation(null);
                  setShowLocationCapture(true);
                }}
                className="mt-2 text-xs h-7"
              >
                <Navigation className="h-3 w-3 mr-1" />
                Change Location
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {(() => {
              console.log('AttendanceWidget: Rendering buttons, status:', status);
              console.log('AttendanceWidget: isCheckedIn:', status?.isCheckedIn);
              console.log('AttendanceWidget: attendance status:', status?.attendance?.status);
              
              const isCheckedIn = status?.isCheckedIn;
              const hasAttendanceToday = status?.attendance && 
                (status.attendance.status === 'CHECKED_OUT' || status.attendance.status === 'EARLY_CHECKOUT');
              
              if (isCheckedIn) {
                // User is checked in - show checkout button
                return (
                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Check Out
                  </Button>
                );
              } else if (hasAttendanceToday) {
                // User has checked out today - show re-check-in button
                return (
                  <Button
                    onClick={handleReCheckIn}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Re-Check In
                  </Button>
                );
              } else {
                // First check-in of the day
                return (
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Check In
                  </Button>
                );
              }
            })()}
            
            <Button
              variant="outline"
              onClick={() => {
                fetchAttendanceStatus();
                fetchAttendanceStats();
              }}
              disabled={actionLoading}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Weekly Stats */}
          {stats && (
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">This Week</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-blue-600">{formatHours(stats.totalHours, 1)}h</p>
                  <p className="text-xs text-gray-600">Total Hours</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{formatHours(stats.avgHoursPerDay, 1)}h</p>
                  <p className="text-xs text-gray-600">Avg/Day</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-purple-600">{stats.totalDaysWorked}</p>
                  <p className="text-xs text-gray-600">Days Worked</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceWidgetWithLocationCapture;
