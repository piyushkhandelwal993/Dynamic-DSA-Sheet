import fs from "fs";
import path from "path";
import { Problem, ProgrammingLanguage } from "../types";
import { ensureBaseStructure, getProblemStarterFilePath, getProblemWorkspaceDir } from "./storage";
import { buildCppFunctionTemplate, buildJavaFunctionTemplate, usesFunctionHarness } from "./functionHarness";
import { normalizeCppSource, PORTABLE_CPP_HEADERS } from "./cppSupport";

export { normalizeCppSource, PORTABLE_CPP_HEADERS } from "./cppSupport";

function buildHeaderComment(problem: Problem): string {
  const lines = [
    `Problem: ${problem.title} (${problem.id})`,
    `Topic: ${problem.topic}`,
    `Subtopic: ${problem.subtopic}`,
    `Difficulty: ${problem.difficulty}`,
    `Expected Concepts: ${problem.expectedConcepts.join(", ")}`
  ];

  if (problem.inputFormat?.length) {
    lines.push("Input:");
    problem.inputFormat.forEach((line) => lines.push(`- ${line}`));
  }

  if (problem.outputFormat?.length) {
    lines.push("Output:");
    problem.outputFormat.forEach((line) => lines.push(`- ${line}`));
  }

  if (problem.intendedApproachSummary) {
    lines.push(`Approach: ${problem.intendedApproachSummary}`);
  }

  const example = problem.examples[0];
  if (example) {
    lines.push(`Sample Input: ${example.input}`);
    lines.push(`Sample Output: ${example.output}`);
  }

  return lines.map((line) => ` * ${line}`).join("\n");
}

export function buildJavaStarterTemplate(problem: Problem): string {
  const readHints = problem.inputFormat?.map((line) => `        // TODO: ${line}`).join("\n") ?? "        // TODO: read input";
  const outputHints = problem.outputFormat?.map((line) => `        // TODO: ${line}`).join("\n") ?? "        // TODO: print the answer";

  return `import java.util.*;

/*
${buildHeaderComment(problem)}
 */
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

${readHints}

        // TODO: implement the intended approach for this problem.
        // Hint: ${problem.hints[0] ?? "Use the expected concept directly."}

${outputHints}

        sc.close();
    }
}
`;
}

export function buildCppStarterTemplate(problem: Problem): string {
  const readHints = problem.inputFormat?.map((line) => `    // TODO: ${line}`).join("\n") ?? "    // TODO: read input";
  const outputHints = problem.outputFormat?.map((line) => `    // TODO: ${line}`).join("\n") ?? "    // TODO: print the answer";

  return `${PORTABLE_CPP_HEADERS}
using namespace std;

/*
${buildHeaderComment(problem)}
 */
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

${readHints}

    // TODO: implement the intended approach for this problem.
    // Hint: ${problem.hints[0] ?? "Use the expected concept directly."}

${outputHints}

    return 0;
}
`;
}

export function ensureProblemWorkspace(problem: Problem, language: ProgrammingLanguage = "java"): { filePath: string; created: boolean } {
  ensureBaseStructure();
  const workspacePath = getProblemWorkspaceDir(problem);
  const filePath = getProblemStarterFilePath(problem, language);
  fs.mkdirSync(workspacePath, { recursive: true });

  if (!fs.existsSync(filePath)) {
    const template = usesFunctionHarness(problem)
      ? language === "cpp" ? buildCppFunctionTemplate(problem) : buildJavaFunctionTemplate(problem)
      : language === "cpp" ? buildCppStarterTemplate(problem) : buildJavaStarterTemplate(problem);
    fs.writeFileSync(filePath, template, "utf-8");
    return { filePath, created: true };
  }

  if (language === "cpp") {
    const existing = fs.readFileSync(filePath, "utf-8");
    const normalized = normalizeCppSource(existing);
    if (normalized !== existing) {
      fs.writeFileSync(filePath, normalized, "utf-8");
    }
  }

  return { filePath, created: false };
}

export function resolveSubmissionPath(problem: Problem, filePath?: string, language: ProgrammingLanguage = "java"): string {
  if (filePath) {
    return path.resolve(filePath);
  }

  return getProblemStarterFilePath(problem, language);
}
