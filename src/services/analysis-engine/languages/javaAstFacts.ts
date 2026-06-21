import { createHash } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { addFact, CodeFacts, createEmptyCodeFacts } from "../facts";

const HELPER_CLASS = "DsaJavaAstHelper";
const HELPER_SOURCE = `
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.tools.*;
import com.sun.source.tree.*;
import com.sun.source.util.*;

public class DsaJavaAstHelper {
  static class Source extends SimpleJavaFileObject {
    final String code;
    Source(String code) {
      super(URI.create("string:///AnalysisInput.java"), Kind.SOURCE);
      this.code = code;
    }
    public CharSequence getCharContent(boolean ignoreEncodingErrors) { return code; }
  }

  static class Scanner extends TreePathScanner<Void, Void> {
    String method = "";
    int loopDepth = 0;

    void emit(String... parts) {
      System.out.println(String.join("\\t", Arrays.stream(parts)
        .map(value -> value == null ? "" : value.replace("\\t", " ").replace("\\n", " "))
        .toArray(String[]::new)));
    }

    @Override public Void visitMethod(MethodTree node, Void unused) {
      String previous = method;
      method = node.getName().toString();
      emit("METHOD", method);
      Void result = super.visitMethod(node, unused);
      method = previous;
      return result;
    }

    @Override public Void visitVariable(VariableTree node, Void unused) {
      emit("VAR", node.getName().toString(), node.getType() == null ? "" : node.getType().toString());
      return super.visitVariable(node, unused);
    }

    Void scanLoop(Tree node, Void unused) {
      loopDepth++;
      emit("LOOP", method, Integer.toString(loopDepth));
      Void result = scan(node, unused);
      loopDepth--;
      return result;
    }

    @Override public Void visitForLoop(ForLoopTree node, Void unused) {
      loopDepth++;
      emit("LOOP", method, Integer.toString(loopDepth));
      Void result = super.visitForLoop(node, unused);
      loopDepth--;
      return result;
    }

    @Override public Void visitEnhancedForLoop(EnhancedForLoopTree node, Void unused) {
      loopDepth++;
      emit("LOOP", method, Integer.toString(loopDepth));
      Void result = super.visitEnhancedForLoop(node, unused);
      loopDepth--;
      return result;
    }

    @Override public Void visitWhileLoop(WhileLoopTree node, Void unused) {
      loopDepth++;
      emit("LOOP", method, Integer.toString(loopDepth));
      Void result = super.visitWhileLoop(node, unused);
      loopDepth--;
      return result;
    }

    @Override public Void visitDoWhileLoop(DoWhileLoopTree node, Void unused) {
      loopDepth++;
      emit("LOOP", method, Integer.toString(loopDepth));
      Void result = super.visitDoWhileLoop(node, unused);
      loopDepth--;
      return result;
    }

    @Override public Void visitArrayAccess(ArrayAccessTree node, Void unused) {
      emit("ARRAY_ACCESS", method);
      return super.visitArrayAccess(node, unused);
    }

    @Override public Void visitBinary(BinaryTree node, Void unused) {
      emit("OP", node.getKind().name());
      return super.visitBinary(node, unused);
    }

    @Override public Void visitUnary(UnaryTree node, Void unused) {
      if (node.getKind() == Tree.Kind.BITWISE_COMPLEMENT) emit("OP", node.getKind().name());
      return super.visitUnary(node, unused);
    }

    @Override public Void visitMethodInvocation(MethodInvocationTree node, Void unused) {
      String called = "";
      ExpressionTree select = node.getMethodSelect();
      if (select instanceof IdentifierTree) called = ((IdentifierTree) select).getName().toString();
      if (select instanceof MemberSelectTree) called = ((MemberSelectTree) select).getIdentifier().toString();
      emit("CALL", method, called);
      return super.visitMethodInvocation(node, unused);
    }

    @Override public Void visitIf(IfTree node, Void unused) {
      emit("IF", method);
      return super.visitIf(node, unused);
    }
  }

  public static void main(String[] args) throws Exception {
    String code = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    if (compiler == null) throw new IllegalStateException("JDK compiler API unavailable");
    JavacTask task = (JavacTask) compiler.getTask(
      null, null, diagnostic -> {}, List.of("-proc:none"), null, List.of(new Source(code))
    );
    for (CompilationUnitTree unit : task.parse()) new Scanner().scan(unit, null);
  }
}
`;

