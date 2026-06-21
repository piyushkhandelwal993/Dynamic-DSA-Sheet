import { Problem, ProblemTestCase } from "../types";

export type TestCaseCoverageSource = "configured" | "curated" | "examples" | "none";

const curatedBoundaryCases: Record<string, ProblemTestCase[]> = {
  "bit-002": [
    { input: "7", expectedOutput: "Odd", visibility: "sample" },
    { input: "0", expectedOutput: "Even", visibility: "hidden", explanation: "Zero is even." },
    { input: "1000000000", expectedOutput: "Even", visibility: "hidden", explanation: "Upper-bound even value." }
  ],
  "bit-004": [
    { input: "8 1", expectedOutput: "10", visibility: "sample" },
    { input: "10 1", expectedOutput: "10", visibility: "hidden", explanation: "The target bit is already set." },
    { input: "0 5", expectedOutput: "32", visibility: "hidden", explanation: "Set a bit in zero." }
  ],
  "bit-005": [
    { input: "14 1", expectedOutput: "12", visibility: "sample" },
    { input: "8 0", expectedOutput: "8", visibility: "hidden", explanation: "The target bit is already clear." },
    { input: "0 5", expectedOutput: "0", visibility: "hidden", explanation: "Clearing any bit in zero keeps zero." }
  ],
  "bit-006": [
    { input: "10 1", expectedOutput: "8", visibility: "sample" },
    { input: "10 0", expectedOutput: "11", visibility: "hidden", explanation: "Toggle a clear least-significant bit." },
    { input: "0 5", expectedOutput: "32", visibility: "hidden", explanation: "Toggle a clear bit in zero." }
  ],
  "bit-007": [
    { input: "10 3", expectedOutput: "1", visibility: "sample" },
    { input: "10 0", expectedOutput: "0", visibility: "hidden", explanation: "Extract the least-significant bit." },
    { input: "0 20", expectedOutput: "0", visibility: "hidden", explanation: "A large shift on zero remains clear." }
  ],
  "bit-008": [
    { input: "13", expectedOutput: "3", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "Zero has no set bits." },
    { input: "1023", expectedOutput: "10", visibility: "hidden", explanation: "Ten consecutive set bits." }
  ],
  "bit-009": [
    { input: "13", expectedOutput: "3", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "The loop must not run for zero." },
    { input: "1024", expectedOutput: "1", visibility: "hidden", explanation: "A power of two has one set bit." }
  ],
  "bit-010": [
    { input: "16", expectedOutput: "true", visibility: "sample" },
    { input: "0", expectedOutput: "false", visibility: "hidden", explanation: "Zero is not a power of two." },
    { input: "-8", expectedOutput: "false", visibility: "hidden", explanation: "Negative values are not powers of two." },
    { input: "1", expectedOutput: "true", visibility: "hidden", explanation: "One is 2 to the power zero." }
  ],
  "bit-011": [
    { input: "5", expectedOutput: "1", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "The empty XOR range has identity zero." },
    { input: "4", expectedOutput: "4", visibility: "hidden", explanation: "Exercises the n modulo 4 equals zero branch." },
    { input: "7", expectedOutput: "0", visibility: "hidden", explanation: "Exercises the n modulo 4 equals three branch." }
  ],
  "bit-012": [
    { input: "3\n2 2 1", expectedOutput: "1", visibility: "sample" },
    { input: "1\n7", expectedOutput: "7", visibility: "hidden", explanation: "A one-element array is its own unique value." },
    { input: "5\n-1 4 4 -1 9", expectedOutput: "9", visibility: "hidden", explanation: "Paired negative values still cancel under XOR." }
  ],
  "bit-013": [
    { input: "6\n1 2 1 3 2 5", expectedOutput: "3 5", visibility: "sample" },
    { input: "2\n-1 4", expectedOutput: "-1 4", visibility: "hidden", explanation: "The smallest valid array has two unique values." },
    { input: "6\n2 1 2 3 4 1", expectedOutput: "3 4", visibility: "hidden", explanation: "Both unique values occur after paired values." }
  ],
  "bit-014": [
    { input: "3\n3 0 1", expectedOutput: "2", visibility: "sample" },
    { input: "1\n0", expectedOutput: "1", visibility: "hidden", explanation: "The missing value is the upper endpoint." },
    { input: "1\n1", expectedOutput: "0", visibility: "hidden", explanation: "The missing value is zero." }
  ],
  "bit-015": [
    { input: "5", expectedOutput: "-6", visibility: "sample" },
    { input: "0", expectedOutput: "-1", visibility: "hidden", explanation: "All zero bits become one in signed two's complement." },
    { input: "-1", expectedOutput: "0", visibility: "hidden", explanation: "All one bits become zero." }
  ],
  "bit-016": [
    { input: "5", expectedOutput: "2", visibility: "sample" },
    { input: "0", expectedOutput: "1", visibility: "hidden", explanation: "Zero has the single-bit complement one." },
    { input: "10", expectedOutput: "5", visibility: "hidden", explanation: "1010 complements to 0101." }
  ],
  "bit-017": [
    { input: "5\n1 2 3 4 5", expectedOutput: "3", visibility: "sample" },
    { input: "1\n0", expectedOutput: "0", visibility: "hidden", explanation: "Zero is even." },
    { input: "4\n-3 -2 0 7", expectedOutput: "2", visibility: "hidden", explanation: "The least-significant-bit rule also handles negative odd values." }
  ],
  "bit-018": [
    { input: "13 2", expectedOutput: "1", visibility: "sample" },
    { input: "0 10", expectedOutput: "0", visibility: "hidden", explanation: "No bit is set in zero." },
    { input: "8 3", expectedOutput: "1", visibility: "hidden", explanation: "Checks the highest active bit." }
  ],
  "bit-019": [
    { input: "0\n2\n1 3", expectedOutput: "10", visibility: "sample" },
    { input: "5\n1\n1", expectedOutput: "7", visibility: "hidden", explanation: "Set one previously clear bit while preserving existing bits." },
    { input: "8\n3\n3 3 0", expectedOutput: "9", visibility: "hidden", explanation: "Repeated queries are idempotent." }
  ],
  "bit-020": [
    { input: "3 5", expectedOutput: "5 3", visibility: "sample" },
    { input: "7 7", expectedOutput: "7 7", visibility: "hidden", explanation: "Equal values remain equal after swapping." },
    { input: "-2 9", expectedOutput: "9 -2", visibility: "hidden", explanation: "Signed values are swapped without arithmetic." }
  ],
  "bit-021": [
    { input: "12", expectedOutput: "8", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "Zero has no set bit to clear." },
    { input: "8", expectedOutput: "0", visibility: "hidden", explanation: "Clearing the only set bit produces zero." }
  ],
  "bit-022": [
    { input: "10 1 2", expectedOutput: "12", visibility: "sample" },
    { input: "0 0 0", expectedOutput: "1", visibility: "hidden", explanation: "Toggle a one-bit range at index zero." },
    { input: "15 1 3", expectedOutput: "1", visibility: "hidden", explanation: "Toggle a multi-bit inclusive range." }
  ],
  "bit-023": [
    { input: "5", expectedOutput: "0 1 1 2 1 2", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "The result always includes the count for zero." },
    { input: "2", expectedOutput: "0 1 1", visibility: "hidden", explanation: "Small sequence boundary." }
  ],
  "bit-024": [
    { input: "16", expectedOutput: "true", visibility: "sample" },
    { input: "1", expectedOutput: "true", visibility: "hidden", explanation: "One is four to the power zero." },
    { input: "8", expectedOutput: "false", visibility: "hidden", explanation: "A power of two is not necessarily a power of four." },
    { input: "0", expectedOutput: "false", visibility: "hidden", explanation: "Zero is not a power of four." }
  ],
  "bit-025": [
    { input: "4\n2 2 3 2", expectedOutput: "3", visibility: "sample" },
    { input: "1\n7", expectedOutput: "7", visibility: "hidden", explanation: "The unique value may be the only value." },
    { input: "7\n-2 -2 -2 5 5 5 -9", expectedOutput: "-9", visibility: "hidden", explanation: "Signed values require correct per-bit handling." }
  ],
  "bit-026": [
    { input: "4\n1 2 2 4", expectedOutput: "2 3", visibility: "sample" },
    { input: "2\n2 2", expectedOutput: "2 1", visibility: "hidden", explanation: "Smallest valid repeating-and-missing pair." },
    { input: "5\n1 1 3 4 5", expectedOutput: "1 2", visibility: "hidden", explanation: "The repeated value appears at the start." }
  ],
  "bit-027": [
    { input: "3\n0 1 3", expectedOutput: "2", visibility: "sample" },
    { input: "1\n0", expectedOutput: "1", visibility: "hidden", explanation: "The upper endpoint is missing." },
    { input: "4\n4 2 1 0", expectedOutput: "3", visibility: "hidden", explanation: "Input order does not affect XOR cancellation." }
  ],
  "bit-029": [
    { input: "3\n1 2 3\n3", expectedOutput: "2", visibility: "sample" },
    { input: "1\n5\n5", expectedOutput: "1", visibility: "hidden", explanation: "A single element forms one matching subset." },
    { input: "3\n2 2 2\n4", expectedOutput: "3", visibility: "hidden", explanation: "Equal values at different indices form distinct subsets." }
  ],
  "bit-030": [
    { input: "4\n0 2 2 3", expectedOutput: "3", visibility: "sample" },
    { input: "1\n7", expectedOutput: "1", visibility: "hidden", explanation: "A single visit creates one set bit." },
    { input: "5\n1 1 1 1 1", expectedOutput: "1", visibility: "hidden", explanation: "Repeated visits count once." }
  ],
  "bit-032": [
    { input: "1 4", expectedOutput: "2", visibility: "sample" },
    { input: "0 0", expectedOutput: "0", visibility: "hidden", explanation: "Equal values have zero Hamming distance." },
    { input: "7 0", expectedOutput: "3", visibility: "hidden", explanation: "All three active bits differ." }
  ],
  "bit-033": [
    { input: "5", expectedOutput: "2", visibility: "sample" },
    { input: "1", expectedOutput: "0", visibility: "hidden", explanation: "The one active bit complements to zero." },
    { input: "10", expectedOutput: "5", visibility: "hidden", explanation: "1010 complements to 0101." }
  ],
  "bit-035": [
    { input: "5 7", expectedOutput: "4", visibility: "sample" },
    { input: "0 0", expectedOutput: "0", visibility: "hidden", explanation: "A single-value zero range." },
    { input: "12 15", expectedOutput: "12", visibility: "hidden", explanation: "The range shares the binary prefix 1100." }
  ],
  "bit-036": [
    { input: "1 2", expectedOutput: "3", visibility: "sample" },
    { input: "0 0", expectedOutput: "0", visibility: "hidden", explanation: "Additive identity." },
    { input: "-2 3", expectedOutput: "1", visibility: "hidden", explanation: "Carry propagation with mixed signs." }
  ],
  "bit-037": [
    { input: "6\n3 10 5 25 2 8", expectedOutput: "28", visibility: "sample" },
    { input: "2\n0 0", expectedOutput: "0", visibility: "hidden", explanation: "Equal values produce zero XOR." },
    { input: "4\n2 4 8 16", expectedOutput: "24", visibility: "hidden", explanation: "The best pair uses the two highest separated bits." }
  ],
  "bit-038": [
    { input: "3\n1 2 3\n1", expectedOutput: "1 0 2 1", visibility: "sample" },
    { input: "1\n6\n4", expectedOutput: "4 2", visibility: "hidden", explanation: "Smallest encoded array." },
    { input: "3\n0 0 0\n7", expectedOutput: "7 7 7 7", visibility: "hidden", explanation: "Zero XOR differences preserve the previous value." }
  ],
  "bit-039": [
    { input: "5", expectedOutput: "0 1 1 2 1 2", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "The DP base entry for zero." },
    { input: "2", expectedOutput: "0 1 1", visibility: "hidden", explanation: "Small sequence verifies the recurrence." }
  ],
  "bit-040": [
    { input: "10 7", expectedOutput: "3", visibility: "sample" },
    { input: "0 0", expectedOutput: "0", visibility: "hidden", explanation: "No flips are needed for equal values." },
    { input: "8 0", expectedOutput: "1", visibility: "hidden", explanation: "Only one active bit must be flipped." }
  ],
  "rec-002": [
    { input: "5", expectedOutput: "1 2 3 4 5", visibility: "sample" },
    { input: "1", expectedOutput: "1", visibility: "hidden", explanation: "Smallest allowed input." },
    { input: "3", expectedOutput: "1 2 3", visibility: "hidden", explanation: "Preserve increasing output order." }
  ],
  "rec-004": [
    { input: "4", expectedOutput: "10", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "Additive identity and base case." },
    { input: "1", expectedOutput: "1", visibility: "hidden", explanation: "Smallest positive input." }
  ],
  "rec-005": [
    { input: "2 5", expectedOutput: "32", visibility: "sample" },
    { input: "7 0", expectedOutput: "1", visibility: "hidden", explanation: "Any non-zero base to exponent zero is one." },
    { input: "-2 3", expectedOutput: "-8", visibility: "hidden", explanation: "Odd exponent with a negative base." }
  ],
  "rec-006": [
    { input: "6", expectedOutput: "8", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "First Fibonacci base case." },
    { input: "1", expectedOutput: "1", visibility: "hidden", explanation: "Second Fibonacci base case." }
  ],
  "rec-007": [
    { input: "level", expectedOutput: "true", visibility: "sample" },
    { input: "a", expectedOutput: "true", visibility: "hidden", explanation: "Single-character base case." },
    { input: "abba", expectedOutput: "true", visibility: "hidden", explanation: "Even-length palindrome." },
    { input: "coding", expectedOutput: "false", visibility: "hidden", explanation: "Mismatch at the outer characters." }
  ],
  "rec-008": [
    { input: "code", expectedOutput: "edoc", visibility: "sample" },
    { input: "a", expectedOutput: "a", visibility: "hidden", explanation: "Single-character base case." },
    { input: "ab", expectedOutput: "ba", visibility: "hidden", explanation: "Smallest non-trivial reversal." }
  ],
  "rec-009": [
    { input: "572", expectedOutput: "14", visibility: "sample" },
    { input: "0", expectedOutput: "0", visibility: "hidden", explanation: "Zero digit-sum base case." },
    { input: "1000000000", expectedOutput: "1", visibility: "hidden", explanation: "Upper bound with many zero digits." }
  ],
  "rec-010": [
    { input: "5072", expectedOutput: "4", visibility: "sample" },
    { input: "0", expectedOutput: "1", visibility: "hidden", explanation: "Zero has one decimal digit." },
    { input: "9", expectedOutput: "1", visibility: "hidden", explanation: "Single-digit base case." }
  ],
  "rec-012": [
    { input: "48 18", expectedOutput: "6", visibility: "sample" },
    { input: "7 0", expectedOutput: "7", visibility: "hidden", explanation: "Euclidean base case." },
    { input: "24 24", expectedOutput: "24", visibility: "hidden", explanation: "Equal inputs." }
  ]
};

function exampleCases(problem: Problem): ProblemTestCase[] {
  return problem.examples.map((example) => ({
    input: example.input,
    expectedOutput: example.output,
    visibility: "sample",
    explanation: example.explanation
  }));
}

function deduplicateCases(testCases: ProblemTestCase[]): ProblemTestCase[] {
  const seen = new Set<string>();
  return testCases.filter((testCase) => {
    const key = `${testCase.input}\u0000${testCase.expectedOutput}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getCuratedBoundaryCases(problemId: string): ProblemTestCase[] {
  return curatedBoundaryCases[problemId] ?? [];
}

export function getTestCaseCoverageSource(problem: Problem): TestCaseCoverageSource {
  if (problem.testCases?.length) {
    return "configured";
  }
  if (getCuratedBoundaryCases(problem.id).length) {
    return "curated";
  }
  if (problem.examples.length) {
    return "examples";
  }
  return "none";
}

export function getExecutionTestCases(problem: Problem): ProblemTestCase[] {
  const authoritativeCases = deduplicateCases([
    ...(problem.testCases ?? []),
    ...getCuratedBoundaryCases(problem.id)
  ]);

  return authoritativeCases.length ? authoritativeCases : exampleCases(problem);
}
