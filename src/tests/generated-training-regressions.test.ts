import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { getProblemById } from "../services/storage";

// Auto-generated from training/exports/reviewed-regressions.json
// Cases without expectedFacts/forbiddenFacts remain todo until reviewed further.

test("reviewed regression arr-002 · cand_d981eaf82461 (concept-detector)", () => {
  const problem = getProblemById("arr-002");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public boolean isSorted(int[] nums) {\n        int previous = nums[0];\n\n        for (int i = 1; i < nums.length; i++) {\n            if (nums[i] < previous) {\n                return false;\n            }\n            previous = nums[i];\n        }\n\n        return true;\n    }\n}");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("adjacent-order-check"), true, "Expected fact adjacent-order-check to be detected");
});

test("reviewed regression bit-015 · cand_04fe0d087d05 (concept-detector)", () => {
  const problem = getProblemById("bit-015");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int invertBits(int n) {\n        int result = n;\n\n        for (int position = 0; position < Integer.SIZE; position++) {\n            if (((result >> position) & 1) == 1) {\n                result &= ~(1 << position);\n            } else {\n                result |= (1 << position);\n            }\n        }\n\n        return result;\n    }\n}");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("bitwise-not"), true, "Expected fact bitwise-not to be detected");
  assert.equal(factIds.has("bit-hardcoding"), false, "Forbidden fact bit-hardcoding should not be detected");
});

test("reviewed regression ll-008 · cand_7438d974c414 (execution-or-template)", () => {
  const problem = getProblemById("ll-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\npublic class Main {\n    static class Node {\n        int data;\n        Node next;\n        Node(int data) { this.data = data; }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        Node[] nodes = new Node[n];\n        for (int i = 0; i < n; i++) {\n            nodes[i] = new Node(sc.nextInt());\n        }\n        int pos = sc.nextInt();\n        Node head = n == 0 ? null : nodes[0];\n        for (int i = 0; i + 1 < n; i++) {\n            nodes[i].next = nodes[i + 1];\n        }\n        if (n > 0 && pos > 0) {\n            nodes[n - 1].next = nodes[pos - 1];\n        }\n        Node slow = head;\n        Node fast = head;\n        boolean cycle = false;\n        while (fast != null && fast.next != null) {\n            slow = slow.next;\n            fast = fast.next.next;\n            if (slow != null && fast != null && slow.data == fast.data) {\n                cycle = true;\n                break;\n            }\n        }\n        System.out.println(cycle ? \"Cycle\" : \"No Cycle\");\n        sc.close();\n    }\n}");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("fast-slow-pointers"), true, "Expected fact fast-slow-pointers to be detected");
  assert.equal(factIds.has("linked-list-cycle-detection"), false, "Forbidden fact linked-list-cycle-detection should not be detected");
});

test("reviewed regression q-008 · cand_ba6875efaa4f (concept-detector)", () => {
  const problem = getProblemById("q-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        int[] values = new int[n];\n        for (int i = 0; i < n; i++) {\n            values[i] = sc.nextInt();\n        }\n        Deque<Integer> deque = new ArrayDeque<>();\n        List<Integer> answer = new ArrayList<>();\n        for (int i = 0; i < n; i++) {\n            while (!deque.isEmpty() && values[deque.peekLast()] <= values[i]) {\n                deque.pollLast();\n            }\n            deque.offerLast(i);\n            if (i >= k - 1) {\n                answer.add(values[deque.peekFirst()]);\n            }\n        }\n        StringBuilder out = new StringBuilder();\n        for (int i = 0; i < answer.size(); i++) {\n            if (i > 0) out.append(' ');\n            out.append(answer.get(i));\n        }\n        System.out.println(out);\n        sc.close();\n    }\n}");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("sliding-window-queue"), false, "Forbidden fact sliding-window-queue should not be detected");
});

test("reviewed regression rec-003 · cand_3555790adebb (failed-tests-high-concept-score)", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int factorial(int n) {\n        if (n <= 1) {\n            return 1;\n        }\n        return factorial(n - 1);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
});

test("reviewed regression rec-003 · cand_8f1e72128a9a (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int factorial(int n) {\n        int answer = 1;\n        for (int value = 2; value <= n; value++) {\n            answer *= value;\n        }\n        return answer;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
});

