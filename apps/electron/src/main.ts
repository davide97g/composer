import { app, BrowserWindow, ipcMain } from "electron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const BACKEND_PORT = 3001;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const getWebPath = (): string => {
  if (isDev) {
    // In development, use Vite dev server
    return "http://localhost:5173";
  } else {
    // In production, load from packaged resources
    const resourcesPath = process.resourcesPath || app.getAppPath();
    return join(resourcesPath, "web/dist/index.html");
  }
};

const startBackend = async (): Promise<void> => {
  try {
    console.log("Starting backend server...");

    // Import server from agent package
    // Use relative path - works in both dev and production
    const agentServerPath = isDev
      ? "../../agent/src/server.ts"
      : "../../agent/dist/server.js";

    const { startServer } = await import(agentServerPath);
    await startServer(BACKEND_PORT);
    console.log("Backend server started successfully");
  } catch (error) {
    console.error("Failed to start backend server:", error);
    throw error;
  }
};

const createWindow = (): void => {
  // Prevent creating multiple windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  const preloadPath = join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#ffffff",
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual glitches
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL("http://localhost:5173").catch((error) => {
      console.error("Failed to load URL:", error);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    const webPath = getWebPath();
    mainWindow.loadFile(webPath).catch((error) => {
      console.error("Failed to load file:", error);
      // Show error to user
      if (mainWindow) {
        mainWindow.webContents.send("load-error", error.message);
      }
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle navigation errors
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );
};

// Wait for backend to be ready before loading frontend
const waitForBackend = async (): Promise<void> => {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Use dynamic import for fetch in Node.js context
      const { default: fetch } = await import("node-fetch");
      const response = await fetch(
        `http://localhost:${BACKEND_PORT}/api/models`
      );
      if (response.ok) {
        console.log("Backend is ready!");
        return;
      }
    } catch (error) {
      // Backend not ready yet
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Backend failed to start");
};

app.whenReady().then(async () => {
  // Start backend first
  await startBackend().catch((error) => {
    console.error("Failed to start backend:", error);
  });

  // Create window immediately, but wait for backend before showing
  createWindow();

  // Wait for backend to be ready
  try {
    await waitForBackend();
    console.log("Backend is ready, window should be visible");
  } catch (error) {
    console.error("Backend startup timeout:", error);
    // Still show the window, user can see the error
    if (mainWindow) {
      mainWindow.show();
    }
  }

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.focus();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for settings sync
ipcMain.handle("get-api-url", () => {
  return `http://localhost:${BACKEND_PORT}/api`;
});

ipcMain.handle("get-backend-status", async () => {
  try {
    // Use dynamic import for fetch in Node.js context
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/models`);
    return { running: response.ok };
  } catch {
    return { running: false };
  }
});
