import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow, ipcMain } from "electron";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
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

const getBackendPath = (): string => {
  if (isDev) {
    // In development, run from source
    return join(__dirname, "../../agent/src/index.ts");
  } else {
    // In production, run from packaged resources
    // extraResources are placed in Contents/Resources/
    const resourcesPath = process.resourcesPath;
    if (!resourcesPath) {
      throw new Error("Could not find resources path");
    }
    return join(resourcesPath, "agent/dist/index.js");
  }
};

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

const getBackendCommand = (): { command: string; args: string[] } => {
  if (isDev) {
    return {
      command: "tsx",
      args: [getBackendPath()],
    };
  } else {
    // In production, use the bundled Node.js from Electron
    // Ensure the path is absolute for ES modules
    const backendPath = getBackendPath();
    const absolutePath = resolve(backendPath);

    return {
      command: process.execPath, // Use Electron's Node.js
      args: [absolutePath],
    };
  }
};

const startBackend = async (): Promise<void> => {
  if (backendProcess) {
    console.log("Backend already running");
    return;
  }

  const { command, args } = getBackendCommand();
  const backendPath = getBackendPath();

  // Verify backend file exists in production
  if (!isDev) {
    const fs = await import("fs");
    if (!fs.existsSync(backendPath)) {
      const error = `Backend file not found at: ${backendPath}`;
      console.error(error);
      throw new Error(error);
    }
    console.log(`Verified backend file exists: ${backendPath}`);
  }

  console.log(`Starting backend with: ${command} ${args.join(" ")}`);

  // Get the path to node_modules for the agent dependencies
  // In packaged apps, unpacked modules are in app.asar.unpacked/node_modules
  let nodeModulesPath: string;
  if (isDev) {
    nodeModulesPath = join(__dirname, "../../node_modules");
  } else {
    // In production, node_modules are unpacked via asarUnpack
    // app.getAppPath() returns path like: /path/to/Composer.app/Contents/Resources/app.asar
    // app.asar.unpacked is at: /path/to/Composer.app/Contents/Resources/app.asar.unpacked
    const appPath = app.getAppPath();
    const unpackedPath = appPath.replace(/\.asar$/, ".asar.unpacked");
    nodeModulesPath = join(unpackedPath, "node_modules");

    console.log(`App path: ${appPath}`);
    console.log(`Unpacked path: ${unpackedPath}`);
    console.log(`Node modules path: ${nodeModulesPath}`);

    // Verify node_modules exists
    const fs = await import("fs");
    if (!fs.existsSync(nodeModulesPath)) {
      console.warn(`Warning: node_modules not found at ${nodeModulesPath}`);
    }
  }

  console.log(`Backend path: ${backendPath}`);
  console.log(`NODE_PATH: ${nodeModulesPath}`);

  const cwd = isDev
    ? join(__dirname, "../../")
    : process.resourcesPath || app.getAppPath();

  console.log(`Working directory: ${cwd}`);

  // For ES modules, we need to ensure node_modules can be found
  // ES modules resolve node_modules relative to the file location, walking up the directory tree
  // The agent code is at: resourcesPath/agent/dist/index.js
  // node_modules are at: app.asar.unpacked/node_modules
  // We need to ensure node_modules are accessible from the agent's location
  let agentCwd: string;

  if (isDev) {
    agentCwd = join(__dirname, "../../");
  } else {
    // Set working directory to resourcesPath so relative paths work
    // But we also need to ensure node_modules are accessible
    agentCwd = process.resourcesPath || app.getAppPath();

    // Try to create a symlink from resourcesPath/node_modules to app.asar.unpacked/node_modules
    // This allows ES modules to resolve dependencies
    const fs = await import("fs");
    const { existsSync, lstatSync } = fs;
    const unpackedNodeModules = nodeModulesPath;
    const resourcesNodeModules = join(
      process.resourcesPath || "",
      "node_modules"
    );

    try {
      if (existsSync(unpackedNodeModules)) {
        if (!existsSync(resourcesNodeModules)) {
          // Create symlink if it doesn't exist
          fs.symlinkSync(unpackedNodeModules, resourcesNodeModules, "dir");
          console.log(
            `Created symlink: ${resourcesNodeModules} -> ${unpackedNodeModules}`
          );
        } else {
          // Check if it's already a symlink pointing to the right place
          const stats = lstatSync(resourcesNodeModules);
          if (!stats.isSymbolicLink()) {
            console.log(
              `Warning: ${resourcesNodeModules} exists but is not a symlink`
            );
          }
        }
      }
    } catch (error) {
      // Symlink creation failed - log but continue
      console.error(`Could not create symlink: ${error}`);
      console.log(
        `Agent will try to resolve modules from: ${unpackedNodeModules}`
      );
    }
  }

  // In production, ES modules resolve node_modules relative to the file location
  // We need to ensure node_modules are accessible from the backend file location
  const env = {
    ...process.env,
    NODE_ENV: "production",
    // NODE_PATH doesn't work for ES modules, but we set it anyway for any CommonJS deps
    NODE_PATH: nodeModulesPath,
    // Ensure the agent can find its dependencies
    PATH: process.env.PATH,
  };

  console.log(`Spawning backend process:`);
  console.log(`  Command: ${command}`);
  console.log(`  Args: ${JSON.stringify(args)}`);
  console.log(`  CWD: ${agentCwd}`);
  console.log(`  NODE_PATH: ${nodeModulesPath}`);

  backendProcess = spawn(command, args, {
    cwd: agentCwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Handle stdout with error handling
  if (backendProcess.stdout) {
    backendProcess.stdout.on("data", (data) => {
      try {
        const output = data.toString();
        if (output.trim()) {
          console.log(`[Backend] ${output}`);
        }
      } catch (error) {
        // Ignore EPIPE errors when process exits
        if ((error as NodeJS.ErrnoException).code !== "EPIPE") {
          console.error("Error reading backend stdout:", error);
        }
      }
    });

    backendProcess.stdout.on("error", (error) => {
      // Ignore EPIPE errors - they're normal when process exits
      if ((error as NodeJS.ErrnoException).code !== "EPIPE") {
        console.error("Backend stdout error:", error);
      }
    });
  }

  // Handle stderr with error handling
  if (backendProcess.stderr) {
    backendProcess.stderr.on("data", (data) => {
      try {
        const errorMsg = data.toString();
        if (errorMsg.trim()) {
          console.error(`[Backend Error] ${errorMsg}`);
        }
      } catch (error) {
        // Ignore EPIPE errors when process exits
        if ((error as NodeJS.ErrnoException).code !== "EPIPE") {
          console.error("Error reading backend stderr:", error);
        }
      }
    });

    backendProcess.stderr.on("error", (error) => {
      // Ignore EPIPE errors - they're normal when process exits
      if ((error as NodeJS.ErrnoException).code !== "EPIPE") {
        console.error("Backend stderr error:", error);
      }
    });
  }

  backendProcess.on("exit", (code, signal) => {
    // Log all exits for debugging, especially in production
    console.log(
      `Backend process exited with code ${code}${
        signal ? ` (signal: ${signal})` : ""
      }`
    );

    // If backend exits immediately (within 2 seconds), it's likely a startup error
    const exitTime = Date.now();
    const startupTime = (backendProcess as any).startupTime || exitTime;
    const runtime = exitTime - startupTime;

    if (runtime < 2000 && code !== 0 && code !== null) {
      console.error(
        `Backend process exited quickly (${runtime}ms) - likely a startup error. ` +
          `Check backend logs above for details.`
      );
    }

    backendProcess = null;
    // Only restart backend if window is still open and exit was unexpected (non-zero)
    // Don't restart if it was a clean shutdown (code 0) or null (killed)
    if (
      code !== 0 &&
      code !== null &&
      mainWindow &&
      !mainWindow.isDestroyed()
    ) {
      console.log("Backend crashed, attempting to restart...");
      setTimeout(() => {
        startBackend().catch((error) => {
          console.error("Failed to restart backend:", error);
        });
      }, 2000);
    }
  });

  // Track startup time
  (backendProcess as any).startupTime = Date.now();

  backendProcess.on("error", (error) => {
    console.error("Failed to start backend process:", error);
    backendProcess = null;
    // Try to restart after a delay
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        startBackend().catch((error) => {
          console.error("Failed to restart backend:", error);
        });
      }, 2000);
    }
  });
};

const stopBackend = (): void => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
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
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
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
