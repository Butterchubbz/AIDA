const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, world-isolated API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // The UI can call window.electronAPI.quitApp()
  quitApp: () => ipcRenderer.send('quit-app'),
});