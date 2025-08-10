"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
// import { Badge } from '@/components/ui/badge';
import { MapPin, Lock, Shield, AlertCircle } from "lucide-react";
import { AppSettings, TrustedLocation } from "@/types";
import {
	generateSalt,
	hashPassword,
	generateId,
	saveToStorage,
} from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";

interface SetupProps {
	onSetupComplete: (settings: AppSettings) => void;
}

export function Setup({ onSetupComplete }: SetupProps) {
	const [step, setStep] = useState<"password" | "location">("password");
	const [masterPassword, setMasterPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [locationName, setLocationName] = useState("");
	const [radius, setRadius] = useState(100);
	const [trustedLocations, setTrustedLocations] = useState<TrustedLocation[]>(
		[]
	);
	const [error, setError] = useState("");

	const {
		currentLocation,
		isInsideTrustedZone,
		isLocationPermissionGranted,
		isLoading,
		error: geoError,
		requestLocationPermission,
	} = useGeolocation(trustedLocations);

	const validatePassword = () => {
		if (masterPassword.length < 8) {
			setError("Password must be at least 8 characters long");
			return false;
		}
		if (masterPassword !== confirmPassword) {
			setError("Passwords do not match");
			return false;
		}
		setError("");
		return true;
	};

	const handlePasswordSetup = () => {
		if (validatePassword()) {
			setStep("location");
			if (!isLocationPermissionGranted) {
				requestLocationPermission();
			}
		}
	};

	const addTrustedLocation = () => {
		if (!currentLocation) {
			setError("Please allow location access first");
			return;
		}
		if (!locationName.trim()) {
			setError("Please enter a location name");
			return;
		}

		const newLocation: TrustedLocation = {
			id: generateId(),
			name: locationName.trim(),
			latitude: currentLocation.latitude,
			longitude: currentLocation.longitude,
			radius,
			createdAt: new Date().toISOString(),
		};

		setTrustedLocations([...trustedLocations, newLocation]);
		setLocationName("");
		setError("");
	};

	const removeTrustedLocation = (id: string) => {
		setTrustedLocations(trustedLocations.filter((loc) => loc.id !== id));
	};

	const completeSetup = () => {
		if (trustedLocations.length === 0) {
			setError("Please add at least one trusted location");
			return;
		}

		const salt = generateSalt();
		const masterPasswordHash = hashPassword(masterPassword, salt);

		const settings: AppSettings = {
			masterPasswordHash,
			trustedLocations,
			isSetup: true,
			encryptionSalt: salt,
		};

		saveToStorage("SETTINGS", settings);
		onSetupComplete(settings);
	};

	if (step === "password") {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
							<Shield className="w-6 h-6 text-primary" />
						</div>
						<CardTitle className="text-2xl">Secure Password Manager</CardTitle>
						<CardDescription>
							Set up your master password to secure your password vault
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="master-password">Master Password</Label>
							<Input
								id="master-password"
								type="password"
								value={masterPassword}
								onChange={(e) => setMasterPassword(e.target.value)}
								placeholder="Enter a strong master password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm Password</Label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm your master password"
							/>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Button onClick={handlePasswordSetup} className="w-full">
							<Lock className="w-4 h-4 mr-2" />
							Continue to Location Setup
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
						<MapPin className="w-6 h-6 text-primary" />
					</div>
					<CardTitle className="text-2xl">Geofencing Setup</CardTitle>
					<CardDescription>
						Add trusted locations where you can access your passwords. You must
						be within these zones to unlock your vault.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{!isLocationPermissionGranted && (
						<Alert>
							<MapPin className="h-4 w-4" />
							<AlertDescription>
								Please enable location access to add trusted locations.
								<Button
									variant="outline"
									size="sm"
									className="ml-2"
									onClick={requestLocationPermission}
									disabled={isLoading}
								>
									{isLoading ? "Getting Location..." : "Enable Location"}
								</Button>
							</AlertDescription>
						</Alert>
					)}

					{geoError && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{geoError}</AlertDescription>
						</Alert>
					)}

					{currentLocation && (
						<div className="space-y-4 p-4 border rounded-lg">
							<h3 className="font-medium">Add Current Location</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="location-name">Location Name</Label>
									<Input
										id="location-name"
										value={locationName}
										onChange={(e) => setLocationName(e.target.value)}
										placeholder="e.g., Home, Office"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="radius">Radius (meters)</Label>
									<Input
										id="radius"
										type="number"
										value={radius}
										onChange={(e) => setRadius(Number(e.target.value))}
										min="50"
										max="1000"
									/>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">
								Current: {currentLocation.latitude.toFixed(6)},{" "}
								{currentLocation.longitude.toFixed(6)}
							</p>
							<Button
								onClick={addTrustedLocation}
								disabled={!locationName.trim()}
							>
								Add Trusted Location
							</Button>
						</div>
					)}

					{trustedLocations.length > 0 && (
						<div className="space-y-4">
							<Separator />
							<h3 className="font-medium">
								Trusted Locations ({trustedLocations.length})
							</h3>
							<div className="space-y-2">
								{trustedLocations.map((location) => (
									<div
										key={location.id}
										className="flex items-center justify-between p-3 border rounded-lg"
									>
										<div>
											<p className="font-medium">{location.name}</p>
											<p className="text-sm text-muted-foreground">
												{location.radius}m radius •{" "}
												{location.latitude.toFixed(4)},{" "}
												{location.longitude.toFixed(4)}
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => removeTrustedLocation(location.id)}
										>
											Remove
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="flex justify-between pt-4">
						<Button variant="outline" onClick={() => setStep("password")}>
							Back to Password
						</Button>
						<Button
							onClick={completeSetup}
							disabled={trustedLocations.length === 0}
						>
							Complete Setup
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
