'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { loadFromStorage } from '@/lib/utils';
import { Setup } from '@/components/setup';
import { Login } from '@/components/login';
import { PasswordVault } from '@/components/password-vault';
import { Settings } from '@/components/settings';
import { useGeolocation } from '@/hooks/useGeolocation';

type AppState = 'setup' | 'login' | 'vault' | 'settings';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get current location for settings page
  const { currentLocation } = useGeolocation(settings?.trustedLocations || []);

  useEffect(() => {
    // Check if the app is already set up
    const storedSettings = loadFromStorage<AppSettings>('SETTINGS');
    if (storedSettings && storedSettings.isSetup) {
      setSettings(storedSettings);
      setAppState('login');
    } else {
      setAppState('setup');
    }
    setIsLoading(false);
  }, []);

  const handleSetupComplete = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setAppState('login');
  };

  const handleLoginSuccess = (password: string) => {
    setMasterPassword(password);
    setAppState('vault');
  };

  const handleShowSettings = () => {
    setAppState('settings');
  };

  const handleBackToVault = () => {
    setAppState('vault');
  };

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleLogout = () => {
    setMasterPassword('');
    setAppState('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'setup':
      return <Setup onSetupComplete={handleSetupComplete} />;
    
    case 'login':
      return settings ? (
        <Login settings={settings} onLoginSuccess={handleLoginSuccess} />
      ) : null;
    
    case 'vault':
      return settings ? (
        <PasswordVault 
          settings={settings} 
          masterPassword={masterPassword} 
          onShowSettings={handleShowSettings}
        />
      ) : null;
    
    case 'settings':
      return settings ? (
        <Settings 
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          onLogout={handleLogout}
          onBackToVault={handleBackToVault}
          currentLocation={currentLocation}
        />
      ) : null;
    
    default:
      return null;
  }
}
