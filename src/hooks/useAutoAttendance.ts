import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Office coordinates: Islamabad, Pakistan
export const OFFICE_COORDINATES = {
  latitude: 33.725636,
  longitude: 73.074649,
  radiusMeters: 500 // 500m for GPS accuracy tolerance
};

const STANDARD_IN_TIME = "10:00";
const GRACE_PERIOD = 15; // minutes - final time is 10:15
const LATE_FINE_AMOUNT = 500; // Rs 500 fine for late arrival

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const calculateStatus = (checkIn: string): { status: "present" | "late"; isLate: boolean; shouldFine: boolean } => {
  const [hours, minutes] = checkIn.split(':').map(Number);
  const [stdHours, stdMinutes] = STANDARD_IN_TIME.split(':').map(Number);
  
  const checkInMinutes = hours * 60 + minutes;
  const standardTime = stdHours * 60 + stdMinutes;
  const graceTime = standardTime + GRACE_PERIOD; // 10:15 AM

  if (checkInMinutes <= graceTime) {
    return { status: "present", isLate: checkInMinutes > standardTime, shouldFine: false };
  } else {
    // After 10:15 AM - late with fine
    return { status: "late", isLate: true, shouldFine: true };
  }
};

export interface AttendanceStatus {
  isMarked: boolean;
  checkInTime: string | null;
  status: string | null;
  isLate: boolean;
}

export interface LocationStatus {
  permissionGranted: boolean | null;
  distance: number | null;
  isWithinGeofence: boolean;
  error: string | null;
  loading: boolean;
}

