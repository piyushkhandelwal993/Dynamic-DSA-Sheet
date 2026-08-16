import { addFact, CodeFacts, createEmptyCodeFacts, hasFact, removeFact, SupportedAnalysisLanguage } from "./facts";
import { extractCppCodeFacts } from "./languages/cppFacts";
import { extractCppAstFacts } from "./languages/cppAstFacts";
import { extractJavaCodeFacts } from "./languages/javaFacts";
import { extractJavaAstFacts } from "./languages/javaAstFacts";

export type FactProviderKind = "ast" | "heuristic";
export type FactProviderFailureMode = "fallback" | "fatal";

export interface FactProvider {
  id: string;
  kind: FactProviderKind;
  failureMode: FactProviderFailureMode;
  analyze(content: string): CodeFacts;
}

export interface LanguageAnalysisAdapter {
  language: SupportedAnalysisLanguage;
  providers: FactProvider[];
}

const javaHeuristicProvider: FactProvider = {
  id: "java-regex-v1",
  kind: "heuristic",
  failureMode: "fatal",
  analyze: extractJavaCodeFacts
};

const javaAstProvider: FactProvider = {
  id: "java-jdk-ast-v1",
  kind: "ast",
  failureMode: "fallback",
  analyze: extractJavaAstFacts
};

const cppHeuristicProvider: FactProvider = {
  id: "cpp-regex-v1",
  kind: "heuristic",
  failureMode: "fatal",
  analyze: extractCppCodeFacts
};

const cppAstProvider: FactProvider = {
  id: "cpp-clang-ast-v1",
  kind: "ast",
  failureMode: "fallback",
  analyze: extractCppAstFacts
};

const adapters: Partial<Record<SupportedAnalysisLanguage, LanguageAnalysisAdapter>> = {
  java: {
    language: "java",
    providers: [javaAstProvider, javaHeuristicProvider]
  },
  cpp: {
    language: "cpp",
    providers: [cppAstProvider, cppHeuristicProvider]
  }
};

export function getLanguageAnalysisAdapter(language: SupportedAnalysisLanguage): LanguageAnalysisAdapter {
  const adapter = adapters[language];
  if (!adapter) {
    throw new Error(`Code analysis is not implemented for ${language} yet.`);
  }
  return adapter;
}

export function analyzeWithAdapter(adapter: LanguageAnalysisAdapter, content: string): CodeFacts {
  if (adapter.providers.length === 0) {
    throw new Error(`No fact providers are configured for ${adapter.language}.`);
  }

  const providerFacts: CodeFacts[] = [];
  const failures: string[] = [];
  adapter.providers.forEach((provider) => {
    try {
      const facts = provider.analyze(content);
      if (facts.language !== adapter.language) {
        throw new Error(`returned ${facts.language} facts for ${adapter.language}`);
      }
      providerFacts.push(facts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (provider.failureMode === "fatal") {
        throw new Error(`Fact provider ${provider.id} failed: ${message}`);
      }
      failures.push(`${provider.id}: ${message}`);
    }
  });

  if (providerFacts.length === 0) {
    throw new Error(
      `All fact providers failed for ${adapter.language}${failures.length ? ` (${failures.join("; ")})` : "."}`
    );
  }
  return mergeCodeFacts(adapter.language, providerFacts, content);
}

export function mergeCodeFacts(language: SupportedAnalysisLanguage, inputs: CodeFacts[], content = ""): CodeFacts {
  const merged = createEmptyCodeFacts(language);
  const buckets = [
    "structures",
    "controlFlow",
    "dataStructures",
    "algorithms",
    "complexitySignals",
    "edgeCaseSignals",
    "antiPatterns"
  ] as const;

  inputs.forEach((facts) => {
    if (facts.language !== language) {
      throw new Error(`Cannot merge ${facts.language} facts into ${language}.`);
    }
    buckets.forEach((bucket) => {
      facts[bucket].forEach((item) => addFact(merged, bucket, item.id, item.confidence, item.evidence));
    });
    merged.metrics.loopCount = Math.max(merged.metrics.loopCount, facts.metrics.loopCount);
    merged.metrics.nestedLoopDepth = Math.max(merged.metrics.nestedLoopDepth, facts.metrics.nestedLoopDepth);
    merged.metrics.methodCount = Math.max(merged.metrics.methodCount, facts.metrics.methodCount);
    merged.metrics.arrayAccessCount = Math.max(merged.metrics.arrayAccessCount, facts.metrics.arrayAccessCount);
    merged.metrics.variableNames = Array.from(new Set([...merged.metrics.variableNames, ...facts.metrics.variableNames]));
  });

  postProcessMergedFacts(language, merged, content);
  return merged;
}

function postProcessMergedFacts(language: SupportedAnalysisLanguage, facts: CodeFacts, content?: string): void {
  if (language !== "java") return;
  const source = content ?? "";

  if (
    hasFact(facts, "recursive-call") &&
    hasFact(facts, "recursion-on-arrays") &&
    hasFact(facts, "sorted-mid-check")
  ) {
    addFact(facts, "algorithms", "divide-and-conquer", "medium", ["mid-guided recursive search shrinks to one side"]);
    removeFact(facts, "multiple-recursive-calls");
    removeFact(facts, "tree-recursion");
    removeFact(facts, "subsequence-generation");
    removeFact(facts, "tree-construction");
    removeFact(facts, "modulo-division-by-two");
    removeFact(facts, "exponential-dp-recursion");
  }

  if (hasFact(facts, "divide-and-conquer") && hasFact(facts, "merge-combine-step")) {
    removeFact(facts, "exponential-dp-recursion");
  }

  if (hasFact(facts, "recursive-call") && hasFact(facts, "gcd-euclid")) {
    removeFact(facts, "multiple-recursive-calls");
    removeFact(facts, "tree-recursion");
    removeFact(facts, "exponential-dp-recursion");
    removeFact(facts, "missing-recursive-progress");
  }

  if (
    hasFact(facts, "recursive-call") &&
    hasFact(facts, "subsequence-generation") &&
    hasFact(facts, "recursion-on-arrays") &&
    !hasFact(facts, "graph-adjacency") &&
    /\b(?:new\s+ArrayList<|result\.add\s*\(|answer\.add\s*\(|output\.add\s*\()/i.test(source)
  ) {
    removeFact(facts, "queue-operations");
    removeFact(facts, "right-shift");
    removeFact(facts, "graph-traversal");
    removeFact(facts, "graph-dfs");
    removeFact(facts, "dp-state-transition");
  }

  if (
    hasFact(facts, "recursive-call") &&
    hasFact(facts, "subsequence-generation") &&
    hasFact(facts, "recursion-on-arrays") &&
    hasFact(facts, "graph-adjacency") &&
    !hasFact(facts, "graph-traversal") &&
    /\b(?:new\s+ArrayList<|result\.add\s*\(|answer\.add\s*\(|output\.add\s*\()/i.test(source)
  ) {
    removeFact(facts, "graph-adjacency");
    removeFact(facts, "queue-operations");
    removeFact(facts, "right-shift");
  }
}
