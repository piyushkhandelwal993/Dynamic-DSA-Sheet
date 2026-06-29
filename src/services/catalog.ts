import fs from "fs";
import path from "path";
import { defaultTopicId as bundledDefaultTopicId, topicOrder as bundledTopicOrder, topicPacks as bundledTopicPacks, TopicPack } from "../data/topics";
import { ContentBundle, ContentSyncManifest, ContentSyncResult, ContentSyncStatus, TopicMeta } from "../types";
import { getContentBundlePath, getContentDir, getContentSyncStatePath } from "./paths";

const CONTENT_SCHEMA_VERSION = 1;
const BUNDLED_CONTENT_VERSION = "bundled";

interface StoredContentSyncState {
  manifestUrl?: string | null;
  installedContentVersion?: string | null;
  lastCheckedAt?: string | null;
  lastSyncedAt?: string | null;
  remoteContentVersion?: string | null;
  updateAvailable?: boolean;
  message?: string | null;
}

let cachedInstalledBundle: ContentBundle | null | undefined;

function writeJson(targetPath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

function readPackageMetadata(): { version?: string; dsaSheetContent?: { manifestUrl?: string } } {
  try {
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    return JSON.parse(fs.readFileSync(packagePath, "utf-8")) as { version?: string; dsaSheetContent?: { manifestUrl?: string } };
  } catch {
    return {};
  }
}

function getAppVersion(): string {
  return readPackageMetadata().version ?? "0.0.0";
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

function getConfiguredManifestUrl(): string | null {
  const fromEnv = process.env.DSA_SHEET_CONTENT_MANIFEST_URL?.trim();
  if (fromEnv) return fromEnv;
  const fromPackage = readPackageMetadata().dsaSheetContent?.manifestUrl?.trim();
  return fromPackage ? fromPackage : null;
}

function validateTopicMeta(topic: TopicMeta, topicId: string): void {
  if (!topic || topic.id !== topicId || !topic.name) {
    throw new Error(`Invalid topic meta for ${topicId}`);
  }
}

function validateContentBundle(bundle: ContentBundle): void {
  if (!bundle || typeof bundle !== "object") {
    throw new Error("Content bundle is missing.");
  }
  if (bundle.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported content schema version: ${String(bundle.schemaVersion)}`);
  }
  if (!Array.isArray(bundle.topicOrder) || bundle.topicOrder.length === 0) {
    throw new Error("Content bundle does not define topic order.");
  }
  if (!bundle.defaultTopicId || !bundle.topicPacks?.[bundle.defaultTopicId]) {
    throw new Error("Content bundle default topic is missing.");
  }
  bundle.topicOrder.forEach((topicId) => {
    const pack = bundle.topicPacks?.[topicId];
    if (!pack) {
      throw new Error(`Missing topic pack for ${topicId}`);
    }
    validateTopicMeta(pack.meta, topicId);
    if (!Array.isArray(pack.problems) || !Array.isArray(pack.concepts)) {
      throw new Error(`Topic pack for ${topicId} is incomplete.`);
    }
  });
}

function createBundledContentBundle(): ContentBundle {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    contentVersion: BUNDLED_CONTENT_VERSION,
    generatedAt: new Date(0).toISOString(),
    defaultTopicId: bundledDefaultTopicId,
    topicOrder: [...bundledTopicOrder],
    topicPacks: bundledTopicPacks as Record<string, TopicPack>
  };
}

function readContentSyncState(): StoredContentSyncState {
  return readJson<StoredContentSyncState>(getContentSyncStatePath()) ?? {};
}

function saveContentSyncState(state: StoredContentSyncState): void {
  writeJson(getContentSyncStatePath(), state);
}

export function invalidateCatalogCache(): void {
  cachedInstalledBundle = undefined;
}

export function getBundledContentBundle(): ContentBundle {
  return createBundledContentBundle();
}

export function getInstalledContentBundle(): ContentBundle | null {
  if (cachedInstalledBundle !== undefined) {
    return cachedInstalledBundle;
  }

  try {
    const bundle = readJson<ContentBundle>(getContentBundlePath());
    if (!bundle) {
      cachedInstalledBundle = null;
      return cachedInstalledBundle;
    }
    validateContentBundle(bundle);
    cachedInstalledBundle = bundle;
    return cachedInstalledBundle;
  } catch {
    cachedInstalledBundle = null;
    return cachedInstalledBundle;
  }
}

export function getActiveContentBundle(): ContentBundle {
  return getInstalledContentBundle() ?? getBundledContentBundle();
}

export function getActiveCatalogSource(): "bundled" | "synced" {
  return getInstalledContentBundle() ? "synced" : "bundled";
}

export function getContentSyncStatus(): ContentSyncStatus {
  const stored = readContentSyncState();
  const active = getActiveContentBundle();
  const installed = getInstalledContentBundle();
  const manifestUrl = stored.manifestUrl ?? getConfiguredManifestUrl();

  return {
    enabled: Boolean(manifestUrl),
    source: installed ? "synced" : "bundled",
    activeContentVersion: active.contentVersion,
    bundledContentVersion: BUNDLED_CONTENT_VERSION,
    installedContentVersion: installed?.contentVersion ?? null,
    remoteContentVersion: stored.remoteContentVersion ?? null,
    updateAvailable: Boolean(stored.updateAvailable),
    lastCheckedAt: stored.lastCheckedAt ?? null,
    lastSyncedAt: stored.lastSyncedAt ?? null,
    manifestUrl: manifestUrl ?? null,
    message: stored.message ?? (manifestUrl ? "Ready to sync content updates." : "Live content sync is not configured yet.")
  };
}

async function fetchJson<T>(targetUrl: string): Promise<T> {
  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${targetUrl}`);
  }

  return await response.json() as T;
}

function validateManifest(manifest: ContentSyncManifest): void {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Content manifest is missing.");
  }
  if (manifest.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported content manifest schema: ${String(manifest.schemaVersion)}`);
  }
  if (!manifest.contentVersion || !manifest.bundleUrl) {
    throw new Error("Content manifest is incomplete.");
  }
}

export async function syncRemoteContent(): Promise<ContentSyncResult> {
  const manifestUrl = getConfiguredManifestUrl();
  const currentStatus = getContentSyncStatus();
  if (!manifestUrl) {
    return {
      updated: false,
      status: currentStatus
    };
  }

  const now = new Date().toISOString();
  const state = readContentSyncState();

  try {
    const manifest = await fetchJson<ContentSyncManifest>(manifestUrl);
    validateManifest(manifest);

    if (manifest.minAppVersion && compareVersions(getAppVersion(), manifest.minAppVersion) < 0) {
      const nextState: StoredContentSyncState = {
        ...state,
        manifestUrl,
        lastCheckedAt: now,
        remoteContentVersion: manifest.contentVersion,
        updateAvailable: false,
        message: `Content ${manifest.contentVersion} needs app version ${manifest.minAppVersion} or newer.`
      };
      saveContentSyncState(nextState);
      return { updated: false, status: getContentSyncStatus() };
    }

    const installedVersion = getInstalledContentBundle()?.contentVersion ?? BUNDLED_CONTENT_VERSION;
    if (installedVersion === manifest.contentVersion) {
      const nextState: StoredContentSyncState = {
        ...state,
        manifestUrl,
        installedContentVersion: getInstalledContentBundle()?.contentVersion ?? null,
        lastCheckedAt: now,
        remoteContentVersion: manifest.contentVersion,
        updateAvailable: false,
        message: `Content is already up to date (${manifest.contentVersion}).`
      };
      saveContentSyncState(nextState);
      return { updated: false, status: getContentSyncStatus() };
    }

    const bundleUrl = new URL(manifest.bundleUrl, manifestUrl).toString();
    const bundle = await fetchJson<ContentBundle>(bundleUrl);
    validateContentBundle(bundle);

    fs.mkdirSync(getContentDir(), { recursive: true });
    writeJson(getContentBundlePath(), bundle);
    invalidateCatalogCache();

    const nextState: StoredContentSyncState = {
      ...state,
      manifestUrl,
      installedContentVersion: bundle.contentVersion,
      lastCheckedAt: now,
      lastSyncedAt: now,
      remoteContentVersion: manifest.contentVersion,
      updateAvailable: false,
      message: `Synced content ${bundle.contentVersion}.`
    };
    saveContentSyncState(nextState);

    return {
      updated: true,
      status: getContentSyncStatus()
    };
  } catch (error) {
    const nextState: StoredContentSyncState = {
      ...state,
      manifestUrl,
      lastCheckedAt: now,
      updateAvailable: false,
      message: error instanceof Error ? error.message : String(error)
    };
    saveContentSyncState(nextState);
    return {
      updated: false,
      status: getContentSyncStatus()
    };
  }
}