test("reviewed regression rec-003 · cand_c08211711faf (needs-investigation)", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int factorial(int n) {\n        if (n == 0 || n == 1) {\n            return 1;\n        }\n        if (n == 2) {\n            return 2;\n        }\n        if (n == 3) {\n            return 6;\n        }\n        return n;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
});

test("reviewed regression rec-004 · cand_04a675a68349 (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-004");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int sumFirstN(int n) {\n        if (n == 1) return 1;\n        if (n == 2) return 3;\n        if (n == 3) return 6;\n        if (n == 4) return 10;\n        return n * 2;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("parameterized-recursion"), false, "Forbidden fact parameterized-recursion should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-004 · cand_1e51b5069976 (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-004");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int sumFirstN(int n) {\n        int sum = 0;\n        for (int value = 1; value <= n; value++) {\n            sum += value;\n        }\n        return sum;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("parameterized-recursion"), false, "Forbidden fact parameterized-recursion should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-004 · cand_8417ed1eb85e (failed-tests-high-concept-score)", () => {
  const problem = getProblemById("rec-004");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int sumFirstN(int n) {\n        if (n <= 1) {\n            return 1;\n        }\n        return n + sumFirstN(n - 1);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-006 · cand_3ccf3f9301fa (needs-investigation)", () => {
  const problem = getProblemById("rec-006");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int fibonacci(int n) {\n        if (n <= 1) {\n            return n;\n        }\n        return fibonacci(n - 1);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("tree-recursion"), false, "Forbidden fact tree-recursion should not be detected");
});

test("reviewed regression rec-006 · cand_570d9b4b01ae (needs-investigation)", () => {
  const problem = getProblemById("rec-006");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int fibonacci(int n) {\n        if (n == 0) return 0;\n        if (n == 1) return 1;\n        if (n == 2) return 1;\n        if (n == 3) return 2;\n        if (n == 4) return 3;\n        return n;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("tree-recursion"), false, "Forbidden fact tree-recursion should not be detected");
});

test("reviewed regression rec-006 · cand_b8284d12bf17 (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-006");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int fibonacci(int n) {\n        if (n <= 1) {\n            return n;\n        }\n        int prev = 0;\n        int curr = 1;\n        for (int i = 2; i <= n; i++) {\n            int next = prev + curr;\n            prev = curr;\n            curr = next;\n        }\n        return curr;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("tree-recursion"), false, "Forbidden fact tree-recursion should not be detected");
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
});

