import { useState, useEffect, useCallback } from 'react';
import { GeolocationState, Location, TrustedLocation } from '@/types';
import { getCurrentLocation, isLocationInTrustedZone } from '@/lib/utils';

export function useGeolocation(trustedLocations: TrustedLocation[]) {
  const [state, setState] = useState<GeolocationState>({
    currentLocation: null,
    isInsideTrustedZone: false,
    isLocationPermissionGranted: false,
    isLoading: false,
    error: null,
  });

  const updateLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const location = await getCurrentLocation();
      const isInTrustedZone = isLocationInTrustedZone(location, trustedLocations);
      
      setState(prev => ({
        ...prev,
        currentLocation: location,
        isInsideTrustedZone: isInTrustedZone,
        isLocationPermissionGranted: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
        isLocationPermissionGranted: false,
      }));
    }
  }, [trustedLocations]);

  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        isLocationPermissionGranted: false,
      }));
      return false;
    }

    try {
      await updateLocation();
      return true;
    } catch {
      return false;
    }
  }, [updateLocation]);

  // Auto-update location every 30 seconds when permission is granted
  useEffect(() => {
    if (!state.isLocationPermissionGranted) return;

    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, [state.isLocationPermissionGranted, updateLocation]);

  return {
    ...state,
    updateLocation,
    requestLocationPermission,
  };
}
