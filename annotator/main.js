const {app, BrowserWindow, screen, ipcMain, globalShortcut} = require('electron')
const path = require('path')

let win
let drawing = true
let overToolbar = false

function createWindow () {
    const {x, y, width, height} = screen.getPrimaryDisplay().bounds
    win = new BrowserWindow({
	x, y, width, height,
	frame: false,
	transparent: true,
	alwaysOnTop: true,
	skipTaskbar: true,
	hasShadow: false,
	resizable: false,
	webPreferences: { preload: path.join(__dirname, 'preload.js') }
    })
    
    win.setAlwaysOnTop(true, 'screen-saver')
    win.loadFile('annotator/index.html')
}

function applyMouseMode() {
    const ignore = !drawing && !overToolbar
    win.setIgnoreMouseEvents(ignore, {forward: true})
}

function toggleDrawing() {
    drawing = !drawing
    applyMouseMode()
    win.webContents.send('mode', drawing)
}

ipcMain.on('set-interactive', (_, on) => {
    overToolbar = on
    applyMouseMode()
})

ipcMain.on('toggle-mode', toggleDrawing)
ipcMain.on('quit', () => app.quit())

app.whenReady().then(() => {
    createWindow()
    globalShortcut.register('CommandOrControl+Shift+D', toggleDrawing)
    globalShortcut.register('CommandOrControl+Shift+C', () => win.webContents.send('clear'))
    globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit())
})
