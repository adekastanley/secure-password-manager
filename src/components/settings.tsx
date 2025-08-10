'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut,
  Globe,
  Home,
  Building,
  AlertCircle,
  Check
} from 'lucide-react';
import { AppSettings, TrustedLocation } from '@/types';
import { generateId, saveToStorage, calculateDistance } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
  onLogout: () => void;
  onBackToVault?: () => void;
  currentLocation: { latitude: number; longitude: number } | null;
}

export function Settings({ settings, onSettingsUpdate, onLogout, currentLocation }: SettingsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TrustedLocation | null>(null);
  const [addMethod, setAddMethod] = useState<'current' | 'manual'>('current');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });

  const {
    currentLocation: geoLocation,
    isLocationPermissionGranted,
    requestLocationPermission,
  } = useGeolocation(settings.trustedLocations);

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      radius: '100',
    });
    setError('');
    setSuccess('');
  };

  const validateCoordinates = (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return 'Invalid coordinates. Please enter valid numbers.';
    }
    
    if (latitude < -90 || latitude > 90) {
      return 'Latitude must be between -90 and 90 degrees.';
    }
    
    if (longitude < -180 || longitude > 180) {
      return 'Longitude must be between -180 and 180 degrees.';
    }
    
    return null;
  };

  const handleAddLocation = () => {
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter a location name.');
      return;
    }

    let latitude: number, longitude: number;

    if (addMethod === 'current') {
      if (!geoLocation) {
        setError('Current location not available. Please enable location access.');
        return;
      }
      latitude = geoLocation.latitude;
      longitude = geoLocation.longitude;
    } else {
      const coordError = validateCoordinates(formData.latitude, formData.longitude);
      if (coordError) {
        setError(coordError);
        return;
      }
      latitude = parseFloat(formData.latitude);
      longitude = parseFloat(formData.longitude);
    }

    const radius = parseInt(formData.radius);
    if (isNaN(radius) || radius < 50 || radius > 5000) {
      setError('Radius must be between 50 and 5000 meters.');
      return;
    }

    // Check if location already exists (within 50 meters)
    const existingLocation = settings.trustedLocations.find(loc => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: loc.latitude, longitude: loc.longitude }
      );
      return distance < 50;
    });

    if (existingLocation) {
      setError(`A trusted location "${existingLocation.name}" already exists very close to this position.`);
      return;
    }

    const newLocation: TrustedLocation = {
      id: generateId(),
      name: formData.name.trim(),
      latitude,
      longitude,
      radius,
      createdAt: new Date().toISOString(),
    };

    const updatedSettings = {
      ...settings,
      trustedLocations: [...settings.trustedLocations, newLocation],
    };

    saveToStorage('SETTINGS', updatedSettings);
    onSettingsUpdate(updatedSettings);
    setSuccess(`Added trusted location "${newLocation.name}"`);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditLocation = () => {
    if (!editingLocation) return;

    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter a location name.');
      return;
    }

    const coordError = validateCoordinates(formData.latitude, formData.longitude);
    if (coordError) {
      setError(coordError);
      return;
    }

    const radius = parseInt(formData.radius);
    if (isNaN(radius) || radius < 50 || radius > 5000) {
      setError('Radius must be between 50 and 5000 meters.');
      return;
    }

    const updatedLocation: TrustedLocation = {
      ...editingLocation,
      name: formData.name.trim(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius,
    };

    const updatedSettings = {
      ...settings,
      trustedLocations: settings.trustedLocations.map(loc =>
        loc.id === editingLocation.id ? updatedLocation : loc
      ),
    };

    saveToStorage('SETTINGS', updatedSettings);
    onSettingsUpdate(updatedSettings);
    setSuccess(`Updated trusted location "${updatedLocation.name}"`);
    resetForm();
    setEditingLocation(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteLocation = (locationId: string) => {
    const locationToDelete = settings.trustedLocations.find(loc => loc.id === locationId);
    
    if (settings.trustedLocations.length === 1) {
      setError('Cannot delete the last trusted location. You need at least one location to access your passwords.');
      return;
    }

    const updatedSettings = {
      ...settings,
      trustedLocations: settings.trustedLocations.filter(loc => loc.id !== locationId),
    };

    saveToStorage('SETTINGS', updatedSettings);
    onSettingsUpdate(updatedSettings);
    setSuccess(`Deleted trusted location "${locationToDelete?.name}"`);
  };

  const openEditDialog = (location: TrustedLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const getLocationIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('home') || lowerName.includes('house')) {
      return <Home className="w-4 h-4" />;
    }
    if (lowerName.includes('office') || lowerName.includes('work') || lowerName.includes('company')) {
      return <Building className="w-4 h-4" />;
    }
    return <MapPin className="w-4 h-4" />;
  };

  const getDistanceFromCurrent = (location: TrustedLocation) => {
    if (!currentLocation) return null;
    const distance = calculateDistance(currentLocation, location);
    return Math.round(distance);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your trusted locations and app settings
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Location Info */}
        {currentLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Latitude: {currentLocation.latitude.toFixed(6)}, 
                Longitude: {currentLocation.longitude.toFixed(6)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trusted Locations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trusted Locations</CardTitle>
                <CardDescription>
                  Locations where you can access your password vault
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Trusted Location</DialogTitle>
                    <DialogDescription>
                      Add a new location where you can access your passwords
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Method Selection */}
                    <div className="space-y-2">
                      <Label>Location Method</Label>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant={addMethod === 'current' ? 'default' : 'outline'}
                          onClick={() => setAddMethod('current')}
                          className="flex-1"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Current Location
                        </Button>
                        <Button
                          type="button"
                          variant={addMethod === 'manual' ? 'default' : 'outline'}
                          onClick={() => setAddMethod('manual')}
                          className="flex-1"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Manual Entry
                        </Button>
                      </div>
                    </div>

                    {/* Location Name */}
                    <div className="space-y-2">
                      <Label htmlFor="location-name">Location Name</Label>
                      <Input
                        id="location-name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Home, Office, Downtown Apartment"
                      />
                    </div>

                    {/* Manual Coordinates */}
                    {addMethod === 'manual' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                              id="latitude"
                              value={formData.latitude}
                              onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                              placeholder="e.g., 40.7128"
                              type="number"
                              step="any"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                              id="longitude"
                              value={formData.longitude}
                              onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                              placeholder="e.g., -74.0060"
                              type="number"
                              step="any"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You can get coordinates from Google Maps by right-clicking on a location.
                        </p>
                      </>
                    )}

                    {/* Current Location Status */}
                    {addMethod === 'current' && !isLocationPermissionGranted && (
                      <Alert>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          Location access required for current location.
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={requestLocationPermission}
                          >
                            Enable Location
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Radius */}
                    <div className="space-y-2">
                      <Label htmlFor="radius">Radius (meters)</Label>
                      <Input
                        id="radius"
                        type="number"
                        value={formData.radius}
                        onChange={(e) => setFormData({...formData, radius: e.target.value})}
                        min="50"
                        max="5000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 100-200m for homes, 500-1000m for large areas
                      </p>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(false);
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddLocation}
                        disabled={
                          !formData.name.trim() || 
                          (addMethod === 'manual' && (!formData.latitude || !formData.longitude)) ||
                          (addMethod === 'current' && !geoLocation)
                        }
                      >
                        Add Location
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.trustedLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {getLocationIcon(location.name)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{location.name}</h3>
                      {currentLocation && getDistanceFromCurrent(location) !== null && (
                        <Badge variant={getDistanceFromCurrent(location)! <= location.radius ? 'default' : 'outline'}>
                          {getDistanceFromCurrent(location)}m away
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} • {location.radius}m radius
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(location.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(location)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLocation(location.id)}
                    disabled={settings.trustedLocations.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edit Location Dialog */}
        {editingLocation && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Trusted Location</DialogTitle>
                <DialogDescription>
                  Update the details of this trusted location
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Location Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-latitude">Latitude</Label>
                    <Input
                      id="edit-latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-longitude">Longitude</Label>
                    <Input
                      id="edit-longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-radius">Radius (meters)</Label>
                  <Input
                    id="edit-radius"
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({...formData, radius: e.target.value})}
                    min="50"
                    max="5000"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    resetForm();
                    setEditingLocation(null);
                    setIsEditDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditLocation}>
                    Update Location
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