test("reviewed regression rec-007 · cand_50719e3b550d (needs-investigation)", () => {
  const problem = getProblemById("rec-007");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public boolean palindrome(String s) {\n        if (s.equals(\"a\") || s.equals(\"aa\") || s.equals(\"aba\") || s.equals(\"abba\")) {\n            return true;\n        }\n        if (s.equals(\"ab\") || s.equals(\"abc\")) {\n            return false;\n        }\n        return s.length() < 2;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), false, "Forbidden fact recursion-on-strings should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-007 · cand_7ca334a6d6d4 (failed-tests-high-concept-score)", () => {
  const problem = getProblemById("rec-007");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public boolean palindrome(String s) {\n        return check(s, 0, s.length() - 1);\n    }\n\n    private boolean check(String s, int left, int right) {\n        if (left >= right) {\n            return true;\n        }\n        if (s.charAt(left) != s.charAt(right)) {\n            return false;\n        }\n        return check(s, left + 1, right);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), true, "Expected fact recursion-on-strings to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-007 · cand_bc01e0d55287 (needs-investigation)", () => {
  const problem = getProblemById("rec-007");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public boolean palindrome(String s) {\n        int left = 0;\n        int right = s.length() - 1;\n        while (left < right) {\n            if (s.charAt(left) != s.charAt(right)) {\n                return false;\n            }\n            left++;\n            right--;\n        }\n        return true;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), false, "Forbidden fact recursion-on-strings should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-008 · cand_10181d64c865 (failed-tests-high-concept-score)", () => {
  const problem = getProblemById("rec-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public String reverseString(String s) {\n        if (s.length() <= 1) {\n            return s;\n        }\n        return reverseString(s.substring(1));\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), true, "Expected fact recursion-on-strings to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-008 · cand_c9020b7230b0 (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public String reverseString(String s) {\n        StringBuilder builder = new StringBuilder();\n        for (int i = s.length() - 1; i >= 0; i--) {\n            builder.append(s.charAt(i));\n        }\n        return builder.toString();\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), false, "Forbidden fact recursion-on-strings should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-008 · cand_edfe437bc015 (passed-tests-but-concept-miss)", () => {
  const problem = getProblemById("rec-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public String reverseString(String s) {\n        if (s.equals(\"a\")) return \"a\";\n        if (s.equals(\"ab\")) return \"ba\";\n        if (s.equals(\"abc\")) return \"cba\";\n        return new StringBuilder(s).reverse().toString();\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("recursion-on-strings"), false, "Forbidden fact recursion-on-strings should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-009 · cand_1f7e88b3a2ec (correctness)", () => {
  const problem = getProblemById("rec-009");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int sumDigits(int n) {\n        if (n == 0) {\n            return 0;\n        }\n        return (n % 10) + sumDigits(n - 1);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-009 · cand_f0e35341bcfe (concept-detector)", () => {
  const problem = getProblemById("rec-009");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int sumDigits(int n) {\n        int sum = 0;\n        while (n > 0) {\n            sum += n % 10;\n            n /= 10;\n        }\n        return sum;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
});

test("reviewed regression rec-010 · cand_aa236062ac25 (concept-detector)", () => {
  const problem = getProblemById("rec-010");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int countDigits(int n) {\n        int count = 0;\n        do {\n            count++;\n            n /= 10;\n        } while (n > 0);\n        return count;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-010 · cand_be381679fb14 (concept-detector)", () => {
  const problem = getProblemById("rec-010");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int countDigits(int n) {\n        if (n < 10) return 1;\n        if (n < 100) return 2;\n        if (n < 1000) return 3;\n        if (n < 10000) return 4;\n        if (n < 100000) return 5;\n        return 6;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("base-case"), false, "Forbidden fact base-case should not be detected");
  assert.equal(factIds.has("functional-recursion"), false, "Forbidden fact functional-recursion should not be detected");
});

test("reviewed regression rec-010 · cand_eddcb0b75326 (correctness)", () => {
  const problem = getProblemById("rec-010");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int countDigits(int n) {\n        if (n < 10) {\n            return 1;\n        }\n        return 1 + countDigits(n - 1);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-012 · cand_8ff166356b84 (correctness)", () => {
  const problem = getProblemById("rec-012");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int gcd(int a, int b) {\n        if (b == 0) {\n            return a;\n        }\n        return gcd(b, a % b);\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("functional-recursion"), true, "Expected fact functional-recursion to be detected");
  assert.equal(factIds.has("base-case"), true, "Expected fact base-case to be detected");
  assert.equal(factIds.has("recursive-progress"), false, "Forbidden fact recursive-progress should not be detected");
});

test("reviewed regression rec-012 · cand_a277d4667d72 (concept-detector)", () => {
  const problem = getProblemById("rec-012");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\n\nclass Solution {\n    public int gcd(int a, int b) {\n        while (b != 0) {\n            int temp = a % b;\n            a = b;\n            b = temp;\n        }\n        return a;\n    }\n}\n");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("memoization"), false, "Forbidden fact memoization should not be detected");
  assert.equal(factIds.has("tree-recursion"), false, "Forbidden fact tree-recursion should not be detected");
});

test("reviewed regression st-009 · cand_4d89191498a1 (concept-detector)", () => {
  const problem = getProblemById("st-009");
  assert.ok(problem);
  const facts = analyzeCodeFacts("java", "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] values = new int[n];\n        for (int i = 0; i < n; i++) {\n            values[i] = sc.nextInt();\n        }\n        int[] answer = new int[n];\n        Deque<Integer> stack = new ArrayDeque<>();\n        for (int i = 0; i < n; i++) {\n            while (!stack.isEmpty() && stack.peek() <= values[i]) {\n                stack.pop();\n            }\n            answer[i] = stack.isEmpty() ? -1 : stack.peek();\n            stack.push(values[i]);\n        }\n        StringBuilder out = new StringBuilder();\n        for (int i = 0; i < n; i++) {\n            if (i > 0) out.append(' ');\n            out.append(answer[i]);\n        }\n        System.out.println(out);\n        sc.close();\n    }\n}");
  const factIds = new Set([
    ...facts.structures,
    ...facts.controlFlow,
    ...facts.dataStructures,
    ...facts.algorithms,
    ...facts.complexitySignals,
    ...facts.edgeCaseSignals,
    ...facts.antiPatterns
  ].map((fact) => fact.id));
  assert.equal(factIds.has("next-greater-element"), false, "Forbidden fact next-greater-element should not be detected");
});
