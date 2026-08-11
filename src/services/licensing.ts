import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
  ActivatedLicenseRecord,
  DesktopLicenseActivationResult,
  DesktopLicenseStatus,
  DesktopTopicAccess,
  LicenseClaims,
  LicenseStore,
  TopicMeta
} from "../types";
import { getActiveContentBundle } from "./catalog";
import { resolveBaseDir } from "./paths";

const LICENSE_SCHEMA_VERSION = 1;
const CODE_PREFIX = "DSA1";
const DEFAULT_FREE_TOPIC_IDS = ["language-toolkit", "arrays"];
const LICENSE_SIGNATURE_ALGORITHM = "sha256";

function getLicenseStorePath(): string {
  return path.join(resolveBaseDir(), "entitlements.json");
}

function getBundledPublicKeyPath(): string {
  return path.resolve(process.cwd(), "config", "license-public-key.pem");
}

function readPackageUnlockPortalUrl(): string | null {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as {
      dsaSheetUnlock?: { portalUrl?: string; backendUrl?: string };
    };
    return packageJson.dsaSheetUnlock?.portalUrl?.trim() || null;
  } catch {
    return null;
  }
}

export function getUnlockPortalUrl(): string | null {
  return process.env.DSA_SHEET_UNLOCK_PORTAL_URL?.trim() || readPackageUnlockPortalUrl();
}

function readPackageUnlockBackendUrl(): string | null {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as {
      dsaSheetUnlock?: { portalUrl?: string; backendUrl?: string };
    };
    return packageJson.dsaSheetUnlock?.backendUrl?.trim() || null;
  } catch {
    return null;
  }
}

export function getUnlockBackendUrl(): string | null {
  return process.env.DSA_SHEET_LICENSE_PUBLIC_BASE_URL?.trim() || process.env.DSA_SHEET_UNLOCK_BACKEND_URL?.trim() || readPackageUnlockBackendUrl();
}

function writeJson<T>(targetPath: string, value: T): void {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(targetPath, "utf-8")) as T;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function codePreview(code: string): string {
  if (code.length <= 18) {
    return code;
  }
  return `${code.slice(0, 10)}…${code.slice(-6)}`;
}

function getConfiguredFreeTopicIds(): string[] {
  const raw = process.env.DSA_SHEET_FREE_TOPIC_IDS?.trim();
  const configured = raw
    ? raw.split(",").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_FREE_TOPIC_IDS;
  return [...new Set(configured)];
}

export function createInitialLicenseStore(): LicenseStore {
  return {
    schemaVersion: LICENSE_SCHEMA_VERSION,
    freeTopicIds: getConfiguredFreeTopicIds(),
    licenses: [],
    lastValidatedAt: null
  };
}

function getLicenseStore(): LicenseStore {
  const defaults = createInitialLicenseStore();
  const saved = readJson<Partial<LicenseStore>>(getLicenseStorePath());
  if (!saved) {
    return defaults;
  }
  return {
    schemaVersion: LICENSE_SCHEMA_VERSION,
    freeTopicIds: Array.isArray(saved.freeTopicIds) && saved.freeTopicIds.length ? [...new Set(saved.freeTopicIds)] : defaults.freeTopicIds,
    licenses: Array.isArray(saved.licenses) ? saved.licenses : [],
    lastValidatedAt: saved.lastValidatedAt ?? null
  };
}

function saveLicenseStore(store: LicenseStore): void {
  fs.mkdirSync(resolveBaseDir(), { recursive: true });
  writeJson(getLicenseStorePath(), store);
}

export function getMachineFingerprint(): { machineHash: string; machineLabel: string } {
  const machineSeed = [
    os.platform(),
    os.arch(),
    os.hostname(),
    os.userInfo().username,
    resolveBaseDir()
  ].join("|");
  const machineHash = crypto.createHash("sha256").update(machineSeed).digest("hex");
  return {
    machineHash,
    machineLabel: machineHash.slice(0, 12).toUpperCase()
  };
}

function loadPublicKey(): crypto.KeyObject | null {
  const envKey = process.env.DSA_SHEET_LICENSE_PUBLIC_KEY?.trim();
  if (envKey) {
    return crypto.createPublicKey(envKey);
  }
  const bundledPath = getBundledPublicKeyPath();
  if (fs.existsSync(bundledPath)) {
    return crypto.createPublicKey(fs.readFileSync(bundledPath, "utf-8"));
  }
  return null;
}

function parseLicenseCode(code: string): { payloadSegment: string; claims: LicenseClaims; signature: Buffer } {
  const normalized = code.trim();
  const segments = normalized.split(".");
  if (segments.length !== 3 || segments[0] !== CODE_PREFIX) {
    throw new Error("This unlock code format is invalid.");
  }

  const payloadSegment = segments[1];
  const claims = JSON.parse(base64UrlDecode(payloadSegment).toString("utf-8")) as LicenseClaims;
  const signature = base64UrlDecode(segments[2]);
  return { payloadSegment, claims, signature };
}

function verifyLicenseClaims(claims: LicenseClaims, email: string, machineHash: string): void {
  if (claims.version !== 1) {
    throw new Error("This unlock code version is not supported.");
  }
  if (!claims.codeId || !claims.planId || !Array.isArray(claims.topicIds) || claims.topicIds.length === 0) {
    throw new Error("This unlock code is missing required access details.");
  }
  if (normalizeEmail(claims.email) !== normalizeEmail(email)) {
    throw new Error("This unlock code was issued for a different email address.");
  }
  if (claims.machineHash !== machineHash) {
    throw new Error("This unlock code was issued for a different machine.");
  }
  const now = Date.now();
  if (Number.isNaN(Date.parse(claims.expiresAt)) || now > Date.parse(claims.expiresAt)) {
    throw new Error("This unlock code has expired.");
  }
  if (Number.isNaN(Date.parse(claims.startsAt)) || now < Date.parse(claims.startsAt)) {
    throw new Error("This unlock code is not active yet.");
  }
}

