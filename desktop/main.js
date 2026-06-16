const path = require("path");
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");

function getDesktopApi() {
  return require(path.join(__dirname, "..", "dist", "services", "desktopApp.js"));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f4ede2",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.loadFile(path.join(__dirname, "index.html"));
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

app.whenReady().then(() => {
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
