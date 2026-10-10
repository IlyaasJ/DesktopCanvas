const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld('api', {
  // main -> page (listening)
  onMode: (cb) => ipcRenderer.on('mode', (_, on) => cb(on)),
  onClear: (cb) => ipcRenderer.on('clear', () => cb()),
 
  // page -> main (sending)
  setInteractive: (on) => ipcRenderer.send('set-interactive', on),
  toggleMode: () => ipcRenderer.send('toggle-mode'),
  quit: () => ipcRenderer.send('quit')
})
