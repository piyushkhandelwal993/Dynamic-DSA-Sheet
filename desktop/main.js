const path = require("path");
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let latestUpdateInfo = null;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function getDesktopApi() {
  return require(path.join(__dirname, "..", "dist", "services", "desktopApp.js"));
}

function sendUpdateStatus(status) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.webContents.send("desktop:update-status", status);
}

function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus({ status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    latestUpdateInfo = info;
    sendUpdateStatus({
      status: "available",
      version: info.version,
      releaseName: info.releaseName,
      releaseNotes: info.releaseNotes
    });
  });

  autoUpdater.on("update-not-available", () => {
    latestUpdateInfo = null;
    sendUpdateStatus({ status: "not-available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdateStatus({
      status: "downloading",
      percent: Math.round(progress.percent ?? 0),
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    latestUpdateInfo = info;
    sendUpdateStatus({
      status: "downloaded",
      version: info.version,
      releaseName: info.releaseName,
      releaseNotes: info.releaseNotes
    });
  });

  autoUpdater.on("error", (error) => {
    sendUpdateStatus({
      status: "error",
      message: error?.message ?? String(error)
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0b1020",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow = win;
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.loadFile(path.join(__dirname, "index.html"));

  win.webContents.once("did-finish-load", () => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch((error) => {
        sendUpdateStatus({ status: "error", message: error?.message ?? String(error) });
      });
    } else {
      sendUpdateStatus({ status: "disabled-dev" });
    }
  });
}

ipcMain.handle("desktop:bootstrap", async (_event, topicId) => getDesktopApi().getDesktopBootstrap(topicId));
ipcMain.handle("desktop:switch-topic", async (_event, topicId) => getDesktopApi().switchDesktopTopic(topicId));
ipcMain.handle("desktop:start-problem", async (_event, problemId) => getDesktopApi().startDesktopProblem(problemId));
ipcMain.handle("desktop:load-workspace", async (_event, problemId) => getDesktopApi().loadDesktopWorkspace(problemId));
ipcMain.handle("desktop:save-workspace", async (_event, problemId, code) => getDesktopApi().saveDesktopWorkspace(problemId, code));
ipcMain.handle("desktop:run-problem", async (_event, problemId, code, options) => getDesktopApi().runDesktopProblem(problemId, code, options));
ipcMain.handle("desktop:submit-problem", async (_event, problemId, code) => getDesktopApi().submitDesktopProblem(problemId, code));
ipcMain.handle("desktop:get-concept-name", async (_event, conceptId) => getDesktopApi().getDesktopConceptName(conceptId));
ipcMain.handle("desktop:load-preferences", async () => getDesktopApi().loadDesktopPreferences());
ipcMain.handle("desktop:save-preferences", async (_event, preferences) => getDesktopApi().saveDesktopPreferenceState(preferences));
ipcMain.handle("desktop:open-path", async (_event, targetPath) => {
  if (!targetPath) {
    return "No path provided.";
  }
  return shell.openPath(targetPath);
});
ipcMain.handle("desktop:open-external", async (_event, targetUrl) => {
  if (!targetUrl || typeof targetUrl !== "string") {
    return false;
  }
  if (!/^https:\/\//i.test(targetUrl)) {
    return false;
  }
  await shell.openExternal(targetUrl);
  return true;
});
ipcMain.handle("desktop:pick-java-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Java Files", extensions: ["java"] }]
  });
  return result.canceled ? null : result.filePaths[0];
});
ipcMain.handle("desktop:check-for-updates", async () => {
  if (!app.isPackaged) {
    sendUpdateStatus({ status: "disabled-dev" });
    return { status: "disabled-dev" };
  }

  const result = await autoUpdater.checkForUpdates();
  return {
    status: result?.updateInfo ? "checked" : "not-available",
    updateInfo: result?.updateInfo ?? latestUpdateInfo
  };
});
ipcMain.handle("desktop:download-update", async () => {
  if (!app.isPackaged) {
    sendUpdateStatus({ status: "disabled-dev" });
    return false;
  }

  await autoUpdater.downloadUpdate();
  return true;
});
ipcMain.handle("desktop:install-update", async () => {
  autoUpdater.quitAndInstall(false, true);
  return true;
});

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
