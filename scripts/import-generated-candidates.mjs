import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    input: "",
    problem: "",
    language: "java",
    mode: "beginner"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      options.input = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--problem") {
      options.problem = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--language") {
      options.language = argv[index + 1] ?? "java";
      index += 1;
    } else if (arg === "--mode") {
      options.mode = argv[index + 1] ?? "beginner";
      index += 1;
    }
  }

  if (!options.input || !options.problem) {
    throw new Error("Usage: node scripts/import-generated-candidates.mjs --input <file> --problem <id> [--language java] [--mode beginner]");
  }

  return options;
}

function createCandidateId(problemId, candidate) {
  const payload = `${problemId}:${candidate.label ?? ""}:${candidate.candidateType ?? ""}:${candidate.code ?? ""}`;
  const hash = crypto.createHash("sha1").update(payload).digest("hex").slice(0, 12);
  return `cand_${hash}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(scriptDir, "..");
  const workspaceRoot = appRoot;
  const inputPath = path.resolve(workspaceRoot, options.input);
  const outputDir = path.resolve(workspaceRoot, "training", "generated", options.problem);

  const candidates = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  ensureDir(outputDir);

  let imported = 0;
  for (const candidate of candidates) {
    const normalized = {
      schemaVersion: 1,
      id: candidate.id ?? createCandidateId(options.problem, candidate),
      importedAt: new Date().toISOString(),
      problemId: options.problem,
      language: candidate.language ?? options.language,
      practiceMode: candidate.practiceMode ?? options.mode,
      candidateType: candidate.candidateType ?? "unknown",
      label: candidate.label ?? "unlabeled",
      code: candidate.code ?? "",
      notes: candidate.notes ?? "",
      model: candidate.model ?? "manual-import",
      promptVersion: candidate.promptVersion ?? "v1",
      sourceFile: options.input
    };

    const outputPath = path.join(outputDir, `${normalized.id}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
    imported += 1;
  }

  console.log(`Imported ${imported} candidate(s) into training/generated/${options.problem}`);
}

main();
