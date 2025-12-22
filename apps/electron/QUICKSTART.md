# Quick Start Guide

## Building and Packaging for macOS

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Everything

```bash
pnpm build
```

This builds:
- Web frontend
- Agent backend  
- Shared package
- Electron wrapper

### 3. Package for macOS

```bash
pnpm dist:mac
```

The DMG file will be created in `apps/electron/release/`

## Running in Development

```bash
# Terminal 1: Web dev server
cd apps/web && pnpm dev

# Terminal 2: Agent server  
cd apps/agent && pnpm dev

# Terminal 3: Electron app
cd apps/electron && pnpm dev
```

## Setting API Key

1. Open the app
2. Click Settings (gear icon)
3. Expand "AI Model" section
4. Enter your OpenAI API key
5. Click "Save Settings"

The API key is stored locally in `~/.composer/settings.json`

