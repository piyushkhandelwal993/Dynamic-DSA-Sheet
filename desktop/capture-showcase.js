const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");

const projectRoot = path.join(__dirname, "..");
const desktopApi = require(path.join(projectRoot, "dist", "services", "desktopApp.js"));

const outputDir = path.join(__dirname, "assets", "showcase");
const homeOutput = path.join(outputDir, "home-landing.png");
const practiceOutput = path.join(outputDir, "practice-view.png");
const feedbackOutput = path.join(outputDir, "practice-feedback.png");
const sampleSolutionPath = path.join(projectRoot, "sample-solutions", "MaximumElementArray.java");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureToFile(win, filePath) {
  const image = await win.webContents.capturePage();
  fs.writeFileSync(filePath, image.toPNG());
}

async function prepareWorkspace() {
  fs.mkdirSync(outputDir, { recursive: true });
  const solution = fs.readFileSync(sampleSolutionPath, "utf8");

  desktopApi.switchDesktopTopic("arrays");
  desktopApi.saveDesktopPreferenceState({
    splitRatio: 46,
    editorFontSize: 14,
    currentRunMode: "official",
    currentProblemView: "description",
    currentView: "home",
    sidebarCollapsed: false,
    editorFocusMode: false,
    lastOpenedTopicId: "arrays",
    lastOpenedProblemId: "arr-001",
    selectedLanguage: "java"
  });
  desktopApi.saveDesktopWorkspace("arr-001", solution);
  desktopApi.startDesktopProblem("arr-001");
}

async function runCapture() {
  await prepareWorkspace();

  const win = new BrowserWindow({
    width: 1600,
    height: 1280,
    show: false,
    backgroundColor: "#070B16",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await win.loadFile(path.join(__dirname, "index.html"));
  await wait(1800);

  await captureToFile(win, homeOutput);

  await win.webContents.executeJavaScript(`
    document.getElementById("home-start-button")?.click();
  `);
  await wait(1800);
  await captureToFile(win, practiceOutput);

  await win.webContents.executeJavaScript(`
    document.getElementById("submit-button")?.click();
  `);
  await wait(2600);
  await win.webContents.executeJavaScript(`
    document.getElementById("success-modal-review-button")?.click();
    document.getElementById("result-section")?.scrollIntoView({ block: "start" });
  `);
  await wait(900);
  await captureToFile(win, feedbackOutput);

  await win.close();
  app.quit();
}

ipcMain.handle("desktop:bootstrap", async (_event, topicId) => desktopApi.getDesktopBootstrap(topicId));
ipcMain.handle("desktop:switch-topic", async (_event, topicId) => desktopApi.switchDesktopTopic(topicId));
ipcMain.handle("desktop:start-problem", async (_event, problemId) => desktopApi.startDesktopProblem(problemId));
ipcMain.handle("desktop:load-workspace", async (_event, problemId) => desktopApi.loadDesktopWorkspace(problemId));
ipcMain.handle("desktop:save-workspace", async (_event, problemId, code) => desktopApi.saveDesktopWorkspace(problemId, code));
ipcMain.handle("desktop:run-problem", async (_event, problemId, code, options) => desktopApi.runDesktopProblem(problemId, code, options));
ipcMain.handle("desktop:submit-problem", async (_event, problemId, code) => desktopApi.submitDesktopProblem(problemId, code));
ipcMain.handle("desktop:get-concept-name", async (_event, conceptId) => desktopApi.getDesktopConceptName(conceptId));
ipcMain.handle("desktop:load-preferences", async () => desktopApi.loadDesktopPreferences());
ipcMain.handle("desktop:save-preferences", async (_event, preferences) => desktopApi.saveDesktopPreferenceState(preferences));
ipcMain.handle("desktop:open-path", async (_event, targetPath) => {
  if (!targetPath) {
    return "No path provided.";
  }
  return shell.openPath(targetPath);
});
ipcMain.handle("desktop:pick-java-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Java Files", extensions: ["java"] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

app.whenReady().then(() => {
  runCapture().catch((error) => {
    console.error(error);
    app.exit(1);
  });
});