const cache = new Map<string, CodeFacts>();
let javaAstAvailable: boolean | undefined;
let helperDirectory: string | undefined;

export function extractJavaAstFacts(content: string): CodeFacts {
  const normalized = normalizeJavaSource(content);
  const key = createHash("sha256").update(normalized).digest("hex");
  const cached = cache.get(key);
  if (cached) return cloneFacts(cached);
  if (!isJavaAstAvailable()) throw new Error("Java compiler AST API is not available");

  const helperDir = ensureHelperCompiled();
  const result = spawnSync("java", ["-cp", helperDir, HELPER_CLASS], {
    input: normalized,
    encoding: "utf-8",
    timeout: 5000,
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Java AST helper failed").trim().slice(0, 500));
  }

  const facts = factsFromEvents(result.stdout);
  if (facts.metrics.methodCount === 0) throw new Error("Java AST did not contain a method");
  cache.set(key, cloneFacts(facts));
  return facts;
}

export function isJavaAstAvailable(): boolean {
  if (javaAstAvailable !== undefined) return javaAstAvailable;
  const java = spawnSync("java", ["-version"], { encoding: "utf-8", timeout: 2000 });
  const javac = spawnSync("javac", ["-version"], { encoding: "utf-8", timeout: 2000 });
  javaAstAvailable = !java.error && java.status === 0 && !javac.error && javac.status === 0;
  return javaAstAvailable;
}

function factsFromEvents(output: string): CodeFacts {
  const facts = createEmptyCodeFacts("java");
  const methods = new Set<string>();
  const callsByMethod = new Map<string, string[]>();
  const methodsWithIf = new Set<string>();

  output.split(/\r?\n/).forEach((line) => {
    if (!line) return;
    const [event, first = "", second = ""] = line.split("\t");
    if (event === "METHOD") methods.add(first);
    if (event === "VAR") {
      facts.metrics.variableNames.push(first);
      detectTypeFacts(second, facts);
    }
    if (event === "LOOP") {
      facts.metrics.loopCount += 1;
      facts.metrics.nestedLoopDepth = Math.max(facts.metrics.nestedLoopDepth, Number(second) || 1);
    }
    if (event === "ARRAY_ACCESS") {
      facts.metrics.arrayAccessCount += 1;
      addFact(facts, "structures", "indexed-access", "high", ["JDK AST ArrayAccessTree"]);
      addFact(facts, "dataStructures", "array", "high", ["JDK AST indexed array access"]);
    }
    if (event === "OP") detectOperatorFact(first, facts);
    if (event === "CALL") callsByMethod.set(first, [...(callsByMethod.get(first) ?? []), second]);
    if (event === "IF") methodsWithIf.add(first);
  });

  facts.metrics.methodCount = methods.size;
  facts.metrics.variableNames = Array.from(new Set(facts.metrics.variableNames));
  if (facts.metrics.loopCount > 0) {
    addFact(facts, "controlFlow", "loop", "high", [`JDK AST: ${facts.metrics.loopCount} loop statement(s)`]);
  }
  if (facts.metrics.nestedLoopDepth >= 2) {
    addFact(facts, "controlFlow", "nested-loop", "high", [`JDK AST loop depth ${facts.metrics.nestedLoopDepth}`]);
    addFact(facts, "complexitySignals", "quadratic-candidate", "medium", [`JDK AST loop depth ${facts.metrics.nestedLoopDepth}`]);
  } else if (facts.metrics.loopCount === 1) {
    addFact(facts, "complexitySignals", "single-pass", "medium", ["JDK AST single loop"]);
  }

  methods.forEach((method) => {
    const recursiveCalls = (callsByMethod.get(method) ?? []).filter((called) => called === method).length;
    if (recursiveCalls > 0) {
      addFact(facts, "controlFlow", "recursive-call", "high", [`JDK AST call to ${method}`]);
      if (methodsWithIf.has(method)) {
        addFact(facts, "controlFlow", "base-case", "medium", [`JDK AST conditional in recursive method ${method}`]);
        addFact(facts, "edgeCaseSignals", "recursive-base-case", "medium", [`JDK AST conditional in recursive method ${method}`]);
      }
    }
    if (recursiveCalls >= 2) {
      addFact(facts, "controlFlow", "multiple-recursive-calls", "high", [`JDK AST: ${recursiveCalls} calls to ${method}`]);
      addFact(facts, "algorithms", "tree-recursion", "medium", [`JDK AST branching recursion in ${method}`]);
    }
  });

  return facts;
}

function detectOperatorFact(kind: string, facts: CodeFacts): void {
  const operators: Record<string, string> = {
    LEFT_SHIFT: "left-shift",
    RIGHT_SHIFT: "right-shift",
    UNSIGNED_RIGHT_SHIFT: "right-shift",
    AND: "bitwise-and",
    OR: "bitwise-or",
    XOR: "bitwise-xor",
    BITWISE_COMPLEMENT: "bitwise-not"
  };
  const id = operators[kind];
  if (id) addFact(facts, "structures", id, "high", [`JDK AST operator ${kind}`]);
}

function detectTypeFacts(type: string, facts: CodeFacts): void {
  if (!type) return;
  if (/\[\]|List<|ArrayList</.test(type)) addFact(facts, "dataStructures", "array", "high", [`JDK AST type ${type}`]);
  if (/Map<|HashMap</.test(type)) addFact(facts, "dataStructures", "hash-map", "high", [`JDK AST type ${type}`]);
  if (/Set<|HashSet</.test(type)) addFact(facts, "dataStructures", "hash-set", "high", [`JDK AST type ${type}`]);
  if (/Stack<|Deque</.test(type)) addFact(facts, "dataStructures", "stack-like", "high", [`JDK AST type ${type}`]);
  if (/Queue<|Deque</.test(type)) addFact(facts, "dataStructures", "queue-like", "high", [`JDK AST type ${type}`]);
  if (/PriorityQueue</.test(type)) addFact(facts, "dataStructures", "priority-queue", "high", [`JDK AST type ${type}`]);
}

function normalizeJavaSource(content: string): string {
  if (/\b(?:class|interface|enum|record)\s+[A-Za-z_]\w*/.test(content)) return content;
  const imports = content.match(/^\s*import\s+[^;]+;\s*$/gm) ?? [];
  const body = content.replace(/^\s*import\s+[^;]+;\s*$/gm, "");
  return `${imports.join("\n")}\nclass DsaAnalysisInput {\n${body}\n}`;
}

function ensureHelperCompiled(): string {
  const hash = createHash("sha256").update(HELPER_SOURCE).digest("hex").slice(0, 12);
  const directory = path.join(os.tmpdir(), `dsa-sheet-java-ast-${hash}`);
  const classFile = path.join(directory, `${HELPER_CLASS}.class`);
  if (helperDirectory === directory && fs.existsSync(classFile)) return directory;

  fs.mkdirSync(directory, { recursive: true });
  const sourceFile = path.join(directory, `${HELPER_CLASS}.java`);
  if (!fs.existsSync(classFile)) {
    fs.writeFileSync(sourceFile, HELPER_SOURCE, "utf-8");
    const compile = spawnSync("javac", ["-d", directory, sourceFile], {
      encoding: "utf-8",
      timeout: 10000
    });
    if (compile.error) throw compile.error;
    if (compile.status !== 0) {
      throw new Error((compile.stderr || compile.stdout || "Java AST helper compilation failed").trim().slice(0, 500));
    }
  }
  helperDirectory = directory;
  return directory;
}

function cloneFacts(facts: CodeFacts): CodeFacts {
  return JSON.parse(JSON.stringify(facts)) as CodeFacts;
}
