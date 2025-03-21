# 1. Getting Started

## Overview & Requirements

### Description
E-SBSL is a Chrome extension that provides secure document operations through e-signature integration. It enables users to sign, encrypt, and verify documents using USB-based smart cards.


## Build & Installation

### Development Build
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
### Build
1. Create production build:
   ```bash
   npm run build
   ```
2. The build output will be in the `dist` directory

### Extension Installation
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` directory

## Native Host Setup

### Configuration
1. Create native messaging host manifest at:
   - Windows: `%LOCALAPPDATA%\Google\Chrome\NativeMessagingHosts\`
   - Linux: `~/.config/google-chrome/NativeMessagingHosts/`
   - macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`

2. Add manifest JSON:
   ```json
   {
     "name": "com.esbsl.native_host",
     "description": "E-SBSL Native Host",
     "path": "[ABSOLUTE_PATH_TO_NATIVE_HOST]",
     "type": "stdio",
     "allowed_origins": [
       "chrome-extension://[EXTENSION_ID]/"
     ]
   }
   ```

### Verification
1. Install the extension
2. Open extension popup
3. Attempt to connect with smart card
4. Check Chrome's console for connection logs

## Troubleshooting
- If native messaging fails, verify the manifest path and permissions
- For build errors, ensure all dependencies are correctly installed
- Extension ID must match between native host manifest and Chrome







# 2. Architecture Overview

## Project Structure
```
src/
├── components/
│   ├── common/                 # Reusable UI components
│   │   ├── Modal.jsx
│   │   └── Notification.jsx
│   ├── features/              # Feature-specific components
│   │   ├── auth/             # Authentication related
│   │   ├── encryption/       # Encryption related
│   │   ├── settings/        # Settings related
│   │   └── signing/         # Document signing related
│   └── ExtensionUI.js        # Main UI component
├── contexts/                  # React Context providers
├── hooks/                    # Custom React hooks
├── pages/                    # Entry points
└── utils/                    # Utility functions
```

## Key Components

### Core Components
1. **ExtensionUI** (`ExtensionUI.js`)
   - Main container component
   - Manages tab navigation
   - Handles authentication state
   - Implements dark/light mode

2. **Feature Components**
   - `AuthScreen`: Initial login interface
   - `SigningTab`: Document signing operations
   - `EncryptionTab`: Document encryption operations
   - `SettingsTab`: User preferences and configuration

3. **Common Components**
   - `Modal`: Reusable modal dialog
   - `Notification`: Toast notification system

### Browser Integration
- `browserApi.js`: Native messaging interface
  - Handles communication with native host
  - Manages document operations
  - Processes authentication requests

## State Management

### Context Providers
1. **AuthContext**
   ```javascript
   {
     isAuthenticated: boolean,
     showPinModal: boolean,
     pin: string,
     handlePinSubmit: () => void,
     handleLogout: () => void
   }
   ```

2. **NotificationContext**
   ```javascript
   {
     notification: { message: string, type: string },
     showNotification: (message, type) => void
   }
   ```

3. **ThemeContext**
   ```javascript
   {
     darkMode: boolean,
     toggleDarkMode: () => void
   }
   ```

### Custom Hooks
1. **useEncryption**
   - Manages document encryption/decryption
   - Handles file selection
   - Processes encryption operations

2. **useSigning**
   - Manages document signing
   - Handles signature verification
   - Processes signing operations

3. **useFileSelection**
   - Common file selection functionality
   - Handles file input operations

### Data Flow
1. User actions trigger hook methods
2. Hooks communicate with native host via browserApi
3. Responses update context state
4. UI components react to state changes






# 3. Core Features

## Authentication

### Login Flow
1. User initiates login through AuthScreen
2. PinModal component activates
3. User enters PIN for smart card
4. PIN verification process:
   ```javascript
   // Authentication request
   const response = await browserApi.verifyPIN(pin);
   if (response.success) {
     setIsAuthenticated(true);
   }
   ```

### Session Management
- Authentication state maintained in AuthContext
- Regular re-authentication through background checks
- Secure logout procedure clearing sensitive data

## Document Operations

### Document Signing
1. **Signing Process**
   ```javascript
   const handleSignDocument = async (file) => {
     const response = await browserApi.signDocument(file.name);
     // Process response and show notification
   };
   ```

2. **Signature Verification**
   ```javascript
   const handleVerifySignature = async (file, signature) => {
     const response = await browserApi.verifySignature(
       file.name, 
       signature.name
     );
     // Verify signature and show result
   };
   ```

### Encryption Operations
1. **Document Encryption**
   ```javascript
   const handleEncrypt = async (file) => {
     const response = await browserApi.encryptData(file.name);
     // Process encrypted data
   };
   ```

2. **Document Decryption**
   ```javascript
   const handleDecrypt = async (file, keyFile) => {
     const response = await browserApi.decryptData(
       file.name, 
       keyFile.name
     );
     // Process decrypted data
   };
   ```

## Extension APIs

### Native Messaging Interface
```javascript
const browserApi = {
  sendMessageToNative: async (module, method, params = {}) => {
    const message = {
      module,
      method,
      params
    };
    return await chrome.runtime.sendNativeMessage(
      'com.esbsl.native_host',
      message
    );
  }
};
```

### Available API Methods
1. **Authentication**
   - `verifyPIN(pin)`
   - Response: `{ success: boolean, message: string }`

2. **Document Signing**
   - `signDocument(filename)`
   - `verifySignature(filename, signature)`
   - Response: `{ success: boolean, data?: string }`

3. **Encryption**
   - `encryptData(filename)`
   - `decryptData(filename, keyfile)`
   - Response: `{ success: boolean, data?: string }`
