import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { CustomRunResult, ExecutionCaseResult, ExecutionResult, Problem, ProblemTestCase } from "../types";

const COMPILE_TIMEOUT_MS = 5000;
const RUN_TIMEOUT_MS = 2000;

function sanitizeJavaIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "");
}

function detectMainClassName(content: string): string {
  const publicMatch = content.match(/public\s+class\s+([A-Za-z_]\w*)/);
  if (publicMatch) {
    return publicMatch[1];
  }

  const classMatch = content.match(/\bclass\s+([A-Za-z_]\w*)/);
  return classMatch?.[1] ?? "Main";
}

function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function getExecutionTestCases(problem: Problem): ProblemTestCase[] {
  if (problem.testCases && problem.testCases.length > 0) {
    return problem.testCases;
  }

  return problem.examples.map((example) => ({
    input: example.input,
    expectedOutput: example.output,
    visibility: "sample" as const,
    explanation: example.explanation
  }));
}

function prepareJavaRun(sourcePath: string, runKey: string) {
  const content = fs.readFileSync(sourcePath, "utf-8");
  const className = detectMainClassName(content);
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), `dsa-sheet-${sanitizeJavaIdentifier(runKey)}-`));
  const javaFileName = `${className}.java`;
  const javaFilePath = path.join(runDir, javaFileName);
  fs.writeFileSync(javaFilePath, content, "utf-8");

  const compile = spawnSync("javac", [javaFileName], {
    cwd: runDir,
    encoding: "utf-8",
    timeout: COMPILE_TIMEOUT_MS
  });

  return {
    className,
    runDir,
    compile
  };
}

export function runJavaSubmission(problem: Problem, sourcePath: string): ExecutionResult {
  const testCases = getExecutionTestCases(problem);
  if (testCases.length === 0) {
    return {
      usedTestCases: false,
      compileSucceeded: false,
      passedCount: 0,
      totalCount: 0,
      failedCases: []
    };
  }

  const { className, runDir, compile } = prepareJavaRun(sourcePath, problem.id);

  if (compile.status !== 0) {
    return {
      usedTestCases: true,
      compileSucceeded: false,
      passedCount: 0,
      totalCount: testCases.length,
      compileError: (compile.stderr || compile.stdout || "Compilation failed").trim(),
      failedCases: []
    };
  }

  const failedCases: ExecutionCaseResult[] = [];
  let passedCount = 0;

  testCases.forEach((testCase) => {
    const execution = spawnSync("java", [className], {
      cwd: runDir,
      encoding: "utf-8",
      input: `${testCase.input}\n`,
      timeout: RUN_TIMEOUT_MS
    });

    const actualOutput = normalizeOutput(execution.stdout ?? "");
    const expectedOutput = normalizeOutput(testCase.expectedOutput);
    const timedOut = execution.signal === "SIGTERM";
    const runtimeError = timedOut ? "Timed out while executing the program." : (execution.stderr ?? "").trim();
    const passed = execution.status === 0 && !timedOut && actualOutput === expectedOutput;

    if (passed) {
      passedCount += 1;
      return;
    }

    failedCases.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed: false,
      visibility: testCase.visibility,
      error: runtimeError || undefined,
      timedOut
    });
  });

  return {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount,
    totalCount: testCases.length,
    failedCases
  };
}

export function runJavaWithCustomInput(problem: Problem, sourcePath: string, customInput: string): CustomRunResult {
  const { className, runDir, compile } = prepareJavaRun(sourcePath, `${problem.id}-custom`);

  if (compile.status !== 0) {
    return {
      compileSucceeded: false,
      actualOutput: "",
      customInput,
      compileError: (compile.stderr || compile.stdout || "Compilation failed").trim()
    };
  }

  const execution = spawnSync("java", [className], {
    cwd: runDir,
    encoding: "utf-8",
    input: customInput,
    timeout: RUN_TIMEOUT_MS
  });

  const timedOut = execution.signal === "SIGTERM";
  const runtimeError = timedOut ? "Timed out while executing the program." : (execution.stderr ?? "").trim();

  return {
    compileSucceeded: execution.status === 0 && !timedOut,
    actualOutput: normalizeOutput(execution.stdout ?? ""),
    runtimeError: runtimeError || undefined,
    timedOut,
    customInput
  };
}
