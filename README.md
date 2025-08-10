# Secure Password Manager with Geofencing

A Next.js-based password manager that uses geofencing technology to secure access to your passwords. You can only access your password vault when you're within predefined trusted locations.

## 🚀 Features

### Core Security Features
- **Geofencing Protection**: Access your passwords only from trusted locations
- **AES Encryption**: All passwords are encrypted using AES encryption
- **Master Password**: Single master password to unlock your vault
- **Real-time Location Monitoring**: Continuous location verification every 30 seconds
- **Zero-Knowledge Architecture**: All data is encrypted locally, never transmitted

### Password Management
- **Add/Edit/Delete Passwords**: Full CRUD operations for password entries
- **Search Functionality**: Quickly find passwords by title, username, or website
- **Copy to Clipboard**: One-click copying of usernames and passwords
- **Password Visibility Toggle**: Show/hide passwords as needed
- **Website Integration**: Store website URLs with password entries
- **Notes Support**: Add additional notes to password entries

### Location Management
- **Current Location Detection**: Automatically detect and add your current location
- **Manual Coordinate Entry**: Add trusted locations by entering GPS coordinates
- **Multiple Trusted Zones**: Support for home, office, and other locations
- **Location Editing**: Modify existing trusted locations and their radius
- **Distance Display**: See how far you are from each trusted location
- **Smart Icons**: Automatic icon assignment based on location names

### User Experience
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme Support**: Automatic theme detection
- **Intuitive Setup Flow**: Easy onboarding process

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, React
- **UI Components**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **Encryption**: crypto-js
- **Geolocation**: Browser Geolocation API
- **Storage**: Browser LocalStorage (encrypted)

## 📱 How It Works

### 1. Initial Setup
1. **Master Password**: Create a strong master password
2. **Trusted Locations**: Add locations where you want to access your passwords
3. **Radius Configuration**: Set the radius (50-1000 meters) for each trusted location

### 2. Accessing Your Vault
1. **Location Check**: App automatically checks if you're in a trusted zone
2. **Master Password**: Enter your master password to unlock the vault
3. **Access Granted**: View and manage your passwords

### 3. Security Features
- **Automatic Logout**: Vault locks when you leave trusted locations
- **Real-time Monitoring**: Location is checked every 30 seconds
- **Encrypted Storage**: All data is encrypted before storage
- **No Server Communication**: Everything runs locally in your browser

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-password-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### First-Time Setup

1. **Master Password Creation**
   - Choose a strong password (minimum 8 characters)
   - This password will encrypt all your data
   - **Important**: If you forget this password, your data cannot be recovered

2. **Location Setup**
   - Allow location access when prompted
   - Add your current location as a "trusted zone"
   - Set an appropriate radius (recommended: 100-200 meters for home/office)
   - You can add multiple trusted locations

### Managing Passwords

1. **Adding Passwords**
   - Click "Add Password" button
   - Fill in title, username, password, and optional website/notes
   - Password is automatically encrypted and saved

2. **Using Passwords**
   - Search for passwords using the search bar
   - Click the eye icon to reveal passwords
   - Click the copy icon to copy usernames or passwords
   - Use the dropdown menu to edit or delete entries

### Security Best Practices

1. **Master Password**
   - Use a unique, strong password
   - Don't use the same password elsewhere
   - Consider using a memorable passphrase

2. **Trusted Locations**
   - Only add locations you frequently use
   - Use appropriate radius sizes (not too large)
   - Regularly review and update locations

3. **Regular Maintenance**
   - Update stored passwords regularly
   - Remove unused password entries
   - Test location access periodically

## 🔒 Security Architecture

### Encryption
- **Algorithm**: AES encryption using crypto-js
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Salt**: Unique salt generated for each user
- **Data**: All passwords and sensitive data are encrypted before storage

### Geolocation Security
- **Distance Calculation**: Haversine formula for accurate distance calculation
- **Permission Handling**: Graceful handling of location permission states
- **Privacy**: Location data never leaves your device

### Storage Security
- **Local Only**: All data stored in browser's localStorage
- **No Cloud Sync**: No data transmitted to external servers
- **Encrypted Storage**: All stored data is encrypted

## 🌐 Browser Compatibility

### Supported Browsers
- Chrome 50+
- Firefox 55+
- Safari 11+
- Edge 79+

### Required Features
- Geolocation API support
- Crypto API support (for secure random generation)
- LocalStorage support
- Modern JavaScript (ES2020+)

## 🚨 Important Security Notes

1. **Data Recovery**: There is no way to recover your data if you forget your master password
2. **Location Privacy**: Your location data never leaves your device
3. **Local Storage**: All data is stored locally - clearing browser data will delete your passwords
4. **HTTPS Required**: For production use, ensure the app is served over HTTPS
5. **Regular Backups**: Consider exporting and backing up your encrypted data periodically

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── setup.tsx       # Initial setup component
│   ├── login.tsx       # Login component
│   └── password-vault.tsx # Main vault component
├── hooks/              # Custom React hooks
│   └── useGeolocation.ts # Geolocation management
├── lib/                # Utility functions
│   └── utils.ts        # Crypto, geolocation, storage utilities
└── types/              # TypeScript type definitions
    └── index.ts        # App-wide type definitions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

This project is for educational and demonstration purposes. Please ensure you comply with all applicable security and privacy regulations when using this software.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add appropriate tests
5. Submit a pull request

## ⚠️ Disclaimers

- This is a demonstration project and should be thoroughly tested before production use
- Always follow security best practices when handling sensitive data
- Regular security audits are recommended for production deployments
- Users are responsible for maintaining their own data backups
