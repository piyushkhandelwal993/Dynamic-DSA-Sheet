const state = {
  bootstrap: null,
  currentProblem: null,
  workspacePath: null,
  currentView: "home",
  currentProblemView: "description",
  currentRunMode: "official",
  splitRatio: 46,
  sidebarCollapsed: false,
  editorFocusMode: false,
  resultHtml: "",
  resultTabs: {
    summary: "",
    execution: "",
    guidance: ""
  },
  activeResultView: "summary",
  showResult: false,
  successModal: null,
  lastSubmissionReview: null,
  editorDirty: false,
  editorFontSize: 14,
  editorContent: "",
  selectedLanguage: "java",
  monacoReady: false,
  updateStatus: null,
  updateDismissed: false
};

const DEFAULT_PREFERENCES = {
  splitRatio: 46,
  editorFontSize: 14,
  currentRunMode: "official",
  currentProblemView: "description",
  currentView: "home",
  sidebarCollapsed: false,
  editorFocusMode: false,
  lastOpenedTopicId: null,
  lastOpenedProblemId: null,
  selectedLanguage: "java"
};

const MARKETING_WORLDS = [
  { id: "arrays-kingdom", label: "Arrays Kingdom", sourceTopicId: "arrays", x: "8%", y: "16%" },
  { id: "hashmap-valley", label: "HashMap Valley", sourceTopicId: "arrays", x: "70%", y: "8%" },
  { id: "two-pointer-bridge", label: "Two Pointer Bridge", sourceTopicId: "arrays", x: "10%", y: "78%" },
  { id: "stack-mountain", label: "Stack Mountain", sourceTopicId: "stack", x: "31%", y: "82%" },
  { id: "tree-forest", label: "Tree Forest", sourceTopicId: "trees", x: "49%", y: "80%" },
  { id: "graph-empire", label: "Graph Empire", sourceTopicId: "graphs", x: "66%", y: "75%" },
  { id: "dp-temple", label: "DP Temple", sourceTopicId: "dp", x: "84%", y: "72%" }
];

const MARKETING_ROADMAP = [
  { label: "Arrays", sourceTopicId: "arrays" },
  { label: "Hashing", sourceTopicId: "arrays" },
  { label: "Two Pointers", sourceTopicId: "arrays" },
  { label: "Sliding Window", sourceTopicId: "queue" },
  { label: "Stack", sourceTopicId: "stack" },
  { label: "Linked List", sourceTopicId: "linked-list" },
  { label: "Trees", sourceTopicId: "trees" },
  { label: "Graphs", sourceTopicId: "graphs" },
  { label: "Dynamic Programming", sourceTopicId: "dp" }
];

let monacoLoaderPromise = null;
let monacoEditor = null;
let monacoApi = null;
let suppressEditorDirtyTracking = false;
let successCountAnimationFrame = null;
let splitterDragging = false;
let environmentBannerDismissed = false;

const appShellEl = document.getElementById("app-shell");
const topicListEl = document.getElementById("topic-list");
const playerCardEl = document.getElementById("player-card");
const headerBreadcrumbEl = document.getElementById("header-breadcrumb");
const headerDifficultyBadgeEl = document.getElementById("header-difficulty-badge");
const headerPlayerChipEl = document.getElementById("header-player-chip");
const environmentBannerEl = document.getElementById("environment-banner");
const environmentBannerTitleEl = document.getElementById("environment-banner-title");
const environmentBannerMessageEl = document.getElementById("environment-banner-message");
const environmentBannerGuideButtonEl = document.getElementById("environment-banner-guide-button");
const environmentBannerDismissButtonEl = document.getElementById("environment-banner-dismiss-button");
const updateBannerEl = document.getElementById("update-banner");
const updateBannerTitleEl = document.getElementById("update-banner-title");
const updateBannerMessageEl = document.getElementById("update-banner-message");
const updateProgressEl = document.getElementById("update-progress");
const updateProgressFillEl = document.getElementById("update-progress-fill");
const updateDownloadButtonEl = document.getElementById("update-download-button");
const updateInstallButtonEl = document.getElementById("update-install-button");
const updateLaterButtonEl = document.getElementById("update-later-button");
const topicSwitcherButtonEl = document.getElementById("topic-switcher-button");
const topicSwitcherMenuEl = document.getElementById("topic-switcher-menu");
const topicNameEl = document.getElementById("topic-name");
const topicDescriptionEl = document.getElementById("topic-description");
const homeStartButtonEl = document.getElementById("home-start-button");
const homeDemoButtonEl = document.getElementById("home-demo-button");
const homeNavStartButtonEl = document.getElementById("home-nav-start-button");
const homeLoginButtonEl = document.getElementById("home-login-button");
const heroTaskTitleEl = document.getElementById("hero-task-title");
const heroJourneyStepsEl = document.getElementById("hero-journey-steps");
const heroTaskReasonsEl = document.getElementById("hero-task-reasons");
const heroTaskStartButtonEl = document.getElementById("hero-task-start-button");
const heroPathEl = document.getElementById("hero-path");
const homeProductFlowEl = document.getElementById("home-product-flow");
const homeWorldsEl = document.getElementById("home-worlds");
const homeRoadmapEl = document.getElementById("home-roadmap");
const homeStatsEl = document.getElementById("home-stats");
const homeFinalCtaButtonEl = document.getElementById("home-final-cta-button");
const homeShowcaseSectionEl = document.getElementById("home-showcase-section");
const missionTitleEl = document.getElementById("mission-title");
const missionSummaryEl = document.getElementById("mission-summary");
const missionMetaEl = document.getElementById("mission-meta");
const missionStepsEl = document.getElementById("mission-steps");
const missionActionButtonEl = document.getElementById("mission-action-button");
const missionJumpButtonEl = document.getElementById("mission-jump-button");
const streakCountEl = document.getElementById("streak-count");
const solvedCountEl = document.getElementById("solved-count");
const progressStreakValueEl = document.getElementById("progress-streak-value");
const progressXpValueEl = document.getElementById("progress-xp-value");
const progressSolvedValueEl = document.getElementById("progress-solved-value");
const progressTopicValueEl = document.getElementById("progress-topic-value");
const progressTopicMetaEl = document.getElementById("progress-topic-meta");
const streakSummaryEl = document.getElementById("streak-summary");
const streakCalendarEl = document.getElementById("streak-calendar");
const submissionTrendEl = document.getElementById("submission-trend");
const topicProgressEl = document.getElementById("topic-progress");
const problemPaneTitleEl = document.getElementById("problem-pane-title");
const problemTabsEl = document.getElementById("problem-tabs");
const problemPaneContentEl = document.getElementById("problem-pane-content");
const splitterEl = document.getElementById("splitter");
const problemListEl = document.getElementById("problem-list");
const problemSearchInputEl = document.getElementById("problem-search-input");
const problemDifficultyFilterEl = document.getElementById("problem-difficulty-filter");
const problemStatusFilterEl = document.getElementById("problem-status-filter");
const editorProblemTitleEl = document.getElementById("editor-problem-title");
const problemMetaEl = document.getElementById("problem-meta");
const editorEl = document.getElementById("editor");
const saveStatusEl = document.getElementById("save-status");
const cursorStatusEl = document.getElementById("cursor-status");
const selectionStatusEl = document.getElementById("selection-status");
const lineStatusEl = document.getElementById("line-status");
const fontStatusEl = document.getElementById("font-status");
const runModeTabsEl = document.getElementById("run-mode-tabs");
const customInputSectionEl = document.getElementById("custom-input-section");
const customInputEl = document.getElementById("custom-input");
const resultSectionEl = document.getElementById("result-section");
const resultTabsEl = document.getElementById("result-tabs");
const resultPanelEl = document.getElementById("result-panel");
const nextCardEl = document.getElementById("next-card");
const skillBarsEl = document.getElementById("skill-bars");
const worldZonesEl = document.getElementById("world-zones");
const toggleSidebarButtonEl = document.getElementById("toggle-sidebar-button");
const sidebarEdgeToggleButtonEl = document.getElementById("sidebar-edge-toggle-button");
const toggleEditorFocusButtonEl = document.getElementById("toggle-editor-focus-button");
const decreaseFontButtonEl = document.getElementById("editor-decrease-font-button");
const increaseFontButtonEl = document.getElementById("editor-increase-font-button");
const runButtonEl = document.getElementById("run-button");
const saveButtonEl = document.getElementById("save-button");
const submitButtonEl = document.getElementById("submit-button");
const openFileButtonEl = document.getElementById("open-file-button");
const languageSelectEl = document.getElementById("language-select");
const refreshButtonEl = document.getElementById("refresh-button");
const resetLayoutButtonEl = document.getElementById("reset-layout-button");
const resetPreferencesButtonEl = document.getElementById("reset-preferences-button");
const successModalOverlayEl = document.getElementById("success-modal-overlay");
const successModalTitleEl = document.getElementById("success-modal-title");
const successModalXpEl = document.getElementById("success-modal-xp");
const successModalStreakEl = document.getElementById("success-modal-streak");
const successModalNextTaskEl = document.getElementById("success-modal-next-task");
const successModalNextReasonEl = document.getElementById("success-modal-next-reason");
const successModalStartButtonEl = document.getElementById("success-modal-start-button");
const successModalReviewButtonEl = document.getElementById("success-modal-review-button");
const successModalCloseButtonEl = document.getElementById("success-modal-close-button");
const viewTabsEl = document.getElementById("view-tabs");
const viewEls = {
  home: document.getElementById("home-view"),
  practice: document.getElementById("practice-view"),
  progress: document.getElementById("progress-view"),
  world: document.getElementById("world-view"),
  problems: document.getElementById("problems-view")
};

function resetAppScrollPosition() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  document.querySelector(".workspace-shell")?.scrollTo({ top: 0, left: 0 });
}

function scheduleScrollReset() {
  resetAppScrollPosition();
  requestAnimationFrame(() => {
    resetAppScrollPosition();
    requestAnimationFrame(() => {
      resetAppScrollPosition();
    });
  });
  window.setTimeout(resetAppScrollPosition, 60);
}

function scheduleEditorRefresh() {
  if (!monacoEditor) return;

  const refresh = () => {
    applyEditorLanguage();
    if (monacoEditor.getValue() !== state.editorContent) {
      suppressEditorDirtyTracking = true;
      monacoEditor.setValue(state.editorContent);
      suppressEditorDirtyTracking = false;
    }
    monacoEditor.layout();
    updateEditorStatus();
  };

  requestAnimationFrame(() => {
    refresh();
    requestAnimationFrame(refresh);
  });
  window.setTimeout(refresh, 80);
}

let editorResizeFrame = 0;

function scheduleEditorLayout() {
  if (!monacoEditor) return;
  window.cancelAnimationFrame(editorResizeFrame);
  editorResizeFrame = window.requestAnimationFrame(() => {
    monacoEditor?.layout();
  });
}

function scrollToResultsSection() {
  if (resultSectionEl.classList.contains("is-hidden")) {
    return;
  }

  requestAnimationFrame(() => {
    const container = document.querySelector(".workspace-shell");
    if (!(container instanceof HTMLElement)) {
      resultSectionEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const resultRect = resultSectionEl.getBoundingClientRect();
    const resultTop = container.scrollTop + resultRect.top - containerRect.top;
    const maximumScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    container.scrollTo({
      top: Math.min(Math.max(0, resultTop - 4), maximumScrollTop),
      behavior: "smooth"
    });
  });
}

function scrollToCurrentTaskWorkspace() {
  const target = document.querySelector(".practice-layout");
  const container = document.querySelector(".workspace-shell");
  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    if (container instanceof HTMLElement && target instanceof HTMLElement) {
      const top = Math.max(0, target.offsetTop - 4);
      container.scrollTo({
        top,
        behavior: "smooth"
      });
    } else {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    if (state.currentProblem) {
      window.setTimeout(() => {
        monacoEditor?.focus();
      }, 220);
    }
  });
}

async function launchPrimaryMission() {
  const problem = currentMissionProblem();
  if (!problem) return;
  if (state.currentProblem) {
    setCurrentView("practice");
    scrollToCurrentTaskWorkspace();
    return;
  }
  await startProblem(problem.id);
}

