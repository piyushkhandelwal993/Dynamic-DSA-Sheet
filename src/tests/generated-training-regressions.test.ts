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

test.todo("reviewed regression ll-008 · cand_7438d974c414 (execution-or-template) requires expectedFacts or forbiddenFacts");

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
