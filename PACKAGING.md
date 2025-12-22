# Packaging Composer for macOS

This guide explains how to package the Composer application as a native macOS app using Electron.

## Prerequisites

1. **Node.js and pnpm**: Make sure you have Node.js installed and pnpm as your package manager
2. **macOS**: You need to be on macOS to build for macOS
3. **Dependencies**: Install all dependencies first

```bash
pnpm install
```

## Building the Application

### Step 1: Build All Packages

First, build all the packages (web frontend, agent backend, and shared):

```bash
pnpm build
```

This will:
- Build the React frontend (`apps/web`)
- Build the Express backend (`apps/agent`)
- Build the shared package (`packages/shared`)
- Build the Electron wrapper (`apps/electron`)

### Step 2: Package for macOS

From the root directory, run:

```bash
pnpm dist:mac
```

Or from the electron directory:

```bash
cd apps/electron
pnpm dist
```

This will create a DMG file in `apps/electron/release/` that you can distribute.

## How It Works

### Architecture

- **Frontend**: The React/Vite app is built and bundled into the Electron app
- **Backend**: The Express server runs as a child process, automatically started when the app launches
- **Settings**: API keys and settings are stored locally and synced between frontend and backend

### File Structure in Packaged App

```
Composer.app/
├── Contents/
│   ├── MacOS/
│   │   └── Composer (Electron executable)
│   └── Resources/
│       ├── app.asar (Electron app bundle)
│       ├── agent/ (Backend server files)
│       └── web/dist/ (Frontend files)
```

### Settings Storage

- **Frontend**: Settings are stored in browser localStorage (managed by Electron)
- **Backend**: Settings are stored in `~/.composer/settings.json`

When you save settings from the UI, they are automatically synced to the backend via the API.

## API Key Configuration

Users can set their OpenAI API key directly from the Settings sidebar in the UI:

1. Open the app
2. Click the Settings button
3. Expand the "AI Model" section
4. Enter your OpenAI API key
5. Click "Save Settings"

The API key is stored locally and never sent anywhere except to OpenAI's API.

## Development Mode

To run the app in development mode:

```bash
# Terminal 1: Start the web dev server
cd apps/web
pnpm dev

# Terminal 2: Start the agent server
cd apps/agent
pnpm dev

# Terminal 3: Start Electron
cd apps/electron
pnpm dev
```

## Troubleshooting

### Backend Not Starting

If the backend doesn't start in the packaged app:
1. Check the console logs in the Electron DevTools
2. Ensure all dependencies are included in the build
3. Verify the agent dist files are in `extraResources`

### Settings Not Syncing

If settings aren't syncing between frontend and backend:
1. Check that the backend API is running on port 3001
2. Verify the API URL is correct (should be `http://localhost:3001/api`)
3. Check browser console for errors

### Build Errors

If you encounter build errors:
1. Make sure all packages are built: `pnpm build`
2. Check that all dependencies are installed: `pnpm install`
3. Verify TypeScript compilation: `cd apps/electron && pnpm build`

## Customization

### App Icon

To add a custom app icon:
1. Create a 512x512 PNG icon
2. Convert to .icns format:
   ```bash
   iconutil -c icns icon.iconset
   ```
3. Place the icon at `apps/electron/build/icon.icns`
4. Update `apps/electron/package.json` to reference it

### App Name and ID

Edit `apps/electron/package.json`:
- `productName`: Display name of the app
- `appId`: Bundle identifier (e.g., `com.yourcompany.composer`)

