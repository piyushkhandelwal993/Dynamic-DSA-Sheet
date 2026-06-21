import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { addFact, CodeFacts, createEmptyCodeFacts } from "../facts";

interface ClangAstNode {
  kind?: string;
  name?: string;
  opcode?: string;
  type?: { qualType?: string };
  referencedDecl?: { kind?: string; name?: string };
  inner?: ClangAstNode[];
  loc?: { line?: number; includedFrom?: unknown };
}

const cache = new Map<string, CodeFacts>();
let clangAvailable: boolean | undefined;

export function extractCppAstFacts(content: string): CodeFacts {
  const key = createHash("sha256").update(content).digest("hex");
  const cached = cache.get(key);
  if (cached) return cloneFacts(cached);
  if (!isClangAvailable()) {
    throw new Error("clang++ is not available");
  }

  const roots = dumpUserAst(content);
  const facts = createEmptyCodeFacts("cpp");
  const functions = collectUserFunctions(roots);
  if (functions.length === 0) {
    throw new Error("Clang did not produce a user function AST");
  }

  facts.metrics.methodCount = functions.length;
  functions.forEach((fn) => analyzeFunction(fn, facts));
  facts.metrics.variableNames = Array.from(new Set(facts.metrics.variableNames));

  cache.set(key, cloneFacts(facts));
  return facts;
}

export function isCppAstAvailable(): boolean {
  return isClangAvailable();
}

function dumpUserAst(content: string): ClangAstNode[] {
  const names = extractFunctionNames(content).slice(0, 12);
  if (names.length === 0) throw new Error("No C++ functions were found");

  if (!/^\s*#\s*include/m.test(content)) {
    return parseAstOutput(runClang(content, []));
  }

  return names.flatMap((name) =>
    parseAstOutput(runClang(content, ["-Xclang", `-ast-dump-filter=${name}`]))
  );
}

function runClang(content: string, extraArgs: string[]): string {
  const result = spawnSync(
    "clang++",
    ["-std=c++17", "-x", "c++", "-fsyntax-only", "-Xclang", "-ast-dump=json", ...extraArgs, "-"],
    {
      input: content,
      encoding: "utf-8",
      timeout: 5000,
      maxBuffer: 24 * 1024 * 1024
    }
  );
  if (result.error) throw result.error;
  if (!result.stdout.trim()) {
    throw new Error((result.stderr || "Clang produced no AST output").trim().slice(0, 500));
  }
  return result.stdout;
}

function parseAstOutput(output: string): ClangAstNode[] {
  const values: ClangAstNode[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < output.length; index += 1) {
    const char = output[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        values.push(JSON.parse(output.slice(start, index + 1)) as ClangAstNode);
        start = -1;
      }
    }
  }
  if (!values.length) throw new Error("Unable to parse Clang JSON AST");
  return values;
}

function collectUserFunctions(roots: ClangAstNode[]): ClangAstNode[] {
  const functions: ClangAstNode[] = [];
  roots.forEach((root) => {
    walk(root, (node) => {
      if (
        (node.kind === "FunctionDecl" || node.kind === "CXXMethodDecl") &&
        node.name &&
        node.inner?.some((child) => child.kind === "CompoundStmt") &&
        isUserNode(node)
      ) {
        functions.push(node);
      }
    });
  });
  return uniqueNodes(functions);
}

