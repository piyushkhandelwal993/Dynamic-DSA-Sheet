import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { getProblemById } from "../services/storage";
import { runCppSubmission, runCppWithCustomInput } from "../services/cppRunner";

const compilerAvailable = spawnSync("g++", ["--version"], { encoding: "utf-8" }).status === 0;

test("cpp runner compiles and passes configured test cases", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-pass-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  int checkBit(int n, int index) {
    return (n & (1 << index)) != 0 ? 1 : 0;
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports bit clear contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-005");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-clear-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  int clearBit(int n, int index) {
    return n & ~(1 << index);
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports bit toggle contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-006");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-toggle-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  int toggleBit(int n, int index) {
    return n ^ (1 << index);
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports odd-even and basic count contracts", { skip: !compilerAvailable }, () => {
  const oddEvenProblem = getProblemById("bit-002");
  const countProblem = getProblemById("bit-008");
  assert.ok(oddEvenProblem);
  assert.ok(countProblem);

  const oddEvenDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-odd-even-"));
  const oddEvenFile = path.join(oddEvenDir, "solution.cpp");
  fs.writeFileSync(
    oddEvenFile,
    `class Solution {
public:
  bool isOdd(int n) {
    return (n & 1) == 1;
  }
};
`,
    "utf-8"
  );

  const countDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-count-"));
  const countFile = path.join(countDir, "solution.cpp");
  fs.writeFileSync(
    countFile,
    `class Solution {
public:
  int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
      count += (n & 1);
      n >>= 1;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const oddEvenResult = runCppSubmission(oddEvenProblem, oddEvenFile);
  const countResult = runCppSubmission(countProblem, countFile);
  assert.equal(oddEvenResult.compileSucceeded, true);
  assert.equal(oddEvenResult.passedCount, oddEvenResult.totalCount);
  assert.equal(countResult.compileSucceeded, true);
  assert.equal(countResult.passedCount, countResult.totalCount);
});

test("cpp function harness supports power-of-two contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-010");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-power-two-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports binary string conversion", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-binary-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
public:
  string toBinary(int n) {
    if (n == 0) return "0";
    string answer;
    while (n > 0) {
      answer.push_back(char('0' + (n & 1)));
      n >>= 1;
    }
    reverse(answer.begin(), answer.end());
    return answer;
  }
};
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports xor pattern and single-number contracts", { skip: !compilerAvailable }, () => {
  const xorProblem = getProblemById("bit-011");
  const singleProblem = getProblemById("bit-012");
  assert.ok(xorProblem);
  assert.ok(singleProblem);

  const xorDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-xor-pattern-"));
  const xorFile = path.join(xorDir, "solution.cpp");
  fs.writeFileSync(
    xorFile,
    `class Solution {
public:
  int xorFromOneToN(int n) {
    int remainder = n % 4;
    if (remainder == 0) return n;
    if (remainder == 1) return 1;
    if (remainder == 2) return n + 1;
    return 0;
  }
};
`,
    "utf-8"
  );

  const singleDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-single-"));
  const singleFile = path.join(singleDir, "solution.cpp");
  fs.writeFileSync(
    singleFile,
    `class Solution {
public:
  int singleNumber(vector<int>& nums) {
    int answer = 0;
    for (int value : nums) answer ^= value;
    return answer;
  }
};
`,
    "utf-8"
  );

  const xorResult = runCppSubmission(xorProblem, xorFile);
  const singleResult = runCppSubmission(singleProblem, singleFile);
  assert.equal(xorResult.compileSucceeded, true);
  assert.equal(xorResult.passedCount, xorResult.totalCount);
  assert.equal(singleResult.compileSucceeded, true);
  assert.equal(singleResult.passedCount, singleResult.totalCount);
});

test("cpp function harness supports two-unique, missing-number, and decode-xor contracts", { skip: !compilerAvailable }, () => {
  const twoUniqueProblem = getProblemById("bit-013");
  const missingProblem = getProblemById("bit-014");
  const decodeProblem = getProblemById("bit-038");
  assert.ok(twoUniqueProblem);
  assert.ok(missingProblem);
  assert.ok(decodeProblem);

  const twoUniqueDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-two-unique-"));
  const twoUniqueFile = path.join(twoUniqueDir, "solution.cpp");
  fs.writeFileSync(
    twoUniqueFile,
    `class Solution {
public:
  vector<int> findTwoUnique(vector<int>& nums) {
    int xors = 0;
    for (int value : nums) xors ^= value;
    int diffBit = xors & -xors;
    int first = 0;
    int second = 0;
    for (int value : nums) {
      if ((value & diffBit) == 0) first ^= value;
      else second ^= value;
    }
    vector<int> answer = {first, second};
    sort(answer.begin(), answer.end());
    return answer;
  }
};
`,
    "utf-8"
  );

  const missingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-missing-"));
  const missingFile = path.join(missingDir, "solution.cpp");
  fs.writeFileSync(
    missingFile,
    `class Solution {
public:
  int missingNumber(vector<int>& nums) {
    int answer = (int)nums.size();
    for (int i = 0; i < (int)nums.size(); i++) {
      answer ^= i;
      answer ^= nums[i];
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const decodeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-decode-"));
  const decodeFile = path.join(decodeDir, "solution.cpp");
  fs.writeFileSync(
    decodeFile,
    `class Solution {
public:
  vector<int> decodeXoredArray(vector<int>& encoded, int first) {
    vector<int> answer(encoded.size() + 1);
    answer[0] = first;
    for (int i = 0; i < (int)encoded.size(); i++) {
      answer[i + 1] = answer[i] ^ encoded[i];
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const twoUniqueResult = runCppSubmission(twoUniqueProblem, twoUniqueFile);
  const missingResult = runCppSubmission(missingProblem, missingFile);
  const decodeResult = runCppSubmission(decodeProblem, decodeFile);
  assert.equal(twoUniqueResult.compileSucceeded, true);
  assert.equal(twoUniqueResult.passedCount, twoUniqueResult.totalCount);
  assert.equal(missingResult.compileSucceeded, true);
  assert.equal(missingResult.passedCount, missingResult.totalCount);
  assert.equal(decodeResult.compileSucceeded, true);
  assert.equal(decodeResult.passedCount, decodeResult.totalCount);
});

test("cpp function harness supports invert, complement, power-of-four, and count-bits contracts", { skip: !compilerAvailable }, () => {
  const invertProblem = getProblemById("bit-015");
  const complementProblem = getProblemById("bit-016");
  const powerOfFourProblem = getProblemById("bit-024");
  const countBitsProblem = getProblemById("bit-039");
  assert.ok(invertProblem);
  assert.ok(complementProblem);
  assert.ok(powerOfFourProblem);
  assert.ok(countBitsProblem);

  const invertDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-invert-"));
  const invertFile = path.join(invertDir, "solution.cpp");
  fs.writeFileSync(
    invertFile,
    `class Solution {
public:
  int invertBits(int n) {
    return ~n;
  }
};
`,
    "utf-8"
  );

  const complementDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-complement-"));
  const complementFile = path.join(complementDir, "solution.cpp");
  fs.writeFileSync(
    complementFile,
    `class Solution {
public:
  int bitwiseComplement(int n) {
    if (n == 0) return 1;
    int mask = 0;
    int value = n;
    while (value > 0) {
      mask = (mask << 1) | 1;
      value >>= 1;
    }
    return n ^ mask;
  }
};
`,
    "utf-8"
  );

  const powerOfFourDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-power-four-"));
  const powerOfFourFile = path.join(powerOfFourDir, "solution.cpp");
  fs.writeFileSync(
    powerOfFourFile,
    `class Solution {
public:
  bool isPowerOfFour(int n) {
    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
  }
};
`,
    "utf-8"
  );

  const countBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-count-dp-"));
  const countBitsFile = path.join(countBitsDir, "solution.cpp");
  fs.writeFileSync(
    countBitsFile,
    `class Solution {
public:
  vector<int> countBits(int n) {
    vector<int> answer(n + 1, 0);
    for (int i = 1; i <= n; i++) {
      answer[i] = answer[i >> 1] + (i & 1);
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const invertResult = runCppSubmission(invertProblem, invertFile);
  const complementResult = runCppSubmission(complementProblem, complementFile);
  const powerOfFourResult = runCppSubmission(powerOfFourProblem, powerOfFourFile);
  const countBitsResult = runCppSubmission(countBitsProblem, countBitsFile);
  assert.equal(invertResult.compileSucceeded, true);
  assert.equal(invertResult.passedCount, invertResult.totalCount);
  assert.equal(complementResult.compileSucceeded, true);
  assert.equal(complementResult.passedCount, complementResult.totalCount);
  assert.equal(powerOfFourResult.compileSucceeded, true);
  assert.equal(powerOfFourResult.passedCount, powerOfFourResult.totalCount);
  assert.equal(countBitsResult.compileSucceeded, true);
  assert.equal(countBitsResult.passedCount, countBitsResult.totalCount);
});

test("cpp function harness supports odd-count, xor-swap, hamming-distance, number-complement, and min-bit-flips contracts", { skip: !compilerAvailable }, () => {
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

  const oddCountDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-odd-count-"));
  const oddCountFile = path.join(oddCountDir, "solution.cpp");
  fs.writeFileSync(
    oddCountFile,
    `class Solution {
public:
  int countOddNumbers(vector<int>& nums) {
    int count = 0;
    for (int value : nums) {
      if ((value & 1) != 0) count++;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const swapDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-swap-"));
  const swapFile = path.join(swapDir, "solution.cpp");
  fs.writeFileSync(
    swapFile,
    `class Solution {
public:
  vector<int> swapUsingXor(int a, int b) {
    if (a != b) {
      a ^= b;
      b ^= a;
      a ^= b;
    }
    return {a, b};
  }
};
`,
    "utf-8"
  );

  const hammingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-hamming-"));
  const hammingFile = path.join(hammingDir, "solution.cpp");
  fs.writeFileSync(
    hammingFile,
    `class Solution {
public:
  int hammingDistance(int x, int y) {
    int value = x ^ y;
    int count = 0;
    while (value != 0) {
      value &= (value - 1);
      count++;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const complementDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-number-complement-"));
  const complementFile = path.join(complementDir, "solution.cpp");
  fs.writeFileSync(
    complementFile,
    `class Solution {
public:
  int findComplement(int n) {
    int mask = 0;
    int value = n;
    while (value > 0) {
      mask = (mask << 1) | 1;
      value >>= 1;
    }
    return n ^ mask;
  }
};
`,
    "utf-8"
  );

  const minFlipsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-min-flips-"));
  const minFlipsFile = path.join(minFlipsDir, "solution.cpp");
  fs.writeFileSync(
    minFlipsFile,
    `class Solution {
public:
  int minBitFlips(int start, int goal) {
    int value = start ^ goal;
    int count = 0;
    while (value != 0) {
      value &= (value - 1);
      count++;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const oddCountResult = runCppSubmission(oddCountProblem, oddCountFile);
  const swapResult = runCppSubmission(swapProblem, swapFile);
  const hammingResult = runCppSubmission(hammingProblem, hammingFile);
  const complementResult = runCppSubmission(complementProblem, complementFile);
  const minFlipsResult = runCppSubmission(minFlipsProblem, minFlipsFile);
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

test("cpp function harness supports clear-rightmost, kernighan-array, range-and, and get-sum contracts", { skip: !compilerAvailable }, () => {
  const clearProblem = getProblemById("bit-021");
  const countBitsProblem = getProblemById("bit-023");
  const rangeAndProblem = getProblemById("bit-035");
  const sumProblem = getProblemById("bit-036");
  assert.ok(clearProblem);
  assert.ok(countBitsProblem);
  assert.ok(rangeAndProblem);
  assert.ok(sumProblem);

  const clearDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-clear-rightmost-"));
  const clearFile = path.join(clearDir, "solution.cpp");
  fs.writeFileSync(
    clearFile,
    `class Solution {
public:
  int clearRightmostSetBit(int n) {
    return n & (n - 1);
  }
};
`,
    "utf-8"
  );

  const countBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-count-kernighan-array-"));
  const countBitsFile = path.join(countBitsDir, "solution.cpp");
  fs.writeFileSync(
    countBitsFile,
    `class Solution {
public:
  vector<int> countBitsKernighan(int n) {
    vector<int> answer(n + 1, 0);
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
};
`,
    "utf-8"
  );

  const rangeAndDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-range-and-"));
  const rangeAndFile = path.join(rangeAndDir, "solution.cpp");
  fs.writeFileSync(
    rangeAndFile,
    `class Solution {
public:
  int rangeBitwiseAnd(int left, int right) {
    int shifts = 0;
    while (left < right) {
      left >>= 1;
      right >>= 1;
      shifts++;
    }
    return left << shifts;
  }
};
`,
    "utf-8"
  );

  const sumDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-get-sum-"));
  const sumFile = path.join(sumDir, "solution.cpp");
  fs.writeFileSync(
    sumFile,
    `class Solution {
public:
  int getSum(int a, int b) {
    while (b != 0) {
      unsigned carry = (unsigned)(a & b) << 1;
      a = a ^ b;
      b = (int)carry;
    }
    return a;
  }
};
`,
    "utf-8"
  );

  const clearResult = runCppSubmission(clearProblem, clearFile);
  const countBitsResult = runCppSubmission(countBitsProblem, countBitsFile);
  const rangeAndResult = runCppSubmission(rangeAndProblem, rangeAndFile);
  const sumResult = runCppSubmission(sumProblem, sumFile);
  assert.equal(clearResult.compileSucceeded, true);
  assert.equal(clearResult.passedCount, clearResult.totalCount);
  assert.equal(countBitsResult.compileSucceeded, true);
  assert.equal(countBitsResult.passedCount, countBitsResult.totalCount);
  assert.equal(rangeAndResult.compileSucceeded, true);
  assert.equal(rangeAndResult.passedCount, rangeAndResult.totalCount);
  assert.equal(sumResult.compileSucceeded, true);
  assert.equal(sumResult.passedCount, sumResult.totalCount);
});

test("cpp function harness supports range-query, query-batch, single-number-ii, repeat-missing, subset-sum, and visited-mask contracts", { skip: !compilerAvailable }, () => {
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

  const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-check-query-"));
  const checkFile = path.join(checkDir, "solution.cpp");
  fs.writeFileSync(
    checkFile,
    `class Solution {
public:
  int checkBitInQuery(int n, int index) {
    return (n & (1 << index)) != 0 ? 1 : 0;
  }
};
`,
    "utf-8"
  );

  const setQueriesDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-set-queries-"));
  const setQueriesFile = path.join(setQueriesDir, "solution.cpp");
  fs.writeFileSync(
    setQueriesFile,
    `class Solution {
public:
  int setBitsFromQueries(int n, vector<int>& positions) {
    for (int index : positions) {
      n |= (1 << index);
    }
    return n;
  }
};
`,
    "utf-8"
  );

  const toggleRangeDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-toggle-range-"));
  const toggleRangeFile = path.join(toggleRangeDir, "solution.cpp");
  fs.writeFileSync(
    toggleRangeFile,
    `class Solution {
public:
  int toggleRange(int n, int left, int right) {
    for (int index = left; index <= right; index++) {
      n ^= (1 << index);
    }
    return n;
  }
};
`,
    "utf-8"
  );

  const singleNumberTwoDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-single-number-two-"));
  const singleNumberTwoFile = path.join(singleNumberTwoDir, "solution.cpp");
  fs.writeFileSync(
    singleNumberTwoFile,
    `class Solution {
public:
  int singleNumberII(vector<int>& nums) {
    int ones = 0;
    int twos = 0;
    for (int value : nums) {
      ones = (ones ^ value) & ~twos;
      twos = (twos ^ value) & ~ones;
    }
    return ones;
  }
};
`,
    "utf-8"
  );

  const repeatMissingDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-repeat-missing-"));
  const repeatMissingFile = path.join(repeatMissingDir, "solution.cpp");
  fs.writeFileSync(
    repeatMissingFile,
    `class Solution {
public:
  vector<int> findRepeatingAndMissing(vector<int>& nums) {
    int repeating = -1;
    int missing = -1;
    vector<int> seen(nums.size() + 1, 0);
    for (int value : nums) {
      if (seen[value]) repeating = value;
      seen[value] = 1;
    }
    for (int value = 1; value <= (int)nums.size(); value++) {
      if (!seen[value]) {
        missing = value;
        break;
      }
    }
    return {repeating, missing};
  }
};
`,
    "utf-8"
  );

  const missingBucketsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-missing-buckets-"));
  const missingBucketsFile = path.join(missingBucketsDir, "solution.cpp");
  fs.writeFileSync(
    missingBucketsFile,
    `class Solution {
public:
  int missingNumberBuckets(vector<int>& nums) {
    int answer = (int)nums.size();
    for (int i = 0; i < (int)nums.size(); i++) {
      answer ^= i;
      answer ^= nums[i];
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const subsetSumDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-subset-sum-"));
  const subsetSumFile = path.join(subsetSumDir, "solution.cpp");
  fs.writeFileSync(
    subsetSumFile,
    `class Solution {
public:
  int countSubsetSum(vector<int>& nums, int target) {
    int count = 0;
    int totalMasks = 1 << nums.size();
    for (int mask = 0; mask < totalMasks; mask++) {
      int sum = 0;
      for (int index = 0; index < (int)nums.size(); index++) {
        if ((mask & (1 << index)) != 0) sum += nums[index];
      }
      if (sum == target) count++;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const visitedCitiesDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-visited-cities-"));
  const visitedCitiesFile = path.join(visitedCitiesDir, "solution.cpp");
  fs.writeFileSync(
    visitedCitiesFile,
    `class Solution {
public:
  int countDistinctVisitedCities(vector<int>& cities) {
    int mask = 0;
    for (int city : cities) mask |= (1 << city);
    int count = 0;
    while (mask != 0) {
      mask &= (mask - 1);
      count++;
    }
    return count;
  }
};
`,
    "utf-8"
  );

  const checkResult = runCppSubmission(checkProblem, checkFile);
  const setQueriesResult = runCppSubmission(setQueriesProblem, setQueriesFile);
  const toggleRangeResult = runCppSubmission(toggleRangeProblem, toggleRangeFile);
  const singleNumberTwoResult = runCppSubmission(singleNumberTwoProblem, singleNumberTwoFile);
  const repeatMissingResult = runCppSubmission(repeatMissingProblem, repeatMissingFile);
  const missingBucketsResult = runCppSubmission(missingBucketsProblem, missingBucketsFile);
  const subsetSumResult = runCppSubmission(subsetSumProblem, subsetSumFile);
  const visitedCitiesResult = runCppSubmission(visitedCitiesProblem, visitedCitiesFile);
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

test("cpp function harness supports subsets, assignment-mask, reverse-bits, and maximum-xor contracts", { skip: !compilerAvailable }, () => {
  const subsetsProblem = getProblemById("bit-028");
  const assignmentProblem = getProblemById("bit-031");
  const reverseBitsProblem = getProblemById("bit-034");
  const maxXorProblem = getProblemById("bit-037");
  assert.ok(subsetsProblem);
  assert.ok(assignmentProblem);
  assert.ok(reverseBitsProblem);
  assert.ok(maxXorProblem);

  const subsetsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-subsets-"));
  const subsetsFile = path.join(subsetsDir, "solution.cpp");
  fs.writeFileSync(
    subsetsFile,
    `class Solution {
public:
  vector<vector<int>> subsets(vector<int>& nums) {
    vector<vector<int>> answer;
    int totalMasks = 1 << nums.size();
    for (int mask = 0; mask < totalMasks; mask++) {
      vector<int> subset;
      for (int index = 0; index < (int)nums.size(); index++) {
        if ((mask & (1 << index)) != 0) subset.push_back(nums[index]);
      }
      answer.push_back(subset);
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const assignmentDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-assignments-"));
  const assignmentFile = path.join(assignmentDir, "solution.cpp");
  fs.writeFileSync(
    assignmentFile,
    `class Solution {
public:
  int countAssignments(vector<vector<int>>& availability) {
    int n = (int)availability.size();
    vector<int> memo(1 << n, -1);
    return dfs(0, availability, memo);
  }

private:
  int dfs(int mask, vector<vector<int>>& availability, vector<int>& memo) {
    int n = (int)availability.size();
    int task = __builtin_popcount((unsigned)mask);
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
};
`,
    "utf-8"
  );

  const reverseBitsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-reverse-bits-"));
  const reverseBitsFile = path.join(reverseBitsDir, "solution.cpp");
  fs.writeFileSync(
    reverseBitsFile,
    `class Solution {
public:
  int reverseBits(int n) {
    unsigned value = (unsigned)n;
    unsigned answer = 0;
    for (int i = 0; i < 32; i++) {
      answer <<= 1;
      answer |= (value & 1U);
      value >>= 1;
    }
    return (int)answer;
  }
};
`,
    "utf-8"
  );

  const maxXorDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-bit-max-xor-"));
  const maxXorFile = path.join(maxXorDir, "solution.cpp");
  fs.writeFileSync(
    maxXorFile,
    `class Solution {
public:
  int maximumXorPair(vector<int>& nums) {
    int answer = 0;
    for (int i = 0; i < (int)nums.size(); i++) {
      for (int j = i + 1; j < (int)nums.size(); j++) {
        answer = max(answer, nums[i] ^ nums[j]);
      }
    }
    return answer;
  }
};
`,
    "utf-8"
  );

  const subsetsResult = runCppSubmission(subsetsProblem, subsetsFile);
  const assignmentResult = runCppSubmission(assignmentProblem, assignmentFile);
  const reverseBitsResult = runCppSubmission(reverseBitsProblem, reverseBitsFile);
  const maxXorResult = runCppSubmission(maxXorProblem, maxXorFile);
  assert.equal(subsetsResult.compileSucceeded, true);
  assert.equal(subsetsResult.passedCount, subsetsResult.totalCount);
  assert.equal(assignmentResult.compileSucceeded, true);
  assert.equal(assignmentResult.passedCount, assignmentResult.totalCount);
  assert.equal(reverseBitsResult.compileSucceeded, true);
  assert.equal(reverseBitsResult.passedCount, reverseBitsResult.totalCount);
  assert.equal(maxXorResult.compileSucceeded, true);
  assert.equal(maxXorResult.passedCount, maxXorResult.totalCount);
});

test("cpp runner reports compiler errors", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-fail-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(filePath, "int main() { this does not compile; }", "utf-8");

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, false);
  assert.ok(result.compileError);
});

test("cpp runner supports custom input", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-custom-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <iostream>
using namespace std;
int main() {
  string name;
  int n;
  cin >> name >> n;
  for (int i = 0; i < n; ++i) cout << name;
}
`,
    "utf-8"
  );

  const result = runCppWithCustomInput(problem, filePath, "Alex\n2\n");
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.actualOutput, "AlexAlex");
});

test("cpp runner normalizes bits/stdc++.h for Apple Clang compatibility", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-portable-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <bits/stdc++.h>
using namespace std;
int main() {
  string name;
  int n;
  cin >> name >> n;
  for (int i = 0; i < n; ++i) {
    if (i > 0) cout << "\\n";
    cout << name;
  }
}
`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp runner stops infinite loops", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-timeout-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(filePath, `int main() { while (true) { asm volatile("" ::: "memory"); } }`, "utf-8");

  const result = runCppWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.timedOut, true);
  assert.equal(result.resourceLimit, "time");
});

test("cpp runner stops excessive output", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("rec-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-runner-output-"));
  const filePath = path.join(tempDir, "main.cpp");
  fs.writeFileSync(
    filePath,
    `#include <iostream>
    int main() { while (true) std::cout << "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; }`,
    "utf-8"
  );

  const result = runCppWithCustomInput(problem, filePath, "");
  assert.equal(result.compileSucceeded, false);
  assert.equal(result.outputLimitExceeded, true);
  assert.equal(result.resourceLimit, "output");
});

test("cpp function harness provides linked-list types and driver", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-runner-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      Node* reverse(Node* head) {
        Node* previous = nullptr;
        Node* current = head;
        while (current != nullptr) {
          Node* next = current->next;
          current->next = previous;
          previous = current;
          current = next;
        }
        return previous;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports linked-list length", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("ll-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-length-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int length(Node* head) {
        int count = 0;
        for (Node* current = head; current != nullptr; current = current->next) ++count;
        return count;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports array scalar returns", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("arr-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-array-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int findMaximum(vector<int>& nums) {
        int answer = nums[0];
        for (int value : nums) answer = max(answer, value);
        return answer;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness provides TreeNode and executes recursive height", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("tr-005");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-tree-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int height(TreeNode* root) {
        if (root == nullptr) return 0;
        return 1 + max(height(root->left), height(root->right));
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports queue prefix reversal", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("q-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-queue-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      vector<int> reverseFirstK(vector<int>& values, int k) {
        reverse(values.begin(), values.begin() + k);
        return values;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports binary search contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-binary-search-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int search(vector<int>& values, int target) {
        int left = 0, right = static_cast<int>(values.size()) - 1;
        while (left <= right) {
          int middle = left + (right - left) / 2;
          if (values[middle] == target) return middle;
          if (values[middle] < target) left = middle + 1;
          else right = middle - 1;
        }
        return -1;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp graph harness provides adjacency construction", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("gr-003");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-graph-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      vector<int> bfs(int n, const vector<vector<int>>& graph) {
        vector<int> order;
        vector<bool> visited(n, false);
        queue<int> nodes;
        nodes.push(0);
        visited[0] = true;
        while (!nodes.empty()) {
          int node = nodes.front();
          nodes.pop();
          order.push_back(node);
          for (int next : graph[node]) {
            if (!visited[next]) {
              visited[next] = true;
              nodes.push(next);
            }
          }
        }
        return order;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});

test("cpp function harness supports DP scalar contracts", { skip: !compilerAvailable }, () => {
  const problem = getProblemById("dp-001");
  assert.ok(problem);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-cpp-function-dp-"));
  const filePath = path.join(tempDir, "solution.cpp");
  fs.writeFileSync(
    filePath,
    `class Solution {
    public:
      int fibonacci(int n) {
        if (n <= 1) return n;
        int previous = 0, current = 1;
        for (int value = 2; value <= n; ++value) {
          int next = previous + current;
          previous = current;
          current = next;
        }
        return current;
      }
    };`,
    "utf-8"
  );

  const result = runCppSubmission(problem, filePath);
  assert.equal(result.compileSucceeded, true);
  assert.equal(result.passedCount, result.totalCount);
});
