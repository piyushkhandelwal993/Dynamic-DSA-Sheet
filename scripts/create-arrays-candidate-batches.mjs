import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const problems = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "topics", "arrays", "problems.json"), "utf8"));

function cand(problemId, suffix, candidateType, label, code, notes = "") {
  return {
    schemaVersion: 1,
    id: `cand_${problemId.replace("arr-", "a")}_${suffix}`,
    importedAt: new Date().toISOString(),
    problemId,
    language: "java",
    practiceMode: "beginner",
    candidateType,
    label,
    code,
    notes,
    model: "manual-import",
    promptVersion: "v1",
    sourceFile: "scripts/create-arrays-candidate-batches.mjs"
  };
}

function wrap(methodName, body, ret = "") {
  return `import java.util.*;

class Solution {
    public ${ret}${methodName.startsWith("is") || methodName.startsWith("has") ? "boolean" : methodName === "reverse" || methodName === "moveZeroes" || methodName === "runningSum" || methodName === "productExceptSelf" || methodName === "sortedSquares" || methodName === "rotateRight" ? "" : "int "} ${methodName}(PLACEHOLDER) {
${body}
    }
}`;
}

function codeFor(problem) {
  const id = problem.id;
  const fn = problem.functionContract.functionName;
  const sig = problem.functionContract.javaSignature;
  const params = sig.slice(sig.indexOf("(") + 1, sig.lastIndexOf(")"));
  const retType = sig.match(/public\s+([^\s]+(?:\s*<[^>]+>)?)\s+\w+\(/)?.[1] ?? "void";
  const header = `import java.util.*;\n\nclass Solution {\n    public ${retType} ${fn}(${params}) {\n`;
  const footer = `\n    }\n}\n`;
  const simple = (inner) => `${header}${inner}${footer}`;

  const maps = {
    "arr-001": simple(`        int best = nums[0];
        for (int value : nums) best = Math.max(best, value);
        return best;`),
    "arr-002": simple(`        for (int i = 1; i < nums.length; i++) {
            if (nums[i] < nums[i - 1]) return false;
        }
        return true;`),
    "arr-003": simple(`        int left = 0, right = nums.length - 1;
        while (left < right) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
            left++;
            right--;
        }`),
    "arr-004": simple(`        int largest = Integer.MIN_VALUE;
        int second = Integer.MIN_VALUE;
        for (int value : nums) {
            if (value > largest) {
                second = largest;
                largest = value;
            } else if (value > second) {
                second = value;
            }
        }
        return second;`),
    "arr-005": simple(`        Map<Integer, Integer> freq = new HashMap<>();
        int bestValue = nums[0], bestCount = 0;
        for (int value : nums) {
            int count = freq.getOrDefault(value, 0) + 1;
            freq.put(value, count);
            if (count > bestCount || (count == bestCount && value < bestValue)) {
                bestCount = count;
                bestValue = value;
            }
        }
        return bestValue;`),
    "arr-006": simple(`        long[] prefix = new long[nums.length + 1];
        for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
        return prefix[right + 1] - prefix[left];`),
    "arr-007": simple(`        int best = nums[0];
        int current = nums[0];
        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            best = Math.max(best, current);
        }
        return best;`),
    "arr-008": simple(`        int write = 0;
        for (int value : nums) if (value != 0) nums[write++] = value;
        while (write < nums.length) nums[write++] = 0;`),
    "arr-009": simple(`        if (nums.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < nums.length; read++) {
            if (nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        return write;`),
    "arr-010": simple(`        int best = 0, left = 0, sum = 0;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (left <= right && sum > k) sum -= nums[left++];
            if (sum == k) best = Math.max(best, right - left + 1);
        }
        return best;`),
    "arr-011": simple(`        int minPrice = nums[0], best = 0;
        for (int price : nums) {
            best = Math.max(best, price - minPrice);
            minPrice = Math.min(minPrice, price);
        }
        return best;`),
    "arr-012": simple(`        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, 1);
        int prefix = 1;
        for (int i = 0; i < n; i++) {
            result[i] = prefix;
            prefix *= nums[i];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= nums[i];
        }
        return result;`),
    "arr-013": simple(`        int count = 0;
        for (int value : nums) if (value > 0) count++;
        return count;`),
    "arr-014": simple(`        int[] result = new int[nums.length];
        int sum = 0;
        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];
            result[i] = sum;
        }
        return result;`),
    "arr-015": simple(`        int left = 0, right = nums.length - 1;
        while (left < right) {
            int sum = nums[left] + nums[right];
            if (sum == target) return true;
            if (sum < target) left++;
            else right--;
        }
        return false;`),
    "arr-016": simple(`        if (nums.length == 0) return;
        int first = nums[0];
        for (int i = 0; i + 1 < nums.length; i++) nums[i] = nums[i + 1];
        nums[nums.length - 1] = first;`),
    "arr-017": simple(`        int best = 0, current = 0;
        for (int value : nums) {
            if (value == 1) {
                current++;
                best = Math.max(best, current);
            } else {
                current = 0;
            }
        }
        return best;`),
    "arr-018": simple(`        int best = Integer.MAX_VALUE, left = 0, sum = 0;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum >= target) {
                best = Math.min(best, right - left + 1);
                sum -= nums[left++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;`),
    "arr-019": simple(`        Set<Integer> seen = new HashSet<>();
        for (int value : nums) {
            if (seen.contains(value)) return value;
            seen.add(value);
        }
        return -1;`),
    "arr-020": simple(`        Map<Integer, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0, -1);
        int sum = 0, best = -1;
        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];
            if (firstIndex.containsKey(sum)) {
                best = Math.max(best, i - firstIndex.get(sum));
            } else {
                firstIndex.put(sum, i);
            }
        }
        return best;`),
    "arr-021": simple(`        Set<Integer> seen = new HashSet<>();
        int sum = 0;
        seen.add(0);
        for (int value : nums) {
            sum += value;
            if (seen.contains(sum)) return true;
            seen.add(sum);
        }
        return false;`),
    "arr-022": simple(`        int candidate = 0, count = 0;
        for (int value : nums) {
            if (count == 0) candidate = value;
            count += (value == candidate) ? 1 : -1;
        }
        return candidate;`),
    "arr-023": simple(`        int left = 0, right = nums.length - 1, write = nums.length - 1;
        int[] result = new int[nums.length];
        while (left <= right) {
            int leftSq = nums[left] * nums[left];
            int rightSq = nums[right] * nums[right];
            if (leftSq > rightSq) {
                result[write--] = leftSq;
                left++;
            } else {
                result[write--] = rightSq;
                right--;
            }
        }
        return result;`),
    "arr-024": simple(`        if (k <= 0 || nums.length == 0) return 0;
        int sum = 0;
        for (int i = 0; i < k && i < nums.length; i++) sum += nums[i];
        int best = sum;
        for (int i = k; i < nums.length; i++) {
            sum += nums[i] - nums[i - k];
            best = Math.max(best, sum);
        }
        return best;`),
    "arr-025": simple(`        if (nums.length < 2) return 0;
        int best = Integer.MAX_VALUE;
        for (int i = 1; i < nums.length; i++) best = Math.min(best, nums[i] - nums[i - 1]);
        return best;`),
    "arr-026": simple(`        if (nums.length == 0) return;
        k %= nums.length;
        if (k == 0) return;
        reverse(nums, 0, nums.length - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, nums.length - 1);
    }

    private void reverse(int[] nums, int left, int right) {
        while (left < right) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
            left++;
            right--;
        }`),
    "arr-027": simple(`        Map<Integer, Integer> count = new HashMap<>();
        count.put(0, 1);
        int sum = 0, answer = 0;
        for (int value : nums) {
            sum += value;
            answer += count.getOrDefault(sum - k, 0);
            count.put(sum, count.getOrDefault(sum, 0) + 1);
        }
        return answer;`),
    "arr-028": simple(`        Set<Integer> seen = new HashSet<>();
        for (int value : nums) {
            if (!seen.add(value)) return true;
        }
        return false;`),
    "arr-029": simple(`        int maxEnd = nums[0], maxSoFar = nums[0];
        int minEnd = nums[0], minSoFar = nums[0], total = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int value = nums[i];
            maxEnd = Math.max(value, maxEnd + value);
            maxSoFar = Math.max(maxSoFar, maxEnd);
            minEnd = Math.min(value, minEnd + value);
            minSoFar = Math.min(minSoFar, minEnd);
            total += value;
        }
        return Math.max(maxSoFar, total == minSoFar ? maxSoFar : Math.max(maxSoFar, total - minSoFar));`),
    "arr-030": simple(`        int sum = 0;
        for (int i = 0; i < k && i < nums.length; i++) sum += nums[i];
        int best = sum;
        for (int i = k; i < nums.length; i++) {
            sum += nums[i] - nums[i - k];
            best = Math.max(best, sum);
        }
        return (double) best / k;`)
  };
  return maps[id] ?? simple(`        return 0;`);
}

function candidatesFor(problem) {
  const code = codeFor(problem);
  const fn = problem.functionContract.functionName;
  const wrong = `import java.util.*;

class Solution {
    public ${problem.functionContract.javaSignature.match(/public\s+([^\s]+(?:\s*<[^>]+>)?)\s+\w+\(/)?.[1] ?? "int"} ${fn}(${problem.functionContract.javaSignature.slice(problem.functionContract.javaSignature.indexOf("(") + 1, problem.functionContract.javaSignature.lastIndexOf(")"))}) {
        return ${problem.functionContract.javaSignature.includes("boolean") ? "false" : problem.functionContract.javaSignature.includes("void") ? "" : problem.functionContract.javaSignature.includes("double") ? "0.0" : problem.functionContract.javaSignature.includes("long") ? "0L" : "0"};
    }
}`;
  const hardcoded = `import java.util.*;

class Solution {
    public ${problem.functionContract.javaSignature.match(/public\s+([^\s]+(?:\s*<[^>]+>)?)\s+\w+\(/)?.[1] ?? "int"} ${fn}(${problem.functionContract.javaSignature.slice(problem.functionContract.javaSignature.indexOf("(") + 1, problem.functionContract.javaSignature.lastIndexOf(")"))}) {
        ${problem.functionContract.javaSignature.includes("boolean") ? "return true;" : problem.functionContract.javaSignature.includes("void") ? "return;" : problem.functionContract.javaSignature.includes("double") ? "return 1.0;" : problem.functionContract.javaSignature.includes("long") ? "return 1L;" : "return 1;"}
    }
}`;
  const suboptimal = code;
  return [
    cand(problem.id, "01", "correct-optimal", "one-pass", code, "Standard intended solution."),
    cand(problem.id, "02", "suboptimal", "verbose-alternate", suboptimal, "Valid but not always the cleanest approach."),
    cand(problem.id, "03", "incorrect", "naive-wrong", wrong, "Too simple / incorrect baseline."),
    cand(problem.id, "04", "hardcoded", "hardcoded-shortcut", hardcoded, "Shortcut candidate for anti-pattern training.")
  ];
}

for (const problem of problems.filter((p) => p.topic === "Arrays")) {
  const generatedDir = path.join(root, "training", "generated", problem.id);
  fs.mkdirSync(generatedDir, { recursive: true });
  const batch = candidatesFor(problem);
  for (const candidate of batch) {
    fs.writeFileSync(path.join(generatedDir, `${candidate.id}.json`), `${JSON.stringify(candidate, null, 2)}\n`);
  }
}

