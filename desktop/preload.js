const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dsaDesktop", {
  bootstrap: (topicId) => ipcRenderer.invoke("desktop:bootstrap", topicId),
  updateProfile: (profile) => ipcRenderer.invoke("desktop:update-profile", profile),
  switchTopic: (topicId) => ipcRenderer.invoke("desktop:switch-topic", topicId),
  startProblem: (problemId, language, practiceMode) => ipcRenderer.invoke("desktop:start-problem", problemId, language, practiceMode),
  loadWorkspace: (problemId, language, practiceMode) => ipcRenderer.invoke("desktop:load-workspace", problemId, language, practiceMode),
  saveWorkspace: (problemId, code, language, practiceMode) => ipcRenderer.invoke("desktop:save-workspace", problemId, code, language, practiceMode),
  resetWorkspace: (problemId, language, practiceMode) => ipcRenderer.invoke("desktop:reset-workspace", problemId, language, practiceMode),
  runProblem: (problemId, code, options) => ipcRenderer.invoke("desktop:run-problem", problemId, code, options),
  submitProblem: (problemId, code, language, practiceMode) => ipcRenderer.invoke("desktop:submit-problem", problemId, code, language, practiceMode),
  markExternalPractice: (problemId, status) => ipcRenderer.invoke("desktop:mark-external-practice", problemId, status),
  evaluateTargetProblem: (inputUrl) => ipcRenderer.invoke("desktop:evaluate-target-problem", inputUrl),
  createTargetProblemRoadmap: (inputUrl) => ipcRenderer.invoke("desktop:create-target-problem-roadmap", inputUrl),
  getConceptName: (conceptId) => ipcRenderer.invoke("desktop:get-concept-name", conceptId),
  loadPreferences: () => ipcRenderer.invoke("desktop:load-preferences"),
  savePreferences: (preferences) => ipcRenderer.invoke("desktop:save-preferences", preferences),
  getContentSyncStatus: () => ipcRenderer.invoke("desktop:get-content-sync-status"),
  syncContent: () => ipcRenderer.invoke("desktop:sync-content"),
  validateContribution: (input) => ipcRenderer.invoke("desktop:validate-contribution", input),
  saveContributionDraft: (input) => ipcRenderer.invoke("desktop:save-contribution-draft", input),
  submitContribution: (input) => ipcRenderer.invoke("desktop:submit-contribution", input),
  getContributionOutboxPath: () => ipcRenderer.invoke("desktop:get-contribution-outbox-path"),
  getContributionIssueUrl: (contributionId) => ipcRenderer.invoke("desktop:get-contribution-issue-url", contributionId),
  getContributionSyncStatus: () => ipcRenderer.invoke("desktop:get-contribution-sync-status"),
  syncContributionStatuses: () => ipcRenderer.invoke("desktop:sync-contribution-statuses"),
  getTrainingCatalog: () => ipcRenderer.invoke("desktop:get-training-catalog"),
  getTrainingProblemSummary: (problemId) => ipcRenderer.invoke("desktop:get-training-problem-summary", problemId),
  getTrainingBacklogSummary: () => ipcRenderer.invoke("desktop:get-training-backlog-summary"),
  exportTrainingRegressionBundle: () => ipcRenderer.invoke("desktop:export-training-regression-bundle"),
  generateTrainingRegressionTests: () => ipcRenderer.invoke("desktop:generate-training-regression-tests"),
  generateTrainingPrompts: (input) => ipcRenderer.invoke("desktop:generate-training-prompts", input),
  importTrainingCandidates: (input) => ipcRenderer.invoke("desktop:import-training-candidates", input),
  evaluateTrainingCandidates: (filters) => ipcRenderer.invoke("desktop:evaluate-training-candidates", filters),
  saveTrainingReview: (input) => ipcRenderer.invoke("desktop:save-training-review", input),
  copyText: (value) => ipcRenderer.invoke("desktop:copy-text", value),
  openPath: (targetPath) => ipcRenderer.invoke("desktop:open-path", targetPath),
  openExternal: (targetUrl) => ipcRenderer.invoke("desktop:open-external", targetUrl),
  pickJavaFile: () => ipcRenderer.invoke("desktop:pick-java-file"),
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("desktop:download-update"),
  installUpdate: () => ipcRenderer.invoke("desktop:install-update"),
  onUpdateStatus: (handler) => {
    const listener = (_event, status) => handler(status);
    ipcRenderer.on("desktop:update-status", listener);
    return () => ipcRenderer.removeListener("desktop:update-status", listener);
  }
});