export const useAutoAttendance = (userName: string | null) => {
  const [isChecking, setIsChecking] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    isMarked: false,
    checkInTime: null,
    status: null,
    isLate: false
  });
  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    permissionGranted: null,
    distance: null,
    isWithinGeofence: false,
    error: null,
    loading: true
  });

  // Check existing attendance status
  const checkAttendanceStatus = useCallback(async () => {
    if (!userName) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('check_in, status, is_late')
      .eq('user_name', userName)
      .eq('date', today)
      .maybeSingle();

    if (existingAttendance) {
      setAttendanceStatus({
        isMarked: true,
        checkInTime: existingAttendance.check_in,
        status: existingAttendance.status,
        isLate: existingAttendance.is_late || false
      });
      setAttendanceMarked(true);
    }
  }, [userName]);

  // Check location status
  const checkLocationStatus = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus({
        permissionGranted: false,
        distance: null,
        isWithinGeofence: false,
        error: 'Geolocation not supported by your browser',
        loading: false
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          OFFICE_COORDINATES.latitude,
          OFFICE_COORDINATES.longitude
        );
        
        setLocationStatus({
          permissionGranted: true,
          distance,
          isWithinGeofence: distance <= OFFICE_COORDINATES.radiusMeters,
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Location access denied';
        if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location unavailable';
        }
        
        setLocationStatus({
          permissionGranted: false,
          distance: null,
          isWithinGeofence: false,
          error: errorMessage,
          loading: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Manual check-in function
  const manualCheckIn = useCallback(async (): Promise<boolean> => {
    if (!userName) {
      toast.error('User not found');
      return false;
    }

    setIsChecking(true);

    try {
      // First check if already marked
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_name', userName)
        .eq('date', today)
        .maybeSingle();

      if (existingAttendance) {
        toast.info('Attendance already marked for today');
        setAttendanceMarked(true);
        checkAttendanceStatus();
        setIsChecking(false);
        return false;
      }

      // Check location
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          toast.error('Geolocation is not supported by your browser');
          setIsChecking(false);
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const distance = calculateDistance(
              latitude,
              longitude,
              OFFICE_COORDINATES.latitude,
              OFFICE_COORDINATES.longitude
            );

            setLocationStatus(prev => ({
              ...prev,
              distance,
              isWithinGeofence: distance <= OFFICE_COORDINATES.radiusMeters,
              permissionGranted: true,
              loading: false
            }));

            if (distance > OFFICE_COORDINATES.radiusMeters) {
              toast.error(`You are ${Math.round(distance)}m from office`, {
                description: `Must be within ${OFFICE_COORDINATES.radiusMeters}m to mark attendance`,
                duration: 5000,
              });
              setIsChecking(false);
              resolve(false);
              return;
            }

            // Mark attendance
            const now = new Date();
            const checkInTime = format(now, 'HH:mm');
            const { status, isLate, shouldFine } = calculateStatus(checkInTime);

            const { data: attendanceData, error } = await supabase.from('attendance').insert({
              user_name: userName,
              date: today,
              check_in: checkInTime,
              status,
              is_late: isLate,
            }).select().single();

            if (error) {
              toast.error('Failed to mark attendance');
              setIsChecking(false);
              resolve(false);
              return;
            }

            // If late after grace period, create a fine
            if (shouldFine && attendanceData) {
              const { error: fineError } = await supabase.from('fines').insert({
                user_name: userName,
                amount: LATE_FINE_AMOUNT,
                reason: `Late arrival - Check-in at ${checkInTime} (after 10:15 AM grace period)`,
                date: today,
                attendance_id: attendanceData.id,
                status: 'pending',
              });

              if (!fineError) {
                toast.error(`Late Fine Applied: Rs ${LATE_FINE_AMOUNT}`, {
                  description: `You checked in at ${checkInTime}, after the 10:15 AM grace period.`,
                  duration: 8000,
                });
              }
            }

            toast.success(`Attendance marked! Check-in: ${checkInTime}`, {
              description: isLate ? 'You arrived late today' : 'On time! Great job!',
              duration: 5000,
            });

            setAttendanceStatus({
              isMarked: true,
              checkInTime,
              status,
              isLate
            });
            setAttendanceMarked(true);
            setIsChecking(false);
            resolve(true);
          },
          (error) => {
            let message = 'Location access denied';
            if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Please try again.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location unavailable. Please check your device settings.';
            }
            
            toast.error('Cannot verify location', {
              description: message,
              duration: 5000,
            });
            setLocationStatus(prev => ({
              ...prev,
              permissionGranted: false,
              error: message,
              loading: false
            }));
            setIsChecking(false);
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });
    } catch (error) {
      console.error('Manual check-in error:', error);
      toast.error('Failed to mark attendance');
      setIsChecking(false);
      return false;
    }
  }, [userName, checkAttendanceStatus]);

  // Auto check-in on load
  useEffect(() => {
    if (!userName || isChecking || attendanceMarked) return;

    const checkLocationAndMarkAttendance = async () => {
      // First check existing attendance
      await checkAttendanceStatus();
      
      // Also check location status for display
      checkLocationStatus();
      
      if (attendanceMarked) return;

      setIsChecking(true);

      try {
        // Check if attendance already marked for today
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('id')
          .eq('user_name', userName)
          .eq('date', today)
          .maybeSingle();

        if (existingAttendance) {
          setAttendanceMarked(true);
          setIsChecking(false);
          return;
        }

        // Check if geolocation is available
        if (!navigator.geolocation) {
          console.log('Geolocation not supported');
          toast.info('Enable location to auto-mark attendance', {
            description: 'Your browser does not support geolocation',
            duration: 5000,
          });
          setIsChecking(false);
          return;
        }

        // Get current position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            const distance = calculateDistance(
              latitude,
              longitude,
              OFFICE_COORDINATES.latitude,
              OFFICE_COORDINATES.longitude
            );

            console.log(`Distance from office: ${distance.toFixed(0)} meters`);
            
            setLocationStatus({
              permissionGranted: true,
              distance,
              isWithinGeofence: distance <= OFFICE_COORDINATES.radiusMeters,
              error: null,
              loading: false
            });

            if (distance <= OFFICE_COORDINATES.radiusMeters) {
              // User is at office - mark attendance
              const now = new Date();
              const checkInTime = format(now, 'HH:mm');
              const { status, isLate, shouldFine } = calculateStatus(checkInTime);

              const { data: attendanceData, error } = await supabase.from('attendance').insert({
                user_name: userName,
                date: today,
                check_in: checkInTime,
                status,
                is_late: isLate,
              }).select().single();

              if (error) {
                console.error('Error marking attendance:', error);
              } else {
                // If late after grace period, create a fine
                if (shouldFine && attendanceData) {
                  const { error: fineError } = await supabase.from('fines').insert({
                    user_name: userName,
                    amount: LATE_FINE_AMOUNT,
                    reason: `Late arrival - Check-in at ${checkInTime} (after 10:15 AM grace period)`,
                    date: today,
                    attendance_id: attendanceData.id,
                    status: 'pending',
                  });

                  if (fineError) {
                    console.error('Error creating fine:', fineError);
                  } else {
                    toast.error(`Late Fine Applied: Rs ${LATE_FINE_AMOUNT}`, {
                      description: `You checked in at ${checkInTime}, after the 10:15 AM grace period.`,
                      duration: 8000,
                    });
                  }
                }

                toast.success(`Attendance marked automatically! Check-in: ${checkInTime}`, {
                  description: isLate ? 'You arrived late today' : 'On time! Great job!',
                  duration: 5000,
                });
                
                setAttendanceStatus({
                  isMarked: true,
                  checkInTime,
                  status,
                  isLate
                });
                setAttendanceMarked(true);
              }
            } else {
              console.log('User is not at office location');
              toast.info('Not at office location', {
                description: `You are ${Math.round(distance)}m away. Attendance not marked.`,
                duration: 5000,
              });
            }
            setIsChecking(false);
          },
          (error) => {
            console.log('Geolocation error:', error.message);
            let message = 'Please enable location for auto attendance';
            if (error.code === error.TIMEOUT) {
              message = 'Location request timed out';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location unavailable';
            }
            
            toast.info('Location access needed', {
              description: message,
              duration: 5000,
            });
            
            setLocationStatus({
              permissionGranted: false,
              distance: null,
              isWithinGeofence: false,
              error: message,
              loading: false
            });
            setIsChecking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } catch (error) {
        console.error('Auto attendance error:', error);
        setIsChecking(false);
      }
    };

    // Wait a moment before checking to ensure user is fully loaded
    const timer = setTimeout(checkLocationAndMarkAttendance, 2000);
    return () => clearTimeout(timer);
  }, [userName, isChecking, attendanceMarked, checkAttendanceStatus, checkLocationStatus]);

  return { 
    isChecking, 
    attendanceMarked, 
    attendanceStatus, 
    locationStatus, 
    manualCheckIn,
    refreshLocation: checkLocationStatus,
    refreshAttendance: checkAttendanceStatus
  };
};