function analyzeFunction(fn: ClangAstNode, facts: CodeFacts): void {
  const functionName = fn.name ?? "function";
  let loopCount = 0;
  let maxLoopDepth = 0;
  let recursiveCalls = 0;
  let hasIf = false;

  walkWithLoopDepth(fn, 0, (node, loopDepth) => {
    if (node.kind === "ForStmt" || node.kind === "CXXForRangeStmt" || node.kind === "WhileStmt" || node.kind === "DoStmt") {
      loopCount += 1;
      maxLoopDepth = Math.max(maxLoopDepth, loopDepth + 1);
    }
    if (node.kind === "IfStmt") hasIf = true;
    if (node.kind === "VarDecl" || node.kind === "ParmVarDecl") {
      if (node.name) facts.metrics.variableNames.push(node.name);
      detectTypeFacts(node.type?.qualType ?? "", facts);
    }
    if (node.kind === "ArraySubscriptExpr") {
      facts.metrics.arrayAccessCount += 1;
      addFact(facts, "structures", "indexed-access", "high", ["Clang AST ArraySubscriptExpr"]);
      addFact(facts, "dataStructures", "array", "high", ["Clang AST indexed collection access"]);
    }
    if (node.kind === "BinaryOperator" || node.kind === "CompoundAssignOperator") {
      detectOperatorFact(node.opcode, facts);
    }
    if (node.kind === "UnaryOperator" && node.opcode === "~") {
      addFact(facts, "structures", "bitwise-not", "high", ["Clang AST unary ~ operator"]);
    }
    if (
      (node.kind === "CallExpr" || node.kind === "CXXMemberCallExpr") &&
      findReferencedFunctionName(node) === functionName
    ) {
      recursiveCalls += 1;
    }
  });

  facts.metrics.loopCount += loopCount;
  facts.metrics.nestedLoopDepth = Math.max(facts.metrics.nestedLoopDepth, maxLoopDepth);
  if (loopCount > 0) addFact(facts, "controlFlow", "loop", "high", [`Clang AST: ${loopCount} loop statement(s)`]);
  if (maxLoopDepth >= 2) {
    addFact(facts, "controlFlow", "nested-loop", "high", [`Clang AST loop depth ${maxLoopDepth}`]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", [`Clang AST loop depth ${maxLoopDepth}`]);
  } else if (loopCount === 1) {
    addFact(facts, "complexitySignals", "single-pass", "medium", ["Clang AST single loop"]);
  }
  if (recursiveCalls > 0) {
    addFact(facts, "controlFlow", "recursive-call", "high", [`Clang AST call to ${functionName}`]);
    if (hasIf) {
      addFact(facts, "controlFlow", "base-case", "medium", [`Clang AST conditional in recursive function ${functionName}`]);
      addFact(facts, "edgeCaseSignals", "recursive-base-case", "medium", [`Clang AST conditional in recursive function ${functionName}`]);
    }
  }
  if (recursiveCalls >= 2) {
    addFact(facts, "controlFlow", "multiple-recursive-calls", "high", [`Clang AST: ${recursiveCalls} calls to ${functionName}`]);
    addFact(facts, "algorithms", "tree-recursion", "medium", [`Clang AST branching recursion in ${functionName}`]);
  }
}

function detectOperatorFact(opcode: string | undefined, facts: CodeFacts): void {
  const operators: Record<string, string> = {
    "<<": "left-shift",
    ">>": "right-shift",
    "&": "bitwise-and",
    "|": "bitwise-or",
    "^": "bitwise-xor"
  };
  const id = opcode ? operators[opcode] : undefined;
  if (id) addFact(facts, "structures", id, "high", [`Clang AST BinaryOperator ${opcode}`]);
}

function detectTypeFacts(type: string, facts: CodeFacts): void {
  if (!type) return;
  if (/\b(?:vector|array)\s*</.test(type) || /\[[^\]]*\]/.test(type)) {
    addFact(facts, "dataStructures", "array", "high", [`Clang AST type ${type}`]);
  }
  if (/\b(?:map|unordered_map)\s*</.test(type)) addFact(facts, "dataStructures", "hash-map", "high", [`Clang AST type ${type}`]);
  if (/\b(?:set|unordered_set)\s*</.test(type)) addFact(facts, "dataStructures", "hash-set", "high", [`Clang AST type ${type}`]);
  if (/\b(?:stack|deque)\s*</.test(type)) addFact(facts, "dataStructures", "stack-like", "high", [`Clang AST type ${type}`]);
  if (/\b(?:queue|deque)\s*</.test(type)) addFact(facts, "dataStructures", "queue-like", "high", [`Clang AST type ${type}`]);
  if (/\bpriority_queue\s*</.test(type)) addFact(facts, "dataStructures", "priority-queue", "high", [`Clang AST type ${type}`]);
}

function findReferencedFunctionName(node: ClangAstNode): string | undefined {
  let result: string | undefined;
  walk(node, (child) => {
    if (!result && child.referencedDecl?.kind?.includes("Function") && child.referencedDecl.name) {
      result = child.referencedDecl.name;
    }
  });
  return result;
}

function walk(node: ClangAstNode, visit: (node: ClangAstNode) => void): void {
  visit(node);
  node.inner?.forEach((child) => walk(child, visit));
}

function walkWithLoopDepth(
  node: ClangAstNode,
  loopDepth: number,
  visit: (node: ClangAstNode, loopDepth: number) => void
): void {
  visit(node, loopDepth);
  const nextDepth =
    node.kind === "ForStmt" || node.kind === "CXXForRangeStmt" || node.kind === "WhileStmt" || node.kind === "DoStmt"
      ? loopDepth + 1
      : loopDepth;
  node.inner?.forEach((child) => walkWithLoopDepth(child, nextDepth, visit));
}

function isUserNode(node: ClangAstNode): boolean {
  return Boolean(node.loc?.line) && !node.loc?.includedFrom;
}

function extractFunctionNames(content: string): string[] {
  const names: string[] = [];
  const regex = /\b(?:void|int|long|long long|bool|string|double|float|char|auto|vector\s*<[^;{}]+>)\s+([a-zA-Z_]\w*)\s*\([^;{}]*\)\s*\{/g;
  let match = regex.exec(content);
  while (match) {
    names.push(match[1]);
    match = regex.exec(content);
  }
  return Array.from(new Set(names));
}

function isClangAvailable(): boolean {
  if (clangAvailable !== undefined) return clangAvailable;
  const result = spawnSync("clang++", ["--version"], { encoding: "utf-8", timeout: 2000 });
  clangAvailable = !result.error && result.status === 0;
  return clangAvailable;
}

function uniqueNodes(nodes: ClangAstNode[]): ClangAstNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    const key = `${node.kind}:${node.name}:${node.loc?.line ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cloneFacts(facts: CodeFacts): CodeFacts {
  return JSON.parse(JSON.stringify(facts)) as CodeFacts;
}
