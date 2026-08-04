import { AnalysisResult, ConceptDetectionResult, Problem } from "../../types";
import { analyzeCodeFacts } from "../analysis-engine/analyzeCode";
import { hasFact } from "../analysis-engine/facts";
import { createEmptyAnalysisResult } from "../analysisUtils";

export function analyzeProgrammingMathJavaContent(content: string): AnalysisResult {
  const base = createEmptyAnalysisResult();
  const facts = analyzeCodeFacts("java", content);
  const detected: string[] = [];
  const warnings: string[] = [];

  const usesDigitExtraction = hasFact(facts, "digit-extraction");
  const usesNumberReversal = hasFact(facts, "number-reversal");
  const usesPalindromeCheck = hasFact(facts, "palindrome-number");
  const usesDivisibilityCheck = hasFact(facts, "divisibility-check");
  const usesGcdEuclid = hasFact(facts, "gcd-euclid");
  const usesFactorEnumeration = hasFact(facts, "factor-enumeration");
  const usesPrimeTest = hasFact(facts, "primality-test");
  const usesLcmBridge = hasFact(facts, "lcm-gcd-bridge");
  const usesSieve = hasFact(facts, "sieve-precomputation");
  const usesModularArithmetic = hasFact(facts, "modular-arithmetic");
  const usesFastExponentiation = hasFact(facts, "fast-exponentiation");
  const usesFactorialModulo = hasFact(facts, "modular-arithmetic") && /for\s*\(\s*int\s+\w+\s*=\s*1\s*;[\s\S]{0,100}\w+\s*<=\s*\w+/.test(content);
  const usesModularInverse = hasFact(facts, "fast-exponentiation") && /\bmod\s*-\s*2\b/.test(content);
  const usesNcrCombinatorics =
    /fact(?:orial)?\w*/i.test(content) &&
    /inv(?:erse)?Fact\w*/i.test(content) &&
    /n\s*-\s*r/.test(content);

  const signals = {
    ...base.signals,
    hasHardcoding: hasFact(facts, "hardcoded-output"),
    hasPoorVariableNames: hasFact(facts, "poor-variable-names"),
    missingEdgeCaseHandling: !hasFact(facts, "empty-or-null-check"),
    usesArrayTraversal: false,
    usesSorting: false,
    usesHashMap: false
  };

  if (usesDigitExtraction) detected.push("Used digit extraction");
  if (usesNumberReversal) detected.push("Used place value rebuild");
  if (usesPalindromeCheck) detected.push("Used numeric palindrome check");
  if (usesDivisibilityCheck) detected.push("Used divisibility checks");
  if (usesGcdEuclid) detected.push("Used Euclid gcd");
  if (usesFactorEnumeration) detected.push("Used factor enumeration");
  if (usesPrimeTest) detected.push("Used primality test");
  if (usesLcmBridge) detected.push("Used lcm-gcd bridge");
  if (usesSieve) detected.push("Used sieve precomputation");
  if (usesModularArithmetic) detected.push("Used modular arithmetic");
  if (usesFastExponentiation) detected.push("Used fast exponentiation");
  if (usesFactorialModulo) detected.push("Used factorial modulo precompute");
  if (usesModularInverse) detected.push("Used modular inverse");
  if (usesNcrCombinatorics) detected.push("Used nCr combinatorics");

  if (signals.hasHardcoding) warnings.push("Contains hardcoded output or logic.");
  if (signals.hasPoorVariableNames) warnings.push("Variable names could be clearer.");
  if (signals.missingEdgeCaseHandling) warnings.push("Did not handle numeric edge cases clearly.");

  return { detected, warnings, signals };
}

export function detectProgrammingMathConcepts(problem: Problem, analysis: AnalysisResult): ConceptDetectionResult {
  const detected = new Set(analysis.detected);

  const matchedConcepts = problem.expectedConcepts.filter((concept) => {
    if (concept === "digit-extraction") return detected.has("Used digit extraction");
    if (concept === "place-value-rebuild") return detected.has("Used place value rebuild");
    if (concept === "numeric-palindrome") return detected.has("Used numeric palindrome check") || detected.has("Used place value rebuild");
    if (concept === "divisibility-check") return detected.has("Used divisibility checks") || detected.has("Used Euclid gcd");
    if (concept === "gcd-euclid") return detected.has("Used Euclid gcd");
    if (concept === "factor-enumeration") return detected.has("Used factor enumeration");
    if (concept === "primality-test") return detected.has("Used primality test") || detected.has("Used factor enumeration");
    if (concept === "lcm-gcd-bridge") return detected.has("Used lcm-gcd bridge") || detected.has("Used Euclid gcd");
    if (concept === "sieve-precomputation") return detected.has("Used sieve precomputation");
    if (concept === "modular-arithmetic") return detected.has("Used modular arithmetic") || detected.has("Used fast exponentiation");
    if (concept === "fast-exponentiation") return detected.has("Used fast exponentiation");
    if (concept === "factorial-mod-precompute") return detected.has("Used factorial modulo precompute") || detected.has("Used modular arithmetic");
    if (concept === "modular-inverse") return detected.has("Used modular inverse") || detected.has("Used fast exponentiation");
    if (concept === "ncr-combinatorics") return detected.has("Used nCr combinatorics") || detected.has("Used factorial modulo precompute");
    return false;
  });

  const missingConcepts = problem.expectedConcepts.filter((concept) => !matchedConcepts.includes(concept));
  return { matchedConcepts, missingConcepts };
}
