import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeWithAdapter,
  FactProvider,
  getLanguageAnalysisAdapter,
  LanguageAnalysisAdapter,
  mergeCodeFacts
} from "../services/analysis-engine/adapters";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { addFact, createEmptyCodeFacts } from "../services/analysis-engine/facts";
import { extractCppCodeFacts } from "../services/analysis-engine/languages/cppFacts";
import { extractCppAstFacts, isCppAstAvailable } from "../services/analysis-engine/languages/cppAstFacts";
import { extractJavaCodeFacts } from "../services/analysis-engine/languages/javaFacts";
import { extractJavaAstFacts, isJavaAstAvailable } from "../services/analysis-engine/languages/javaAstFacts";
import { hasFact } from "../services/analysis-engine/facts";

test("registered adapters preserve heuristic facts and add AST providers", () => {
  const javaCode = `int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }`;
  const cppCode = `int search(vector<int>& values, int target) { for (int value : values) if (value == target) return 1; return 0; }`;

  const mergedJavaFacts = analyzeCodeFacts("java", javaCode);
  const heuristicJavaFacts = extractJavaCodeFacts(javaCode);
  heuristicJavaFacts.controlFlow.forEach((fact) => assert.equal(hasFact(mergedJavaFacts, fact.id), true));
  const mergedCppFacts = analyzeCodeFacts("cpp", cppCode);
  const heuristicCppFacts = extractCppCodeFacts(cppCode);
  heuristicCppFacts.controlFlow.forEach((fact) => assert.equal(hasFact(mergedCppFacts, fact.id), true));
  heuristicCppFacts.dataStructures.forEach((fact) => assert.equal(hasFact(mergedCppFacts, fact.id), true));
  assert.equal(getLanguageAnalysisAdapter("java").providers[0].kind, "ast");
  assert.equal(getLanguageAnalysisAdapter("java").providers[1].kind, "heuristic");
  assert.equal(getLanguageAnalysisAdapter("cpp").providers[0].kind, "ast");
  assert.equal(getLanguageAnalysisAdapter("cpp").providers[1].kind, "heuristic");
});

test("adapter merges AST and heuristic facts by confidence and evidence", () => {
  const astProvider: FactProvider = {
    id: "test-ast",
    kind: "ast",
    failureMode: "fallback",
    analyze() {
      const facts = createEmptyCodeFacts("cpp");
      addFact(facts, "controlFlow", "loop", "high", ["AST for statement"]);
      facts.metrics.loopCount = 1;
      facts.metrics.variableNames = ["index"];
      return facts;
    }
  };
  const heuristicProvider: FactProvider = {
    id: "test-heuristic",
    kind: "heuristic",
    failureMode: "fatal",
    analyze() {
      const facts = createEmptyCodeFacts("cpp");
      addFact(facts, "controlFlow", "loop", "medium", ["regex loop"]);
      addFact(facts, "dataStructures", "array", "high", ["vector"]);
      facts.metrics.arrayAccessCount = 2;
      facts.metrics.variableNames = ["values"];
      return facts;
    }
  };
  const adapter: LanguageAnalysisAdapter = {
    language: "cpp",
    providers: [astProvider, heuristicProvider]
  };

  const facts = analyzeWithAdapter(adapter, "ignored");
  const loop = facts.controlFlow.find((item) => item.id === "loop");
  assert.equal(loop?.confidence, "high");
  assert.deepEqual(loop?.evidence, ["AST for statement", "regex loop"]);
  assert.deepEqual(facts.metrics.variableNames, ["index", "values"]);
  assert.equal(facts.metrics.arrayAccessCount, 2);
});

test("optional AST provider failure falls back to heuristic facts", () => {
  const adapter: LanguageAnalysisAdapter = {
    language: "java",
    providers: [
      {
        id: "broken-ast",
        kind: "ast",
        failureMode: "fallback",
        analyze() {
          throw new Error("parser unavailable");
        }
      },
      {
        id: "java-fallback",
        kind: "heuristic",
        failureMode: "fatal",
        analyze() {
          const facts = createEmptyCodeFacts("java");
          addFact(facts, "algorithms", "binary-search", "medium", ["fallback"]);
          return facts;
        }
      }
    ]
  };

  assert.equal(analyzeWithAdapter(adapter, "").algorithms[0]?.id, "binary-search");
});

