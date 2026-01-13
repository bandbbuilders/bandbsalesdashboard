import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Office coordinates: P39F+5C Islamabad, Pakistan
// Converted to lat/lng: approximately 33.6973, 73.0551
const OFFICE_COORDINATES = {
  latitude: 33.6973,
  longitude: 73.0551,
  radiusMeters: 200 // 200 meter radius for office area
};

const STANDARD_IN_TIME = "10:00";
const GRACE_PERIOD = 15;

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

const calculateStatus = (checkIn: string): { status: "present" | "late"; isLate: boolean } => {
  const [hours, minutes] = checkIn.split(':').map(Number);
  const [stdHours, stdMinutes] = STANDARD_IN_TIME.split(':').map(Number);
  
  const checkInMinutes = hours * 60 + minutes;
  const standardTime = stdHours * 60 + stdMinutes;
  const graceTime = standardTime + GRACE_PERIOD;

  if (checkInMinutes <= graceTime) {
    return { status: "present", isLate: checkInMinutes > standardTime };
  } else {
    return { status: "late", isLate: true };
  }
};

export const useAutoAttendance = (userName: string | null) => {
  const [isChecking, setIsChecking] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  useEffect(() => {
    if (!userName || isChecking || attendanceMarked) return;

    const checkLocationAndMarkAttendance = async () => {
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

            if (distance <= OFFICE_COORDINATES.radiusMeters) {
              // User is at office - mark attendance
              const now = new Date();
              const checkInTime = format(now, 'HH:mm');
              const { status, isLate } = calculateStatus(checkInTime);

              const { error } = await supabase.from('attendance').insert({
                user_name: userName,
                date: today,
                check_in: checkInTime,
                status,
                is_late: isLate,
              });

              if (error) {
                console.error('Error marking attendance:', error);
              } else {
                toast.success(`Attendance marked automatically! Check-in: ${checkInTime}`, {
                  description: isLate ? 'You arrived late today' : 'On time! Great job!',
                  duration: 5000,
                });
                setAttendanceMarked(true);
              }
            } else {
              console.log('User is not at office location');
            }
            setIsChecking(false);
          },
          (error) => {
            console.log('Geolocation error:', error.message);
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
  }, [userName, isChecking, attendanceMarked]);

  return { isChecking, attendanceMarked };
};
