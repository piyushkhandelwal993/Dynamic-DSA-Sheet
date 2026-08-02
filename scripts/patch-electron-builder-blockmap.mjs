import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const filePath = resolve("node_modules/app-builder-lib/out/targets/blockmap/blockmap.js");

const original = 'const blake2_js_1 = require("@noble/hashes/blake2.js");';
const replacement = 'const blake2_js_1 = require("@noble/hashes/blake2b");';

try {
  const current = await readFile(filePath, "utf8");
  if (!current.includes(original)) {
    process.exit(0);
  }
  await writeFile(filePath, current.replace(original, replacement));
  console.log(`patched ${filePath}`);
} catch (error) {
  if (error && error.code === "ENOENT") {
    process.exit(0);
  }
  throw error;
}
