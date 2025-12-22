import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getApiUrl: () => ipcRenderer.invoke("get-api-url"),
  getBackendStatus: () => ipcRenderer.invoke("get-backend-status"),
});

