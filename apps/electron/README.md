# Composer Electron App

This is the Electron wrapper for the Composer application, bundling both the web frontend and agent backend into a native macOS application.

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Build all dependencies:
```bash
pnpm build
```

3. Run in development mode:
```bash
cd apps/electron
pnpm dev
```

This will:
- Start the Vite dev server for the web app (if not already running)
- Start the agent backend server
- Launch the Electron app

## Building for macOS

From the root directory:

```bash
pnpm dist:mac
```

This will:
1. Build all packages (web, agent, shared)
2. Build the Electron app
3. Package everything into a macOS DMG file

The output will be in `apps/electron/release/`.

## How It Works

- **Frontend**: The React/Vite app is built and bundled into the Electron app
- **Backend**: The Express server runs as a child process, started automatically when the app launches
- **Settings**: API keys and settings can be configured from the UI, and are synced between frontend (localStorage) and backend (file system)

## API Key Configuration

Users can set their OpenAI API key directly from the Settings sidebar in the UI. The key is stored locally and synced to the backend automatically.

