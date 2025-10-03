'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

interface AttendanceData {
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

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
}

interface CleanAttendanceWidgetProps {
  onStatusChange?: () => void;
  initialData?: AttendanceData;
}

interface LocationCaptureState {
  isCapturing: boolean;
  capturedLocation: LocationData | null;
  error: string | null;
}

export default function CleanAttendanceWidget({ 
  onStatusChange,
  initialData
}: CleanAttendanceWidgetProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(initialData || null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEarlyCheckoutConfirm, setShowEarlyCheckoutConfirm] = useState(false);
  const [earlyCheckoutData, setEarlyCheckoutData] = useState<any>(null);
  const [locationState, setLocationState] = useState<LocationCaptureState>({
    isCapturing: false,
    capturedLocation: null,
    error: null
  });
  const { toast } = useToast();

  // Fetch attendance status
  const fetchAttendanceStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/attendance/status');
      console.log('CleanAttendanceWidget: Fetched status:', response);
      const data = response.data || response;
      setAttendanceData(data);
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
  }, [toast]);

  // Fetch attendance stats
  const fetchAttendanceStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/attendance/stats');
      const data = response.data || response;
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    if (!initialData) {
      fetchAttendanceStatus();
    }
    fetchAttendanceStats();
  }, [initialData, fetchAttendanceStatus, fetchAttendanceStats]);

  // Update when initial data changes
  useEffect(() => {
    if (initialData) {
      console.log('CleanAttendanceWidget: Updating from initialData:', initialData);
      setAttendanceData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  // Get current location with high accuracy and visual feedback
  const getCurrentLocation = async (): Promise<LocationData> => {
    setLocationState({
      isCapturing: true,
      capturedLocation: null,
      error: null
    });

    try {
      const locationData = await new Promise<LocationData>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'));
          return;
        }

        console.log('CleanAttendanceWidget: Starting GPS capture...');
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log(`CleanAttendanceWidget: GPS obtained - Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, Accuracy: ±${Math.round(accuracy)}m`);
            
            // Get address from coordinates
            let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            try {
              console.log('CleanAttendanceWidget: Getting address from backend geocoding...');
              const response = await apiClient.get(`/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`);
              if (response.data?.success && response.data?.data?.address) {
                address = response.data.data.address;
                console.log('CleanAttendanceWidget: Address resolved:', address);
              }
            } catch (error) {
              console.warn('CleanAttendanceWidget: Geocoding failed:', error);
            }

            const locationData = { latitude, longitude, accuracy, address };
            resolve(locationData);
          },
          (error) => {
            console.error('CleanAttendanceWidget: GPS error:', error);
            reject(new Error(`Location error: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0 // Always get fresh location
          }
        );
      });

      // Update state with captured location
      setLocationState({
        isCapturing: false,
        capturedLocation: locationData,
        error: null
      });

      return locationData;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get location';
      setLocationState({
        isCapturing: false,
        capturedLocation: null,
        error: errorMessage
      });
      throw error;
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      console.log('CleanAttendanceWidget: Starting check-in process...');
      
      // Get location with visual feedback
      const location = await getCurrentLocation();
      console.log('CleanAttendanceWidget: Location captured:', location);

      // Send check-in request
      const response = await apiClient.post('/attendance/checkin', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      const result = response.data || response;
      console.log('CleanAttendanceWidget: Check-in successful:', result);
      
      // Update local state immediately
      const newData: AttendanceData = {
        isCheckedIn: true,
        attendance: result.attendance ? {
          id: result.attendance.id,
          checkInAt: result.attendance.checkInAt,
          checkInAddress: result.attendance.checkInAddress || location.address,
          status: 'CHECKED_IN'
        } : {
          id: 0,
          checkInAt: new Date().toISOString(),
          checkInAddress: location.address,
          status: 'CHECKED_IN'
        }
      };
      setAttendanceData(newData);

      toast({
        title: 'Checked In Successfully',
        description: location.address,
      });

      // Notify parent and refresh data
      if (onStatusChange) {
        await onStatusChange();
      }
      await fetchAttendanceStatus();
      await fetchAttendanceStats();
    } catch (error: any) {
      console.error('Check-in failed:', error);
      
      // If already checked in, refresh status to sync UI with backend
      if (error.response?.status === 400 && 
          (error.response?.data?.error === 'Already checked in' || 
           error.response?.data?.message?.includes('already checked in'))) {
        toast({
          title: 'Already Checked In',
          description: 'You are currently checked in. Refreshing status...',
          variant: 'destructive',
        });
        // Refresh to sync state
        await fetchAttendanceStatus();
        if (onStatusChange) {
          await onStatusChange();
        }
      } else {
        toast({
          title: 'Check-in Failed',
          description: error.response?.data?.message || error.message || 'Failed to check in',
          variant: 'destructive',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      console.log('CleanAttendanceWidget: Starting check-out process...');
      
      // Get location with visual feedback
      const location = await getCurrentLocation();
      console.log('CleanAttendanceWidget: Location captured:', location);

      // Send check-out request
      const response = await apiClient.post('/attendance/checkout', {
        attendanceId: attendanceData?.attendance?.id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      const result = response.data || response;
      console.log('CleanAttendanceWidget: Check-out successful:', result);
      
      // Update local state immediately
      const newData: AttendanceData = {
        isCheckedIn: false,
        attendance: result.attendance ? {
          id: result.attendance.id,
          checkInAt: result.attendance.checkInAt,
          checkOutAt: result.attendance.checkOutAt,
          checkInAddress: result.attendance.checkInAddress,
          checkOutAddress: result.attendance.checkOutAddress || location.address,
          status: result.attendance.status || 'CHECKED_OUT',
          totalHours: result.attendance.totalHours
        } : attendanceData?.attendance
      };
      setAttendanceData(newData);

      toast({
        title: 'Checked Out Successfully',
        description: `Total hours: ${formatHours(result.attendance?.totalHours)}h`,
      });

      // Notify parent and refresh data
      if (onStatusChange) {
        await onStatusChange();
      }
      await fetchAttendanceStatus();
      await fetchAttendanceStats();
    } catch (error: any) {
      console.error('Check-out failed:', error);
      
      // Handle early checkout confirmation
      if (error.response?.status === 400 && error.response?.data?.requiresConfirmation) {
        setEarlyCheckoutData({
          location,
          confirmationData: error.response.data
        });
        setShowEarlyCheckoutConfirm(true);
        return;
      }
      
      toast({
        title: 'Check-out Failed',
        description: error.response?.data?.message || 'Failed to check out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle re-check-in
  const handleReCheckIn = async () => {
    setActionLoading(true);
    try {
      console.log('CleanAttendanceWidget: Starting re-check-in process...');
      
      // Get location with visual feedback
      const location = await getCurrentLocation();
      console.log('CleanAttendanceWidget: Location captured:', location);

      // Send re-check-in request
      const response = await apiClient.post('/attendance/re-checkin', {
        attendanceId: attendanceData?.attendance?.id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      const result = response.data || response;
      console.log('CleanAttendanceWidget: Re-check-in successful:', result);
      
      // Update local state immediately
      const newData: AttendanceData = {
        isCheckedIn: true,
        attendance: result.attendance ? {
          id: result.attendance.id,
          checkInAt: result.attendance.checkInAt,
          checkInAddress: result.attendance.checkInAddress || location.address,
          status: 'CHECKED_IN'
        } : {
          id: 0,
          checkInAt: new Date().toISOString(),
          checkInAddress: location.address,
          status: 'CHECKED_IN'
        }
      };
      setAttendanceData(newData);

      toast({
        title: 'Re-Checked In Successfully',
        description: location.address,
      });

      // Notify parent and refresh data
      if (onStatusChange) {
        await onStatusChange();
      }
      await fetchAttendanceStatus();
      await fetchAttendanceStats();
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

  // Handle early checkout confirmation
  const handleEarlyCheckoutConfirm = async (confirmed: boolean) => {
    setShowEarlyCheckoutConfirm(false);
    
    if (!confirmed || !earlyCheckoutData) {
      setEarlyCheckoutData(null);
      return;
    }

    setActionLoading(true);
    try {
      const { location } = earlyCheckoutData;
      
      const response = await apiClient.post('/attendance/checkout', {
        attendanceId: attendanceData?.attendance?.id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        confirmEarlyCheckout: true
      });

      const result = response.data || response;
      const newData: AttendanceData = {
        isCheckedIn: false,
        attendance: result.attendance ? {
          id: result.attendance.id,
          checkInAt: result.attendance.checkInAt,
          checkOutAt: result.attendance.checkOutAt,
          checkInAddress: result.attendance.checkInAddress,
          checkOutAddress: result.attendance.checkOutAddress,
          status: result.attendance.status || 'EARLY_CHECKOUT',
          totalHours: result.attendance.totalHours
        } : attendanceData?.attendance
      };
      setAttendanceData(newData);

      toast({
        title: 'Checked Out Successfully',
        description: `Total hours: ${formatHours(result.attendance?.totalHours)}h`,
      });

      if (onStatusChange) {
        await onStatusChange();
      }
      await fetchAttendanceStatus();
      await fetchAttendanceStats();
    } catch (error: any) {
      console.error('Early checkout failed:', error);
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

  // Utility functions
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
    if (!attendanceData) return null;

    if (attendanceData.isCheckedIn) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Checked In
        </Badge>
      );
    } else {
      const hasAttendanceToday = attendanceData.attendance && 
        (attendanceData.attendance.status === 'CHECKED_OUT' || attendanceData.attendance.status === 'EARLY_CHECKOUT');
      
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

  const renderActionButton = () => {
    if (!attendanceData) return null;

    const isCheckedIn = attendanceData.isCheckedIn;
    const hasAttendanceToday = attendanceData.attendance && 
      (attendanceData.attendance.status === 'CHECKED_OUT' || attendanceData.attendance.status === 'EARLY_CHECKOUT');

    if (isCheckedIn) {
      return (
        <Button
          onClick={handleCheckOut}
          disabled={actionLoading || locationState.isCapturing}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {actionLoading || locationState.isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          {locationState.isCapturing ? 'Getting Location...' : 'Check Out'}
        </Button>
      );
    } else if (hasAttendanceToday) {
      return (
        <Button
          onClick={handleReCheckIn}
          disabled={actionLoading || locationState.isCapturing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {actionLoading || locationState.isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4 mr-2" />
          )}
          {locationState.isCapturing ? 'Getting Location...' : 'Re-Check In'}
        </Button>
      );
    } else {
      return (
        <Button
          onClick={handleCheckIn}
          disabled={actionLoading || locationState.isCapturing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {actionLoading || locationState.isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4 mr-2" />
          )}
          {locationState.isCapturing ? 'Getting Location...' : 'Check In'}
        </Button>
      );
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
                  onClick={() => handleEarlyCheckoutConfirm(false)}
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
                    onClick={() => handleEarlyCheckoutConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleEarlyCheckoutConfirm(true)}
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

      {/* Main Attendance Card */}
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
          {attendanceData?.attendance && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Check-in Time:</span>
                <span className="font-medium">{formatTime(attendanceData.attendance.checkInAt)}</span>
              </div>
              
              {attendanceData.attendance.checkOutAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Check-out Time:</span>
                  <span className="font-medium">{formatTime(attendanceData.attendance.checkOutAt)}</span>
                </div>
              )}
              
              {attendanceData.attendance.totalHours && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">{formatHours(attendanceData.attendance.totalHours)}h</span>
                </div>
              )}

              {/* Location Capture Status */}
              {locationState.isCapturing && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-800">Capturing Location...</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Getting your GPS coordinates and address</p>
                  </div>
                </div>
              )}

              {/* Captured Location Display */}
              {locationState.capturedLocation && !locationState.isCapturing && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Location Captured</span>
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-green-100 text-green-700">
                        ±{Math.round(locationState.capturedLocation.accuracy)}m
                      </Badge>
                    </div>
                    
                    {/* Coordinates Display */}
                    <div className="space-y-1">
                      <div className="bg-white bg-opacity-70 rounded px-2 py-1">
                        <p className="text-xs font-mono text-gray-700">
                          📍 {locationState.capturedLocation.latitude.toFixed(6)}, {locationState.capturedLocation.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-70 rounded px-2 py-1">
                        <p className="text-xs text-gray-700 break-words">
                          📍 {locationState.capturedLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Error */}
              {locationState.error && !locationState.isCapturing && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Location Error</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">{locationState.error}</p>
                  </div>
                </div>
              )}

              {/* Stored Location Info */}
              {attendanceData.attendance.checkInAddress && !locationState.isCapturing && !locationState.capturedLocation && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">Check-in Location:</p>
                      <p className="text-xs text-gray-800 break-words">
                        {attendanceData.attendance.checkInAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {renderActionButton()}
            
            <Button
              variant="outline"
              onClick={() => {
                fetchAttendanceStatus();
                fetchAttendanceStats();
                // Clear location state on refresh
                setLocationState({
                  isCapturing: false,
                  capturedLocation: null,
                  error: null
                });
              }}
              disabled={actionLoading || locationState.isCapturing}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
