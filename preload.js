const { contextBridge, clipboard, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  copyToClipboard: (text) => clipboard.writeText(text),
  embedId: (filePath, videoId) => ipcRenderer.invoke("embed-id", filePath, videoId),
  readId: (filePath) => ipcRenderer.invoke("read-id", filePath),
});

