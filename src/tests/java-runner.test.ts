import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { getProblemById } from "../services/storage";
import { runJavaSubmission, runJavaWithCustomInput } from "../services/javaRunner";

test("java runner compiles and passes configured test cases", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-pass-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public int checkBit(int n, int index) {
        return (n & (1 << index)) != 0 ? 1 : 0;
    }
}
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
  assert.equal(result.failedCases.length, 0);
});

test("java function harness supports bit mask update contracts", () => {
  const problem = getProblemById("bit-004");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-set-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int setBit(int n, int index) {
        return n | (1 << index);
      }
    }
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports bit extraction by right shift", () => {
  const problem = getProblemById("bit-007");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-shift-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int extractBit(int n, int index) {
        return (n >> index) & 1;
      }
    }
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports odd-even boolean formatting", () => {
  const problem = getProblemById("bit-002");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-odd-even-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public boolean isOdd(int n) {
        return (n & 1) == 1;
      }
    }
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports Kernighan and power-of-two contracts", () => {
  const countProblem = getProblemById("bit-009");
  const powerProblem = getProblemById("bit-010");
  assert.ok(countProblem);
  assert.ok(powerProblem);

  const countDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-count-fast-"));
  const countFile = path.join(countDir, "Solution.java");
  fs.writeFileSync(
    countFile,
    `class Solution {
      public int countSetBitsFast(int n) {
        int count = 0;
        while (n != 0) {
          n = n & (n - 1);
          count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const powerDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-power-two-"));
  const powerFile = path.join(powerDir, "Solution.java");
  fs.writeFileSync(
    powerFile,
    `class Solution {
      public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
      }
    }
`,
    "utf-8"
  );

  const countResult = runJavaSubmission(countProblem, countFile);
  const powerResult = runJavaSubmission(powerProblem, powerFile);
  assert.equal(countResult.compileSucceeded, true);
  assert.equal(countResult.passedCount, countResult.totalCount);
  assert.equal(powerResult.compileSucceeded, true);
  assert.equal(powerResult.passedCount, powerResult.totalCount);
});

test("java function harness supports binary string conversion", () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-binary-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public String toBinary(int n) {
        if (n == 0) return "0";
        StringBuilder answer = new StringBuilder();
        while (n > 0) {
          answer.append(n & 1);
          n >>= 1;
        }
        return answer.reverse().toString();
      }
    }
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports xor pattern and single-number contracts", () => {
  const xorProblem = getProblemById("bit-011");
  const singleProblem = getProblemById("bit-012");
  assert.ok(xorProblem);
  assert.ok(singleProblem);

  const xorDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-xor-pattern-"));
  const xorFile = path.join(xorDir, "Solution.java");
  fs.writeFileSync(
    xorFile,
    `class Solution {
      public int xorFromOneToN(int n) {
        int remainder = n % 4;
        if (remainder == 0) return n;
        if (remainder == 1) return 1;
        if (remainder == 2) return n + 1;
        return 0;
      }
    }
`,
    "utf-8"
  );

  const singleDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-single-"));
  const singleFile = path.join(singleDir, "Solution.java");
  fs.writeFileSync(
    singleFile,
    `class Solution {
      public int singleNumber(int[] nums) {
        int answer = 0;
        for (int value : nums) answer ^= value;
        return answer;
      }
    }
`,
    "utf-8"
  );

  const xorResult = runJavaSubmission(xorProblem, xorFile);
  const singleResult = runJavaSubmission(singleProblem, singleFile);
  assert.equal(xorResult.compileSucceeded, true);
  assert.equal(xorResult.passedCount, xorResult.totalCount);
  assert.equal(singleResult.compileSucceeded, true);
  assert.equal(singleResult.passedCount, singleResult.totalCount);
});

test("java function harness supports two-unique, missing-number, and decode-xor contracts", () => {
  const twoUniqueProblem = getProblemById("bit-013");
  const missingProblem = getProblemById("bit-014");
  const decodeProblem = getProblemById("bit-038");
  assert.ok(twoUniqueProblem);
  assert.ok(missingProblem);
  assert.ok(decodeProblem);

  const twoUniqueDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-two-unique-"));
  const twoUniqueFile = path.join(twoUniqueDir, "Solution.java");
  fs.writeFileSync(
    twoUniqueFile,
    `import java.util.Arrays;
    class Solution {
      public int[] findTwoUnique(int[] nums) {
        int xors = 0;
        for (int value : nums) xors ^= value;
        int diffBit = xors & -xors;
        int first = 0;
        int second = 0;
        for (int value : nums) {
          if ((value & diffBit) == 0) first ^= value;
          else second ^= value;
        }
        int[] answer = new int[] { first, second };
        Arrays.sort(answer);
        return answer;
      }
    }
