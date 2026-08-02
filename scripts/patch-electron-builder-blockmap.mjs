import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const filePath = resolve("node_modules/app-builder-lib/out/targets/blockmap/blockmap.js");

const requireLines = [
  'const blake2_js_1 = require("@noble/hashes/blake2.js");',
  'const blake2_js_1 = require("@noble/hashes/blake2b");'
];
const emitChunkLine = '        checksums.push(Buffer.from((0, blake2_js_1.blake2b)(chunkBuf.subarray(0, chunkN), { dkLen: 18 })).toString("base64"));';
const replacementRequireLine = 'const blockMapBlake2b = (input) => (0, crypto_1.createHash)("blake2b512").update(input).digest().subarray(0, 18);';
const replacementEmitChunkLine = '        checksums.push(Buffer.from(blockMapBlake2b(chunkBuf.subarray(0, chunkN))).toString("base64"));';

try {
  const current = await readFile(filePath, "utf8");
  if (!requireLines.some((line) => current.includes(line)) && !current.includes(emitChunkLine)) {
    process.exit(0);
  }
  const next = requireLines
    .reduce((value, line) => value.replace(line, replacementRequireLine), current)
    .replace(emitChunkLine, replacementEmitChunkLine);
  await writeFile(filePath, next);
  console.log(`patched ${filePath}`);
} catch (error) {
  if (error && error.code === "ENOENT") {
    process.exit(0);
  }
  throw error;
}
