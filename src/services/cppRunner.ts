import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { CustomRunResult, ExecutionCaseResult, ExecutionResult, Problem } from "../types";
import { normalizeCppSource } from "./cppSupport";
import { classifyProcessFailure, cppRuntimeCommand, executionPolicy } from "./executionPolicy";
import { getExecutionTestCases } from "./problemTestCases";
import { buildCppHarnessSource, usesFunctionHarness } from "./functionHarness";

function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function prepareCppRun(problem: Problem, sourcePath: string, runKey: string) {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), `dsa-sheet-cpp-${runKey.replace(/[^a-zA-Z0-9_-]/g, "")}-`));
  const sourceFile = path.join(runDir, "main.cpp");
  const executableName = process.platform === "win32" ? "solution.exe" : "solution";
  const studentSource = normalizeCppSource(fs.readFileSync(sourcePath, "utf-8"));
  fs.writeFileSync(sourceFile, usesFunctionHarness(problem) ? buildCppHarnessSource(problem, studentSource) : studentSource, "utf-8");
  const compile = spawnSync("g++", ["-std=c++17", "-O2", "main.cpp", "-o", executableName], {
    cwd: runDir,
    encoding: "utf-8",
    timeout: executionPolicy.compileTimeoutMs,
    maxBuffer: executionPolicy.maxCompileOutputBytes
  });
  return { runDir, executableName, compile };
}

export function runCppSubmission(problem: Problem, sourcePath: string): ExecutionResult {
  const testCases = getExecutionTestCases(problem);
  if (!testCases.length) {
    return { usedTestCases: false, compileSucceeded: false, passedCount: 0, totalCount: 0, failedCases: [] };
  }

  const { runDir, executableName, compile } = prepareCppRun(problem, sourcePath, problem.id);
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
      const runtime = cppRuntimeCommand(executableName);
      const execution = spawnSync(runtime.command, runtime.args, {
        cwd: runDir,
        encoding: "utf-8",
        input: `${testCase.input}\n`,
        timeout: executionPolicy.runTimeoutMs,
        maxBuffer: executionPolicy.maxRunOutputBytes,
        killSignal: "SIGKILL"
      });
      const failure = classifyProcessFailure(execution, "cpp");
      const actualOutput = normalizeOutput(execution.stdout ?? "");
      const expectedOutput = normalizeOutput(testCase.expectedOutput);
      const passed = execution.status === 0 && !failure.resourceLimit && actualOutput === expectedOutput;
      if (passed) {
        passedCount += 1;
      } else {
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
      }
    });

    return { usedTestCases: true, compileSucceeded: true, passedCount, totalCount: testCases.length, failedCases };
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}

export function runCppWithCustomInput(problem: Problem, sourcePath: string, customInput: string): CustomRunResult {
  const { runDir, executableName, compile } = prepareCppRun(problem, sourcePath, `${problem.id}-custom`);
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
    const runtime = cppRuntimeCommand(executableName);
    const execution = spawnSync(runtime.command, runtime.args, {
      cwd: runDir,
      encoding: "utf-8",
      input: customInput,
      timeout: executionPolicy.runTimeoutMs,
      maxBuffer: executionPolicy.maxRunOutputBytes,
      killSignal: "SIGKILL"
    });
    const failure = classifyProcessFailure(execution, "cpp");
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