`,
    "utf-8"
  );

  const missingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-missing-"));
  const missingFile = path.join(missingDir, "Solution.java");
  fs.writeFileSync(
    missingFile,
    `class Solution {
      public int missingNumber(int[] nums) {
        int answer = nums.length;
        for (int i = 0; i < nums.length; i++) {
          answer ^= i;
          answer ^= nums[i];
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const decodeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-decode-"));
  const decodeFile = path.join(decodeDir, "Solution.java");
  fs.writeFileSync(
    decodeFile,
    `class Solution {
      public int[] decodeXoredArray(int[] encoded, int first) {
        int[] answer = new int[encoded.length + 1];
        answer[0] = first;
        for (int i = 0; i < encoded.length; i++) {
          answer[i + 1] = answer[i] ^ encoded[i];
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const twoUniqueResult = runJavaSubmission(twoUniqueProblem, twoUniqueFile);
  const missingResult = runJavaSubmission(missingProblem, missingFile);
  const decodeResult = runJavaSubmission(decodeProblem, decodeFile);
  assert.equal(twoUniqueResult.compileSucceeded, true);
  assert.equal(twoUniqueResult.passedCount, twoUniqueResult.totalCount);
  assert.equal(missingResult.compileSucceeded, true);
  assert.equal(missingResult.passedCount, missingResult.totalCount);
  assert.equal(decodeResult.compileSucceeded, true);
  assert.equal(decodeResult.passedCount, decodeResult.totalCount);
});

test("java function harness supports invert, complement, power-of-four, and count-bits contracts", () => {
  const invertProblem = getProblemById("bit-015");
  const complementProblem = getProblemById("bit-016");
  const powerOfFourProblem = getProblemById("bit-024");
  const countBitsProblem = getProblemById("bit-039");
  assert.ok(invertProblem);
  assert.ok(complementProblem);
  assert.ok(powerOfFourProblem);
  assert.ok(countBitsProblem);

  const invertDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-invert-"));
  const invertFile = path.join(invertDir, "Solution.java");
  fs.writeFileSync(
    invertFile,
    `class Solution {
      public int invertBits(int n) {
        return ~n;
      }
    }
`,
    "utf-8"
  );

  const complementDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-complement-"));
  const complementFile = path.join(complementDir, "Solution.java");
  fs.writeFileSync(
    complementFile,
    `class Solution {
      public int bitwiseComplement(int n) {
        if (n == 0) return 1;
        int mask = 0;
        int value = n;
        while (value > 0) {
          mask = (mask << 1) | 1;
          value >>= 1;
        }
        return n ^ mask;
      }
    }
`,
    "utf-8"
  );

  const powerOfFourDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-power-four-"));
  const powerOfFourFile = path.join(powerOfFourDir, "Solution.java");
  fs.writeFileSync(
    powerOfFourFile,
    `class Solution {
      public boolean isPowerOfFour(int n) {
        return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
      }
    }
`,
    "utf-8"
  );

  const countBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-count-dp-"));
  const countBitsFile = path.join(countBitsDir, "Solution.java");
  fs.writeFileSync(
    countBitsFile,
    `class Solution {
      public int[] countBits(int n) {
        int[] answer = new int[n + 1];
        for (int i = 1; i <= n; i++) {
          answer[i] = answer[i >> 1] + (i & 1);
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const invertResult = runJavaSubmission(invertProblem, invertFile);
  const complementResult = runJavaSubmission(complementProblem, complementFile);
  const powerOfFourResult = runJavaSubmission(powerOfFourProblem, powerOfFourFile);
  const countBitsResult = runJavaSubmission(countBitsProblem, countBitsFile);
  assert.equal(invertResult.compileSucceeded, true);
  assert.equal(invertResult.passedCount, invertResult.totalCount);
  assert.equal(complementResult.compileSucceeded, true);
  assert.equal(complementResult.passedCount, complementResult.totalCount);
  assert.equal(powerOfFourResult.compileSucceeded, true);
  assert.equal(powerOfFourResult.passedCount, powerOfFourResult.totalCount);
  assert.equal(countBitsResult.compileSucceeded, true);
  assert.equal(countBitsResult.passedCount, countBitsResult.totalCount);
});

test("java function harness supports odd-count, xor-swap, hamming-distance, number-complement, and min-bit-flips contracts", () => {
  const oddCountProblem = getProblemById("bit-017");
  const swapProblem = getProblemById("bit-020");
  const hammingProblem = getProblemById("bit-032");
  const complementProblem = getProblemById("bit-033");
  const minFlipsProblem = getProblemById("bit-040");
  assert.ok(oddCountProblem);
  assert.ok(swapProblem);
  assert.ok(hammingProblem);
  assert.ok(complementProblem);
  assert.ok(minFlipsProblem);

  const oddCountDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-odd-count-"));
  const oddCountFile = path.join(oddCountDir, "Solution.java");
  fs.writeFileSync(
    oddCountFile,
    `class Solution {
      public int countOddNumbers(int[] nums) {
        int count = 0;
        for (int value : nums) {
          if ((value & 1) != 0) count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const swapDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-swap-"));
  const swapFile = path.join(swapDir, "Solution.java");
  fs.writeFileSync(
    swapFile,
    `class Solution {
      public int[] swapUsingXor(int a, int b) {
        if (a != b) {
          a ^= b;
          b ^= a;
          a ^= b;
        }
        return new int[] { a, b };
      }
    }
`,
    "utf-8"
  );

  const hammingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-hamming-"));
  const hammingFile = path.join(hammingDir, "Solution.java");
  fs.writeFileSync(
    hammingFile,
    `class Solution {
      public int hammingDistance(int x, int y) {
        int value = x ^ y;
        int count = 0;
        while (value != 0) {
          value &= (value - 1);
          count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const complementDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-number-complement-"));
  const complementFile = path.join(complementDir, "Solution.java");
  fs.writeFileSync(
    complementFile,
    `class Solution {
      public int findComplement(int n) {
        int mask = 0;
        int value = n;
        while (value > 0) {
          mask = (mask << 1) | 1;
          value >>= 1;
        }
        return n ^ mask;
      }
    }
`,
    "utf-8"
  );

  const minFlipsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-min-flips-"));
  const minFlipsFile = path.join(minFlipsDir, "Solution.java");
  fs.writeFileSync(
    minFlipsFile,
    `class Solution {
      public int minBitFlips(int start, int goal) {
        int value = start ^ goal;
        int count = 0;
        while (value != 0) {
          value &= (value - 1);
          count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const oddCountResult = runJavaSubmission(oddCountProblem, oddCountFile);
  const swapResult = runJavaSubmission(swapProblem, swapFile);
  const hammingResult = runJavaSubmission(hammingProblem, hammingFile);
  const complementResult = runJavaSubmission(complementProblem, complementFile);
  const minFlipsResult = runJavaSubmission(minFlipsProblem, minFlipsFile);
  assert.equal(oddCountResult.compileSucceeded, true);
  assert.equal(oddCountResult.passedCount, oddCountResult.totalCount);
  assert.equal(swapResult.compileSucceeded, true);
  assert.equal(swapResult.passedCount, swapResult.totalCount);
  assert.equal(hammingResult.compileSucceeded, true);
  assert.equal(hammingResult.passedCount, hammingResult.totalCount);
  assert.equal(complementResult.compileSucceeded, true);
  assert.equal(complementResult.passedCount, complementResult.totalCount);
  assert.equal(minFlipsResult.compileSucceeded, true);
  assert.equal(minFlipsResult.passedCount, minFlipsResult.totalCount);
});

test("java function harness supports clear-rightmost, kernighan-array, range-and, and get-sum contracts", () => {
  const clearProblem = getProblemById("bit-021");
  const countBitsProblem = getProblemById("bit-023");
  const rangeAndProblem = getProblemById("bit-035");
  const sumProblem = getProblemById("bit-036");
  assert.ok(clearProblem);
  assert.ok(countBitsProblem);
  assert.ok(rangeAndProblem);
  assert.ok(sumProblem);

  const clearDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-clear-rightmost-"));
  const clearFile = path.join(clearDir, "Solution.java");
  fs.writeFileSync(
    clearFile,
    `class Solution {
      public int clearRightmostSetBit(int n) {
        return n & (n - 1);
      }
    }
`,
    "utf-8"
  );

  const countBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-count-kernighan-array-"));
  const countBitsFile = path.join(countBitsDir, "Solution.java");
  fs.writeFileSync(
    countBitsFile,
    `class Solution {
      public int[] countBitsKernighan(int n) {
        int[] answer = new int[n + 1];
        for (int i = 0; i <= n; i++) {
          int value = i;
          int count = 0;
          while (value != 0) {
            value &= (value - 1);
            count++;
          }
          answer[i] = count;
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const rangeAndDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-range-and-"));
  const rangeAndFile = path.join(rangeAndDir, "Solution.java");
  fs.writeFileSync(
    rangeAndFile,
    `class Solution {
      public int rangeBitwiseAnd(int left, int right) {
        int shifts = 0;
        while (left < right) {
          left >>= 1;
          right >>= 1;
          shifts++;
        }
        return left << shifts;
      }
    }
`,
    "utf-8"
  );

  const sumDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-get-sum-"));
  const sumFile = path.join(sumDir, "Solution.java");
  fs.writeFileSync(
    sumFile,
    `class Solution {
      public int getSum(int a, int b) {
        while (b != 0) {
          int carry = (a & b) << 1;
          a = a ^ b;
          b = carry;
        }
        return a;
      }
    }
`,
    "utf-8"
  );

  const clearResult = runJavaSubmission(clearProblem, clearFile);
  const countBitsResult = runJavaSubmission(countBitsProblem, countBitsFile);
  const rangeAndResult = runJavaSubmission(rangeAndProblem, rangeAndFile);
  const sumResult = runJavaSubmission(sumProblem, sumFile);
  assert.equal(clearResult.compileSucceeded, true);
  assert.equal(clearResult.passedCount, clearResult.totalCount);
  assert.equal(countBitsResult.compileSucceeded, true);
  assert.equal(countBitsResult.passedCount, countBitsResult.totalCount);
  assert.equal(rangeAndResult.compileSucceeded, true);
  assert.equal(rangeAndResult.passedCount, rangeAndResult.totalCount);
  assert.equal(sumResult.compileSucceeded, true);
  assert.equal(sumResult.passedCount, sumResult.totalCount);
});

test("java function harness supports range-query, query-batch, single-number-ii, repeat-missing, subset-sum, and visited-mask contracts", () => {
  const checkProblem = getProblemById("bit-018");
  const setQueriesProblem = getProblemById("bit-019");
  const toggleRangeProblem = getProblemById("bit-022");
  const singleNumberTwoProblem = getProblemById("bit-025");
  const repeatMissingProblem = getProblemById("bit-026");
  const missingBucketsProblem = getProblemById("bit-027");
  const subsetSumProblem = getProblemById("bit-029");
  const visitedCitiesProblem = getProblemById("bit-030");
  assert.ok(checkProblem);
  assert.ok(setQueriesProblem);
  assert.ok(toggleRangeProblem);
  assert.ok(singleNumberTwoProblem);
  assert.ok(repeatMissingProblem);
  assert.ok(missingBucketsProblem);
  assert.ok(subsetSumProblem);
  assert.ok(visitedCitiesProblem);

  const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-check-query-"));
  const checkFile = path.join(checkDir, "Solution.java");
  fs.writeFileSync(
    checkFile,
    `class Solution {
      public int checkBitInQuery(int n, int index) {
        return (n & (1 << index)) != 0 ? 1 : 0;
      }
    }
`,
    "utf-8"
  );

  const setQueriesDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-set-queries-"));
  const setQueriesFile = path.join(setQueriesDir, "Solution.java");
  fs.writeFileSync(
    setQueriesFile,
    `class Solution {
      public int setBitsFromQueries(int n, int[] positions) {
        for (int index : positions) {
          n |= (1 << index);
        }
        return n;
      }
    }
`,
    "utf-8"
  );

  const toggleRangeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-toggle-range-"));
  const toggleRangeFile = path.join(toggleRangeDir, "Solution.java");
  fs.writeFileSync(
    toggleRangeFile,
    `class Solution {
      public int toggleRange(int n, int left, int right) {
        for (int index = left; index <= right; index++) {
          n ^= (1 << index);
        }
        return n;
      }
    }
`,
    "utf-8"
  );

  const singleNumberTwoDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-single-number-two-"));
  const singleNumberTwoFile = path.join(singleNumberTwoDir, "Solution.java");
  fs.writeFileSync(
    singleNumberTwoFile,
    `class Solution {
      public int singleNumberII(int[] nums) {
        int ones = 0;
        int twos = 0;
        for (int value : nums) {
          ones = (ones ^ value) & ~twos;
          twos = (twos ^ value) & ~ones;
        }
        return ones;
      }
    }
`,
    "utf-8"
  );

  const repeatMissingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-repeat-missing-"));
  const repeatMissingFile = path.join(repeatMissingDir, "Solution.java");
  fs.writeFileSync(
    repeatMissingFile,
    `class Solution {
      public int[] findRepeatingAndMissing(int[] nums) {
        int repeating = -1;
        int missing = -1;
        boolean[] seen = new boolean[nums.length + 1];
        for (int value : nums) {
          if (seen[value]) repeating = value;
          seen[value] = true;
        }
        for (int value = 1; value <= nums.length; value++) {
          if (!seen[value]) {
            missing = value;
            break;
          }
        }
        return new int[] { repeating, missing };
      }
    }
`,
    "utf-8"
  );

  const missingBucketsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-missing-buckets-"));
  const missingBucketsFile = path.join(missingBucketsDir, "Solution.java");
  fs.writeFileSync(
    missingBucketsFile,
    `class Solution {
      public int missingNumberBuckets(int[] nums) {
        int answer = nums.length;
        for (int i = 0; i < nums.length; i++) {
          answer ^= i;
          answer ^= nums[i];
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const subsetSumDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-subset-sum-"));
  const subsetSumFile = path.join(subsetSumDir, "Solution.java");
  fs.writeFileSync(
    subsetSumFile,
    `class Solution {
      public int countSubsetSum(int[] nums, int target) {
        int count = 0;
        int totalMasks = 1 << nums.length;
        for (int mask = 0; mask < totalMasks; mask++) {
          int sum = 0;
          for (int index = 0; index < nums.length; index++) {
            if ((mask & (1 << index)) != 0) sum += nums[index];
          }
          if (sum == target) count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const visitedCitiesDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-visited-cities-"));
  const visitedCitiesFile = path.join(visitedCitiesDir, "Solution.java");
  fs.writeFileSync(
    visitedCitiesFile,
    `class Solution {
      public int countDistinctVisitedCities(int[] cities) {
        int mask = 0;
        for (int city : cities) mask |= (1 << city);
        int count = 0;
        while (mask != 0) {
          mask &= (mask - 1);
          count++;
        }
        return count;
      }
    }
`,
    "utf-8"
  );

  const checkResult = runJavaSubmission(checkProblem, checkFile);
  const setQueriesResult = runJavaSubmission(setQueriesProblem, setQueriesFile);
  const toggleRangeResult = runJavaSubmission(toggleRangeProblem, toggleRangeFile);
  const singleNumberTwoResult = runJavaSubmission(singleNumberTwoProblem, singleNumberTwoFile);
  const repeatMissingResult = runJavaSubmission(repeatMissingProblem, repeatMissingFile);
  const missingBucketsResult = runJavaSubmission(missingBucketsProblem, missingBucketsFile);
  const subsetSumResult = runJavaSubmission(subsetSumProblem, subsetSumFile);
  const visitedCitiesResult = runJavaSubmission(visitedCitiesProblem, visitedCitiesFile);
  assert.equal(checkResult.compileSucceeded, true);
  assert.equal(checkResult.passedCount, checkResult.totalCount);
  assert.equal(setQueriesResult.compileSucceeded, true);
  assert.equal(setQueriesResult.passedCount, setQueriesResult.totalCount);
  assert.equal(toggleRangeResult.compileSucceeded, true);
  assert.equal(toggleRangeResult.passedCount, toggleRangeResult.totalCount);
  assert.equal(singleNumberTwoResult.compileSucceeded, true);
  assert.equal(singleNumberTwoResult.passedCount, singleNumberTwoResult.totalCount);
  assert.equal(repeatMissingResult.compileSucceeded, true);
  assert.equal(repeatMissingResult.passedCount, repeatMissingResult.totalCount);
  assert.equal(missingBucketsResult.compileSucceeded, true);
  assert.equal(missingBucketsResult.passedCount, missingBucketsResult.totalCount);
  assert.equal(subsetSumResult.compileSucceeded, true);
  assert.equal(subsetSumResult.passedCount, subsetSumResult.totalCount);
  assert.equal(visitedCitiesResult.compileSucceeded, true);
  assert.equal(visitedCitiesResult.passedCount, visitedCitiesResult.totalCount);
});

test("java function harness supports subsets, assignment-mask, reverse-bits, and maximum-xor contracts", () => {
  const subsetsProblem = getProblemById("bit-028");
  const assignmentProblem = getProblemById("bit-031");
  const reverseBitsProblem = getProblemById("bit-034");
  const maxXorProblem = getProblemById("bit-037");
  assert.ok(subsetsProblem);
  assert.ok(assignmentProblem);
  assert.ok(reverseBitsProblem);
  assert.ok(maxXorProblem);

  const subsetsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-subsets-"));
  const subsetsFile = path.join(subsetsDir, "Solution.java");
  fs.writeFileSync(
    subsetsFile,
    `import java.util.*;
    class Solution {
      public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        int totalMasks = 1 << nums.length;
        for (int mask = 0; mask < totalMasks; mask++) {
          List<Integer> subset = new ArrayList<>();
          for (int index = 0; index < nums.length; index++) {
            if ((mask & (1 << index)) != 0) subset.add(nums[index]);
          }
          answer.add(subset);
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const assignmentDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-assignments-"));
  const assignmentFile = path.join(assignmentDir, "Solution.java");
  fs.writeFileSync(
    assignmentFile,
    `class Solution {
      public int countAssignments(int[][] availability) {
        int n = availability.length;
        int[] memo = new int[1 << n];
        java.util.Arrays.fill(memo, -1);
        return dfs(0, availability, memo);
      }

      private int dfs(int mask, int[][] availability, int[] memo) {
        int n = availability.length;
        int task = Integer.bitCount(mask);
        if (task == n) return 1;
        if (memo[mask] != -1) return memo[mask];
        int ways = 0;
        for (int worker = 0; worker < n; worker++) {
          if ((mask & (1 << worker)) == 0 && availability[task][worker] == 1) {
            ways += dfs(mask | (1 << worker), availability, memo);
          }
        }
        return memo[mask] = ways;
      }
    }
`,
    "utf-8"
  );

  const reverseBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-reverse-bits-"));
  const reverseBitsFile = path.join(reverseBitsDir, "Solution.java");
  fs.writeFileSync(
    reverseBitsFile,
    `class Solution {
      public int reverseBits(int n) {
        int answer = 0;
        for (int i = 0; i < 32; i++) {
          answer <<= 1;
          answer |= (n & 1);
          n >>>= 1;
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const maxXorDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-bit-max-xor-"));
  const maxXorFile = path.join(maxXorDir, "Solution.java");
  fs.writeFileSync(
    maxXorFile,
    `class Solution {
      public int maximumXorPair(int[] nums) {
        int answer = 0;
        for (int i = 0; i < nums.length; i++) {
          for (int j = i + 1; j < nums.length; j++) {
            answer = Math.max(answer, nums[i] ^ nums[j]);
          }
        }
        return answer;
      }
    }
`,
    "utf-8"
  );

  const subsetsResult = runJavaSubmission(subsetsProblem, subsetsFile);
  const assignmentResult = runJavaSubmission(assignmentProblem, assignmentFile);
  const reverseBitsResult = runJavaSubmission(reverseBitsProblem, reverseBitsFile);
  const maxXorResult = runJavaSubmission(maxXorProblem, maxXorFile);
  assert.equal(subsetsResult.compileSucceeded, true);
  assert.equal(subsetsResult.passedCount, subsetsResult.totalCount);
  assert.equal(assignmentResult.compileSucceeded, true);
  assert.equal(assignmentResult.passedCount, assignmentResult.totalCount);
  assert.equal(reverseBitsResult.compileSucceeded, true);
  assert.equal(reverseBitsResult.passedCount, reverseBitsResult.totalCount);
  assert.equal(maxXorResult.compileSucceeded, true);
  assert.equal(maxXorResult.passedCount, maxXorResult.totalCount);
});

test("java runner reports compilation failure cleanly", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-fail-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
    public static void main(String[] args) {
        System.out.println("oops")
    }
}
`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.usedTestCases, true);
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.passedCount, 0);
  assert.ok(result.compileError);
});

test("java runner stops infinite loops", () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-timeout-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
      public static void main(String[] args) {
        while (true) {}
      }
    }`,
    "utf-8"
  );

  const result = runJavaWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.resourceLimit, "time");
});

test("java runner stops excessive output", () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-runner-output-"));
  const filePath = path.join(tempDir, "Main.java");
  fs.writeFileSync(
    filePath,
    `public class Main {
      public static void main(String[] args) {
        while (true) System.out.print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      }
    }`,
    "utf-8"
  );

  const result = runJavaWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.outputLimitExceeded, true);
  assert.equal(result.resourceLimit, "output");
});

test("java function harness provides linked-list types and driver", () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-runner-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public Node reverse(Node head) {
        Node previous = null;
        Node current = head;
        while (current != null) {
          Node next = current.next;
          current.next = previous;
          previous = current;
          current = next;
        }
        return previous;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports linked-list search formatting", () => {
  const problem = getProblemById("ll-002");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-search-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public boolean contains(Node head, int target) {
        for (Node current = head; current != null; current = current.next) {
          if (current.data == target) return true;
        }
        return false;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports in-place array mutation", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-array-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public void reverse(int[] nums) {
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
          int value = nums[left];
          nums[left++] = nums[right];
          nums[right--] = value;
        }
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness provides TreeNode and serializes traversal results", () => {
  const problem = getProblemById("tr-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-tree-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public List<Integer> preorder(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        visit(root, result);
        return result;
      }

      private void visit(TreeNode node, List<Integer> result) {
        if (node == null) return;
        result.add(node.val);
        visit(node.left, result);
        visit(node.right, result);
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports stack string contracts", () => {
  const problem = getProblemById("st-002");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-stack-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public boolean isBalanced(String value) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char current : value.toCharArray()) {
          if (current == '(' || current == '[' || current == '{') stack.push(current);
          else {
            if (stack.isEmpty()) return false;
            char open = stack.pop();
            if ((current == ')' && open != '(') || (current == ']' && open != '[') || (current == '}' && open != '{')) return false;
          }
        }
        return stack.isEmpty();
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports array plus target contracts", () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-binary-search-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int search(int[] values, int target) {
        int left = 0, right = values.length - 1;
        while (left <= right) {
          int middle = left + (right - left) / 2;
          if (values[middle] == target) return middle;
          if (values[middle] < target) left = middle + 1;
          else right = middle - 1;
        }
        return -1;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java function harness supports recursive scalar contracts", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-recursion-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `class Solution {
      public int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("java graph harness provides an adjacency list", () => {
  const problem = getProblemById("gr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-java-function-graph-"));
  const filePath = path.join(tempDir, "Solution.java");
  fs.writeFileSync(
    filePath,
    `import java.util.*;
    class Solution {
      public List<Integer> bfs(int n, List<List<Integer>> graph) {
        List<Integer> order = new ArrayList<>();
        boolean[] visited = new boolean[n];
        Queue<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        visited[0] = true;
        while (!queue.isEmpty()) {
          int node = queue.remove();
          order.add(node);
          for (int next : graph.get(node)) {
            if (!visited[next]) {
              visited[next] = true;
              queue.add(next);
            }
          }
        }
        return order;
      }
    }`,
    "utf-8"
  );

  const result = runJavaSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});
