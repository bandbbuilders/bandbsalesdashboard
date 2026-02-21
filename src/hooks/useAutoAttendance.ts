import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Office coordinates: Islamabad, Pakistan
export const OFFICE_COORDINATES = {
  latitude: 33.725636,
  longitude: 73.074649,
  radiusMeters: 2000, // 2km for mobile GPS accuracy in urban areas
  radiusMetersLaptop: 10000 // 10km for laptops (IP/Wi-Fi based location is inaccurate)
};

const STANDARD_IN_TIME = "10:00";
const GRACE_PERIOD = 20; // minutes - grace until 10:20 AM
const LATE_FINE_AMOUNT = 500; // Rs 500 fine for late arrival

// Detect if user is on a mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get geofence radius based on device type
export const getGeofenceRadius = (userName?: string | null, includeSecretExtra: boolean = false): number => {
  let radius = isMobileDevice() ? OFFICE_COORDINATES.radiusMeters : OFFICE_COORDINATES.radiusMetersLaptop;

  // Special case: Sara Memon gets 2km extra radius as requested
  if (includeSecretExtra && userName?.toLowerCase().trim() === 'sara memon') {
    radius += 2000;
  }

  return radius;
};

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
  const graceTime = standardTime + GRACE_PERIOD; // 10:20 AM

  // On-time: check-in at or before 10:20 (graceTime = 620 minutes = 10:20)
  // Late: check-in AFTER 10:20 (621 minutes = 10:21 or later)
  if (checkInMinutes <= graceTime) {
    // Check-in at 10:20 or earlier = present (on-time)
    return { status: "present", isLate: false, shouldFine: false };
  } else {
    // Check-in after 10:20 (10:21+) = late with fine
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
  isMobile: boolean;
  effectiveRadius: number;
}

// Zain Sarwar (COO) user ID - exempt from all fines
const ZAIN_SARWAR_USER_ID = 'fab190bd-59c4-4cd2-9d53-3fc0e7b5af95';

