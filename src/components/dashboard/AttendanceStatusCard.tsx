import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Navigation,
  RefreshCw,
  Laptop,
  Smartphone
} from "lucide-react";
import { AttendanceStatus, LocationStatus } from "@/hooks/useAutoAttendance";

interface AttendanceStatusCardProps {
  attendanceStatus: AttendanceStatus;
  locationStatus: LocationStatus;
  isChecking: boolean;
  onManualCheckIn: () => void;
  onRefreshLocation: () => void;
}

export const AttendanceStatusCard = ({
  attendanceStatus,
  locationStatus,
  isChecking,
  onManualCheckIn,
  onRefreshLocation
}: AttendanceStatusCardProps) => {
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Card className={`${
      attendanceStatus.isMarked 
        ? attendanceStatus.isLate 
          ? 'border-orange-500/50 bg-orange-500/5' 
          : 'border-green-500/50 bg-green-500/5'
        : 'border-blue-500/50 bg-blue-500/5'
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Today's Attendance
        </CardTitle>
        {attendanceStatus.isMarked ? (
          <Badge className={attendanceStatus.isLate ? 'bg-orange-500' : 'bg-green-500'}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {attendanceStatus.isLate ? 'Late' : 'On Time'}
          </Badge>
        ) : (
          <Badge variant="secondary">
            Not Checked In
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attendance Status */}
        {attendanceStatus.isMarked ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div>
              <p className="text-sm font-medium">Checked in at</p>
              <p className="text-2xl font-bold">{attendanceStatus.checkInTime}</p>
            </div>
            <CheckCircle2 className={`h-10 w-10 ${
              attendanceStatus.isLate ? 'text-orange-500' : 'text-green-500'
            }`} />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Device Type Indicator */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {locationStatus.isMobile ? (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Device</span>
                  </>
                ) : (
                  <>
                    <Laptop className="h-4 w-4" />
                    <span>Laptop/Desktop</span>
                  </>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {formatDistance(locationStatus.effectiveRadius)} radius
              </Badge>
            </div>
            
            {/* Laptop location warning */}
            {!locationStatus.isMobile && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">Note:</span> Laptop location can be inaccurate. Using extended 10km radius for verification.
              </div>
            )}

            {/* Location Status */}
            <div className="p-3 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location Status
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={onRefreshLocation}
                  disabled={locationStatus.loading}
                >
                  <RefreshCw className={`h-3 w-3 ${locationStatus.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {locationStatus.loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Getting location...</span>
                </div>
              ) : locationStatus.error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{locationStatus.error}</span>
                </div>
              ) : locationStatus.distance !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Distance from office</span>
                    <span className="font-medium">{formatDistance(locationStatus.distance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {locationStatus.isWithinGeofence ? (
                      <>
                        <Navigation className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          You are at office! Ready to check in.
                        </span>
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-600">
                          Must be within {formatDistance(locationStatus.effectiveRadius)} to check in
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Enable location to see distance</span>
              )}
            </div>

            {/* Check-in Button */}
            <Button 
              className="w-full" 
              onClick={onManualCheckIn}
              disabled={isChecking || (!locationStatus.isWithinGeofence && !locationStatus.loading)}
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Attendance
                </>
              )}
            </Button>

            {!locationStatus.isWithinGeofence && !locationStatus.loading && locationStatus.permissionGranted && (
              <p className="text-xs text-muted-foreground text-center">
                You need to be at the office location to mark attendance
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
