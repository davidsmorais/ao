"use strict";
const { app, BrowserWindow, Menu, shell, session } = require("electron");
const fs = require("fs");
const { is, readSheet } = require("./src/util");
const file = require("./src/file");
const menu = require("./src/menu");
const settings = require("./src/settings");
const shortcut = require("./src/keymap");
const time = require("./src/time");
const tray = require("./src/tray");
const update = require("./src/update");
const url = require("./src/url");
const win = require("./src/win");

const { log } = console;

require("electron-debug")({ enabled: true });

require("electron-dl")();
require("electron-context-menu")();

let exiting = false;
let shown = false;
let mainWindow;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

function createMainWindow() {
  settings.configure({
    dir: app.getPath('userData')
  });

  const kuroWindow = new BrowserWindow(win.defaultOpts);

  kuroWindow.loadURL(url.app);

  kuroWindow.on("close", e => {
    if (!exiting) {
      e.preventDefault();

      if (is.darwin) {
        app.hide();
      } else {
        kuroWindow.hide();
      }
    }
  });

  kuroWindow.on("page-title-updated", e => {
    e.preventDefault();
  });

  kuroWindow.on("unresponsive", log);

  kuroWindow.webContents.on("did-navigate-in-page", (_, url) => {
    settings.setSync("lastURL", url);
  });

  return kuroWindow;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(menu);

  const lang = app.getLocale();
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = `${lang},en-US;q=0.9`;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow = createMainWindow();
  if (settings.getSync("useGlobalShortcuts")) {
    shortcut.registerGlobal();
  }

  if (!settings.getSync("hideTray")) {
    tray.create();
  }

  const { webContents } = mainWindow;
  webContents.on("dom-ready", () => {
    const stylesheets = fs.readdirSync(file.style);
    stylesheets.forEach(x => webContents.insertCSS(readSheet(x)));

    if (!shown) {
      if (settings.getSync("launchMinimized")) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }

      shown = true;
    }
  });

  webContents.on("new-window", (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  webContents.on("crashed", log);

  if (!settings.getSync("disableAutoUpdateCheck")) {
    setInterval(
      () => update.auto(),
      time.ms(settings.getSync("updateCheckPeriod"))
    );
  }
});

process.on("uncaughtException", log);

app.on("activate", () => mainWindow.show());

app.on("before-quit", () => {
  exiting = true;
  if (!mainWindow.isFullScreen()) {
    settings.setSync("lastWindowState", mainWindow.getBounds());
  }
});
