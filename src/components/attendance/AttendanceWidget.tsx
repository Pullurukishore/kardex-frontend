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
  AlertTriangle
} from 'lucide-react';
import api from '@/lib/api/axios';

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

interface AttendanceWidgetProps {
  onStatusChange?: () => void;
}

export function AttendanceWidget({ onStatusChange }: AttendanceWidgetProps = {}) {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showEarlyCheckoutConfirm, setShowEarlyCheckoutConfirm] = useState(false);
  const [earlyCheckoutData, setEarlyCheckoutData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendanceData();
    // Automatically request location when component loads
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser.";
      setLocationError(errorMsg);
      toast({
        title: "Location Unavailable",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // Allow 1 minute old location
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Reverse geocode to get address
      let address = 'Current Location';
      try {
        // You can use a geocoding service here
        // For now, we'll use a placeholder
        address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (error) {
        console.error('Geocoding failed:', error);
      }

      const locationData = { lat, lng, address };
      setLocation(locationData);
      setLocationError(null);
      
      toast({
        title: "Location Detected",
        description: "Your location has been successfully detected.",
        variant: "default"
      });
      
      return locationData;
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = "Could not get your current location.";
      
      if (error.code === 1) {
        errorMessage = "Location access denied. Please allow location permissions and try again.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS/network connection.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }
      
      setLocationError(errorMessage);
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await api.get('/attendance/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await api.get('/attendance/stats', {
        params: { period: 'week' }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  };

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceStatus(),
        fetchAttendanceStats()
      ]);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    
    try {
      // Request location when checking in
      const locationData = await getCurrentLocation();
      
      if (!locationData?.lat || !locationData?.lng) {
        toast({
          title: "Location Required",
          description: "Location access is required to check in. Please allow location access when prompted.",
          variant: "destructive"
        });
        setActionLoading(false);
        return;
      }

      const checkInData = {
        latitude: locationData.lat,
        longitude: locationData.lng,
        address: locationData.address || 'Unknown Location',
        notes: 'Daily check-in'
      };

      const response = await api.post('/attendance/checkin', checkInData);
      
      setStatus({
        isCheckedIn: true,
        attendance: response.data.attendance
      });

      // Refresh stats
      await fetchAttendanceStats();

      // Notify parent component of status change
      onStatusChange?.();

      toast({
        title: "Checked In Successfully",
        description: "Your work day has started. Have a productive day!",
      });
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: "Check-in Failed",
        description: error.response?.data?.error || "Failed to check in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (confirmEarly = false) => {
    if (!status?.attendance) return;
    
    setActionLoading(true);
    try {
      const checkOutData = {
        attendanceId: status.attendance.id,
        latitude: location?.lat,
        longitude: location?.lng,
        address: location?.address || 'Unknown Location',
        notes: 'Daily check-out',
        confirmEarlyCheckout: confirmEarly
      };

      const response = await api.post('/attendance/checkout', checkOutData);

      setStatus({
        isCheckedIn: false,
        attendance: response.data.attendance
      });

      // Refresh stats
      await fetchAttendanceStats();

      // Notify parent component of status change
      onStatusChange?.();

      toast({
        title: "Checked Out Successfully",
        description: response.data.attendance.status === 'EARLY_CHECKOUT' 
          ? "Early checkout completed. Have a good day!" 
          : "Your work day has ended. Great job today!",
      });

      setShowEarlyCheckoutConfirm(false);
      setEarlyCheckoutData(null);
    } catch (error: any) {
      console.error('Check-out failed:', error);
      
      // Handle early checkout confirmation requirement
      if (error.response?.data?.requiresConfirmation) {
        setEarlyCheckoutData(error.response.data);
        setShowEarlyCheckoutConfirm(true);
        toast({
          title: "Early Checkout Confirmation",
          description: error.response.data.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Check-out Failed",
          description: error.response?.data?.error || "Failed to check out. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReCheckIn = async () => {
    if (!status?.attendance || !location?.lat || !location?.lng) {
      toast({
        title: "Location Required",
        description: "Please allow location access to re-check in.",
        variant: "destructive"
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const reCheckInData = {
        attendanceId: status.attendance.id,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address || 'Unknown Location',
        notes: 'Re-check-in after mistaken checkout'
      };

      const response = await api.post('/attendance/re-checkin', reCheckInData);

      setStatus({
        isCheckedIn: true,
        attendance: response.data.attendance
      });

      // Refresh stats
      await fetchAttendanceStats();

      // Notify parent component of status change
      onStatusChange?.();

      toast({
        title: "Re-checked In Successfully",
        description: "You're back to work. Continue your productive day!",
      });
    } catch (error: any) {
      console.error('Re-check-in failed:', error);
      toast({
        title: "Re-check-in Failed",
        description: error.response?.data?.error || "Failed to re-check in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (checkInTime: string) => {
    const start = new Date(checkInTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-500" />
          Attendance
        </CardTitle>
        <CardDescription>Track your daily work hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${status?.isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <div>
              <p className="font-medium">
                {status?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </p>
              {status?.attendance?.checkInAt && (
                <p className="text-sm text-gray-600">
                  {status.isCheckedIn ? (
                    <>Since {new Date(status.attendance.checkInAt).toLocaleTimeString()} • {formatDuration(status.attendance.checkInAt)}</>
                  ) : (
                    <>Worked {(Number(status.attendance.totalHours) || 0).toFixed(1)}h today</>
                  )}
                </p>
              )}
            </div>
          </div>
          <Badge variant={status?.isCheckedIn ? 'default' : 'secondary'}>
            {status?.isCheckedIn ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Enhanced Location Status */}
        <div className="space-y-3">
          {/* Location Status Card */}
          <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
            location 
              ? 'bg-green-50 border-green-200 shadow-sm' 
              : locationError 
                ? 'bg-red-50 border-red-200 shadow-sm'
                : 'bg-blue-50 border-blue-200 shadow-sm animate-pulse'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {locationLoading ? (
                  <div className="relative">
                    <MapPin className="h-6 w-6 text-blue-500" />
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin absolute -top-1 -right-1" />
                  </div>
                ) : location ? (
                  <div className="relative">
                    <MapPin className="h-6 w-6 text-green-600" />
                    <CheckCircle className="h-4 w-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="h-6 w-6 text-red-500" />
                    <AlertCircle className="h-4 w-4 text-red-600 absolute -top-1 -right-1 bg-white rounded-full" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className={`font-semibold text-base ${
                    location 
                      ? 'text-green-800' 
                      : locationError 
                        ? 'text-red-800'
                        : 'text-blue-800'
                  }`}>
                    {locationLoading 
                      ? 'Getting your location...' 
                      : location 
                        ? 'Location Ready ✓' 
                        : locationError 
                          ? 'Location Required'
                          : 'Location Needed'
                    }
                  </p>
                  <p className={`text-sm mt-1 ${
                    location 
                      ? 'text-green-700' 
                      : locationError 
                        ? 'text-red-700'
                        : 'text-blue-700'
                  }`}>
                    {locationLoading 
                      ? 'Please allow location access when prompted' 
                      : location 
                        ? `📍 ${location.address}` 
                        : locationError 
                          ? locationError
                          : 'Location is required for attendance tracking'
                    }
                  </p>
                </div>
              </div>
              
              {/* Action Button */}
              {(!location || locationError) && (
                <Button 
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className={`${
                    locationError 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } px-4 py-2 font-medium`}
                  size="sm"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Getting...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      {locationError ? 'Try Again' : 'Get Location'}
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Progress indicator for location loading */}
            {locationLoading && (
              <div className="mt-3">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">Requesting location permissions...</p>
              </div>
            )}
          </div>
          
          {/* Location Help Text */}
          {!location && !locationLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Why do we need your location?</p>
                  <ul className="text-amber-700 space-y-1 text-xs">
                    <li>• Required for attendance check-in/check-out</li>
                    <li>• Helps track work locations and activities</li>
                    <li>• Ensures accurate time and location logging</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Location Address */}
        {status?.attendance?.checkInAddress && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            📍 {status.attendance.checkInAddress}
          </div>
        )}

        {/* Early Checkout Confirmation */}
        {showEarlyCheckoutConfirm && earlyCheckoutData && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Early Checkout Confirmation</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              {earlyCheckoutData.message}
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleCheckOut(true)}
                disabled={actionLoading}
                size="sm"
                variant="destructive"
              >
                Yes, Check Out Early
              </Button>
              <Button 
                onClick={() => {
                  setShowEarlyCheckoutConfirm(false);
                  setEarlyCheckoutData(null);
                }}
                disabled={actionLoading}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!status?.isCheckedIn ? (
            <>
              <Button 
                onClick={handleCheckIn}
                disabled={actionLoading || !location}
                className={`flex-1 ${
                  !location 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {!location ? 'Location Required' : 'Check In'}
              </Button>
              
              {/* Re-check-in button for same day checkout */}
              {status?.attendance?.status && ['CHECKED_OUT', 'EARLY_CHECKOUT'].includes(status.attendance.status) && (
                <Button 
                  onClick={handleReCheckIn}
                  disabled={actionLoading || !location}
                  variant="outline"
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Re-check In
                </Button>
              )}
            </>
          ) : (
            <Button 
              onClick={() => handleCheckOut(false)}
              disabled={actionLoading}
              variant="destructive"
              className="flex-1"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Check Out
            </Button>
          )}
        </div>


        {/* Today's Summary */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {(Number(status?.attendance?.totalHours) || 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600">Hours Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {(Number(stats?.totalHours) || 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600">Hours This Week</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