function closeTopicSwitcher() {
  topicSwitcherMenuEl.classList.add("is-hidden");
  topicSwitcherButtonEl.setAttribute("aria-expanded", "false");
}

function toggleTopicSwitcher() {
  const willOpen = topicSwitcherMenuEl.classList.contains("is-hidden");
  topicSwitcherMenuEl.classList.toggle("is-hidden", !willOpen);
  topicSwitcherButtonEl.setAttribute("aria-expanded", String(willOpen));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function marketingIcon(name) {
  const icons = {
    worlds: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v5c0 5 3.5 8.8 8 10 4.5-1.2 8-5 8-10V7l-8-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.7 12 2.1 2.1 4.5-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    problems: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h10a2 2 0 0 1 2 2v10H8a2 2 0 0 0-2 2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 17H6a2 2 0 0 0-2 2V9a2 2 0 0 1 2-2h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 9h5M11 12h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    streak: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 3c.4 2.2-.6 4.4-2.2 5.7C9 10.6 8 12.2 8 14c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.7-1.7-4.9-4.1-5.7.2 1.8-.4 3.4-1.8 4.6-.8-2.4-.7-4.7-.6-6.9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 5H5a2 2 0 0 0 2 4h1M16 5h3a2 2 0 0 1-2 4h-1M12 11v4M9 19h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };
  return icons[name] ?? "";
}

function scoreColor(score) {
  if (score >= 85) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

function difficultyColor(level) {
  if (level === "Easy") return "green";
  if (level === "Medium") return "yellow";
  return "red";
}

function zoneColor(status) {
  if (status === "cleared") return "blue";
  if (status === "unlocked") return "green";
  return "red";
}

function masteryColor(tier) {
  if (tier === "Mastered") return "green";
  if (tier === "Strong") return "blue";
  if (tier === "Comfortable") return "yellow";
  if (tier === "Training") return "red";
  return "gray";
}

function conceptLabel(conceptId) {
  return conceptId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function javaGuideUrl() {
  return "https://adoptium.net/temurin/releases/?version=17";
}

function cppGuideUrl() {
  return "https://code.visualstudio.com/docs/languages/cpp";
}

function buildSummaryScoreRing(score, label = "Great") {
  return `
    <div class="score-ring ${scoreColor(score)}">
      <div class="score-ring-value">
        <strong>${score}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}

function renderConceptChips(concepts, color = "blue") {
  if (!concepts?.length) {
    return `<span class="pill gray">None</span>`;
  }
  return concepts.map((concept) => `<span class="pill ${color}">${escapeHtml(concept)}</span>`).join("");
}

function confidenceColor(confidence) {
  if (confidence === "High") return "green";
  if (confidence === "Medium") return "yellow";
  return "gray";
}

function renderConceptEvidence(items) {
  if (!items?.length) {
    return `<div class="empty-guidance">No expected concept has strong supporting evidence yet.</div>`;
  }
  return `
    <div class="evidence-list">
      ${items.map((item) => `
        <div class="evidence-item">
          <div class="evidence-item-header">
            <strong>${escapeHtml(item.conceptName ?? conceptLabel(item.conceptId))}</strong>
            <span class="pill ${confidenceColor(item.confidence)}">${escapeHtml(item.confidence)} · ${item.confidenceScore}%</span>
          </div>
          <div class="evidence-facts">${renderConceptChips(item.factIds.map(conceptLabel), "blue")}</div>
          <ul>${item.evidence.map((evidence) => `<li>${escapeHtml(evidence)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAnalysisIssues(items) {
  if (!items?.length) {
    return `<div class="empty-guidance">No significant anti-patterns were detected.</div>`;
  }
  return `
    <div class="evidence-list">
      ${items.map((item) => `
        <div class="evidence-item warning">
          <div class="evidence-item-header">
            <strong>${escapeHtml(conceptLabel(item.id))}</strong>
            <span class="pill ${confidenceColor(item.confidence)}">${escapeHtml(item.confidence)}</span>
          </div>
          <ul>${item.evidence.map((evidence) => `<li>${escapeHtml(evidence)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `;
}

function renderReasonList(items, emptyMessage) {
  if (!items?.length) return `<div class="empty-guidance">${escapeHtml(emptyMessage)}</div>`;
  return `<ul class="analysis-reason-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function buildResultStateBanner(title, description, statusPill = "") {
  return `
    <div class="result-state-banner">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p class="result-section-copy">${escapeHtml(description)}</p>
      </div>
      ${statusPill ? `<div>${statusPill}</div>` : ""}
    </div>
  `;
}

function updateVersionLabel(status) {
  return status?.version ? ` v${status.version}` : "";
}

function renderUpdateBanner() {
  const status = state.updateStatus;
  const statusName = status?.status ?? "idle";
  const hiddenStatuses = new Set(["idle", "checking", "checked", "not-available", "disabled-dev"]);
  const shouldHide = !status || hiddenStatuses.has(statusName) || (state.updateDismissed && statusName !== "downloading");

  updateBannerEl.classList.toggle("is-hidden", shouldHide);
  if (shouldHide) {
    return;
  }

  updateDownloadButtonEl.classList.add("is-hidden");
  updateInstallButtonEl.classList.add("is-hidden");
  updateLaterButtonEl.classList.remove("is-hidden");
  updateProgressEl.classList.add("is-hidden");
  updateProgressFillEl.style.width = "0%";

  if (statusName === "available") {
    updateBannerTitleEl.textContent = `Update available${updateVersionLabel(status)}`;
    updateBannerMessageEl.textContent = "You can keep working and update when you are ready. Your local progress and workspaces stay intact.";
    updateDownloadButtonEl.classList.remove("is-hidden");
    return;
  }

  if (statusName === "downloading") {
    const percent = Math.max(0, Math.min(100, Number(status.percent ?? 0)));
    updateBannerTitleEl.textContent = "Downloading update";
    updateBannerMessageEl.textContent = `${percent}% downloaded. You can continue solving while this finishes.`;
    updateProgressEl.classList.remove("is-hidden");
    updateProgressFillEl.style.width = `${percent}%`;
    updateLaterButtonEl.classList.add("is-hidden");
    return;
  }

  if (statusName === "downloaded") {
    updateBannerTitleEl.textContent = `Update ready${updateVersionLabel(status)}`;
    updateBannerMessageEl.textContent = "Restart when ready to install. Your DSA progress, preferences, and code files remain untouched.";
    updateInstallButtonEl.classList.remove("is-hidden");
    return;
  }

  if (statusName === "error") {
    updateBannerTitleEl.textContent = "Update check failed";
    updateBannerMessageEl.textContent = status.message || "We could not check for updates right now. You can keep using the app normally.";
  }
}

function currentProblemFilters() {
  return {
    query: problemSearchInputEl?.value?.trim().toLowerCase() ?? "",
    difficulty: problemDifficultyFilterEl?.value ?? "all",
    status: problemStatusFilterEl?.value ?? "all"
  };
}

function getProblemStatus(problemId) {
  const status = state.bootstrap?.progressMap?.[problemId]?.status ?? "pending";
  if (status === "submitted") return "started";
  return status;
}

function setResultPanels(panels, visible = true, activeView = "summary") {
  state.resultTabs = {
    summary: panels.summary ?? "",
    execution: panels.execution ?? "",
    guidance: panels.guidance ?? ""
  };
  state.activeResultView = activeView;
  state.resultHtml = state.resultTabs[state.activeResultView] ?? "";
  state.showResult = visible;
  resultPanelEl.innerHTML = state.resultHtml;
  resultSectionEl.classList.toggle("is-hidden", !visible);
}

function clearResultPanels() {
  state.resultTabs = {
    summary: "",
    execution: "",
    guidance: ""
  };
  state.activeResultView = "summary";
  state.resultHtml = "";
  state.showResult = false;
  resultPanelEl.innerHTML = "";
  resultSectionEl.classList.add("is-hidden");
}

function applySplitRatio() {
  const bounded = Math.max(32, Math.min(68, state.splitRatio));
  state.splitRatio = bounded;
  document.documentElement.style.setProperty("--problem-width", `${bounded}%`);
}

function getDesktopPreferences() {
  return {
    splitRatio: state.splitRatio,
    editorFontSize: state.editorFontSize,
    currentRunMode: state.currentRunMode,
    currentProblemView: state.currentProblemView,
    currentView: state.currentView,
    sidebarCollapsed: state.sidebarCollapsed,
    editorFocusMode: state.editorFocusMode,
    lastOpenedTopicId: state.bootstrap?.activeTopicId ?? null,
    lastOpenedProblemId: state.currentProblem?.id ?? null,
    selectedLanguage: state.selectedLanguage
  };
}

function buildResetPreferences({ clearLastOpenedProblem = false } = {}) {
  return {
    ...DEFAULT_PREFERENCES,
    lastOpenedTopicId: state.bootstrap?.activeTopicId ?? DEFAULT_PREFERENCES.lastOpenedTopicId ?? null,
    lastOpenedProblemId: clearLastOpenedProblem ? null : state.currentProblem?.id ?? null
  };
}

function applyDesktopPreferences(preferences = {}) {
  state.splitRatio = typeof preferences.splitRatio === "number" ? preferences.splitRatio : DEFAULT_PREFERENCES.splitRatio;
  state.editorFontSize =
    typeof preferences.editorFontSize === "number" ? preferences.editorFontSize : DEFAULT_PREFERENCES.editorFontSize;
  state.currentRunMode = preferences.currentRunMode ?? DEFAULT_PREFERENCES.currentRunMode;
  state.currentProblemView = preferences.currentProblemView ?? DEFAULT_PREFERENCES.currentProblemView;
  state.currentView = preferences.currentView ?? DEFAULT_PREFERENCES.currentView;
  state.sidebarCollapsed = preferences.sidebarCollapsed ?? DEFAULT_PREFERENCES.sidebarCollapsed;
  state.editorFocusMode = preferences.editorFocusMode ?? DEFAULT_PREFERENCES.editorFocusMode;
  state.lastOpenedTopicId = preferences.lastOpenedTopicId ?? DEFAULT_PREFERENCES.lastOpenedTopicId;
  state.lastOpenedProblemId = preferences.lastOpenedProblemId ?? DEFAULT_PREFERENCES.lastOpenedProblemId;
  state.selectedLanguage = preferences.selectedLanguage === "cpp" ? "cpp" : "java";
}

async function persistDesktopPreferences() {
  await window.dsaDesktop.savePreferences(getDesktopPreferences());
}

async function persistProvidedPreferences(preferences) {
  await window.dsaDesktop.savePreferences(preferences);
}

async function resetLayoutState() {
  const preferences = buildResetPreferences({ clearLastOpenedProblem: false });
  applyDesktopPreferences(preferences);
  hideSuccessModal();
  render();
  monacoEditor?.layout();
  await persistProvidedPreferences(preferences);
  scheduleScrollReset();
}

async function resetDesktopPreferences() {
  const preferences = buildResetPreferences({ clearLastOpenedProblem: true });
  applyDesktopPreferences(preferences);
  hideSuccessModal();
  clearResultPanels();
  state.lastSubmissionReview = null;
  customInputEl.value = "";
  render();
  monacoEditor?.layout();
  await persistProvidedPreferences(preferences);
  scheduleScrollReset();
}

function showSuccessModal(data) {
  state.successModal = data;
  successModalTitleEl.textContent = data.title;
  successModalXpEl.textContent = "+0 XP";
  successModalStreakEl.textContent = "+0 Day Streak";
  successModalNextTaskEl.textContent = data.nextTaskTitle || "Continue your journey";
  successModalNextReasonEl.textContent = data.nextTaskReason || "Take the next recommended problem when you're ready.";
  successModalReviewButtonEl.classList.toggle("is-hidden", !data.hasReview);
  animateSuccessCounts(data.xp, data.streakGain);
  if (!successModalOverlayEl.open) {
    successModalOverlayEl.showModal();
  }
}

function hideSuccessModal() {
  state.successModal = null;
  if (successCountAnimationFrame) {
    cancelAnimationFrame(successCountAnimationFrame);
    successCountAnimationFrame = null;
  }
  if (successModalOverlayEl.open) {
    successModalOverlayEl.close();
  }
}

function saveLastSubmissionReview(problem, panels) {
  state.lastSubmissionReview = {
    problemId: problem.id,
    title: problem.title,
    panels
  };
}

function reviewLastSubmission() {
  if (!state.lastSubmissionReview) return;
  setResultPanels(state.lastSubmissionReview.panels, true, "summary");
  state.currentView = "practice";
  hideSuccessModal();
  render();
  scrollToResultsSection();
}

async function startRecommendedNextProblem() {
  const nextProblem = state.bootstrap?.nextRecommendation?.problem;
  if (!nextProblem) return;
  hideSuccessModal();
  await startProblem(nextProblem.id);
}

function animateNumber(from, to, duration, formatter, onUpdate) {
  const start = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (to - from) * eased);
    onUpdate(formatter(value));

    if (progress < 1) {
      successCountAnimationFrame = requestAnimationFrame(step);
    } else {
      successCountAnimationFrame = null;
    }
  }

  successCountAnimationFrame = requestAnimationFrame(step);
}

function animateSuccessCounts(xp, streakGain) {
  animateNumber(0, xp, 700, (value) => `+${value} XP`, (text) => {
    successModalXpEl.textContent = text;
  });

  const streakStart = performance.now();
  function streakStep(now) {
    const progress = Math.min(1, (now - streakStart) / 520);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(streakGain * eased);
    successModalStreakEl.textContent = `+${value} Day Streak`;
    if (progress < 1) {
      requestAnimationFrame(streakStep);
    }
  }
  requestAnimationFrame(streakStep);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.src = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-href="${href}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true" || existing.sheet) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.href = href;
    link.addEventListener(
      "load",
      () => {
        link.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    link.addEventListener("error", reject, { once: true });
    document.head.appendChild(link);
  });
}

function registerDsaLanguage(monaco, id, definition) {
  if (!monaco.languages.getLanguages().some((language) => language.id === id)) {
    monaco.languages.register({ id });
  }

  monaco.languages.setLanguageConfiguration(id, definition.configuration);
  monaco.languages.setMonarchTokensProvider(id, definition.tokenizer);
}

function registerDsaLanguages(monaco) {
  const commonOperators = [
    "=", ">", "<", "!", "~", "?", ":", "==", "<=", ">=", "!=", "&&", "||",
    "++", "--", "+", "-", "*", "/", "&", "|", "^", "%", "<<", ">>", ">>>",
    "+=", "-=", "*=", "/=", "&=", "|=", "^=", "%=", "<<=", ">>=", ">>>="
  ];
  const commonConfiguration = {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "\"", close: "\"", notIn: ["string", "comment"] },
      { open: "'", close: "'", notIn: ["string", "comment"] }
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "\"", close: "\"" },
      { open: "'", close: "'" }
    ]
  };
  const createTokenizer = ({ keywords, typeKeywords, preprocessor = false }) => ({
    defaultToken: "",
    tokenPostfix: `.${preprocessor ? "cpp" : "java"}`,
    keywords,
    typeKeywords,
    operators: commonOperators,
    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes: /\\(?:[abfnrtv\\"'0-7]|x[0-9A-Fa-f]+|u[0-9A-Fa-f]{4})/,
    tokenizer: {
      root: [
        ...(preprocessor ? [[/^\s*#\s*[a-zA-Z_]\w*/, "keyword.directive"]] : []),
        [/[a-zA-Z_$][\w$]*/, {
          cases: {
            "@typeKeywords": "type",
            "@keywords": "keyword",
            "@default": "identifier"
          }
        }],
        { include: "@whitespace" },
        [/[{}()[\]]/, "@brackets"],
        [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
        [/\d*\.\d+([eE][+-]?\d+)?[fFdD]?/, "number.float"],
        [/0[xX][0-9a-fA-F]+[lL]?/, "number.hex"],
        [/0[bB][01]+[lL]?/, "number.binary"],
        [/\d+[lLuUfF]*/, "number"],
        [/[;,.]/, "delimiter"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/'([^'\\]|\\.)'/, "string"],
        [/'/, "string.invalid"]
      ],
      whitespace: [
        [/[ \t\r\n]+/, ""],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"]
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"]
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, "string", "@pop"]
      ]
    }
  });

  registerDsaLanguage(monaco, "java", {
    configuration: commonConfiguration,
    tokenizer: createTokenizer({
      keywords: [
        "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
        "class", "const", "continue", "default", "do", "double", "else", "enum",
        "extends", "final", "finally", "float", "for", "goto", "if", "implements",
        "import", "instanceof", "int", "interface", "long", "native", "new", "package",
        "private", "protected", "public", "return", "short", "static", "strictfp",
        "super", "switch", "synchronized", "this", "throw", "throws", "transient",
        "try", "void", "volatile", "while", "true", "false", "null", "record", "var"
      ],
      typeKeywords: [
        "String", "Integer", "Long", "Double", "Float", "Character", "Object",
        "List", "ArrayList", "Map", "HashMap", "Set", "HashSet", "Queue", "Deque",
        "Stack", "Scanner", "System", "Math", "Arrays", "Collections"
      ]
    })
  });

  registerDsaLanguage(monaco, "cpp", {
    configuration: commonConfiguration,
    tokenizer: createTokenizer({
      preprocessor: true,
      keywords: [
        "alignas", "alignof", "and", "asm", "auto", "bitand", "bitor", "bool",
        "break", "case", "catch", "char", "class", "compl", "concept", "const",
        "constexpr", "const_cast", "continue", "co_await", "co_return", "co_yield",
        "decltype", "default", "delete", "do", "double", "dynamic_cast", "else",
        "enum", "explicit", "export", "extern", "false", "float", "for", "friend",
        "goto", "if", "inline", "int", "long", "mutable", "namespace", "new",
        "noexcept", "not", "nullptr", "operator", "or", "private", "protected",
        "public", "register", "reinterpret_cast", "requires", "return", "short",
        "signed", "sizeof", "static", "static_assert", "static_cast", "struct",
        "switch", "template", "this", "thread_local", "throw", "true", "try",
        "typedef", "typeid", "typename", "union", "unsigned", "using", "virtual",
        "void", "volatile", "wchar_t", "while", "xor"
      ],
      typeKeywords: [
        "string", "vector", "array", "map", "unordered_map", "set", "unordered_set",
        "queue", "deque", "stack", "priority_queue", "pair", "tuple", "size_t",
        "int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t",
        "uint32_t", "uint64_t", "istream", "ostream"
      ]
    })
  });
}

async function ensureMonaco() {
  if (monacoApi) {
    return monacoApi;
  }

  if (!monacoLoaderPromise) {
    monacoLoaderPromise = (async () => {
      const loaderUrl = new URL("../node_modules/monaco-editor/min/vs/loader.js", window.location.href).toString();
      const workerMainUrl = new URL("../node_modules/monaco-editor/min/vs/base/worker/workerMain.js", window.location.href).toString();
      const baseUrl = new URL("../node_modules/monaco-editor/min/", window.location.href).toString();
      const vsPath = new URL("../node_modules/monaco-editor/min/vs", window.location.href).toString();
      const editorCssUrl = new URL("../node_modules/monaco-editor/min/vs/style.css", window.location.href).toString();

      await loadStylesheet(editorCssUrl);
      await loadScript(loaderUrl);

      window.MonacoEnvironment = {
        getWorkerUrl() {
          return `data:text/javascript;charset=utf-8,${encodeURIComponent(
            `self.MonacoEnvironment={baseUrl:${JSON.stringify(baseUrl)}};importScripts(${JSON.stringify(workerMainUrl)});`
          )}`;
        }
      };

      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = () => {
          if (settled || !window.monaco?.editor) return;
          settled = true;
          window.clearInterval(readinessInterval);
          window.clearTimeout(readinessTimeout);
          resolve(window.monaco);
        };
        const fail = (error) => {
          if (settled) return;
          settled = true;
          window.clearInterval(readinessInterval);
          window.clearTimeout(readinessTimeout);
          reject(error);
        };
        const readinessInterval = window.setInterval(finish, 25);
        const readinessTimeout = window.setTimeout(() => {
          fail(new Error("Monaco editor assets loaded, but the editor API did not become ready."));
        }, 8000);

        window.require.config({ paths: { vs: vsPath } });
        window.require(["vs/editor/editor.main"], finish, fail);
        finish();
      });
    })();
  }

  monacoApi = await monacoLoaderPromise;
  return monacoApi;
}

async function initializeMonacoEditor() {
  const monaco = await ensureMonaco();
  registerDsaLanguages(monaco);
  if (monacoEditor) {
    return;
  }
  const initialContent = state.editorContent;

  monacoEditor = monaco.editor.create(editorEl, {
    value: initialContent,
    language: state.selectedLanguage === "cpp" ? "cpp" : "java",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: state.editorFontSize,
    lineNumbers: "on",
    roundedSelection: false,
    scrollBeyondLastLine: false,
    wordWrap: "off",
    tabSize: 2,
    insertSpaces: true,
    bracketPairColorization: { enabled: true },
    guides: { indentation: true },
    readOnly: true
  });

  monacoEditor.onDidChangeModelContent(() => {
    state.editorContent = monacoEditor.getValue();
    if (!suppressEditorDirtyTracking && state.currentProblem) {
      setEditorDirty(true);
    }
    updateEditorStatus();
  });

  monacoEditor.onDidChangeCursorSelection(() => {
    updateEditorStatus();
  });

  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
    await saveCurrentWorkspace();
  });

  state.monacoReady = true;
  setEditorValue(initialContent);
  applyEditorFontSize();
  scheduleEditorRefresh();
  updateEditorStatus();
}

function getEditorValue() {
  if (monacoEditor) {
    return monacoEditor.getValue();
  }
  return state.editorContent;
}

function setEditorValue(value) {
  state.editorContent = value;
  if (monacoEditor) {
    suppressEditorDirtyTracking = true;
    monacoEditor.setValue(value);
    suppressEditorDirtyTracking = false;
  }
}

function applyEditorLanguage() {
  if (languageSelectEl) {
    languageSelectEl.value = state.selectedLanguage;
  }
  if (monacoEditor && monacoApi) {
    const model = monacoEditor.getModel();
    if (model) {
      monacoApi.editor.setModelLanguage(model, state.selectedLanguage === "cpp" ? "cpp" : "java");
    }
  }
}

function applyEditorFontSize() {
  if (monacoEditor) {
    monacoEditor.updateOptions({ fontSize: state.editorFontSize });
  }
  fontStatusEl.textContent = `${state.editorFontSize}px`;
}

function updateEditorStatus() {
  const text = getEditorValue();
  const lines = text.length ? text.split("\n").length : 0;
  let selectionLength = 0;
  let line = 1;
  let column = 1;

  if (monacoEditor) {
    const model = monacoEditor.getModel();
    const position = monacoEditor.getPosition();
    const selection = monacoEditor.getSelection();
    line = position?.lineNumber ?? 1;
    column = position?.column ?? 1;
    selectionLength = selection && model ? model.getValueLengthInRange(selection) : 0;
  }

  cursorStatusEl.textContent = `Ln ${line}, Col ${column}`;
  selectionStatusEl.textContent = `${selectionLength} selected`;
  lineStatusEl.textContent = `${lines} line${lines === 1 ? "" : "s"}`;

  if (!state.currentProblem) {
    saveStatusEl.className = "pill gray";
    saveStatusEl.textContent = "No file open";
  } else if (state.editorDirty) {
    saveStatusEl.className = "pill yellow";
    saveStatusEl.textContent = "Unsaved changes";
  } else {
    saveStatusEl.className = "pill green";
    saveStatusEl.textContent = "Saved";
  }
}

function setEditorDirty(isDirty) {
  state.editorDirty = isDirty;
  updateEditorStatus();
}

function setEditorControlsEnabled(enabled) {
  toggleEditorFocusButtonEl.disabled = !enabled;
  decreaseFontButtonEl.disabled = !enabled;
  increaseFontButtonEl.disabled = !enabled;
  runButtonEl.disabled = !enabled;
  saveButtonEl.disabled = !enabled;
  submitButtonEl.disabled = !enabled;
  openFileButtonEl.disabled = !enabled;
  if (languageSelectEl) languageSelectEl.disabled = !enabled;
}

function renderRunMode() {
  runModeTabsEl.querySelectorAll("[data-run-mode]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-run-mode") === state.currentRunMode);
  });
  customInputSectionEl.classList.toggle("is-hidden", state.currentRunMode !== "custom");
}

function currentMissionProblem() {
  return state.currentProblem ?? state.bootstrap?.nextRecommendation?.problem ?? null;
}

function emptyEditorState() {
  setEditorValue("");
  editorEl.classList.add("is-disabled");
  if (monacoEditor) {
    monacoEditor.updateOptions({ readOnly: true });
  }
  setEditorControlsEnabled(false);
  editorProblemTitleEl.textContent = "Workspace";
  problemMetaEl.textContent = "Open a problem to load its starter file here.";
  state.editorDirty = false;
  if (languageSelectEl) languageSelectEl.disabled = true;
  updateEditorStatus();
}

async function loadBootstrap(topicId) {
  state.bootstrap = await window.dsaDesktop.bootstrap(topicId);
  applyDesktopPreferences(state.bootstrap.preferences);
  render();
}

async function switchTopic(topicId) {
  closeTopicSwitcher();
  const previousView = state.currentView;
  state.bootstrap = await window.dsaDesktop.switchTopic(topicId);
  state.currentProblem = null;
  state.workspacePath = null;
  state.currentView = previousView;
  state.showResult = false;
  state.resultHtml = "";
  state.resultTabs = { summary: "", execution: "", guidance: "" };
  state.activeResultView = "summary";
  customInputEl.value = "";
  emptyEditorState();
  void persistDesktopPreferences();
  render();
}

function setCurrentView(view) {
  state.currentView = view;
  void persistDesktopPreferences();
  render();
  scheduleScrollReset();
  if (view === "practice") scheduleEditorRefresh();
}

function renderViews() {
  appShellEl.classList.toggle("home-mode", state.currentView === "home");
  Object.entries(viewEls).forEach(([view, el]) => {
    el.classList.toggle("is-hidden", view !== state.currentView);
  });

  viewTabsEl.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-view") === state.currentView);
  });
}

function renderTopics() {
  if (!topicListEl) {
    return;
  }
  topicListEl.innerHTML = "";
  state.bootstrap.topics.forEach((topic) => {
    const button = document.createElement("button");
    button.className = `topic-button${topic.id === state.bootstrap.activeTopicId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(topic.name)}</strong>
      <div class="meta-line">
        <span>${escapeHtml(topic.worldName)}</span>
        <span class="pill ${topic.status === "active" ? "green" : "yellow"}">${escapeHtml(topic.status)}</span>
      </div>
    `;
    button.disabled = topic.status !== "active";
    button.onclick = () => switchTopic(topic.id);
    topicListEl.appendChild(button);
  });
}

function renderTopicSwitcher() {
  topicSwitcherMenuEl.innerHTML = "";
  state.bootstrap.topics.forEach((topic) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `topic-switcher-option${topic.id === state.bootstrap.activeTopicId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(topic.name)}</strong>
      <div class="meta-line">
        <span>${escapeHtml(topic.worldName)}</span>
        <span class="pill ${topic.status === "active" ? "green" : "yellow"}">${escapeHtml(topic.status)}</span>
      </div>
    `;
    button.disabled = topic.status !== "active";
    button.addEventListener("click", async () => {
      await switchTopic(topic.id);
    });
    topicSwitcherMenuEl.appendChild(button);
  });
}

function platformStats() {
  const activeTopics = state.bootstrap.topics.filter((topic) => topic.status === "active");
  const totalProblems = state.bootstrap.topicProgress.reduce((sum, item) => sum + item.total, 0);
  const solvedProblems = state.bootstrap.topicProgress.reduce((sum, item) => sum + item.solved, 0);
  const totalRoadmapSteps = activeTopics.reduce((sum, topic) => sum + (topic.roadmap?.length ?? 0), 0);

  return {
    activeTopics: activeTopics.length,
    totalProblems,
    solvedProblems,
    roadmapSteps: totalRoadmapSteps
  };
}

function topicSolvedCount(topicId) {
  return state.bootstrap.topicProgress.find((item) => item.topicId === topicId)?.solved ?? 0;
}

function marketingWorldStatus(world, index) {
  const solved = topicSolvedCount(world.sourceTopicId);
  const active = world.sourceTopicId === state.bootstrap.activeTopicId;
  if (active) {
    return "current";
  }
  if (solved > 0 || index === 0) {
    return "completed";
  }
  return "locked";
}

function renderHomeHero() {
  const missionProblem = currentMissionProblem();
  if (!missionProblem) {
    heroTaskTitleEl.textContent = "Your next task will appear here";
    heroJourneyStepsEl.innerHTML = `
      <div class="journey-step journey-step-current">
        <div class="journey-step-top">
          <div class="journey-step-status">
            <span class="journey-status">▶</span>
            <span class="journey-state">Current</span>
          </div>
          <span class="journey-xp">+40 XP</span>
        </div>
        <strong>Pick a topic to reveal your next guided task.</strong>
        <small>Adaptive recommendation</small>
      </div>
      <div class="journey-step-connector"></div>
      <div class="journey-step journey-step-locked">
        <div class="journey-step-top">
          <div class="journey-step-status">
            <span class="journey-status">🔒</span>
            <span class="journey-state">Locked</span>
          </div>
        </div>
        <strong>Feedback unlocks the next challenge.</strong>
        <small>Next recommendation</small>
      </div>
    `;
    heroTaskReasonsEl.innerHTML = `<div class="home-reason-item muted">Pick a topic to reveal the next guided problem.</div>`;
  } else {
    heroTaskTitleEl.textContent = missionProblem.title;

    const reasons = state.bootstrap.nextRecommendation?.reasons?.length
      ? state.bootstrap.nextRecommendation.reasons
      : [
          "Chosen from your active topic roadmap",
          "Adaptive progression favors the next best-fit concept",
          "The platform removes guesswork from what to solve next"
        ];

    heroTaskReasonsEl.innerHTML = reasons
      .slice(0, 3)
      .map((reason) => `<div class="home-reason-item">✓ ${escapeHtml(reason)}</div>`)
      .join("");

    const missionIndex = Math.max(
      0,
      state.bootstrap.problems.findIndex((problem) => problem.id === missionProblem.id)
    );
    const journeyProblems = state.bootstrap.problems
      .slice(Math.max(0, missionIndex - 2), Math.min(state.bootstrap.problems.length, missionIndex + 3));

    heroJourneyStepsEl.innerHTML = journeyProblems
      .map((problem, index) => {
        const absoluteIndex = Math.max(0, missionIndex - 2) + index;
        const isCompleted = absoluteIndex < missionIndex;
        const isCurrent = absoluteIndex === missionIndex;
        const statusClass = isCompleted
          ? "journey-step-completed"
          : isCurrent
            ? "journey-step-current"
            : "journey-step-locked";
        const statusIcon = isCompleted ? "✓" : isCurrent ? "▶" : "🔒";
        const statusLabel = isCompleted ? "Solved" : isCurrent ? "Current" : "Locked";
        const detail = `${problem.difficulty} · ${problem.subtopic}`;
        const xp = isCurrent ? "+40 XP" : isCompleted ? "+20 XP" : "";

        return `
          <div class="journey-step ${statusClass}">
            <div class="journey-step-top">
              <div class="journey-step-status">
                <span class="journey-status">${statusIcon}</span>
                <span class="journey-state">${statusLabel}</span>
              </div>
              ${xp ? `<span class="journey-xp">${xp}</span>` : ""}
            </div>
            <strong>${escapeHtml(problem.title)}</strong>
            <small>${escapeHtml(detail)}</small>
          </div>
          ${index < journeyProblems.length - 1 ? `<div class="journey-step-connector"></div>` : ""}
        `;
      })
      .join("");
  }

  heroPathEl.innerHTML = `
    <div class="hero-world-path"></div>
    ${MARKETING_WORLDS.map((world, index) => {
      const status = marketingWorldStatus(world, index);
      return `
        <div class="hero-world-node hero-world-node-${status}" style="left:${world.x}; top:${world.y};">
          <div class="hero-world-core"></div>
          <strong>${escapeHtml(world.label)}</strong>
        </div>
      `;
    }).join("")}
  `;
}

function renderHomeFlow() {
  if (!homeProductFlowEl) return;
  const recommendationMessage =
    state.bootstrap.nextRecommendation?.message ?? "The platform selects the next problem automatically.";
  const recommendationReason =
    state.bootstrap.nextRecommendation?.reasons?.[0] ?? "Chosen from your current topic progression.";

  homeProductFlowEl.innerHTML = `
    <article class="flow-phase-card flow-phase-solve">
      <div class="flow-phase-icon">▶</div>
      <div class="flow-phase-copy">
        <span class="flow-phase-label">Solve</span>
        <strong>Write the solution in the editor.</strong>
        <p>Run official tests before you submit.</p>
      </div>
    </article>
    <div class="flow-phase-arrow">→</div>
    <article class="flow-phase-card flow-phase-feedback">
      <div class="flow-phase-icon">✓</div>
      <div class="flow-phase-copy">
        <span class="flow-phase-label">Feedback</span>
        <strong>See correctness, concepts, and misses.</strong>
        <p>Feedback stays tied to the problem you just solved.</p>
      </div>
    </article>
    <div class="flow-phase-arrow">→</div>
    <article class="flow-phase-card flow-phase-recommendation">
      <div class="flow-phase-icon">↗</div>
      <div class="flow-phase-copy">
        <span class="flow-phase-label">Recommendation</span>
        <strong>${escapeHtml(recommendationMessage)}</strong>
        <p>${escapeHtml(recommendationReason)}</p>
      </div>
    </article>
  `;
}

function renderHomeWorlds() {
  homeWorldsEl.innerHTML = `
    <div class="world-adventure-map">
      <div class="world-adventure-path"></div>
      ${MARKETING_WORLDS.map((world, index) => {
        const status = marketingWorldStatus(world, index);
        const solved = topicSolvedCount(world.sourceTopicId);
        return `
          <button class="world-island ${status}" data-home-topic-id="${escapeHtml(world.sourceTopicId)}">
            <div class="world-island-core"></div>
            <strong>${escapeHtml(world.label)}</strong>
            <small>${status === "locked" ? "Locked" : `${solved} solved`}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;

  homeWorldsEl.querySelectorAll("[data-home-topic-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const topicId = button.getAttribute("data-home-topic-id");
      if (topicId) {
        await switchTopic(topicId);
      }
    });
  });
}

function renderHomeRoadmap() {
  homeRoadmapEl.innerHTML = MARKETING_ROADMAP
    .map((node) => {
      const solved = topicSolvedCount(node.sourceTopicId);
      const current = node.sourceTopicId === state.bootstrap.activeTopicId ? " current" : "";
      const completed = solved > 0 && !current ? " completed" : "";
      return `
        <div class="roadmap-node${current}${completed}">
          <div class="roadmap-node-ring"></div>
          <strong>${escapeHtml(node.label)}</strong>
          <span>${current ? "Current focus" : solved > 0 ? `${solved} solved` : "Upcoming"}</span>
        </div>
      `;
    })
    .join("");
}

function renderHomeStats() {
  const stats = platformStats();
  const cards = [
    {
      icon: marketingIcon("worlds"),
      value: stats.activeTopics,
      label: "Active Worlds",
      suffix: "+"
    },
    {
      icon: marketingIcon("problems"),
      value: stats.totalProblems,
      label: "Guided Problems",
      suffix: "+"
    },
    {
      icon: marketingIcon("streak"),
      value: Math.max(1, state.bootstrap.gameProfile?.streakDays ?? 0),
      label: "Current Streak",
      suffix: ""
    },
    {
      icon: marketingIcon("trophy"),
      value: stats.solvedProblems,
      label: "Problems Solved",
      suffix: "+"
    }
  ];

  homeStatsEl.innerHTML = cards
    .map(
      (card, index) => `
        <article class="stats-card">
          <span class="stats-icon">${card.icon}</span>
          <strong class="stats-value" data-home-stat="${index}" data-target="${card.value}" data-suffix="${card.suffix}">0${card.suffix}</strong>
          <span>${escapeHtml(card.label)}</span>
        </article>
      `
    )
    .join("");
}

function animateHomeCounters() {
  homeStatsEl.querySelectorAll("[data-home-stat]").forEach((node) => {
    const target = Number(node.getAttribute("data-target") ?? "0");
    const suffix = node.getAttribute("data-suffix") ?? "";
    const start = performance.now();
    const duration = 650;

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      node.textContent = `${value}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });
}

function renderPlayerCard() {
  const { profile, gameProfile, activeTopic } = state.bootstrap;
  const topicTitle = gameProfile.topicTitles?.[state.bootstrap.activeTopicId];
  playerCardEl.innerHTML = `
    <strong>${escapeHtml(profile?.name ?? "Player")}</strong>
    <p>${escapeHtml(gameProfile.rankTitle)} · Level ${gameProfile.level}</p>
    <p>XP ${gameProfile.xp} · Streak ${gameProfile.streakDays} day(s)</p>
    <p>${topicTitle ? `Active Title: ${escapeHtml(topicTitle)}` : `Focused World: ${escapeHtml(activeTopic?.worldName ?? "Arena")}`}</p>
  `;
}

function renderHeader() {
  const { activeTopic, profile, gameProfile } = state.bootstrap;
  const current = currentMissionProblem();
  headerBreadcrumbEl.textContent = current
    ? `${activeTopic?.name ?? "Topic"} › ${current.subtopic}`
    : `${activeTopic?.name ?? "Topic"} › Recommended Path`;
  headerPlayerChipEl.textContent = `${profile?.name ?? "Player"} · Lv ${gameProfile.level}`;
  if (current?.difficulty) {
    headerDifficultyBadgeEl.className = `pill ${difficultyColor(current.difficulty)}`;
    headerDifficultyBadgeEl.textContent = current.difficulty;
    headerDifficultyBadgeEl.classList.remove("is-hidden");
  } else {
    headerDifficultyBadgeEl.className = "pill gray is-hidden";
  }
  topicNameEl.textContent = activeTopic?.name ?? "Topic";
  topicDescriptionEl.textContent = activeTopic?.description ?? "";
}

function renderEnvironmentBanner() {
  const runtime = state.selectedLanguage === "cpp" ? state.bootstrap?.cppRuntime : state.bootstrap?.javaRuntime;
  if (!environmentBannerEl || !runtime) return;

  const shouldShow = !runtime.available && !environmentBannerDismissed;
  environmentBannerEl.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) return;

  environmentBannerTitleEl.textContent = state.selectedLanguage === "cpp"
    ? "C++ compiler missing"
    : runtime.javaAvailable && !runtime.javacAvailable
      ? "Java compiler missing"
      : !runtime.javaAvailable && runtime.javacAvailable
        ? "Java runtime missing"
        : "Java setup required";

  const details = state.selectedLanguage === "cpp"
    ? [
        runtime.guidance,
        runtime.compilerVersion ? `Compiler: ${runtime.compilerVersion}.` : "Compiler: not detected."
      ]
    : [
        runtime.guidance,
        runtime.javaVersion ? `Runtime: ${runtime.javaVersion}.` : "Runtime: not detected.",
        runtime.javacVersion ? `Compiler: ${runtime.javacVersion}.` : "Compiler: not detected."
      ];
  environmentBannerMessageEl.textContent = details.join(" ");
}

function renderPracticeStrip() {
  const { gameProfile, nextRecommendation } = state.bootstrap;
  const missionProblem = currentMissionProblem();
  const hasWorkspaceOpen = Boolean(state.currentProblem);
  const solved = state.bootstrap.topicProgress.find((item) => item.topicId === state.bootstrap.activeTopicId);

  missionTitleEl.textContent = hasWorkspaceOpen
    ? `Continue ${state.currentProblem.id} · ${state.currentProblem.title}`
    : missionProblem
      ? `${missionProblem.id} · ${missionProblem.title}`
      : "Choose your next problem";

  missionSummaryEl.textContent = hasWorkspaceOpen
    ? "Your editor is ready. Finish the code on the right, then submit to see test results."
    : nextRecommendation.message;

  missionMetaEl.innerHTML = missionProblem
    ? `
      <span class="pill ${difficultyColor(missionProblem.difficulty)}">${escapeHtml(missionProblem.difficulty)}</span>
      <span class="pill blue">📚 ${escapeHtml(missionProblem.subtopic)}</span>
      <span class="pill yellow">${escapeHtml(missionProblem.expectedComplexity)}</span>
    `
    : "";

  streakCountEl.textContent = `${gameProfile.streakDays} day${gameProfile.streakDays === 1 ? "" : "s"}`;
  solvedCountEl.textContent = `${solved?.solved ?? 0}/${solved?.total ?? state.bootstrap.problems.length}`;

  missionStepsEl.textContent = hasWorkspaceOpen
    ? "Read the left panel, code on the right, then submit when ready."
    : missionProblem
      ? `Start ${missionProblem.id}, solve it, and submit it.`
      : "Pick a topic to load your first task.";

  missionActionButtonEl.textContent = hasWorkspaceOpen ? "Continue Current Task" : "Start Next Task";
  missionActionButtonEl.disabled = !missionProblem;
  missionJumpButtonEl.textContent = hasWorkspaceOpen ? "Browse Problems" : "Preview Problem";
  missionJumpButtonEl.disabled = !missionProblem;
}

function renderProblemList() {
  const filters = currentProblemFilters();
  const filteredProblems = state.bootstrap.problems.filter((problem) => {
    const status = getProblemStatus(problem.id);
    const queryMatch =
      !filters.query ||
      `${problem.id} ${problem.title} ${problem.subtopic}`.toLowerCase().includes(filters.query);
    const difficultyMatch = filters.difficulty === "all" || problem.difficulty === filters.difficulty;
    const statusMatch = filters.status === "all" || status === filters.status;
    return queryMatch && difficultyMatch && statusMatch;
  });

  problemListEl.innerHTML = filteredProblems
    .map((problem, index) => {
      const status = getProblemStatus(problem.id);
      return `
        <button class="problem-library-row${state.currentProblem?.id === problem.id ? " active" : ""}" data-problem-id="${problem.id}">
          <span>${index + 1}</span>
          <span class="problem-library-title">
            <strong>${escapeHtml(problem.title)}</strong>
            <span>${escapeHtml(problem.id)} · ${escapeHtml(problem.subtopic)}</span>
          </span>
          <span class="pill ${difficultyColor(problem.difficulty)}">${escapeHtml(problem.difficulty)}</span>
          <span class="status-dot ${status}">${escapeHtml(status)}</span>
          <span>${escapeHtml(problem.expectedComplexity)}</span>
        </button>
      `;
    })
    .join("");

  if (!filteredProblems.length) {
    problemListEl.innerHTML = `<div class="problem-library-row"><span>-</span><span class="problem-library-title"><strong>No matching problems</strong><span>Try clearing the search or filters.</span></span><span></span><span></span><span></span></div>`;
  }

  problemListEl.querySelectorAll("[data-problem-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const problemId = button.getAttribute("data-problem-id");
      if (problemId) {
        await startProblem(problemId);
      }
    });
  });
}

function renderProblemPane(problem) {
  problemTabsEl.querySelectorAll("[data-problem-view]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-problem-view") === state.currentProblemView);
  });

  if (!problem) {
    problemPaneTitleEl.textContent = "Choose a problem";
    problemPaneContentEl.innerHTML =
      "Use the next-task strip to open your recommended problem. The full statement will appear here.";
    return;
  }

  const section = (title, body) =>
    body
      ? `
        <section class="problem-section">
          <h3>${escapeHtml(title)}</h3>
          ${body}
        </section>
      `
      : "";

  const list = (items) =>
    items?.length
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";

  const examples = problem.examples?.length
    ? problem.examples
        .map(
          (example, index) => `
            <div class="example-card">
              <strong>Example ${index + 1}</strong>
              <pre>Input: ${escapeHtml(example.input)}
Output: ${escapeHtml(example.output)}</pre>
              ${example.explanation ? `<p>${escapeHtml(example.explanation)}</p>` : ""}
            </div>
          `
        )
        .join("")
    : "";

  const descriptionView = [
    `<div class="problem-header-meta">
      <span class="pill ${difficultyColor(problem.difficulty)}">${escapeHtml(problem.difficulty)}</span>
      <span class="pill blue">${escapeHtml(problem.subtopic)}</span>
      <span class="pill yellow">${escapeHtml(problem.expectedComplexity)}</span>
      <span class="pill gray">${problem.estimatedMinutes} min</span>
    </div>`,
    section("Description", `<p>${escapeHtml(problem.description ?? "No description added yet.")}</p>`),
    section("Constraints", list(problem.constraints)),
    problem.inputFormat?.length ? section("Input Format", list(problem.inputFormat)) : "",
    problem.outputFormat?.length ? section("Output Format", list(problem.outputFormat)) : "",
    section(
      "Expected Concepts",
      `<div class="compact-list">${problem.expectedConcepts
        .map((conceptId) => `<span class="pill blue">${escapeHtml(conceptLabel(conceptId))}</span>`)
        .join("")}</div>`
    ),
    problem.intendedApproachSummary
      ? `
        <details class="problem-section problem-details">
          <summary>See intended approach</summary>
          <p>${escapeHtml(problem.intendedApproachSummary)}</p>
        </details>
      `
      : ""
  ]
    .filter(Boolean)
    .join("");

  const examplesView = [
    examples || `<p class="muted">No examples added yet.</p>`,
    problem.edgeCases?.length ? section("Edge Cases", list(problem.edgeCases)) : ""
  ]
    .filter(Boolean)
    .join("");

  const hintsView = [
    problem.hints?.length ? section("Hints", list(problem.hints)) : `<p class="muted">No hints added yet.</p>`,
    problem.wrongApproachHints?.length ? section("Common Misses", list(problem.wrongApproachHints)) : "",
    problem.prerequisiteConcepts?.length
      ? section(
          "Prerequisite Concepts",
          `<div class="compact-list">${problem.prerequisiteConcepts
            .map((conceptId) => `<span class="pill gray">${escapeHtml(conceptLabel(conceptId))}</span>`)
            .join("")}</div>`
        )
      : ""
  ]
    .filter(Boolean)
    .join("");

  const tabContent = {
    description: descriptionView,
    examples: examplesView,
    hints: hintsView
  };

  problemPaneTitleEl.textContent = `${problem.id} · ${problem.title}`;
  problemPaneContentEl.innerHTML = tabContent[state.currentProblemView] ?? descriptionView;
}

function renderEditorMeta(problem, workspacePath) {
  if (!problem) {
    editorProblemTitleEl.textContent = "Workspace";
    problemMetaEl.textContent = "Open a problem to load its starter file here.";
    return;
  }

  const functionMode = Boolean(problem.functionContract && problem.solutionMode !== "complete-program");
  const independenceMilestone = Boolean(problem.independenceMilestoneFor?.length);
  editorProblemTitleEl.textContent = functionMode
    ? `Complete the function · ${problem.title}`
    : independenceMilestone
      ? `Complete-program milestone · ${problem.title}`
    : `${problem.id} · ${problem.title}`;
  const modeDetails = functionMode
    ? `<br /><strong>Task:</strong> Implement <code>${escapeHtml(
        state.selectedLanguage === "cpp" ? problem.functionContract.cppSignature : problem.functionContract.javaSignature
      )}</code><br /><span class="muted">Node, input parsing, output formatting, and the test driver are provided.</span>`
    : "";
  const milestoneDetails = independenceMilestone
    ? `<br /><strong>Milestone:</strong> Build the complete executable solution without generated scaffolding.`
    : "";
  problemMetaEl.innerHTML = `
    <strong>${escapeHtml(problem.topic)} · ${escapeHtml(problem.subtopic)}</strong><br />
    Workspace: ${escapeHtml(workspacePath ?? "Not created yet")}<br />
    Language: ${state.selectedLanguage === "cpp" ? "C++17" : "Java"}
    ${modeDetails}
    ${milestoneDetails}
  `;
}

function renderStreakCalendar() {
  const { streakCalendar, gameProfile } = state.bootstrap;
  const activeDays = streakCalendar.filter((entry) => entry.count > 0).length;
  const todayEntry = streakCalendar[streakCalendar.length - 1];
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  streakSummaryEl.innerHTML = `
    <strong>${gameProfile.streakDays} day streak</strong>
    <span class="muted">Last 28 days: ${activeDays} active day(s)</span>
    <span class="muted">${todayEntry?.count ? `Today: ${todayEntry.count} submission(s)` : "Solve today to keep the streak alive."}</span>
  `;

  streakCalendarEl.innerHTML = `
    <div class="streak-weekdays">
      ${weekdayLabels.map((label) => `<span>${label}</span>`).join("")}
    </div>
    <div class="streak-grid">
      ${streakCalendar
        .map(
          (entry) => `
            <div
              class="streak-cell level-${entry.level}"
              title="${escapeHtml(entry.date)} · ${entry.count} submission(s)"
            ></div>
          `
        )
        .join("")}
    </div>
    <div class="streak-legend">
      <span class="muted">Less</span>
      <span class="streak-legend-cell level-0"></span>
      <span class="streak-legend-cell level-1"></span>
      <span class="streak-legend-cell level-2"></span>
      <span class="streak-legend-cell level-3"></span>
      <span class="muted">More</span>
    </div>
  `;
}

function renderSubmissionTrend() {
  const items = state.bootstrap.submissionTrend;
  if (!items.length) {
    submissionTrendEl.innerHTML = `<p class="muted">Your last submissions will appear here after you start practicing.</p>`;
    return;
  }

  const average = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
  const values = items.map((item) => item.score);
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100;
    return { x, y, value, label: items[index].problemId };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  submissionTrendEl.innerHTML = `
    <div class="trend-pill-row">
      <span class="pill blue">Recent submissions: ${items.length}</span>
      <span class="pill ${scoreColor(average)}">Average ${average}</span>
    </div>
    <div class="trend-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Submission trend">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#8B5CF6"></stop>
            <stop offset="100%" stop-color="rgba(139, 92, 246, 0)"></stop>
          </linearGradient>
        </defs>
        <path class="trend-chart-area" d="${areaPath}"></path>
        <path class="trend-chart-line" d="${linePath}"></path>
        ${points.map((point) => `<circle class="trend-chart-point" cx="${point.x}" cy="${point.y}" r="1.9"></circle>`).join("")}
      </svg>
    </div>
    ${items
      .map((item) => `
        <div class="mini-bar-row">
          <div class="mini-bar-labels">
            <span>${escapeHtml(item.problemId)}</span>
            <span class="pill ${scoreColor(item.score)}">${item.score}</span>
          </div>
          <div class="mini-bar">
            <div class="bar-fill ${scoreColor(item.score)}" style="width: ${Math.max(8, item.score)}%"></div>
          </div>
        </div>
      `)
      .join("")}
  `;
}

function renderProgressSummary() {
  const { gameProfile, activeTopic } = state.bootstrap;
  const totalSolved = state.bootstrap.topicProgress.reduce((sum, item) => sum + item.solved, 0);
  const activeTopicProgress = state.bootstrap.topicProgress.find((item) => item.topicId === state.bootstrap.activeTopicId);

  progressStreakValueEl.textContent = `${gameProfile.streakDays}`;
  progressXpValueEl.textContent = `${gameProfile.xp}`;
  progressSolvedValueEl.textContent = `${totalSolved}`;
  progressTopicValueEl.textContent = activeTopic?.name ?? "Topic";
  progressTopicMetaEl.textContent = activeTopicProgress
    ? `${activeTopicProgress.solved}/${activeTopicProgress.total} solved`
    : "0/0 solved";
}

function renderTopicProgress() {
  topicProgressEl.innerHTML = state.bootstrap.topicProgress
    .map((item) => {
      const percent = item.total === 0 ? 0 : Math.round((item.solved / item.total) * 100);
      return `
        <div class="mini-bar-row">
          <div class="mini-bar-labels">
            <span>${escapeHtml(item.topicName)}</span>
            <span>${item.solved}/${item.total}</span>
          </div>
          <div class="mini-bar">
            <div class="bar-fill blue" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRecommendationInsights() {
  const { nextRecommendation } = state.bootstrap;
  nextCardEl.innerHTML = `
    <div class="world-hero-card">
      <h4>${nextRecommendation.problem ? `${escapeHtml(nextRecommendation.problem.id)} · ${escapeHtml(nextRecommendation.problem.title)}` : "No recommendation yet"}</h4>
      <p>${escapeHtml(nextRecommendation.message)}</p>
      <div class="compact-list">
      ${nextRecommendation.reasons.length
        ? nextRecommendation.reasons.map((reason) => `<div>${escapeHtml(reason)}</div>`).join("")
        : `<div class="muted">Solve a few problems and your next-step reasoning will appear here.</div>`}
      </div>
    </div>
  `;
}

function renderSkillBars() {
  const items = state.bootstrap.skillBars;
  if (!items.length) {
    skillBarsEl.innerHTML = `<p class="muted">Your strongest concepts will appear here as you submit more problems.</p>`;
    return;
  }

  skillBarsEl.innerHTML = items
    .map(
      (item) => `
        <div class="mini-bar-row">
          <div class="mini-bar-labels">
            <span>${escapeHtml(item.conceptName)}</span>
            <span class="pill ${masteryColor(item.tier)}">${escapeHtml(item.tier)}</span>
          </div>
          <div class="mini-bar">
            <div class="bar-fill ${masteryColor(item.tier)}" style="width: ${item.score}%"></div>
          </div>
          <div class="mini-bar-labels">
            <span class="muted">Implementation independence</span>
            <span class="muted">${item.implementationScore}% · ${escapeHtml(item.implementationTier)}</span>
          </div>
          <div class="mini-bar">
            <div class="bar-fill ${masteryColor(item.implementationTier)}" style="width: ${item.implementationScore}%"></div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderWorldZones() {
  const nodes = state.bootstrap.worldZones
    .map(
      (zone, index) => `
        <div class="world-node-card ${zone.status === "unlocked" ? "current" : zone.status === "cleared" ? "completed" : "locked"}">
          <div class="world-node-number">${index + 1}</div>
          <h4>${escapeHtml(zone.name)}</h4>
          <div><span class="pill ${zoneColor(zone.status)}">${escapeHtml(zone.status)}</span></div>
          <p>${escapeHtml(zone.description)}</p>
          <p>${zone.solvedCount}/${zone.totalProblems} solved${zone.gate ? ` · Gate: ${escapeHtml(zone.gate)}` : ""}</p>
        </div>
      `
    )
    .join("");

  const summary = state.bootstrap.worldZones
    .map((zone) => {
      const percent = zone.totalProblems === 0 ? 0 : Math.round((zone.solvedCount / zone.totalProblems) * 100);
      return `
        <div class="mini-bar-row">
          <div class="mini-bar-labels">
            <span>${escapeHtml(zone.name)}</span>
            <span>${zone.solvedCount}/${zone.totalProblems}</span>
          </div>
          <div class="mini-bar">
            <div class="bar-fill ${zoneColor(zone.status)}" style="width: ${Math.max(percent, zone.solvedCount ? 8 : 0)}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  worldZonesEl.innerHTML = `
    <div class="world-track">${nodes}</div>
    <div class="world-hero-card">
      <h4>Zone Progress</h4>
      ${summary}
    </div>
  `;
}

function formatExecutionFeedback(execution) {
  const lines = [];
  lines.push(`<div class="result-detail-stack">`);
  lines.push(`<div class="result-detail-card"><h4>Execution</h4>`);

  if (!execution.compileSucceeded) {
    lines.push(`<div class="execution-summary-grid"><div class="execution-summary-card"><strong>Compile Result</strong><span class="pill red">Compilation failed</span></div></div>`);
    if (execution.compileError) {
      lines.push(`<pre>${escapeHtml(execution.compileError)}</pre>`);
    }
    lines.push(`</div></div>`);
    return lines.join("");
  }

  if (execution.usedTestCases) {
    lines.push(`
      <div class="execution-summary-grid">
        <div class="execution-summary-card">
          <strong>Compile Result</strong>
          <span class="pill green">Success</span>
        </div>
        <div class="execution-summary-card">
          <strong>Test Cases</strong>
          <span class="pill ${execution.passedCount === execution.totalCount ? "green" : "yellow"}">${execution.passedCount}/${execution.totalCount} tests passed</span>
        </div>
      </div>
    `);
  } else {
    lines.push(`
      <div class="execution-summary-grid">
        <div class="execution-summary-card">
          <strong>Compile Result</strong>
          <span class="pill green">Success</span>
        </div>
        <div class="execution-summary-card">
          <strong>Execution Mode</strong>
          <span class="pill gray">Static-heavy fallback</span>
        </div>
      </div>
      <p class="muted">This problem does not have full execution test cases yet, so static analysis was used more heavily.</p>
    `);
  }
  lines.push(`</div>`);

  if (execution.failedCases.length) {
    lines.push(
      `<div class="result-detail-card"><h4>Failed Cases</h4><div class="failed-case-grid">${execution.failedCases
        .slice(0, 3)
        .map(
          (item, index) => `
            <div class="failed-case-card">
              <strong>Failed Case ${index + 1}</strong>
              <pre>Input: ${escapeHtml(item.input)}
Expected: ${escapeHtml(item.expectedOutput)}
Got: ${escapeHtml(item.actualOutput || item.error || "No output")}</pre>
              ${item.timedOut ? `<p class="muted">The program timed out on this case.</p>` : ""}
            </div>
          `
        )
        .join("")}</div></div>`
    );
  }

  lines.push(`</div>`);
  return lines.join("");
}

function buildRunResultPanels(problem, execution) {
  const statusPill = !execution.compileSucceeded
    ? `<span class="pill red">Compile failed</span>`
    : execution.passedCount === execution.totalCount
      ? `<span class="pill green">${execution.passedCount}/${execution.totalCount} tests passed</span>`
      : `<span class="pill yellow">${execution.passedCount}/${execution.totalCount} tests passed</span>`;

  return {
    summary: `
      ${buildResultStateBanner(
        `Official run · ${problem.id}`,
        "This was a local test run. It does not affect progress until you submit.",
        statusPill
      )}
      <div class="result-card-grid">
        <div class="result-score-card">
          ${buildSummaryScoreRing(execution.compileSucceeded ? (execution.totalCount ? Math.round((execution.passedCount / execution.totalCount) * 100) : 0) : 0, "Run")}
          <p class="muted">Local run complete. Progress was not updated.</p>
        </div>
        <div class="result-metric-card">
          <div class="result-metrics">
            <div class="result-metrics-block">
              <div class="result-metrics-label">Run Context</div>
              <div class="metric-row"><strong>Problem</strong><span class="metric-value">${escapeHtml(problem.title)}</span></div>
              <div class="metric-row"><strong>Status</strong><span>${statusPill}</span></div>
              <div class="metric-row"><strong>Mode</strong><span class="metric-value">Official tests</span></div>
            </div>
            <div class="result-metrics-block">
              <div class="result-metrics-label">What To Do</div>
              <div class="metric-row"><strong>Next</strong><span class="metric-value">Inspect Execution, then submit when ready</span></div>
            </div>
          </div>
        </div>
      </div>
    `,
    execution: formatExecutionFeedback(execution),
    guidance: `
      <div class="result-next-card">
        <h4>What next</h4>
        <p>${execution.compileSucceeded && execution.passedCount === execution.totalCount
          ? "Your code passed the available test cases. Submit when you want this attempt to count toward progress."
          : "Fix the compile or test issues shown in the Execution tab, then run again before submitting."}</p>
      </div>
    `
  };
}

function buildCustomRunPanels(problem, customRun) {
  const statusPill = !customRun.compileSucceeded
    ? `<span class="pill red">Run failed</span>`
    : `<span class="pill green">Run complete</span>`;

  return {
    summary: `
      ${buildResultStateBanner(
        `Custom input run · ${problem.id}`,
        "Use this mode to debug with your own stdin before running official tests or submitting.",
        statusPill
      )}
      <div class="result-card-grid">
        <div class="result-score-card">
          ${buildSummaryScoreRing(customRun.compileSucceeded ? 100 : 0, "Custom")}
          <p class="muted">Custom input run complete. Progress was not updated.</p>
        </div>
        <div class="result-metric-card">
          <div class="result-metrics">
            <div class="result-metrics-block">
              <div class="result-metrics-label">Run Context</div>
              <div class="metric-row"><strong>Problem</strong><span class="metric-value">${escapeHtml(problem.title)}</span></div>
              <div class="metric-row"><strong>Status</strong><span>${statusPill}</span></div>
              <div class="metric-row"><strong>Mode</strong><span class="metric-value">Custom input</span></div>
            </div>
            <div class="result-metrics-block">
              <div class="result-metrics-label">What To Do</div>
              <div class="metric-row"><strong>Next</strong><span class="metric-value">Refine with your own cases, then run official tests</span></div>
            </div>
          </div>
        </div>
      </div>
    `,
    execution: `
      <div class="result-detail-stack">
        <div class="result-detail-card">
          <h4>Execution</h4>
          <div class="execution-summary-grid">
            <div class="execution-summary-card">
              <strong>Run Status</strong>
              ${statusPill}
            </div>
            <div class="execution-summary-card">
              <strong>Input Mode</strong>
              <span class="pill blue">Custom stdin</span>
            </div>
          </div>
          ${customRun.compileError ? `<pre>${escapeHtml(customRun.compileError)}</pre>` : ""}
          ${customRun.runtimeError ? `<pre>${escapeHtml(customRun.runtimeError)}</pre>` : ""}
        </div>
        ${!customRun.compileError ? `<div class="result-detail-card"><h4>Input</h4><pre>${escapeHtml(customRun.customInput || "(empty input)")}</pre></div>` : ""}
        ${!customRun.compileError ? `<div class="result-detail-card"><h4>Output</h4><pre>${escapeHtml(customRun.actualOutput || "(no output)")}</pre></div>` : ""}
      </div>
    `,
    guidance: `
      <div class="result-next-card">
        <h4>What next</h4>
        <p>${customRun.compileSucceeded
          ? "Use this custom case to debug quickly. When the logic looks stable, switch back to Official Tests or Submit."
          : "Fix the compile or runtime issue shown in the Execution tab, then run again."}</p>
      </div>
    `
  };
}

function formatLikelyCause(outcome) {
  const likelyCauses = [];

  if (!outcome.execution.compileSucceeded) {
    likelyCauses.push(`The ${state.selectedLanguage === "cpp" ? "C++" : "Java"} file did not compile. Start by fixing the compiler message shown above.`);
  }
  if (outcome.execution.compileSucceeded && outcome.execution.failedCases.length) {
    likelyCauses.push("At least one test case produced a wrong output. Compare the failed input with your logic and edge cases.");
  }
  if (outcome.analysis.signals.missingRecursiveProgress) {
    likelyCauses.push("The recursive call may not be moving toward the base case.");
  }
  if (!outcome.analysis.signals.hasBaseCase && outcome.problem.topic === "Recursion") {
    likelyCauses.push("Your recursion likely needs a clear base case before the recursive step.");
  }
  if (outcome.analysis.signals.usesModuloDivision && outcome.problem.topic === "Bit Manipulation") {
    likelyCauses.push("Your solution uses arithmetic instead of the intended bitwise operator path.");
  }
  if (outcome.analysis.signals.hasUnnecessaryLoop) {
    likelyCauses.push("A simpler complexity may be expected here. Recheck the intended approach.");
  }
  if (outcome.detection.missingConcepts.length) {
    likelyCauses.push(`You have not clearly demonstrated the required concept: ${outcome.detection.missingConcepts.map(conceptLabel).join(", ")}.`);
  }

  if (!likelyCauses.length) {
    return "";
  }

  return `
    <strong>Likely Cause</strong>
    <ul>${likelyCauses.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

async function startProblem(problemId) {
  const session = await window.dsaDesktop.startProblem(problemId, state.selectedLanguage);
  loadWorkspaceSession(session);
}

function loadWorkspaceSession(session) {
  state.currentProblem = session.problem;
  state.workspacePath = session.workspacePath;
  state.selectedLanguage = session.language === "cpp" ? "cpp" : "java";
  state.currentView = "practice";
  state.currentProblemView = "description";
  clearResultPanels();
  setEditorValue(session.workspaceCode);
  applyEditorLanguage();
  editorEl.classList.remove("is-disabled");
  if (monacoEditor) {
    monacoEditor.updateOptions({ readOnly: false });
  }
  setEditorControlsEnabled(true);
  setEditorDirty(false);
  applyEditorFontSize();
  render();
  updateEditorStatus();
  scheduleEditorRefresh();
  monacoEditor?.focus();
  scheduleScrollReset();
  void persistDesktopPreferences();
}

async function restoreLastWorkspace() {
  const problemId = state.lastOpenedProblemId;
  if (!problemId) return;

  try {
    const session = await window.dsaDesktop.loadWorkspace(problemId, state.selectedLanguage);
    loadWorkspaceSession(session);
  } catch (_error) {
    state.lastOpenedProblemId = null;
    void persistDesktopPreferences();
  }
}

async function saveCurrentWorkspace() {
  if (!state.currentProblem) return;
  await window.dsaDesktop.saveWorkspace(state.currentProblem.id, getEditorValue(), state.selectedLanguage);
  setEditorDirty(false);
  setResultPanels(
    {
      summary: `<strong>Saved</strong><p>${escapeHtml(state.currentProblem.id)} was saved to your workspace.</p>`,
      execution: `<p class="muted">No execution run yet. Press Submit to compile and run test cases.</p>`,
      guidance: `<p class="muted">Keep coding or press Submit when you want real feedback.</p>`
    },
    state.showResult,
    "summary"
  );
}

async function runCurrentWorkspace() {
  if (!state.currentProblem) return;
  const runtime = state.selectedLanguage === "cpp" ? state.bootstrap?.cppRuntime : state.bootstrap?.javaRuntime;
  const languageName = state.selectedLanguage === "cpp" ? "C++" : "Java";
  if (!runtime?.available) {
    setResultPanels(
      {
        summary: `<strong>${languageName} Setup Required</strong><p>${escapeHtml(runtime?.guidance ?? `Install a ${languageName} compiler to run solutions.`)}</p>`,
        execution: `<p class="muted">Run is unavailable until the selected language toolchain is installed.</p>`,
        guidance: `<p class="muted">Install the required compiler, then restart the app.</p>`
      },
      true,
      "summary"
    );
    render();
    scrollToResultsSection();
    return;
  }
  const outcome = await window.dsaDesktop.runProblem(state.currentProblem.id, getEditorValue(), {
    mode: state.currentRunMode,
    customInput: customInputEl.value,
    language: state.selectedLanguage
  });
  if (outcome.mode === "custom") {
    setResultPanels(buildCustomRunPanels(outcome.problem, outcome.customRun), true, "execution");
  } else {
    setResultPanels(buildRunResultPanels(outcome.problem, outcome.execution), true, "execution");
  }
  render();
  updateEditorStatus();
  scrollToResultsSection();
}

async function submitCurrentWorkspace() {
  if (!state.currentProblem) return;
  const runtime = state.selectedLanguage === "cpp" ? state.bootstrap?.cppRuntime : state.bootstrap?.javaRuntime;
  const languageName = state.selectedLanguage === "cpp" ? "C++" : "Java";
  if (!runtime?.available) {
    setResultPanels(
      {
        summary: `<strong>${languageName} Setup Required</strong><p>${escapeHtml(runtime?.guidance ?? `Install a ${languageName} compiler to submit solutions.`)}</p>`,
        execution: `<p class="muted">Submit is unavailable until the selected language toolchain is installed.</p>`,
        guidance: `<p class="muted">Install the required compiler, then restart the app.</p>`
      },
      true,
      "summary"
    );
    render();
    scrollToResultsSection();
    return;
  }
  const previousStreak = state.bootstrap?.gameProfile?.streakDays ?? 0;
  const outcome = await window.dsaDesktop.submitProblem(state.currentProblem.id, getEditorValue(), state.selectedLanguage);
  state.editorDirty = false;
  state.bootstrap = await window.dsaDesktop.bootstrap(state.bootstrap.activeTopicId);

  const missingConceptNames = await Promise.all(
    outcome.detection.missingConcepts.map((conceptId) => window.dsaDesktop.getConceptName(conceptId))
  );
  const detectedConceptNames = await Promise.all(
    outcome.analysisFeedback.detectedConcepts.map((item) => window.dsaDesktop.getConceptName(item.conceptId))
  );
  const detectedConceptEvidence = outcome.analysisFeedback.detectedConcepts.map((item, index) => ({
    ...item,
    conceptName: detectedConceptNames[index]
  }));
  const nextProblem = state.bootstrap?.nextRecommendation?.problem;
  const nextTaskAction = nextProblem
    ? `
        <div class="next-task-inline">
          <div class="eyebrow">Next Task</div>
          <strong>${escapeHtml(nextProblem.id)} · ${escapeHtml(nextProblem.title)}</strong>
          <p class="muted">${escapeHtml(outcome.recommendation.message)}</p>
          <button class="primary-button" data-result-action="start-next-task">Start Next Task</button>
        </div>
      `
    : "";

  const reviewPanels = {
    summary: `
        ${buildResultStateBanner(
          `Submission review · ${outcome.problem.id}`,
          "This result counts toward your progress and concept profile.",
          `<span class="pill ${scoreColor(outcome.score.finalScore)}">${outcome.score.finalScore}/100</span>`
        )}
        <div class="result-card-grid">
          <div class="result-score-card">
            <div class="eyebrow">Review · ${escapeHtml(outcome.problem.id)}</div>
            ${buildSummaryScoreRing(outcome.score.finalScore, outcome.score.finalScore >= 85 ? "Great" : "Review")}
            <strong>${escapeHtml(outcome.problem.title)}</strong>
          </div>
          <div class="result-metric-card">
            <div class="result-metrics">
              <div class="result-metrics-block">
                <div class="result-metrics-label">Score Breakdown</div>
                <div class="metric-row"><strong>Correctness</strong><span class="metric-value">${outcome.score.correctnessScore}</span></div>
                <div class="metric-row"><strong>Concept Match</strong><span class="metric-value">${outcome.score.conceptMatchScore}</span></div>
                <div class="metric-row"><strong>Code Quality</strong><span class="metric-value">${outcome.score.qualityScore}</span></div>
                <div class="metric-row"><strong>Complexity</strong><span class="metric-value">${outcome.score.complexityScore}</span></div>
              </div>
              <div class="result-metrics-block">
                <div class="result-metrics-label">Concept Signals</div>
                <div class="metric-row"><strong>Detected Concepts</strong><span class="chip-list">${renderConceptChips(detectedConceptNames, "blue")}</span></div>
                <div class="metric-row"><strong>Missing Concepts</strong><span class="chip-list">${renderConceptChips(missingConceptNames, "red")}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="result-detail-card analysis-evidence-card">
          <h4>Why these concepts were detected</h4>
          ${renderConceptEvidence(detectedConceptEvidence)}
        </div>
      `,
    execution: `
        ${buildResultStateBanner(
          `Execution review · ${outcome.problem.id}`,
          "Look here first when you need to understand compile errors or failed test cases."
        )}
        <div class="eyebrow">Review · ${escapeHtml(outcome.problem.id)}</div>
        ${formatExecutionFeedback(outcome.execution)}
      `,
    guidance: `
        ${buildResultStateBanner(
          `Recommendation · ${outcome.problem.id}`,
          "This explains what to do next and why the adaptive engine chose it."
        )}
        <div class="result-detail-stack">
          <div class="result-detail-card">
            <div class="eyebrow">Review · ${escapeHtml(outcome.problem.id)}</div>
            ${formatLikelyCause(outcome) || `<div class="empty-guidance">No major warning signals were detected. You can focus on the next recommended step.</div>`}
          </div>
          <div class="result-detail-card">
            <h4>Complexity reasoning</h4>
            ${renderReasonList(outcome.analysisFeedback.complexityReasoning, "No complexity evidence is available.")}
          </div>
          <div class="result-detail-card">
            <h4>Analyzer warnings</h4>
            ${renderAnalysisIssues(outcome.analysisFeedback.antiPatterns)}
          </div>
          <div class="result-detail-card">
            <h4>How to improve</h4>
            ${renderReasonList(outcome.analysisFeedback.improvements, "No immediate improvement is required.")}
          </div>
          <div class="result-next-card">
            <h4>Recommendation</h4>
            <p>${escapeHtml(outcome.recommendation.message)}</p>
            ${nextTaskAction}
          </div>
        </div>
      `
  };

  saveLastSubmissionReview(outcome.problem, reviewPanels);
  setResultPanels(reviewPanels, true, "summary");
  if (outcome.solvedByExecution) {
    showSuccessModal({
      title: outcome.rewardResult.questStatus === "quest-complete" ? "Great Work" : "Good Progress",
      xp: outcome.rewardResult.xpGained,
      streakGain: Math.max(0, (state.bootstrap?.gameProfile?.streakDays ?? 0) - previousStreak),
      nextTaskId: nextProblem?.id,
      nextTaskTitle: nextProblem ? `${nextProblem.id} · ${nextProblem.title}` : "",
      nextTaskReason: state.bootstrap?.nextRecommendation?.message ?? "",
      hasReview: true
    });
  }
  render();
  updateEditorStatus();
}

async function openCurrentWorkspace() {
  if (!state.workspacePath) return;
  await window.dsaDesktop.openPath(state.workspacePath);
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  void persistDesktopPreferences();
  render();
}

function toggleEditorFocus() {
  if (!state.currentProblem) return;
  state.editorFocusMode = !state.editorFocusMode;
  void persistDesktopPreferences();
  render();
}

function render() {
  if (!state.bootstrap) return;
  applySplitRatio();
  appShellEl.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  appShellEl.classList.toggle("editor-focus-mode", state.editorFocusMode);
  toggleSidebarButtonEl.textContent = state.sidebarCollapsed ? "☰ Expand Sidebar" : "☰ Collapse Sidebar";
  sidebarEdgeToggleButtonEl.setAttribute("aria-label", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
  toggleEditorFocusButtonEl.textContent = state.editorFocusMode ? "Exit Focus" : "Focus Editor";
  renderViews();
  renderRunMode();
  renderHeader();
  renderEnvironmentBanner();
  renderUpdateBanner();
  renderTopicSwitcher();
  renderHomeHero();
  renderHomeWorlds();
  renderHomeFlow();
  renderHomeRoadmap();
  renderHomeStats();
  renderTopics();
  renderPlayerCard();
  renderPracticeStrip();
  renderProblemList();
  renderProblemPane(state.currentProblem);
  renderEditorMeta(state.currentProblem, state.workspacePath);
  renderProgressSummary();
  renderStreakCalendar();
  renderSubmissionTrend();
  renderTopicProgress();
  renderRecommendationInsights();
  renderSkillBars();
  renderWorldZones();
  applyEditorLanguage();
  resultTabsEl.querySelectorAll("[data-result-view]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-result-view") === state.activeResultView);
  });
  resultPanelEl.innerHTML = state.resultTabs[state.activeResultView] ?? state.resultHtml;
  resultSectionEl.classList.toggle("is-hidden", !state.showResult);
  if (state.successModal && !successModalOverlayEl.open) {
    successModalOverlayEl.showModal();
  } else if (!state.successModal && successModalOverlayEl.open) {
    successModalOverlayEl.close();
  }
  applyEditorFontSize();
  updateEditorStatus();
  if (state.currentView === "home") {
    animateHomeCounters();
  }
}

refreshButtonEl.addEventListener("click", async () => {
  environmentBannerDismissed = false;
  state.bootstrap = await window.dsaDesktop.bootstrap(state.bootstrap?.activeTopicId);
  render();
});

environmentBannerGuideButtonEl?.addEventListener("click", async () => {
  await window.dsaDesktop.openExternal(state.selectedLanguage === "cpp" ? cppGuideUrl() : javaGuideUrl());
});

environmentBannerDismissButtonEl?.addEventListener("click", () => {
  environmentBannerDismissed = true;
  renderEnvironmentBanner();
});

updateDownloadButtonEl?.addEventListener("click", async () => {
  state.updateDismissed = false;
  try {
    await window.dsaDesktop.downloadUpdate();
  } catch (error) {
    state.updateStatus = {
      status: "error",
      message: error?.message ?? String(error)
    };
    renderUpdateBanner();
  }
});

updateInstallButtonEl?.addEventListener("click", async () => {
  try {
    await window.dsaDesktop.installUpdate();
  } catch (error) {
    state.updateStatus = {
      status: "error",
      message: error?.message ?? String(error)
    };
    renderUpdateBanner();
  }
});

updateLaterButtonEl?.addEventListener("click", () => {
  state.updateDismissed = true;
  renderUpdateBanner();
});

topicSwitcherButtonEl.addEventListener("click", () => {
  toggleTopicSwitcher();
});

homeStartButtonEl.addEventListener("click", async () => {
  await launchPrimaryMission();
});

homeNavStartButtonEl?.addEventListener("click", async () => {
  await launchPrimaryMission();
});

homeLoginButtonEl?.addEventListener("click", () => {
  setCurrentView("practice");
});

heroTaskStartButtonEl.addEventListener("click", async () => {
  await launchPrimaryMission();
});

homeFinalCtaButtonEl.addEventListener("click", async () => {
  await launchPrimaryMission();
});

homeDemoButtonEl.addEventListener("click", () => {
  if (!homeShowcaseSectionEl) return;
  homeShowcaseSectionEl.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

document.querySelectorAll("[data-home-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-home-scroll");
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

resetLayoutButtonEl.addEventListener("click", async () => {
  await resetLayoutState();
});

resetPreferencesButtonEl.addEventListener("click", async () => {
  await resetDesktopPreferences();
});

toggleSidebarButtonEl.addEventListener("click", () => {
  toggleSidebar();
});

sidebarEdgeToggleButtonEl.addEventListener("click", () => {
  toggleSidebar();
});

toggleEditorFocusButtonEl.addEventListener("click", () => {
  toggleEditorFocus();
});

saveButtonEl.addEventListener("click", saveCurrentWorkspace);
runButtonEl.addEventListener("click", runCurrentWorkspace);
submitButtonEl.addEventListener("click", submitCurrentWorkspace);
openFileButtonEl.addEventListener("click", openCurrentWorkspace);
languageSelectEl?.addEventListener("change", async () => {
  const nextLanguage = languageSelectEl.value === "cpp" ? "cpp" : "java";
  if (nextLanguage === state.selectedLanguage) return;

  if (state.currentProblem) {
    await window.dsaDesktop.saveWorkspace(state.currentProblem.id, getEditorValue(), state.selectedLanguage);
  }

  state.selectedLanguage = nextLanguage;
  environmentBannerDismissed = false;
  clearResultPanels();

  if (state.currentProblem) {
    const session = await window.dsaDesktop.loadWorkspace(state.currentProblem.id, state.selectedLanguage);
    loadWorkspaceSession(session);
  } else {
    applyEditorLanguage();
    render();
    await persistDesktopPreferences();
  }
});
decreaseFontButtonEl.addEventListener("click", () => {
  state.editorFontSize = Math.max(12, state.editorFontSize - 1);
  applyEditorFontSize();
  void persistDesktopPreferences();
});
increaseFontButtonEl.addEventListener("click", () => {
  state.editorFontSize = Math.min(22, state.editorFontSize + 1);
  applyEditorFontSize();
  void persistDesktopPreferences();
});
missionActionButtonEl.addEventListener("click", async () => {
  const problem = currentMissionProblem();
  if (!problem) return;
  if (state.currentProblem) {
    setCurrentView("practice");
    scrollToCurrentTaskWorkspace();
    return;
  }
  await startProblem(problem.id);
});
missionJumpButtonEl.addEventListener("click", async () => {
  const problem = currentMissionProblem();
  if (!problem) return;
  if (state.currentProblem) {
    setCurrentView("problems");
    return;
  }
  await startProblem(problem.id);
});
successModalStartButtonEl.addEventListener("click", async () => {
  await startRecommendedNextProblem();
});
successModalReviewButtonEl.addEventListener("click", reviewLastSubmission);
successModalCloseButtonEl.addEventListener("click", hideSuccessModal);
successModalOverlayEl.addEventListener("click", (event) => {
  if (event.target === successModalOverlayEl) {
    hideSuccessModal();
  }
});

viewTabsEl.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.getAttribute("data-view");
    if (view) {
      setCurrentView(view);
    }
  });
});

problemTabsEl.querySelectorAll("[data-problem-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.getAttribute("data-problem-view");
    if (!view) return;
    state.currentProblemView = view;
    renderProblemPane(state.currentProblem);
    void persistDesktopPreferences();
  });
});

splitterEl.addEventListener("mousedown", (event) => {
  if (window.innerWidth <= 1240) return;
  splitterDragging = true;
  splitterEl.classList.add("is-dragging");
  event.preventDefault();
});

window.addEventListener("mousemove", (event) => {
  if (!splitterDragging) return;
  const practiceLayout = document.querySelector(".practice-layout");
  if (!practiceLayout) return;
  const rect = practiceLayout.getBoundingClientRect();
  const ratio = ((event.clientX - rect.left) / rect.width) * 100;
  state.splitRatio = ratio;
  applySplitRatio();
});

window.addEventListener("mouseup", () => {
  if (!splitterDragging) return;
  splitterDragging = false;
  splitterEl.classList.remove("is-dragging");
  void persistDesktopPreferences();
});

runModeTabsEl.querySelectorAll("[data-run-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.getAttribute("data-run-mode");
    if (!mode) return;
    state.currentRunMode = mode;
    renderRunMode();
    void persistDesktopPreferences();
  });
});

