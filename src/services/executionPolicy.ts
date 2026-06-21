import { SpawnSyncReturns } from "child_process";

export const executionPolicy = {
  compileTimeoutMs: 10_000,
  runTimeoutMs: 2_000,
  maxCompileOutputBytes: 1 * 1024 * 1024,
  maxRunOutputBytes: 1 * 1024 * 1024,
  javaHeapMb: 128,
  javaMetaspaceMb: 96,
  cppVirtualMemoryKb: 256 * 1024
} as const;

export type ResourceLimit = "time" | "output" | "memory";

export interface ProcessFailure {
  timedOut: boolean;
  outputLimitExceeded: boolean;
  memoryLimitExceeded: boolean;
  resourceLimit?: ResourceLimit;
  message?: string;
}

export function classifyProcessFailure(result: SpawnSyncReturns<string>, language: "java" | "cpp"): ProcessFailure {
  const errorCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
  const combined = `${result.stderr ?? ""}\n${result.error?.message ?? ""}`;
  const timedOut = errorCode === "ETIMEDOUT" || result.signal === "SIGTERM";
  const outputLimitExceeded = errorCode === "ENOBUFS";
  const memoryLimitExceeded =
    /OutOfMemoryError|Java heap space|Cannot reserve enough space|bad_alloc|cannot allocate memory/i.test(combined) ||
    (!timedOut && !outputLimitExceeded && language === "cpp" && result.signal === "SIGKILL");

  if (timedOut) {
    return {
      timedOut,
      outputLimitExceeded,
      memoryLimitExceeded,
      resourceLimit: "time",
      message: `Timed out after ${executionPolicy.runTimeoutMs} ms.`
    };
  }
  if (outputLimitExceeded) {
    return {
      timedOut,
      outputLimitExceeded,
      memoryLimitExceeded,
      resourceLimit: "output",
      message: `Output exceeded the ${executionPolicy.maxRunOutputBytes / 1024} KB limit.`
    };
  }
  if (memoryLimitExceeded) {
    return {
      timedOut,
      outputLimitExceeded,
      memoryLimitExceeded,
      resourceLimit: "memory",
      message: "The program exceeded the available memory limit."
    };
  }

  return {
    timedOut,
    outputLimitExceeded,
    memoryLimitExceeded,
    message: (result.stderr ?? "").trim() || result.error?.message
  };
}

export function javaRuntimeArgs(className: string): string[] {
  return [
    `-Xmx${executionPolicy.javaHeapMb}m`,
    `-XX:MaxMetaspaceSize=${executionPolicy.javaMetaspaceMb}m`,
    "-Xss1m",
    className
  ];
}

export function cppRuntimeCommand(executableName: string): { command: string; args: string[] } {
  if (process.platform === "win32") {
    return { command: executableName, args: [] };
  }
  return {
    command: "/bin/sh",
    args: [
      "-c",
      `ulimit -v ${executionPolicy.cppVirtualMemoryKb} 2>/dev/null || true; exec "./${executableName}"`
    ]
  };
}
