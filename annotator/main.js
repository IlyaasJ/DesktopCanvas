const {app, BrowserWindow, nativeImage, Tray, screen, ipcMain, globalShortcut, Menu} = require('electron')
const path = require('path')

let win
let tray
let drawing = true
let overToolbar = false

const trayIcon = nativeImage.createFromPath("images/DC_icon.png")
const appIcon = nativeImage.createFromPath("images/DC_icon.png")

function createWindow () {
    const {x, y, width, height} = screen.getPrimaryDisplay().bounds
    tray = new Tray(trayIcon)
    const contextMenu = Menu.buildFromTemplate([
	{ label: 'Item1', type: 'radio' },
	{ label: 'Item2', type: 'radio' },
	{ label: 'Item3', type: 'radio', checked: true },
	{ label: 'Item4', type: 'radio' }
    ])

    win = new BrowserWindow({
	x, y, width, height,
	frame: false,
	transparent: true,
	alwaysOnTop: true,
	skipTaskbar: false,
	hasShadow: true,
	resizable: false,
	icon: appIcon,
	webPreferences: { preload: path.join(__dirname, 'preload.js') }
    })
    
    win.setAlwaysOnTop(true, 'screen-saver')
    win.loadFile('annotator/index.html')
    tray.setToolTip('This is my application.')
    tray.setContextMenu(contextMenu)
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
