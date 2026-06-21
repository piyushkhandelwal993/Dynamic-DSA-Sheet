import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { CustomRunResult, ExecutionCaseResult, ExecutionResult, Problem } from "../types";
import { classifyProcessFailure, executionPolicy, javaRuntimeArgs } from "./executionPolicy";
import { getExecutionTestCases } from "./problemTestCases";
import { buildJavaHarnessFiles, usesFunctionHarness } from "./functionHarness";

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

function prepareJavaRun(problem: Problem, sourcePath: string, runKey: string) {
  const content = fs.readFileSync(sourcePath, "utf-8");
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), `dsa-sheet-${sanitizeJavaIdentifier(runKey)}-`));
  const harnessFiles = usesFunctionHarness(problem) ? buildJavaHarnessFiles(problem, content) : null;
  const className = harnessFiles ? "Main" : detectMainClassName(content);
  const files = harnessFiles ?? { [`${className}.java`]: content };
  Object.entries(files).forEach(([fileName, source]) => {
    fs.writeFileSync(path.join(runDir, fileName), source, "utf-8");
  });

  const compile = spawnSync("javac", Object.keys(files), {
    cwd: runDir,
    encoding: "utf-8",
    timeout: executionPolicy.compileTimeoutMs,
    maxBuffer: executionPolicy.maxCompileOutputBytes
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

  const { className, runDir, compile } = prepareJavaRun(problem, sourcePath, problem.id);

  if (compile.status !== 0) {
    const compileError = (compile.stderr || compile.stdout || compile.error?.message || "Compilation failed").trim();
    fs.rmSync(runDir, { recursive: true, force: true });
    return {
      usedTestCases: true,
      compileSucceeded: false,
      passedCount: 0,
      totalCount: testCases.length,
      compileError,
      failedCases: []
    };
  }

  try {
    const failedCases: ExecutionCaseResult[] = [];
    let passedCount = 0;

    testCases.forEach((testCase) => {
      const execution = spawnSync("java", javaRuntimeArgs(className), {
        cwd: runDir,
        encoding: "utf-8",
        input: `${testCase.input}\n`,
        timeout: executionPolicy.runTimeoutMs,
        maxBuffer: executionPolicy.maxRunOutputBytes,
        killSignal: "SIGKILL"
      });
      const failure = classifyProcessFailure(execution, "java");
      const actualOutput = normalizeOutput(execution.stdout ?? "");
      const expectedOutput = normalizeOutput(testCase.expectedOutput);
      const passed = execution.status === 0 && !failure.resourceLimit && actualOutput === expectedOutput;

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
        error: failure.message || undefined,
        timedOut: failure.timedOut,
        outputLimitExceeded: failure.outputLimitExceeded,
        memoryLimitExceeded: failure.memoryLimitExceeded,
        resourceLimit: failure.resourceLimit
      });
    });

    return {
      usedTestCases: true,
      compileSucceeded: true,
      passedCount,
      totalCount: testCases.length,
      failedCases
    };
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}

export function runJavaWithCustomInput(problem: Problem, sourcePath: string, customInput: string): CustomRunResult {
  const { className, runDir, compile } = prepareJavaRun(problem, sourcePath, `${problem.id}-custom`);

  if (compile.status !== 0) {
    const compileError = (compile.stderr || compile.stdout || compile.error?.message || "Compilation failed").trim();
    fs.rmSync(runDir, { recursive: true, force: true });
    return {
      compileSucceeded: false,
      actualOutput: "",
      customInput,
      compileError
    };
  }

  try {
    const execution = spawnSync("java", javaRuntimeArgs(className), {
      cwd: runDir,
      encoding: "utf-8",
      input: customInput,
      timeout: executionPolicy.runTimeoutMs,
      maxBuffer: executionPolicy.maxRunOutputBytes,
      killSignal: "SIGKILL"
    });
    const failure = classifyProcessFailure(execution, "java");

    return {
      compileSucceeded: execution.status === 0 && !failure.resourceLimit,
      actualOutput: normalizeOutput(execution.stdout ?? ""),
      runtimeError: failure.message || undefined,
      timedOut: failure.timedOut,
      outputLimitExceeded: failure.outputLimitExceeded,
      memoryLimitExceeded: failure.memoryLimitExceeded,
      resourceLimit: failure.resourceLimit,
      customInput
    };
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}
