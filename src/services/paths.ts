import os from "os";
import path from "path";

export function resolveBaseDir(): string {
  return process.env.DSA_SHEET_HOME ? path.resolve(process.env.DSA_SHEET_HOME) : path.join(os.homedir(), ".dsa-sheet");
}

export function getContentDir(): string {
  return path.join(resolveBaseDir(), "content");
}

export function getContentBundlePath(): string {
  return path.join(getContentDir(), "catalog.bundle.json");
}

export function getContentSyncStatePath(): string {
  return path.join(resolveBaseDir(), "content-sync-state.json");
}
