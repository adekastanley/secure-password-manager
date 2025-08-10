export interface Location {
  latitude: number;
  longitude: number;
}

export interface TrustedLocation extends Location {
  id: string;
  name: string;
  radius: number; // in meters
  createdAt: string;
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  masterPasswordHash: string;
  trustedLocations: TrustedLocation[];
  isSetup: boolean;
  encryptionSalt: string;
}

export interface GeolocationState {
  currentLocation: Location | null;
  isInsideTrustedZone: boolean;
  isLocationPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
}
