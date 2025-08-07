const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html')); // Load your React app

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  const pbServePath = path.join(app.getAppPath(), 'pocketbase.exe');

  // Start PocketBase
  const pbProcess = exec(`${pbServePath} serve --hooksDir=pb_hooks`, {
    cwd: app.getAppPath(), // Set current working directory
  });

  pbProcess.stdout.on('data', (data) => {
    console.log(`PocketBase: ${data}`);
  });
  pbProcess.stderr.on('data', (data) => {
    console.error(`PocketBase: ${data}`);
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});