// Check if user is COO/CEO (exempt from fines)
const checkIsExemptFromFines = async (userName: string): Promise<boolean> => {
  try {
    // Check if name is exactly Zain Sarwar (case insensitive)
    if (userName.toLowerCase().trim() === 'zain sarwar') {
      return true;
    }

    // Get profile by name
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('full_name', userName)
      .maybeSingle();

    if (!profile?.user_id) return false;

    // Check if this is Zain Sarwar's user_id
    if (profile.user_id === ZAIN_SARWAR_USER_ID) {
      return true;
    }

    // Check user_roles table for ceo_coo role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    return roleData?.role === 'ceo_coo';
  } catch (error) {
    console.error('Error checking fine exemption status:', error);
    return false;
  }
};

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
    loading: true,
    isMobile: isMobileDevice(),
    effectiveRadius: getGeofenceRadius(userName, false)
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
    const mobile = isMobileDevice();
    const displayRadius = getGeofenceRadius(userName, false);
    const actualRadius = getGeofenceRadius(userName, true);

    if (!navigator.geolocation) {
      setLocationStatus({
        permissionGranted: false,
        distance: null,
        isWithinGeofence: false,
        error: 'Geolocation not supported by your browser',
        loading: false,
        isMobile: mobile,
        effectiveRadius: displayRadius
      });
      return;
    }

    const getLocation = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const distance = calculateDistance(
            latitude,
            longitude,
            OFFICE_COORDINATES.latitude,
            OFFICE_COORDINATES.longitude
          );

          console.log(`Location obtained (${highAccuracy ? 'High' : 'Low'} Accuracy) - Lat: ${latitude}, Lon: ${longitude}, Accuracy: ${accuracy}m, Distance: ${distance}m`);

          setLocationStatus({
            permissionGranted: true,
            distance,
            isWithinGeofence: distance <= actualRadius,
            error: null,
            loading: false,
            isMobile: mobile,
            effectiveRadius: displayRadius
          });
        },
        (error) => {
          console.error(`Geolocation error (${highAccuracy ? 'High' : 'Low'} Accuracy):`, error.code, error.message);

          // If high accuracy failed on mobile, try low accuracy
          if (highAccuracy && mobile) {
            console.log('Retrying with low accuracy...');
            getLocation(false);
            return;
          }

          let errorMessage = 'Location access denied';
          if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out. Please enable GPS and try again.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location unavailable. Please enable GPS/Location services.';
          } else if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
          }

          setLocationStatus({
            permissionGranted: false,
            distance: null,
            isWithinGeofence: false,
            error: errorMessage,
            loading: false,
            isMobile: mobile,
            effectiveRadius: displayRadius
          });
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? (mobile ? 15000 : 10000) : 10000,
          maximumAge: 60000
        }
      );
    };

    getLocation(mobile); // Start with high accuracy for mobile, low for desktop (or default based on device)
  }, [userName]);

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
            const { latitude, longitude, accuracy } = position.coords;
            const distance = calculateDistance(
              latitude,
              longitude,
              OFFICE_COORDINATES.latitude,
              OFFICE_COORDINATES.longitude
            );

            const displayRadius = getGeofenceRadius(userName, false);
            const actualRadius = getGeofenceRadius(userName, true);

            console.log(`Manual check-in - Lat: ${latitude}, Lon: ${longitude}, Accuracy: ${accuracy}m, Distance: ${distance}m, Radius: ${displayRadius}m (Actual: ${actualRadius}m)`);

            setLocationStatus(prev => ({
              ...prev,
              distance,
              isWithinGeofence: distance <= actualRadius,
              permissionGranted: true,
              loading: false
            }));

            if (distance > actualRadius) {
              toast.error(`You are ${Math.round(distance)}m from office`, {
                description: `Must be within ${displayRadius}m to mark attendance. ${accuracy ? `GPS accuracy: ${Math.round(accuracy)}m` : ''}`,
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

            // If late after grace period, create a fine (unless exempt - COO/CEO)
            if (shouldFine && attendanceData) {
              const isExempt = await checkIsExemptFromFines(userName);

              if (!isExempt) {
                const { error: fineError } = await supabase.from('fines').insert({
                  user_name: userName,
                  amount: LATE_FINE_AMOUNT,
                  reason: `Late arrival - Check-in at ${checkInTime} (after 10:20 AM grace period)`,
                  date: today,
                  attendance_id: attendanceData.id,
                  status: 'pending',
                });

                if (!fineError) {
                  toast.error(`Late Fine Applied: Rs ${LATE_FINE_AMOUNT}`, {
                    description: `You checked in at ${checkInTime}, after the 10:20 AM grace period.`,
                    duration: 8000,
                  });
                }
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
            console.error('Manual check-in geolocation error:', error.code, error.message);
            let message = 'Location access denied. Please allow location access in browser settings.';
            if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Please ensure GPS is enabled and try again.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location unavailable. Please enable GPS/Location services on your device.';
            }

            toast.error('Cannot verify location', {
              description: message,
              duration: 6000,
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
            enableHighAccuracy: isMobileDevice(), // High accuracy for mobile GPS
            timeout: isMobileDevice() ? 30000 : 15000, // 30s timeout for mobile GPS acquisition
            maximumAge: 60000 // Allow 1-minute cached position
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
        const mobile = isMobileDevice();
        const displayRadius = getGeofenceRadius(userName, false);
        const actualRadius = getGeofenceRadius(userName, true);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            const distance = calculateDistance(
              latitude,
              longitude,
              OFFICE_COORDINATES.latitude,
              OFFICE_COORDINATES.longitude
            );

            console.log(`Auto-attendance - Lat: ${latitude}, Lon: ${longitude}, Accuracy: ${accuracy}m, Distance: ${distance.toFixed(0)}m (Device: ${mobile ? 'Mobile' : 'Laptop'}, Radius: ${displayRadius}m (Actual: ${actualRadius}m))`);

            setLocationStatus({
              permissionGranted: true,
              distance,
              isWithinGeofence: distance <= actualRadius,
              error: null,
              loading: false,
              isMobile: mobile,
              effectiveRadius: displayRadius
            });

            if (distance <= actualRadius) {
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
                // If late after grace period, create a fine (unless exempt - COO/CEO)
                if (shouldFine && attendanceData) {
                  const isExempt = await checkIsExemptFromFines(userName);

                  if (!isExempt) {
                    const { error: fineError } = await supabase.from('fines').insert({
                      user_name: userName,
                      amount: LATE_FINE_AMOUNT,
                      reason: `Late arrival - Check-in at ${checkInTime} (after 10:20 AM grace period)`,
                      date: today,
                      attendance_id: attendanceData.id,
                      status: 'pending',
                    });

                    if (fineError) {
                      console.error('Error creating fine:', fineError);
                    } else {
                      toast.error(`Late Fine Applied: Rs ${LATE_FINE_AMOUNT}`, {
                        description: `You checked in at ${checkInTime}, after the 10:20 AM grace period.`,
                        duration: 8000,
                      });
                    }
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
            console.log('Auto-attendance geolocation error:', error.code, error.message);
            let message = 'Please enable location for auto attendance';
            if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Please ensure GPS is enabled.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location unavailable. Enable GPS/Location services.';
            } else if (error.code === error.PERMISSION_DENIED) {
              message = 'Location permission denied. Allow location in browser.';
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
              loading: false,
              isMobile: mobile,
              effectiveRadius: displayRadius
            });
            setIsChecking(false);
          },
          {
            enableHighAccuracy: mobile, // High accuracy for mobile GPS, lower for desktop
            timeout: mobile ? 30000 : 15000, // 30s for mobile GPS, 15s for desktop
            maximumAge: 60000 // Allow 1-minute cached position
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