resultTabsEl.querySelectorAll("[data-result-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.getAttribute("data-result-view");
    if (!view) return;
    state.activeResultView = view;
    resultPanelEl.innerHTML = state.resultTabs[state.activeResultView] ?? "";
    render();
  });
});

resultPanelEl.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-result-action]");
  if (!button) return;

  const action = button.getAttribute("data-result-action");
  if (action === "start-next-task") {
    await startRecommendedNextProblem();
  }
});

problemSearchInputEl?.addEventListener("input", renderProblemList);
problemDifficultyFilterEl?.addEventListener("change", renderProblemList);
problemStatusFilterEl?.addEventListener("change", renderProblemList);

window.addEventListener("keydown", (event) => {
  const modifierPressed = event.metaKey || event.ctrlKey;
  if (!modifierPressed) return;

  const key = event.key.toLowerCase();

  if (key === "b" && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    toggleSidebar();
    return;
  }

  if (key === "f" && event.shiftKey && !event.altKey) {
    event.preventDefault();
    toggleEditorFocus();
  }
});

window.addEventListener("resize", scheduleEditorLayout);

if (typeof ResizeObserver !== "undefined") {
  const editorResizeObserver = new ResizeObserver(scheduleEditorLayout);
  editorResizeObserver.observe(editorEl);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (topicSwitcherButtonEl.contains(target) || topicSwitcherMenuEl.contains(target)) return;
  closeTopicSwitcher();
});

window.dsaDesktop.onUpdateStatus?.((status) => {
  state.updateStatus = status;
  if (["available", "downloaded", "downloading"].includes(status?.status)) {
    state.updateDismissed = false;
  }
  renderUpdateBanner();
});

(async () => {
  try {
    const savedPreferences = await window.dsaDesktop.loadPreferences();
    applyDesktopPreferences(savedPreferences);
    emptyEditorState();
    await loadBootstrap(savedPreferences.lastOpenedTopicId ?? undefined);
    await restoreLastWorkspace();
    await initializeMonacoEditor();
    applyEditorLanguage();
    if (state.currentProblem) {
      setEditorValue(state.editorContent);
      monacoEditor?.updateOptions({ readOnly: false });
      setEditorControlsEnabled(true);
      scheduleEditorRefresh();
    }
    render();
    scheduleScrollReset();
  } catch (error) {
    setResultPanels(
      {
        summary: `<strong>Desktop Load Error</strong><p>${escapeHtml(error.message || String(error))}</p>`,
        execution: `<p class="muted">The editor could not initialize yet.</p>`,
        guidance: `<p class="muted">Reload the desktop app and try again.</p>`
      },
      true,
      "summary"
    );
    emptyEditorState();
  }
})();
