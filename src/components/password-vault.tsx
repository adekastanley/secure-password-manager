'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Shield, 
  ShieldOff,
  MapPin,
  Lock,
  Search,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';
import { PasswordEntry, AppSettings } from '@/types';
import { encryptData, decryptData, generateId, saveToStorage, loadFromStorage } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';

interface PasswordVaultProps {
  settings: AppSettings;
  masterPassword: string;
  onShowSettings: () => void;
}

export function PasswordVault({ settings, masterPassword, onShowSettings }: PasswordVaultProps) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: '',
  });

  const {
    currentLocation,
    isInsideTrustedZone,
    isLocationPermissionGranted,
    isLoading: locationLoading,
    error: locationError,
    requestLocationPermission,
  } = useGeolocation(settings.trustedLocations);

  useEffect(() => {
    if (isInsideTrustedZone) {
      loadPasswords();
    }
  }, [isInsideTrustedZone]);

  useEffect(() => {
    // Request location permission on mount
    if (!isLocationPermissionGranted) {
      requestLocationPermission();
    }
  }, [isLocationPermissionGranted, requestLocationPermission]);

  const loadPasswords = () => {
    try {
      const encrypted = loadFromStorage<string>('PASSWORDS');
      if (encrypted) {
        const decrypted = decryptData(encrypted, masterPassword);
        const parsed = JSON.parse(decrypted);
        setPasswords(parsed);
      }
    } catch (error) {
      console.error('Failed to load passwords:', error);
    }
  };

  const savePasswords = (newPasswords: PasswordEntry[]) => {
    try {
      const encrypted = encryptData(JSON.stringify(newPasswords), masterPassword);
      saveToStorage('PASSWORDS', encrypted);
      setPasswords(newPasswords);
    } catch (error) {
      console.error('Failed to save passwords:', error);
    }
  };

  const handleAddPassword = () => {
    const newPassword: PasswordEntry = {
      id: generateId(),
      title: formData.title,
      username: formData.username,
      password: formData.password,
      website: formData.website,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPasswords = [...passwords, newPassword];
    savePasswords(updatedPasswords);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleUpdatePassword = () => {
    if (!editingPassword) return;

    const updatedPassword: PasswordEntry = {
      ...editingPassword,
      title: formData.title,
      username: formData.username,
      password: formData.password,
      website: formData.website,
      notes: formData.notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedPasswords = passwords.map(p => 
      p.id === editingPassword.id ? updatedPassword : p
    );
    savePasswords(updatedPasswords);
    resetForm();
    setEditingPassword(null);
  };

  const handleDeletePassword = (id: string) => {
    const updatedPasswords = passwords.filter(p => p.id !== id);
    savePasswords(updatedPasswords);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      username: '',
      password: '',
      website: '',
      notes: '',
    });
  };

  const openEditDialog = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      title: password.title,
      username: password.username,
      password: password.password,
      website: password.website || '',
      notes: password.notes || '',
    });
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const filteredPasswords = passwords.filter(password =>
    password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.website?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show location access request if not granted
  if (!isLocationPermissionGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Location Access Required</CardTitle>
            <CardDescription>
              This app requires location access to verify you're in a trusted zone before unlocking your passwords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={requestLocationPermission} disabled={locationLoading}>
              {locationLoading ? 'Requesting Access...' : 'Enable Location Access'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if outside trusted zone
  if (isLocationPermissionGranted && !isInsideTrustedZone && !locationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldOff className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You're currently outside your trusted locations. Move to a trusted zone to access your password vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">Trusted Locations:</p>
              {settings.trustedLocations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>{location.name}</span>
                  <Badge variant="outline">{location.radius}m</Badge>
                </div>
              ))}
            </div>
            {currentLocation && (
              <p className="text-xs text-muted-foreground">
                Current: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Password Vault</h1>
              <p className="text-sm text-muted-foreground flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                Secured by geofencing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Zone: Trusted
            </Badge>
            <Button variant="outline" onClick={onShowSettings}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Password</DialogTitle>
                <DialogDescription>
                  Add a new password entry to your secure vault.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Gmail, Facebook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username/Email</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPassword} disabled={!formData.title || !formData.username || !formData.password}>
                    Add Password
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Password List */}
        <div className="space-y-4">
          {filteredPasswords.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No passwords found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No passwords match your search.' : 'Add your first password to get started.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Password
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPasswords.map((password) => (
              <Card key={password.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {password.website ? (
                          <Globe className="w-5 h-5 text-primary" />
                        ) : (
                          <Lock className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{password.title}</h3>
                        <p className="text-sm text-muted-foreground">{password.username}</p>
                        {password.website && (
                          <p className="text-xs text-muted-foreground">{password.website}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(password.username, 'username')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center">
                        <Input
                          type={visiblePasswords.has(password.id) ? 'text' : 'password'}
                          value={password.password}
                          readOnly
                          className="w-24 text-center mr-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePasswordVisibility(password.id)}
                          className="mr-1"
                        >
                          {visiblePasswords.has(password.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(password.password, 'password')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditDialog(password)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePassword(password.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        {editingPassword && (
          <Dialog open={!!editingPassword} onOpenChange={() => setEditingPassword(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Password</DialogTitle>
                <DialogDescription>
                  Update your password entry.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username/Email</Label>
                  <Input
                    id="edit-username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Password</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    resetForm();
                    setEditingPassword(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePassword}>
                    Update Password
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