function buildTopicAccessMap(topicMetas: TopicMeta[], store: LicenseStore, machineHash: string): Record<string, DesktopTopicAccess> {
  const now = Date.now();
  const activeLicenses = store.licenses.filter((license) =>
    license.machineHash === machineHash && Date.parse(license.expiresAt) >= now
  );
  const latestByTopic = new Map<string, ActivatedLicenseRecord>();
  activeLicenses.forEach((license) => {
    license.topicIds.forEach((topicId) => {
      const current = latestByTopic.get(topicId);
      if (!current || Date.parse(license.expiresAt) > Date.parse(current.expiresAt)) {
        latestByTopic.set(topicId, license);
      }
    });
  });

  return Object.fromEntries(topicMetas.map((topic) => {
    if (topic.status !== "active") {
      return [topic.id, {
        topicId: topic.id,
        access: "coming-soon" as const,
        lockedReason: "This topic is still marked coming soon."
      }];
    }

    if (store.freeTopicIds.includes(topic.id)) {
      return [topic.id, {
        topicId: topic.id,
        access: "free" as const
      }];
    }

    const license = latestByTopic.get(topic.id);
    if (license) {
      return [topic.id, {
        topicId: topic.id,
        access: "unlocked" as const,
        expiresAt: license.expiresAt,
        planId: license.planId
      }];
    }

    return [topic.id, {
      topicId: topic.id,
      access: "locked" as const,
      lockedReason: "Enter a valid unlock code for this topic on this machine."
    }];
  }));
}

export function getDesktopLicenseStatus(): DesktopLicenseStatus {
  const store = getLicenseStore();
  const { machineHash, machineLabel } = getMachineFingerprint();
  const topicAccess = buildTopicAccessMap(
    getActiveContentBundle().topicOrder
      .map((topicId) => getActiveContentBundle().topicPacks[topicId]?.meta)
      .filter((topic): topic is TopicMeta => Boolean(topic)),
    store,
    machineHash
  );
  const now = Date.now();

  return {
    machineHash,
    machineLabel,
    unlockPortalUrl: getUnlockPortalUrl(),
    unlockBackendUrl: getUnlockBackendUrl(),
    freeTopicIds: store.freeTopicIds,
    activeLicenses: store.licenses.filter((license) =>
      license.machineHash === machineHash && Date.parse(license.expiresAt) >= now
    ),
    topicAccess,
    publicKeyConfigured: Boolean(loadPublicKey())
  };
}

export function canAccessTopic(topicId: string): boolean {
  const access = getDesktopLicenseStatus().topicAccess[topicId];
  return Boolean(access && (access.access === "free" || access.access === "unlocked"));
}

export function getTopicAccess(topicId: string): DesktopTopicAccess | undefined {
  return getDesktopLicenseStatus().topicAccess[topicId];
}

export function activateLicenseCode(email: string, code: string): DesktopLicenseActivationResult {
  const publicKey = loadPublicKey();
  if (!publicKey) {
    return {
      success: false,
      message: "Licensing is not configured yet. Add the public verification key before activating codes.",
      status: getDesktopLicenseStatus()
    };
  }

  const { machineHash } = getMachineFingerprint();

  try {
    const { payloadSegment, claims, signature } = parseLicenseCode(code);
    const verified = crypto.verify(
      LICENSE_SIGNATURE_ALGORITHM,
      Buffer.from(payloadSegment, "utf-8"),
      publicKey,
      signature
    );
    if (!verified) {
      throw new Error("This unlock code signature is invalid.");
    }

    verifyLicenseClaims(claims, email, machineHash);

    const store = getLicenseStore();
    const record: ActivatedLicenseRecord = {
      codeId: claims.codeId,
      email: normalizeEmail(email),
      machineHash: claims.machineHash,
      topicIds: claims.topicIds,
      planId: claims.planId,
      issuedAt: claims.issuedAt,
      startsAt: claims.startsAt,
      expiresAt: claims.expiresAt,
      activatedAt: new Date().toISOString(),
      codePreview: codePreview(code.trim())
    };

    const nextLicenses = store.licenses.filter((license) => license.codeId !== claims.codeId);
    nextLicenses.push(record);
    saveLicenseStore({
      ...store,
      licenses: nextLicenses,
      lastValidatedAt: new Date().toISOString()
    });

    const status = getDesktopLicenseStatus();
    return {
      success: true,
      message: `Unlock code accepted. ${claims.topicIds.length} topic(s) unlocked until ${new Date(claims.expiresAt).toLocaleDateString()}.`,
      status,
      activatedLicense: record
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not activate this unlock code.",
      status: getDesktopLicenseStatus()
    };
  }
}

export function clearExpiredLicenses(): void {
  const store = getLicenseStore();
  const now = Date.now();
  const filtered = store.licenses.filter((license) => Date.parse(license.expiresAt) >= now);
  if (filtered.length !== store.licenses.length) {
    saveLicenseStore({
      ...store,
      licenses: filtered
    });
  }
}

export function serializeLicenseCode(claims: LicenseClaims, privateKeyPem: string): string {
  const payloadSegment = base64UrlEncode(JSON.stringify(claims));
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(
    LICENSE_SIGNATURE_ALGORITHM,
    Buffer.from(payloadSegment, "utf-8"),
    privateKey
  );
  return `${CODE_PREFIX}.${payloadSegment}.${base64UrlEncode(signature)}`;
}
