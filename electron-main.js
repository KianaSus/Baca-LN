// electron-main.js — wrapper EXE minimal untuk Kokoro (opsional).
// Cara pakai: npm install lalu npm run electron:dev
// Build EXE final: npx @electron-forge/cli import lalu npm run make
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    backgroundColor: '#ede5d4',
    icon: path.join(__dirname, 'icons', 'icon-512.svg')
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
