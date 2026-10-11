const {app, BrowserWindow, nativeImage, Tray, screen, ipcMain, globalShortcut, Menu, dialog}  = require('electron')
const path = require('path')

let win;
let tray;
const fs = require('fs');
let drawing = true;
let overToolbar = true;

const trayIcon = nativeImage.createFromPath("images/DC_icon.png");
const appIcon = nativeImage.createFromPath("images/DC_icon.png");

function createWindow () {
    const {x, y, width, height} = screen.getPrimaryDisplay().bounds;
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
	{ label: 'Item1', type: 'radio' },
	{ label: 'Item2', type: 'radio' },
	{ label: 'Item3', type: 'radio', checked: true },
	{ label: 'Item4', type: 'radio' }
    ]);

    win = new BrowserWindow({
	x, y, width, height,
	frame: false,
	transparent: true,
	alwaysOnTop: true,
	skipTaskbar: false,
	hasShadow: true,
	resizable: false,
	icon: appIcon,
	name: "DesktopCanvas",
	webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile('annotator/index.html');
    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu);
}

function cacheSVGs() {
    //Cache all svg icons
    const dir = path.join(__dirname, "../images");
    const cache = {};

    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.svg')) {
	cache[path.basename(file, '.svg')] = fs.readFileSync(path.join(dir, file), 'utf8');
      }
    }

    ipcMain.handle('api:all', () => {
	return cache
    })
}

function applyMouseMode() {
    const ignore = !drawing && !overToolbar;
    win.setIgnoreMouseEvents(ignore, {forward: true});
}

function toggleDrawing() {
    drawing = !drawing;
    applyMouseMode();
    win.webContents.send('mode', drawing);
}

ipcMain.on('set-interactive', (_, on) => {
    overToolbar = on;
    applyMouseMode();
});

ipcMain.on('toggle-mode', toggleDrawing);
ipcMain.on('quit', () => app.quit());
ipcMain.on('save', async(event, base64data) => {
    console.log("Hello");
    const {filePath, canceled} = await dialog.showSaveDialog(win, {
    	title: "Save Image",
    	defaultPath: path.join(app.getPath('downloads'), 'image.png'),
    	filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    });
    
    if (!canceled && filePath) {
	fs.writeFile(filePath, base64data, 'base64', (err) => {
	    if (err) {
		console.error('Failed to save image:', err);
	    } else {
		console.log('Image saved successfully to:', filePath);
	    } 
	});
    }
});

app.whenReady().then(() => {
    cacheSVGs()
    createWindow();
    globalShortcut.register('CommandOrControl+Shift+D', toggleDrawing);
    globalShortcut.register('CommandOrControl+Shift+C', () => win.webContents.send('clear'));
    globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());
})