test("fact merging rejects cross-language provider output", () => {
  assert.throws(
    () => mergeCodeFacts("java", [createEmptyCodeFacts("cpp")]),
    /Cannot merge cpp facts into java/
  );
});

test("C++ AST distinguishes stream operators from genuine bit shifts", { skip: !isCppAstAvailable() }, () => {
  const streamFacts = extractCppAstFacts(`
    #include <iostream>
    int main() {
      int value;
      std::cin >> value;
      std::cout << value;
      return 0;
    }
  `);
  const shiftFacts = extractCppAstFacts(`
    int shift(int value, int count) {
      return value << count;
    }
  `);

  assert.equal(hasFact(streamFacts, "left-shift"), false);
  assert.equal(hasFact(streamFacts, "right-shift"), false);
  assert.equal(hasFact(shiftFacts, "left-shift"), true);
});

test("C++ AST detects recursion, base cases, and branching calls", { skip: !isCppAstAvailable() }, () => {
  const facts = extractCppAstFacts(`
    int fibonacci(int n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
  `);

  assert.equal(hasFact(facts, "recursive-call"), true);
  assert.equal(hasFact(facts, "base-case"), true);
  assert.equal(hasFact(facts, "multiple-recursive-calls"), true);
  assert.equal(hasFact(facts, "tree-recursion"), true);
});

test("C++ AST measures nested loop depth structurally", { skip: !isCppAstAvailable() }, () => {
  const facts = extractCppAstFacts(`
    int countPairs(int n) {
      int count = 0;
      for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
          count++;
        }
      }
      return count;
    }
  `);

  assert.equal(facts.metrics.loopCount, 2);
  assert.equal(facts.metrics.nestedLoopDepth, 2);
  assert.equal(hasFact(facts, "nested-loop"), true);
  assert.equal(hasFact(facts, "quadratic-candidate"), true);
});

test("Java AST detects real shifts and ignores ordinary stream method calls", { skip: !isJavaAstAvailable() }, () => {
  const ioFacts = extractJavaAstFacts(`
    class Main {
      public static void main(String[] args) {
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        int value = scanner.nextInt();
        System.out.println(value);
      }
    }
  `);
  const shiftFacts = extractJavaAstFacts(`
    int shift(int value, int count) {
      return value << count;
    }
  `);

  assert.equal(hasFact(ioFacts, "left-shift"), false);
  assert.equal(hasFact(ioFacts, "right-shift"), false);
  assert.equal(hasFact(shiftFacts, "left-shift"), true);
});

test("Java AST detects recursion, base cases, and branching calls", { skip: !isJavaAstAvailable() }, () => {
  const facts = extractJavaAstFacts(`
    int fibonacci(int n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
  `);

  assert.equal(hasFact(facts, "recursive-call"), true);
  assert.equal(hasFact(facts, "base-case"), true);
  assert.equal(hasFact(facts, "multiple-recursive-calls"), true);
  assert.equal(hasFact(facts, "tree-recursion"), true);
});

test("Java AST detects arrays, variables, and nested loops structurally", { skip: !isJavaAstAvailable() }, () => {
  const facts = extractJavaAstFacts(`
    int countPairs(int[] values) {
      int count = 0;
      for (int i = 0; i < values.length; i++) {
        for (int j = 0; j < values.length; j++) {
          if (values[i] == values[j]) count++;
        }
      }
      return count;
    }
  `);

  assert.equal(facts.metrics.loopCount, 2);
  assert.equal(facts.metrics.nestedLoopDepth, 2);
  assert.equal(facts.metrics.arrayAccessCount, 2);
  assert.equal(hasFact(facts, "array"), true);
  assert.equal(hasFact(facts, "nested-loop"), true);
});
