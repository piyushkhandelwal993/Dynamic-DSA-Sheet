import { FunctionContract, Problem } from "../types";
import { PORTABLE_CPP_HEADERS } from "./cppSupport";

function requireFunctionContract(problem: Problem): FunctionContract {
  if (!problem.functionContract) {
    throw new Error(`Function contract is missing for ${problem.id}.`);
  }
  return problem.functionContract;
}

export function usesFunctionHarness(problem: Problem): boolean {
  return Boolean(problem.functionContract && problem.solutionMode !== "complete-program");
}

function javaMethodStub(contract: FunctionContract): string {
  switch (contract.driverStrategy) {
    case "linked-list-length":
      return `        return 0;`;
    case "linked-list-search":
      return `        return false;`;
    case "linked-list-reverse":
    case "linked-list-insert-head":
    case "linked-list-insert-tail":
    case "linked-list-delete-position":
    case "linked-list-merge-sorted":
    case "linked-list-remove-duplicates":
      return `        return head;`;
    case "linked-list-middle-value":
      return `        return 0;`;
    case "linked-list-cycle-detect":
      return `        return false;`;
    case "array-sorted-check":
      return `        return false;`;
    case "array-maximum":
    case "tree-height":
    case "tree-diameter":
    case "tree-balanced-check":
    case "tree-bst-search":
    case "tree-left-view":
    case "tree-bst-insert":
    case "tree-bst-delete":
    case "tree-top-view":
    case "tree-lca":
    case "tree-build-from-traversals":
    case "tree-serialize-level-order":
      return `        return 0;`;
    case "array-second-largest":
    case "array-highest-frequency":
    case "array-max-subarray":
    case "array-min-subarray-len":
    case "array-first-repeating":
    case "array-equilibrium-index":
    case "array-majority-element":
    case "array-remove-duplicates":
    case "array-longest-sum-k-positive":
    case "array-stock-profit":
    case "array-max-window-sum":
    case "array-min-adjacent-diff":
    case "array-count-positive":
    case "array-max-consecutive-ones":
    case "array-max-circular-subarray":
    case "bit-count-odd-array":
    case "bit-single-number":
    case "bit-missing-number":
    case "bit-clear-rightmost-set-bit":
    case "bit-set-query-batch":
    case "bit-subset-sum-count":
    case "bit-assignment-mask-count":
    case "bit-reverse-bits":
    case "bit-max-xor-pair":
    case "bit-invert-all":
    case "bit-base10-complement":
      return `        return 0;`;
    case "array-pair-sum-sorted":
    case "array-zero-sum-exists":
    case "array-contains-duplicate":
      return `        return false;`;
    case "array-range-sum":
    case "array-count-subarrays-sum-k":
      return `        return 0L;`;
    case "array-max-average-window":
      return `        return 0.0;`;
    case "bit-binary-string":
      return `        return "";`;
    case "array-product-except-self":
    case "array-sorted-squares":
    case "array-running-sum":
    case "bit-two-unique-numbers":
    case "bit-swap-two-numbers":
    case "bit-decode-xored-array":
    case "bit-count-bits-dp":
      return `        return new int[0];`;
    case "bit-generate-subsets":
      return `        return new ArrayList<>();`;
    case "array-left-rotate-one":
    case "array-right-rotate-k":
    case "array-move-zeroes":
    case "array-reverse":
      return `        // Write your code here.`;
    case "tree-preorder":
    case "tree-inorder":
    case "tree-postorder":
    case "tree-level-order":
    case "tree-diameter":
    case "tree-balanced-check":
    case "tree-bst-search":
    case "tree-left-view":
    case "tree-bst-insert":
    case "tree-bst-delete":
    case "tree-top-view":
    case "tree-lca":
    case "tree-build-from-traversals":
    case "tree-serialize-level-order":
      return `        return new ArrayList<>();`;
    case "stack-balanced-brackets":
    case "stack-validate-sequences":
    case "stack-backspace-compare":
      case "bit-odd-even":
      case "bit-power-of-two":
      case "bit-power-of-four":
      return `        return false;`;
    case "stack-process-queries":
    case "stack-min-stack-queries":
    case "stack-stock-span":
    case "stack-next-greater-right":
    case "stack-previous-smaller-left":
    case "stack-daily-temperatures":
    case "stack-circular-next-greater":
    case "stack-asteroid-collision":
    case "stack-next-smaller-right":
    case "stack-next-greater-reference":
    case "stack-online-stock-span":
      return `        return new int[0];`;
    case "stack-reverse-word":
    case "stack-remove-adjacent-duplicates":
    case "stack-infix-to-postfix":
    case "stack-simplify-path":
    case "stack-remove-adjacent-k":
    case "stack-postfix-to-infix":
    case "stack-remove-k-digits":
      return `        return "";`;
    case "stack-evaluate-postfix":
    case "stack-evaluate-prefix":
    case "stack-max-nesting-depth":
    case "stack-celebrity":
    case "stack-baseball-score":
      return `        return 0;`;
    case "stack-largest-rectangle":
    case "stack-subarray-minimums":
      return `        return 0L;`;
    case "stack-maximal-rectangle":
      return `        return 0;`;
    case "stack-redundant-brackets":
      return `        return false;`;
    case "queue-process-queries":
    case "queue-circular-queries":
      return `        return new int[0];`;
    case "queue-petrol-pump":
    case "queue-rotten-oranges":
    case "queue-shortest-subarray-at-least-k":
    case "queue-jump-game-vi":
    case "queue-task-scheduler":
      return `        return 0;`;
    case "queue-generate-binary":
    case "queue-first-non-repeating-stream":
    case "queue-dota2-senate":
      return `        return "";`;
    case "queue-sliding-window-maximum":
    case "queue-k-largest-elements":
      return `        return new int[0];`;
    case "queue-reverse-first-k":
      return `        return values;`;
    case "binary-search-exact":
      return `        return -1;`;
    case "binary-search-lower-bound":
    case "binary-search-search-insert":
    case "binary-search-rotated-search":
      return `        return -1;`;
    case "binary-search-first-last":
      return `        return new int[0];`;
    case "binary-search-min-rotated":
    case "binary-search-peak":
      return `        return 0;`;
    case "binary-search-floor-sqrt":
      return `        return 0L;`;
    case "binary-search-capacity-speed":
    case "binary-search-capacity-ship":
    case "binary-search-capacity-bouquets":
      return `        return 0;`;
    case "binary-search-median-two-arrays":
      return `        return 0.0;`;
    case "bit-xor-1-to-n":
    case "bit-check":
    case "bit-count-set-bits":
    case "bit-count-set-bits-kernighan":
    case "bit-clear-rightmost-set-bit":
    case "bit-hamming-distance":
    case "bit-toggle-range":
    case "bit-range-bitwise-and":
    case "bit-sum-without-plus":
    case "bit-min-bit-flips":
    case "bit-single-number":
    case "bit-missing-number":
    case "bit-invert-all":
    case "bit-base10-complement":
    case "bit-set":
    case "bit-clear":
    case "bit-toggle":
    case "bit-check-right-shift":
      return `        return 0;`;
    case "recursion-print-name-n-times":
    case "recursion-print-1-to-n":
    case "recursion-tower-of-hanoi":
    case "recursion-sudoku-solver":
      return `        // Write your code here.`;
    case "recursion-sum-first-n":
    case "recursion-power":
    case "recursion-fibonacci-number":
    case "recursion-count-digits":
    case "recursion-binary-search":
    case "recursion-gcd":
    case "recursion-josephus":
    case "recursion-climbing-stairs":
    case "recursion-tribonacci":
      return `        return 0;`;
    case "recursion-palindrome":
    case "recursion-subset-sum-exists":
      return `        return false;`;
    case "recursion-reverse-string":
      return `        return "";`;
    case "recursion-sum-digits":
      return `        return 0;`;
    case "recursion-generate-subsequences":
    case "recursion-combination-sum":
    case "recursion-generate-permutations":
      return `        return new ArrayList<>();`;
    case "recursion-merge-sort":
    case "recursion-quick-sort":
      return `        return new int[0];`;
    case "recursion-n-queens":
      return `        return new ArrayList<>();`;
    case "recursion-factorial":
    case "dp-fibonacci":
      return `        return 0;`;
    case "dp-climbing-stairs":
    case "dp-house-robber":
    case "dp-max-non-adjacent-sum":
    case "dp-min-cost-climbing-stairs":
    case "dp-unique-paths":
    case "dp-min-path-sum":
    case "dp-subset-sum":
    case "dp-knapsack-01":
    case "dp-coin-change-min-coins":
    case "dp-lis-length":
    case "dp-bitonic-subsequence":
    case "dp-lcs-length":
    case "dp-edit-distance":
    case "dp-matrix-chain-multiplication":
      return `        return 0;`;
    case "graph-bfs":
      return `        return new ArrayList<>();`;
    case "graph-build-adjacency-list":
    case "graph-dfs":
    case "graph-connected-components":
    case "graph-cycle-undirected":
    case "graph-cycle-directed":
    case "graph-num-islands":
    case "graph-shortest-path-binary-matrix":
    case "graph-topological-sort":
    case "graph-course-schedule":
    case "graph-shortest-path-unweighted":
    case "graph-number-of-provinces":
      return `        return new ArrayList<>();`;
    default:
      throw new Error(`Unsupported driver strategy: ${contract.driverStrategy}`);
  }
  throw new Error(`Unsupported driver strategy: ${contract.driverStrategy}`);
}

function cppMethodStub(contract: FunctionContract): string {
  switch (contract.driverStrategy) {
    case "linked-list-length":
      return `        return 0;`;
    case "linked-list-search":
      return `        return false;`;
    case "linked-list-reverse":
    case "linked-list-insert-head":
    case "linked-list-insert-tail":
    case "linked-list-delete-position":
    case "linked-list-merge-sorted":
    case "linked-list-remove-duplicates":
      return `        return head;`;
    case "linked-list-middle-value":
      return `        return 0;`;
    case "linked-list-cycle-detect":
      return `        return false;`;
    case "array-sorted-check":
      return `        return false;`;
    case "array-maximum":
    case "tree-height":
      return `        return 0;`;
    case "array-second-largest":
    case "array-highest-frequency":
    case "array-max-subarray":
    case "array-min-subarray-len":
    case "array-first-repeating":
    case "array-equilibrium-index":
    case "array-majority-element":
    case "array-remove-duplicates":
    case "array-longest-sum-k-positive":
    case "array-stock-profit":
    case "array-max-window-sum":
    case "array-min-adjacent-diff":
    case "array-count-positive":
    case "array-max-consecutive-ones":
    case "array-max-circular-subarray":
    case "bit-count-odd-array":
    case "bit-single-number":
    case "bit-missing-number":
    case "bit-clear-rightmost-set-bit":
    case "bit-set-query-batch":
    case "bit-subset-sum-count":
    case "bit-assignment-mask-count":
    case "bit-reverse-bits":
    case "bit-max-xor-pair":
    case "bit-invert-all":
    case "bit-base10-complement":
      return `        return 0;`;
    case "array-pair-sum-sorted":
    case "array-zero-sum-exists":
    case "array-contains-duplicate":
      return `        return false;`;
    case "array-range-sum":
    case "array-count-subarrays-sum-k":
      return `        return 0LL;`;
    case "array-max-average-window":
      return `        return 0.0;`;
    case "bit-binary-string":
      return `        return "";`;
    case "array-product-except-self":
    case "array-sorted-squares":
    case "array-running-sum":
    case "bit-two-unique-numbers":
    case "bit-swap-two-numbers":
    case "bit-decode-xored-array":
    case "bit-count-bits-dp":
      return `        return {};`;
    case "bit-generate-subsets":
      return `        return {};`;
    case "array-left-rotate-one":
    case "array-right-rotate-k":
    case "array-move-zeroes":
    case "array-reverse":
      return `        // Write your code here.`;
    case "tree-preorder":
      return `        return {};`;
    case "stack-balanced-brackets":
    case "stack-validate-sequences":
    case "stack-backspace-compare":
    case "bit-odd-even":
    case "bit-power-of-two":
    case "bit-power-of-four":
      return `        return false;`;
    case "stack-process-queries":
    case "stack-min-stack-queries":
    case "stack-stock-span":
    case "stack-next-greater-right":
    case "stack-previous-smaller-left":
    case "stack-daily-temperatures":
    case "stack-circular-next-greater":
    case "stack-asteroid-collision":
    case "stack-next-smaller-right":
    case "stack-next-greater-reference":
    case "stack-online-stock-span":
      return `        return {};`;
    case "stack-reverse-word":
    case "stack-remove-adjacent-duplicates":
    case "stack-infix-to-postfix":
    case "stack-simplify-path":
    case "stack-remove-adjacent-k":
    case "stack-postfix-to-infix":
    case "stack-remove-k-digits":
      return `        return "";`;
    case "stack-evaluate-postfix":
    case "stack-evaluate-prefix":
    case "stack-max-nesting-depth":
    case "stack-celebrity":
    case "stack-baseball-score":
      return `        return 0;`;
    case "stack-largest-rectangle":
    case "stack-subarray-minimums":
      return `        return 0LL;`;
    case "stack-maximal-rectangle":
      return `        return 0;`;
    case "stack-redundant-brackets":
      return `        return false;`;
    case "queue-process-queries":
    case "queue-circular-queries":
    case "queue-petrol-pump":
    case "queue-generate-binary":
    case "queue-rotten-oranges":
    case "queue-first-non-repeating-stream":
    case "queue-sliding-window-maximum":
    case "queue-shortest-subarray-at-least-k":
    case "queue-jump-game-vi":
    case "queue-k-largest-elements":
    case "queue-task-scheduler":
    case "queue-dota2-senate":
      return `        return {};`;
    case "queue-reverse-first-k":
      return `        return values;`;
    case "binary-search-exact":
      return `        return -1;`;
    case "binary-search-lower-bound":
    case "binary-search-search-insert":
    case "binary-search-rotated-search":
      return `        return -1;`;
    case "binary-search-first-last":
      return `        return {};`;
    case "binary-search-min-rotated":
    case "binary-search-peak":
      return `        return 0;`;
    case "binary-search-floor-sqrt":
      return `        return 0LL;`;
    case "binary-search-capacity-speed":
    case "binary-search-capacity-ship":
    case "binary-search-capacity-bouquets":
      return `        return 0;`;
    case "binary-search-median-two-arrays":
      return `        return 0.0;`;
    case "bit-xor-1-to-n":
    case "bit-check":
    case "bit-count-set-bits":
    case "bit-count-set-bits-kernighan":
    case "bit-clear-rightmost-set-bit":
    case "bit-hamming-distance":
    case "bit-toggle-range":
    case "bit-range-bitwise-and":
    case "bit-sum-without-plus":
    case "bit-min-bit-flips":
    case "bit-single-number":
    case "bit-missing-number":
    case "bit-invert-all":
    case "bit-base10-complement":
    case "bit-set":
    case "bit-clear":
    case "bit-toggle":
    case "bit-check-right-shift":
      return `        return 0;`;
    case "recursion-print-name-n-times":
    case "recursion-print-1-to-n":
    case "recursion-tower-of-hanoi":
    case "recursion-sudoku-solver":
      return `        // Write your code here.`;
    case "recursion-sum-first-n":
    case "recursion-power":
    case "recursion-fibonacci-number":
    case "recursion-count-digits":
    case "recursion-binary-search":
    case "recursion-gcd":
    case "recursion-josephus":
    case "recursion-climbing-stairs":
    case "recursion-tribonacci":
      return `        return 0;`;
    case "recursion-palindrome":
    case "recursion-subset-sum-exists":
      return `        return false;`;
    case "recursion-reverse-string":
      return `        return "";`;
    case "recursion-sum-digits":
      return `        return 0;`;
    case "recursion-generate-subsequences":
    case "recursion-combination-sum":
    case "recursion-generate-permutations":
      return `        return {};`;
    case "recursion-merge-sort":
    case "recursion-quick-sort":
      return `        return {};`;
    case "recursion-n-queens":
      return `        return {};`;
    case "recursion-factorial":
    case "dp-fibonacci":
      return `        return 0;`;
    case "dp-climbing-stairs":
    case "dp-house-robber":
    case "dp-max-non-adjacent-sum":
    case "dp-min-cost-climbing-stairs":
    case "dp-unique-paths":
    case "dp-min-path-sum":
    case "dp-subset-sum":
    case "dp-knapsack-01":
    case "dp-coin-change-min-coins":
    case "dp-lis-length":
    case "dp-bitonic-subsequence":
    case "dp-lcs-length":
    case "dp-edit-distance":
    case "dp-matrix-chain-multiplication":
      return `        return 0;`;
    case "graph-bfs":
      return `        return {};`;
    case "graph-build-adjacency-list":
    case "graph-dfs":
    case "graph-connected-components":
    case "graph-cycle-undirected":
    case "graph-cycle-directed":
    case "graph-num-islands":
    case "graph-shortest-path-binary-matrix":
    case "graph-topological-sort":
    case "graph-course-schedule":
    case "graph-shortest-path-unweighted":
    case "graph-number-of-provinces":
      return `        return {};`;
    default:
      throw new Error(`Unsupported driver strategy: ${contract.driverStrategy}`);
  }
}

export function buildJavaFunctionTemplate(problem: Problem): string {
  const contract = requireFunctionContract(problem);
  return `import java.util.*;

/*
 * Problem: ${problem.title} (${problem.id})
 * Mode: Complete the function
 * Provided by DSA Sheet: ${contract.providedTypes.join(", ") || "input parsing"}, output formatting, and test driver
 * Expected Complexity: ${problem.expectedComplexity}
 */
class Solution {
    ${contract.javaSignature} {
        // TODO: implement ${contract.functionName}.
${javaMethodStub(contract)}
    }
}
`;
}

export function buildCppFunctionTemplate(problem: Problem): string {
  const contract = requireFunctionContract(problem);
  return `/*
 * Problem: ${problem.title} (${problem.id})
 * Mode: Complete the function
 * Provided by DSA Sheet: ${contract.providedTypes.join(", ") || "input parsing"}, output formatting, and test driver
 * Expected Complexity: ${problem.expectedComplexity}
 */
class Solution {
public:
    ${contract.cppSignature} {
        // TODO: implement ${contract.functionName}.
${cppMethodStub(contract)}
    }
};
`;
}

const javaNodeSource = `class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
`;

const javaTreeNodeSource = `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
`;

function isLinkedListStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy.startsWith("linked-list-");
}

function isArrayStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy.startsWith("array-");
}

function isTreeStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy.startsWith("tree-");
}

function isMatrixStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy === "bit-assignment-mask-count" || contract.driverStrategy === "recursion-sudoku-solver";
}

function isRecursionArrayStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy === "recursion-binary-search" ||
    contract.driverStrategy === "recursion-subset-sum-exists" ||
    contract.driverStrategy === "recursion-merge-sort" ||
    contract.driverStrategy === "recursion-quick-sort";
}

function isStackArrayStrategy(contract: FunctionContract): boolean {
  return contract.driverStrategy === "stack-stock-span" ||
    contract.driverStrategy === "stack-next-greater-right" ||
    contract.driverStrategy === "stack-previous-smaller-left" ||
    contract.driverStrategy === "stack-daily-temperatures" ||
    contract.driverStrategy === "stack-circular-next-greater" ||
    contract.driverStrategy === "stack-largest-rectangle" ||
    contract.driverStrategy === "stack-asteroid-collision" ||
    contract.driverStrategy === "stack-next-smaller-right" ||
    contract.driverStrategy === "stack-subarray-minimums" ||
    contract.driverStrategy === "stack-online-stock-span";
}

function usesTokenArrayHelpers(contract: FunctionContract): boolean {
  return contract.driverStrategy === "stack-baseball-score";
}

function usesLineArrayHelpers(contract: FunctionContract): boolean {
  return contract.driverStrategy === "stack-process-queries" ||
    contract.driverStrategy === "stack-min-stack-queries";
}

function usesNestedIntegerHelpers(contract: FunctionContract): boolean {
  return contract.driverStrategy === "bit-generate-subsets" ||
    contract.driverStrategy === "recursion-generate-subsequences" ||
    contract.driverStrategy === "recursion-combination-sum" ||
    contract.driverStrategy === "recursion-generate-permutations";
}

function usesStringListHelpers(contract: FunctionContract): boolean {
  return contract.driverStrategy === "recursion-tower-of-hanoi";
}

function usesNestedStringHelpers(contract: FunctionContract): boolean {
  return contract.driverStrategy === "recursion-n-queens";
}

function isArrayLikeStrategy(contract: FunctionContract): boolean {
  return isArrayStrategy(contract) ||
    isRecursionArrayStrategy(contract) ||
    isStackArrayStrategy(contract) ||
    contract.driverStrategy === "bit-count-odd-array" ||
    contract.driverStrategy === "bit-single-number" ||
    contract.driverStrategy === "bit-two-unique-numbers" ||
    contract.driverStrategy === "bit-swap-two-numbers" ||
    contract.driverStrategy === "bit-missing-number" ||
    contract.driverStrategy === "bit-decode-xored-array" ||
    contract.driverStrategy === "bit-count-bits-dp" ||
    contract.driverStrategy === "bit-set-query-batch" ||
    contract.driverStrategy === "bit-subset-sum-count" ||
    contract.driverStrategy === "bit-generate-subsets" ||
    contract.driverStrategy === "bit-max-xor-pair" ||
    contract.driverStrategy === "queue-process-queries" ||
    contract.driverStrategy === "queue-circular-queries" ||
    contract.driverStrategy === "queue-reverse-first-k" ||
    contract.driverStrategy === "binary-search-exact";
}

function javaDriverSource(contract: FunctionContract): string {
  const linkedListHelpers = `    private static Node readList(Scanner sc, int n) {
        Node dummy = new Node(0);
        Node tail = dummy;
        for (int i = 0; i < n; i++) {
            tail.next = new Node(sc.nextInt());
            tail = tail.next;
        }
        return dummy.next;
    }

    private static void printList(Node head) {
        boolean first = true;
        for (Node current = head; current != null; current = current.next) {
            if (!first) System.out.print(" ");
            System.out.print(current.data);
            first = false;
        }
    }

    private static Node connectCycle(Node head, int pos) {
        if (head == null || pos <= 0) return head;
        Node cycleNode = null;
        Node tail = head;
        int index = 1;
        for (Node current = head; current != null; current = current.next) {
            if (index == pos) cycleNode = current;
            tail = current;
            index++;
        }
        if (tail != null) tail.next = cycleNode;
        return head;
    }`;

  const arrayHelpers = `    private static int[] readArray(Scanner sc, int n) {
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = sc.nextInt();
        return values;
    }

    private static void printArray(int[] values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(values[i]);
        }
    }`;

  const subsetHelpers = `    private static int[] readArray(Scanner sc, int n) {
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = sc.nextInt();
        return values;
    }

    private static void printNestedValues(List<List<Integer>> values) {
        System.out.print("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(",");
            List<Integer> subset = values.get(i);
            System.out.print("[");
            for (int j = 0; j < subset.size(); j++) {
                if (j > 0) System.out.print(",");
                System.out.print(subset.get(j));
            }
            System.out.print("]");
        }
        System.out.print("]");
    }`;

  const stringListHelpers = `    private static void printStrings(List<String> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.println();
            System.out.print(values.get(i));
        }
    }`;

  const tokenArrayHelpers = `    private static String[] readTokens(Scanner sc, int n) {
        String[] values = new String[n];
        for (int i = 0; i < n; i++) values[i] = sc.next();
        return values;
    }`;

  const lineArrayHelpers = `    private static String[] readLines(Scanner sc, int n) {
        sc.nextLine();
        String[] values = new String[n];
        for (int i = 0; i < n; i++) values[i] = sc.nextLine();
        return values;
    }

    private static void printArray(int[] values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) System.out.println();
            System.out.print(values[i]);
        }
    }`;

  const nestedStringHelpers = `    private static void printNestedStrings(List<List<String>> values) {
        System.out.print("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(",");
            List<String> board = values.get(i);
            System.out.print("[");
            for (int j = 0; j < board.size(); j++) {
                if (j > 0) System.out.print(",");
                System.out.print(board.get(j));
            }
            System.out.print("]");
        }
        System.out.print("]");
    }`;

  const matrixHelpers = `    private static int[][] readMatrix(Scanner sc, int rows, int cols) {
        int[][] values = new int[rows][cols];
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                values[row][col] = sc.nextInt();
            }
        }
        return values;
    }

    private static void printMatrix(int[][] values) {
        for (int row = 0; row < values.length; row++) {
            if (row > 0) System.out.println();
            for (int col = 0; col < values[row].length; col++) {
                if (col > 0) System.out.print(" ");
                System.out.print(values[row][col]);
            }
        }
    }`;

  const treeHelpers = `    private static TreeNode readTree(Scanner sc, int n) {
        if (n == 0) return null;
        int rootValue = sc.nextInt();
        if (rootValue == -1) {
            for (int i = 1; i < n; i++) sc.nextInt();
            return null;
        }

        TreeNode root = new TreeNode(rootValue);
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        int index = 1;
        while (!queue.isEmpty() && index < n) {
            TreeNode current = queue.remove();
            int leftValue = sc.nextInt();
            index++;
            if (leftValue != -1) {
                current.left = new TreeNode(leftValue);
                queue.add(current.left);
            }
            if (index < n) {
                int rightValue = sc.nextInt();
                index++;
                if (rightValue != -1) {
                    current.right = new TreeNode(rightValue);
                    queue.add(current.right);
                }
            }
        }
        while (index < n) {
            sc.nextInt();
            index++;
        }
        return root;
    }

    private static void printValues(List<Integer> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(values.get(i));
        }
    }`;

  const graphHelpers = `    private static List<List<Integer>> readUndirectedGraph(Scanner sc, int n, int m) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < n; node++) graph.add(new ArrayList<>());
        for (int edge = 0; edge < m; edge++) {
            int from = sc.nextInt();
            int to = sc.nextInt();
            graph.get(from).add(to);
            graph.get(to).add(from);
        }
        return graph;
    }

    private static int[][] readEdges(Scanner sc, int m, int cols) {
        int[][] edges = new int[m][cols];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < cols; j++) edges[i][j] = sc.nextInt();
        }
        return edges;
    }

    private static void printAdjacencyList(List<List<Integer>> graph) {
        for (int i = 0; i < graph.size(); i++) {
            System.out.print(i + ":");
            for (int j = 0; j < graph.get(i).size(); j++) {
                System.out.print(j == 0 ? " " : " ");
                System.out.print(graph.get(i).get(j));
            }
            if (i + 1 < graph.size()) System.out.println();
        }
    }

    private static void printValues(List<Integer> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(values.get(i));
        }
    }`;

  const helpers = isLinkedListStrategy(contract)
    ? linkedListHelpers
    : usesNestedIntegerHelpers(contract)
      ? subsetHelpers
    : usesStringListHelpers(contract)
      ? stringListHelpers
    : usesTokenArrayHelpers(contract)
      ? tokenArrayHelpers
    : usesLineArrayHelpers(contract)
      ? lineArrayHelpers
    : usesNestedStringHelpers(contract)
      ? nestedStringHelpers
    : isArrayLikeStrategy(contract)
      ? arrayHelpers
      : isMatrixStrategy(contract)
        ? matrixHelpers
      : isTreeStrategy(contract)
        ? treeHelpers
        : contract.driverStrategy === "graph-bfs"
          ? graphHelpers
          : "";

  let inputSetup: string;
  let invocation: string;
  switch (contract.driverStrategy) {
    case "linked-list-length":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(head));`;
      break;
    case "linked-list-search":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);`;
      invocation = `        int target = sc.nextInt();
        System.out.print(new Solution().${contract.functionName}(head, target) ? "Found" : "Not Found");`;
      break;
    case "linked-list-reverse":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);`;
      invocation = `        printList(new Solution().${contract.functionName}(head));`;
      break;
    case "linked-list-insert-head":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);
        int value = sc.nextInt();`;
      invocation = `        printList(new Solution().${contract.functionName}(head, value));`;
      break;
    case "linked-list-insert-tail":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);
        int value = sc.nextInt();`;
      invocation = `        printList(new Solution().${contract.functionName}(head, value));`;
      break;
    case "linked-list-delete-position":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);
        int position = sc.nextInt();`;
      invocation = `        printList(new Solution().${contract.functionName}(head, position));`;
      break;
    case "linked-list-middle-value":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(head));`;
      break;
    case "linked-list-cycle-detect":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);
        int pos = sc.nextInt();
        head = connectCycle(head, pos);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(head) ? "Cycle" : "No Cycle");`;
      break;
    case "linked-list-merge-sorted":
      inputSetup = `        int n = sc.nextInt();
        Node first = readList(sc, n);
        int m = sc.nextInt();
        Node second = readList(sc, m);`;
      invocation = `        printList(new Solution().${contract.functionName}(first, second));`;
      break;
    case "linked-list-remove-duplicates":
      inputSetup = `        int n = sc.nextInt();
        Node head = readList(sc, n);`;
      invocation = `        printList(new Solution().${contract.functionName}(head));`;
      break;
    case "array-maximum":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-binary-string":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "array-sorted-check":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values) ? "Sorted" : "Not Sorted");`;
      break;
    case "array-second-largest":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-range-sum":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int left = sc.nextInt();
        int right = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, left, right));`;
      break;
    case "array-highest-frequency":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-max-subarray":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-min-subarray-len":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "array-first-repeating":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-equilibrium-index":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-zero-sum-exists":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values) ? "Yes" : "No");`;
      break;
    case "array-majority-element":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-sorted-squares":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "array-move-zeroes":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        new Solution().${contract.functionName}(values);
        printArray(values);`;
      break;
    case "array-remove-duplicates":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        int length = new Solution().${contract.functionName}(values);
        System.out.println(length);
        printArray(Arrays.copyOf(values, length));`;
      break;
    case "array-longest-sum-k-positive":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "array-stock-profit":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-max-window-sum":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, k));`;
      break;
    case "array-min-adjacent-diff":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-product-except-self":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "array-count-positive":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-running-sum":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "array-pair-sum-sorted":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target) ? "Yes" : "No");`;
      break;
    case "array-left-rotate-one":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        new Solution().${contract.functionName}(values);
        printArray(values);`;
      break;
    case "array-right-rotate-k":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        new Solution().${contract.functionName}(values, k);
        printArray(values);`;
      break;
    case "array-max-consecutive-ones":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-count-subarrays-sum-k":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, k));`;
      break;
    case "array-contains-duplicate":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values) ? "Yes" : "No");`;
      break;
    case "array-max-circular-subarray":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "array-max-average-window":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(String.format(java.util.Locale.US, "%.1f", new Solution().${contract.functionName}(values, k)));`;
      break;
    case "bit-single-number":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-count-odd-array":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-two-unique-numbers":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-swap-two-numbers":
      inputSetup = `        int a = sc.nextInt();
        int b = sc.nextInt();`;
      invocation = `        printArray(new Solution().${contract.functionName}(a, b));`;
      break;
    case "bit-missing-number":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-clear-rightmost-set-bit":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "bit-decode-xored-array":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int first = sc.nextInt();`;
      invocation = `        printArray(new Solution().${contract.functionName}(values, first));`;
      break;
    case "bit-count-bits-dp":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        printArray(new Solution().${contract.functionName}(n));`;
      break;
    case "array-reverse":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        new Solution().${contract.functionName}(values);
        printArray(values);`;
      break;
    case "tree-height":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(root));`;
      break;
    case "tree-preorder":
    case "tree-inorder":
    case "tree-postorder":
    case "tree-level-order":
    case "tree-left-view":
    case "tree-top-view":
    case "tree-serialize-level-order":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);`;
      invocation = `        printValues(new Solution().${contract.functionName}(root));`;
      break;
    case "tree-diameter":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(root));`;
      break;
    case "tree-balanced-check":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(root) ? "Balanced" : "Not Balanced");`;
      break;
    case "tree-bst-search":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(root, target) ? "Found" : "Not Found");`;
      break;
    case "tree-bst-insert":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);
        int x = sc.nextInt();`;
      invocation = `        printValues(new Solution().${contract.functionName}(root, x));`;
      break;
    case "tree-bst-delete":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);
        int key = sc.nextInt();`;
      invocation = `        printValues(new Solution().${contract.functionName}(root, key));`;
      break;
    case "tree-lca":
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);
        int p = sc.nextInt();
        int q = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(root, p, q));`;
      break;
    case "tree-build-from-traversals":
      inputSetup = `        int n = sc.nextInt();
        int[] preorder = readArray(sc, n);
        int[] inorder = readArray(sc, n);`;
      invocation = `        printValues(new Solution().${contract.functionName}(preorder, inorder));`;
      break;
    case "stack-balanced-brackets":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value) ? "Balanced" : "Not Balanced");`;
      break;
    case "stack-process-queries":
      inputSetup = `        int q = sc.nextInt();
        String[] queries = readLines(sc, q);`;
      invocation = `        printArray(new Solution().${contract.functionName}(queries));`;
      break;
    case "stack-reverse-word":
    case "stack-remove-adjacent-duplicates":
    case "stack-infix-to-postfix":
    case "stack-simplify-path":
    case "stack-postfix-to-infix":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value));`;
      break;
    case "stack-evaluate-postfix":
    case "stack-evaluate-prefix":
    case "stack-max-nesting-depth":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value));`;
      break;
    case "stack-min-stack-queries":
      inputSetup = `        int q = sc.nextInt();
        String[] queries = readLines(sc, q);`;
      invocation = `        printArray(new Solution().${contract.functionName}(queries));`;
      break;
    case "stack-stock-span":
    case "stack-next-greater-right":
    case "stack-previous-smaller-left":
    case "stack-daily-temperatures":
    case "stack-circular-next-greater":
    case "stack-asteroid-collision":
    case "stack-next-smaller-right":
    case "stack-online-stock-span":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "stack-largest-rectangle":
    case "stack-subarray-minimums":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "stack-maximal-rectangle":
      inputSetup = `        int rows = sc.nextInt();
        int cols = sc.nextInt();
        int[][] values = readMatrix(sc, rows, cols);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "stack-validate-sequences":
      inputSetup = `        int n = sc.nextInt();
        int[] pushed = readArray(sc, n);
        int[] popped = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(pushed, popped) ? "Valid" : "Invalid");`;
      break;
    case "stack-remove-adjacent-k":
      inputSetup = `        String value = sc.next();
        int k = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value, k));`;
      break;
    case "stack-redundant-brackets":
      inputSetup = `        String expression = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(expression) ? "Redundant" : "Useful");`;
      break;
    case "stack-celebrity":
      inputSetup = `        int n = sc.nextInt();
        int[][] matrix = readMatrix(sc, n, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(matrix));`;
      break;
    case "stack-baseball-score":
      inputSetup = `        int n = sc.nextInt();
        String[] operations = readTokens(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(operations));`;
      break;
    case "stack-backspace-compare":
      inputSetup = `        String first = sc.next();
        String second = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(first, second) ? "Equal" : "Not Equal");`;
      break;
    case "stack-next-greater-reference":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        int[] nums1 = readArray(sc, n);
        int[] nums2 = readArray(sc, m);`;
      invocation = `        printArray(new Solution().${contract.functionName}(nums1, nums2));`;
      break;
    case "stack-remove-k-digits":
      inputSetup = `        String number = sc.next();
        int k = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(number, k));`;
      break;
    case "bit-odd-even":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n) ? "Odd" : "Even");`;
      break;
    case "queue-process-queries":
      inputSetup = `        int q = sc.nextInt();
        int[][] queries = new int[q][2];
        for (int i = 0; i < q; i++) {
            queries[i][0] = sc.nextInt();
            queries[i][1] = queries[i][0] == 1 ? sc.nextInt() : 0;
        }`;
      invocation = `        printArray(new Solution().${contract.functionName}(queries));`;
      break;
    case "queue-circular-queries":
      inputSetup = `        int capacity = sc.nextInt();
        int q = sc.nextInt();
        int[][] queries = new int[q][2];
        for (int i = 0; i < q; i++) {
            queries[i][0] = sc.nextInt();
            queries[i][1] = (queries[i][0] == 1) ? sc.nextInt() : 0;
        }`;
      invocation = `        printArray(new Solution().${contract.functionName}(capacity, queries));`;
      break;
    case "queue-petrol-pump":
      inputSetup = `        int n = sc.nextInt();
        int[] petrol = readArray(sc, n);
        int[] distance = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(petrol, distance));`;
      break;
    case "queue-generate-binary":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        printStrings(new Solution().${contract.functionName}(n));`;
      break;
    case "queue-rotten-oranges":
      inputSetup = `        int rows = sc.nextInt();
        int cols = sc.nextInt();
        int[][] grid = readMatrix(sc, rows, cols);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(grid));`;
      break;
    case "queue-first-non-repeating-stream":
      inputSetup = `        String s = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(s));`;
      break;
    case "queue-sliding-window-maximum":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-shortest-subarray-at-least-k":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-jump-game-vi":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-k-largest-elements":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-task-scheduler":
      inputSetup = `        String tasks = sc.next();
        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(tasks, n));`;
      break;
    case "queue-dota2-senate":
      inputSetup = `        String senate = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(senate));`;
      break;
    case "queue-reverse-first-k":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values, k));`;
      break;
    case "binary-search-exact":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "binary-search-lower-bound":
    case "binary-search-search-insert":
    case "binary-search-rotated-search":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "binary-search-first-last":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        printArray(new Solution().${contract.functionName}(values, target));`;
      break;
    case "binary-search-min-rotated":
    case "binary-search-peak":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "binary-search-floor-sqrt":
      inputSetup = `        long x = sc.nextLong();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(x));`;
      break;
    case "binary-search-capacity-speed":
      inputSetup = `        int n = sc.nextInt();
        int hours = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, hours));`;
      break;
    case "binary-search-capacity-ship":
      inputSetup = `        int n = sc.nextInt();
        int days = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, days));`;
      break;
    case "binary-search-capacity-bouquets":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, m, k));`;
      break;
    case "binary-search-median-two-arrays":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        int[] first = readArray(sc, n);
        int[] second = readArray(sc, m);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(first, second));`;
      break;
    case "bit-count-set-bits":
    case "bit-count-set-bits-kernighan":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "bit-check":
    case "bit-set":
    case "bit-clear":
    case "bit-toggle":
    case "bit-check-right-shift":
      inputSetup = `        int n = sc.nextInt();
        int index = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, index));`;
      break;
    case "bit-set-query-batch":
      inputSetup = `        int n = sc.nextInt();
        int q = sc.nextInt();
        int[] positions = readArray(sc, q);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, positions));`;
      break;
    case "bit-toggle-range":
      inputSetup = `        int n = sc.nextInt();
        int left = sc.nextInt();
        int right = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, left, right));`;
      break;
    case "bit-subset-sum-count":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "bit-generate-subsets":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printNestedValues(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-assignment-mask-count":
      inputSetup = `        int n = sc.nextInt();
        int[][] values = readMatrix(sc, n, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-hamming-distance":
    case "bit-range-bitwise-and":
    case "bit-sum-without-plus":
    case "bit-min-bit-flips":
      inputSetup = `        int first = sc.nextInt();
        int second = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(first, second));`;
      break;
    case "bit-reverse-bits":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "bit-max-xor-pair":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "bit-power-of-two":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n) ? "true" : "false");`;
      break;
    case "bit-power-of-four":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n) ? "true" : "false");`;
      break;
    case "bit-invert-all":
    case "bit-base10-complement":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "recursion-print-name-n-times":
      inputSetup = `        String name = sc.next();
        int n = sc.nextInt();`;
      invocation = `        new Solution().${contract.functionName}(name, n);`;
      break;
    case "recursion-print-1-to-n":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        new Solution().${contract.functionName}(n);`;
      break;
    case "recursion-sum-first-n":
    case "recursion-fibonacci-number":
    case "recursion-sum-digits":
    case "recursion-count-digits":
    case "recursion-climbing-stairs":
    case "recursion-tribonacci":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "recursion-power":
      inputSetup = `        int a = sc.nextInt();
        int b = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(a, b));`;
      break;
    case "recursion-palindrome":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value) ? "true" : "false");`;
      break;
    case "recursion-reverse-string":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value));`;
      break;
    case "recursion-binary-search":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target));`;
      break;
    case "recursion-gcd":
      inputSetup = `        int a = sc.nextInt();
        int b = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(a, b));`;
      break;
    case "recursion-josephus":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, k));`;
      break;
    case "recursion-generate-subsequences":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printNestedValues(new Solution().${contract.functionName}(values));`;
      break;
    case "recursion-subset-sum-exists":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, target) ? "true" : "false");`;
      break;
    case "recursion-combination-sum":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);
        int target = sc.nextInt();`;
      invocation = `        printNestedValues(new Solution().${contract.functionName}(values, target));`;
      break;
    case "recursion-generate-permutations":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printNestedValues(new Solution().${contract.functionName}(values));`;
      break;
    case "recursion-tower-of-hanoi":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        printStrings(new Solution().${contract.functionName}(n));`;
      break;
    case "recursion-merge-sort":
    case "recursion-quick-sort":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        printArray(new Solution().${contract.functionName}(values));`;
      break;
    case "recursion-sudoku-solver":
      inputSetup = `        int[][] board = readMatrix(sc, 9, 9);`;
      invocation = `        new Solution().${contract.functionName}(board);
        printMatrix(board);`;
      break;
    case "recursion-n-queens":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        printNestedStrings(new Solution().${contract.functionName}(n));`;
      break;
    case "bit-xor-1-to-n":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "recursion-factorial":
    case "dp-fibonacci":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "dp-climbing-stairs":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "dp-house-robber":
    case "dp-max-non-adjacent-sum":
    case "dp-min-cost-climbing-stairs":
    case "dp-lis-length":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = contract.driverStrategy === "dp-lis-length"
        ? `        System.out.print(new Solution().${contract.functionName}(values));`
        : `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "dp-unique-paths":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, m));`;
      break;
    case "dp-min-path-sum":
      inputSetup = `        int rows = sc.nextInt();
        int cols = sc.nextInt();
        int[][] grid = readMatrix(sc, rows, cols);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(grid));`;
      break;
    case "dp-subset-sum":
      inputSetup = `        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values, k) ? "Yes" : "No");`;
      break;
    case "dp-knapsack-01":
      inputSetup = `        int n = sc.nextInt();
        int w = sc.nextInt();
        int[] weights = readArray(sc, n);
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(weights, values, w));`;
      break;
    case "dp-coin-change-min-coins":
      inputSetup = `        int n = sc.nextInt();
        int amount = sc.nextInt();
        int[] coins = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(coins, amount));`;
      break;
    case "dp-bitonic-subsequence":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
      break;
    case "dp-lcs-length":
    case "dp-edit-distance":
      inputSetup = `        String first = sc.next();
        String second = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(first, second));`;
      break;
    case "dp-matrix-chain-multiplication":
      inputSetup = `        int n = sc.nextInt();
        int[] dims = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(dims));`;
      break;
    case "graph-bfs":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        List<List<Integer>> graph = readUndirectedGraph(sc, n, m);`;
      invocation = `        printValues(new Solution().${contract.functionName}(n, graph));`;
      break;
    case "graph-build-adjacency-list":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        int[][] edges = readEdges(sc, m, 2);`;
      invocation = `        printAdjacencyList(new Solution().${contract.functionName}(n, edges));`;
      break;
    case "graph-dfs":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        List<List<Integer>> graph = readUndirectedGraph(sc, n, m);`;
      invocation = `        printValues(new Solution().${contract.functionName}(n, graph));`;
      break;
    case "graph-connected-components":
    case "graph-cycle-undirected":
    case "graph-topological-sort":
    case "graph-course-schedule":
    case "graph-shortest-path-unweighted":
    case "graph-dijkstra":
    case "graph-network-delay-time":
    case "graph-kruskal-mst":
    case "graph-prim-mst":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();`;
      if (contract.driverStrategy === "graph-course-schedule") {
        inputSetup += `
        int[][] edges = readEdges(sc, m, 2);`;
      } else if (contract.driverStrategy === "graph-shortest-path-unweighted") {
        inputSetup += `
        int[][] edges = readEdges(sc, m, 2);
        int s = sc.nextInt();`;
      } else if (contract.driverStrategy === "graph-dijkstra" || contract.driverStrategy === "graph-network-delay-time" || contract.driverStrategy === "graph-kruskal-mst" || contract.driverStrategy === "graph-prim-mst") {
        inputSetup += `
        int[][] edges = readEdges(sc, m, 3);`;
        if (contract.driverStrategy === "graph-dijkstra" || contract.driverStrategy === "graph-network-delay-time") inputSetup += `
        int s = sc.nextInt();`;
      } else {
        inputSetup += `
        int[][] edges = readEdges(sc, m, 2);`;
      }
      invocation = contract.driverStrategy === "graph-connected-components"
        ? `        System.out.print(new Solution().${contract.functionName}(n, edges));`
        : contract.driverStrategy === "graph-cycle-undirected"
          ? `        System.out.print(new Solution().${contract.functionName}(n, edges) ? "Cycle" : "Acyclic");`
          : contract.driverStrategy === "graph-topological-sort"
            ? `        printArray(new Solution().${contract.functionName}(n, edges));`
            : contract.driverStrategy === "graph-course-schedule"
              ? `        System.out.print(new Solution().${contract.functionName}(n, edges) ? "Possible" : "Impossible");`
              : contract.driverStrategy === "graph-shortest-path-unweighted"
                ? `        printArray(new Solution().${contract.functionName}(n, edges, s));`
                : contract.driverStrategy === "graph-network-delay-time"
                  ? `        System.out.print(new Solution().${contract.functionName}(n, edges, s));`
                  : `        System.out.print(new Solution().${contract.functionName}(n, edges));`;
      break;
    case "graph-cycle-directed":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        int[][] edges = readEdges(sc, m, 2);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, edges) ? "Cycle" : "Acyclic");`;
      break;
    case "graph-num-islands":
    case "graph-shortest-path-binary-matrix":
      inputSetup = `        int rows = sc.nextInt();
        int cols = sc.nextInt();
        int[][] grid = readMatrix(sc, rows, cols);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(grid));`;
      break;
    case "graph-number-of-provinces":
      inputSetup = `        int n = sc.nextInt();
        int[][] matrix = readMatrix(sc, n, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(matrix));`;
      break;
    default:
      inputSetup = `        throw new IllegalStateException("Unsupported driver strategy: ${contract.driverStrategy}");`;
      invocation = ``;
      break;
  }

  return `import java.util.*;

public class Main {
${helpers}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${inputSetup}
${invocation}
        sc.close();
    }
}
`;
}

export function buildJavaHarnessFiles(problem: Problem, studentSource: string): Record<string, string> {
  const contract = requireFunctionContract(problem);
  const files: Record<string, string> = {
    "Solution.java": studentSource,
    "Main.java": javaDriverSource(contract)
  };
  if (isLinkedListStrategy(contract)) files["Node.java"] = javaNodeSource;
  if (isTreeStrategy(contract)) files["TreeNode.java"] = javaTreeNodeSource;
  return files;
}

function cppDriverSource(contract: FunctionContract): string {
  const linkedListHelpers = `Node* readList(int n) {
    Node dummy(0);
    Node* tail = &dummy;
    for (int i = 0; i < n; ++i) {
        int value;
        cin >> value;
        tail->next = new Node(value);
        tail = tail->next;
    }
    return dummy.next;
}

void printList(Node* head) {
    bool first = true;
    for (Node* current = head; current != nullptr; current = current->next) {
        if (!first) cout << " ";
        cout << current->data;
        first = false;
    }
}

Node* connectCycle(Node* head, int pos) {
    if (head == nullptr || pos <= 0) return head;
    Node* cycleNode = nullptr;
    Node* tail = nullptr;
    int index = 1;
    for (Node* current = head; current != nullptr; current = current->next) {
        if (index == pos) cycleNode = current;
        tail = current;
        ++index;
    }
    if (tail != nullptr) tail->next = cycleNode;
    return head;
}`;

  const arrayHelpers = `vector<int> readArray(int n) {
    vector<int> values(n);
    for (int& value : values) cin >> value;
    return values;
}

void printArray(const vector<int>& values) {
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << " ";
        cout << values[i];
    }
}`;

  const subsetHelpers = `vector<int> readArray(int n) {
    vector<int> values(n);
    for (int& value : values) cin >> value;
    return values;
}

void printNestedValues(const vector<vector<int>>& values) {
    cout << "[";
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << ",";
        cout << "[";
        for (size_t j = 0; j < values[i].size(); ++j) {
            if (j > 0) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]";
}`;

  const stringListHelpers = `void printStrings(const vector<string>& values) {
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << "\\n";
        cout << values[i];
    }
}`;

  const tokenArrayHelpers = `vector<string> readTokens(int n) {
    vector<string> values(n);
    for (string& value : values) cin >> value;
    return values;
}`;

  const lineArrayHelpers = `vector<string> readLines(int n) {
    string ignored;
    getline(cin, ignored);
    vector<string> values(n);
    for (int i = 0; i < n; ++i) getline(cin, values[i]);
    return values;
}

void printArray(const vector<int>& values) {
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << "\\n";
        cout << values[i];
    }
}`;

  const nestedStringHelpers = `void printNestedStrings(const vector<vector<string>>& values) {
    cout << "[";
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << ",";
        cout << "[";
        for (size_t j = 0; j < values[i].size(); ++j) {
            if (j > 0) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]";
}`;

  const matrixHelpers = `vector<vector<int>> readMatrix(int rows, int cols) {
    vector<vector<int>> values(rows, vector<int>(cols));
    for (int row = 0; row < rows; ++row) {
        for (int col = 0; col < cols; ++col) {
            cin >> values[row][col];
        }
    }
    return values;
}

void printMatrix(const vector<vector<int>>& values) {
    for (size_t row = 0; row < values.size(); ++row) {
        if (row > 0) cout << "\\n";
        for (size_t col = 0; col < values[row].size(); ++col) {
            if (col > 0) cout << " ";
            cout << values[row][col];
        }
    }
}`;

  const treeHelpers = `TreeNode* readTree(int n) {
    if (n == 0) return nullptr;
    int rootValue;
    cin >> rootValue;
    if (rootValue == -1) {
        for (int i = 1, ignored; i < n; ++i) cin >> ignored;
        return nullptr;
    }

    TreeNode* root = new TreeNode(rootValue);
    queue<TreeNode*> nodes;
    nodes.push(root);
    int index = 1;
    while (!nodes.empty() && index < n) {
        TreeNode* current = nodes.front();
        nodes.pop();
        int leftValue;
        cin >> leftValue;
        ++index;
        if (leftValue != -1) {
            current->left = new TreeNode(leftValue);
            nodes.push(current->left);
        }
        if (index < n) {
            int rightValue;
            cin >> rightValue;
            ++index;
            if (rightValue != -1) {
                current->right = new TreeNode(rightValue);
                nodes.push(current->right);
            }
        }
    }
    for (int ignored; index < n; ++index) cin >> ignored;
    return root;
}

void printValues(const vector<int>& values) {
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << " ";
        cout << values[i];
    }
}`;

  const graphHelpers = `vector<vector<int>> readUndirectedGraph(int n, int m) {
    vector<vector<int>> graph(n);
    for (int edge = 0; edge < m; ++edge) {
        int from, to;
        cin >> from >> to;
        graph[from].push_back(to);
        graph[to].push_back(from);
    }
    return graph;
}

void printValues(const vector<int>& values) {
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) cout << " ";
        cout << values[i];
    }
}`;

  const helpers = isLinkedListStrategy(contract)
    ? linkedListHelpers
    : usesNestedIntegerHelpers(contract)
      ? subsetHelpers
    : usesStringListHelpers(contract)
      ? stringListHelpers
    : usesTokenArrayHelpers(contract)
      ? tokenArrayHelpers
    : usesLineArrayHelpers(contract)
      ? lineArrayHelpers
    : usesNestedStringHelpers(contract)
      ? nestedStringHelpers
    : isArrayLikeStrategy(contract)
      ? arrayHelpers
      : isMatrixStrategy(contract)
        ? matrixHelpers
      : isTreeStrategy(contract)
        ? treeHelpers
        : contract.driverStrategy === "graph-bfs"
          ? graphHelpers
          : "";

  let inputSetup: string;
  let invocation: string;
  switch (contract.driverStrategy) {
    case "linked-list-length":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);`;
      invocation = `    cout << Solution().${contract.functionName}(head);`;
      break;
    case "linked-list-search":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);`;
      invocation = `    int target;
    cin >> target;
    cout << (Solution().${contract.functionName}(head, target) ? "Found" : "Not Found");`;
      break;
    case "linked-list-reverse":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);`;
      invocation = `    printList(Solution().${contract.functionName}(head));`;
      break;
    case "linked-list-insert-head":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);
    int value;
    cin >> value;`;
      invocation = `    printList(Solution().${contract.functionName}(head, value));`;
      break;
    case "linked-list-insert-tail":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);
    int value;
    cin >> value;`;
      invocation = `    printList(Solution().${contract.functionName}(head, value));`;
      break;
    case "linked-list-delete-position":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);
    int position;
    cin >> position;`;
      invocation = `    printList(Solution().${contract.functionName}(head, position));`;
      break;
    case "linked-list-middle-value":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);`;
      invocation = `    cout << Solution().${contract.functionName}(head);`;
      break;
    case "linked-list-cycle-detect":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);
    int pos;
    cin >> pos;
    head = connectCycle(head, pos);`;
      invocation = `    cout << (Solution().${contract.functionName}(head) ? "Cycle" : "No Cycle");`;
      break;
    case "linked-list-merge-sorted":
      inputSetup = `    int n;
    cin >> n;
    Node* first = readList(n);
    int m;
    cin >> m;
    Node* second = readList(m);`;
      invocation = `    printList(Solution().${contract.functionName}(first, second));`;
      break;
    case "linked-list-remove-duplicates":
      inputSetup = `    int n;
    cin >> n;
    Node* head = readList(n);`;
      invocation = `    printList(Solution().${contract.functionName}(head));`;
      break;
    case "array-maximum":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-binary-string":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "array-sorted-check":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(values) ? "Sorted" : "Not Sorted");`;
      break;
    case "array-second-largest":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-range-sum":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int left, right;
    cin >> left >> right;`;
      invocation = `    cout << Solution().${contract.functionName}(values, left, right);`;
      break;
    case "array-highest-frequency":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-max-subarray":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-min-subarray-len":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "array-first-repeating":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-equilibrium-index":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-zero-sum-exists":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(values) ? "Yes" : "No");`;
      break;
    case "array-majority-element":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-sorted-squares":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "array-move-zeroes":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    Solution().${contract.functionName}(values);
    printArray(values);`;
      break;
    case "array-remove-duplicates":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    int length = Solution().${contract.functionName}(values);
    cout << length << "\\n";
    printArray(vector<int>(values.begin(), values.begin() + length));`;
      break;
    case "array-longest-sum-k-positive":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "array-stock-profit":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-max-window-sum":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, k);`;
      break;
    case "array-min-adjacent-diff":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-product-except-self":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "array-count-positive":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-running-sum":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "array-pair-sum-sorted":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << (Solution().${contract.functionName}(values, target) ? "Yes" : "No");`;
      break;
    case "array-left-rotate-one":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    Solution().${contract.functionName}(values);
    printArray(values);`;
      break;
    case "array-right-rotate-k":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    Solution().${contract.functionName}(values, k);
    printArray(values);`;
      break;
    case "array-max-consecutive-ones":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-count-subarrays-sum-k":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, k);`;
      break;
    case "array-contains-duplicate":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(values) ? "Yes" : "No");`;
      break;
    case "array-max-circular-subarray":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-max-average-window":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << fixed << setprecision(1) << Solution().${contract.functionName}(values, k);`;
      break;
    case "bit-single-number":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-count-odd-array":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-two-unique-numbers":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "bit-swap-two-numbers":
      inputSetup = `    int a, b;
    cin >> a >> b;`;
      invocation = `    printArray(Solution().${contract.functionName}(a, b));`;
      break;
    case "bit-missing-number":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-clear-rightmost-set-bit":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "bit-decode-xored-array":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int first;
    cin >> first;`;
      invocation = `    printArray(Solution().${contract.functionName}(values, first));`;
      break;
    case "bit-count-bits-dp":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    printArray(Solution().${contract.functionName}(n));`;
      break;
    case "array-reverse":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    Solution().${contract.functionName}(values);
    printArray(values);`;
      break;
    case "tree-height":
    case "tree-preorder":
    case "tree-inorder":
    case "tree-postorder":
    case "tree-level-order":
    case "tree-left-view":
    case "tree-top-view":
    case "tree-serialize-level-order":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);`;
      invocation = `    printValues(Solution().${contract.functionName}(root));`;
      break;
    case "tree-diameter":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);`;
      invocation = `    cout << Solution().${contract.functionName}(root);`;
      break;
    case "tree-balanced-check":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(root) ? "Balanced" : "Not Balanced");`;
      break;
    case "tree-bst-search":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);
    int target;
    cin >> target;`;
      invocation = `    cout << (Solution().${contract.functionName}(root, target) ? "Found" : "Not Found");`;
      break;
    case "tree-bst-insert":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);
    int x;
    cin >> x;`;
      invocation = `    printValues(Solution().${contract.functionName}(root, x));`;
      break;
    case "tree-bst-delete":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);
    int key;
    cin >> key;`;
      invocation = `    printValues(Solution().${contract.functionName}(root, key));`;
      break;
    case "tree-lca":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);
    int p, q;
    cin >> p >> q;`;
      invocation = `    cout << Solution().${contract.functionName}(root, p, q);`;
      break;
    case "tree-build-from-traversals":
      inputSetup = `    int n;
    cin >> n;
    vector<int> preorder = readArray(n);
    vector<int> inorder = readArray(n);`;
      invocation = `    printValues(Solution().${contract.functionName}(preorder, inorder));`;
      break;
    case "stack-balanced-brackets":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << (Solution().${contract.functionName}(value) ? "Balanced" : "Not Balanced");`;
      break;
    case "stack-process-queries":
      inputSetup = `    int q;
    cin >> q;
    vector<string> queries = readLines(q);`;
      invocation = `    printArray(Solution().${contract.functionName}(queries));`;
      break;
    case "stack-reverse-word":
    case "stack-remove-adjacent-duplicates":
    case "stack-infix-to-postfix":
    case "stack-simplify-path":
    case "stack-postfix-to-infix":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << Solution().${contract.functionName}(value);`;
      break;
    case "stack-evaluate-postfix":
    case "stack-evaluate-prefix":
    case "stack-max-nesting-depth":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << Solution().${contract.functionName}(value);`;
      break;
    case "stack-min-stack-queries":
      inputSetup = `    int q;
    cin >> q;
    vector<string> queries = readLines(q);`;
      invocation = `    printArray(Solution().${contract.functionName}(queries));`;
      break;
    case "stack-stock-span":
    case "stack-next-greater-right":
    case "stack-previous-smaller-left":
    case "stack-daily-temperatures":
    case "stack-circular-next-greater":
    case "stack-asteroid-collision":
    case "stack-next-smaller-right":
    case "stack-online-stock-span":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "stack-largest-rectangle":
    case "stack-subarray-minimums":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "stack-maximal-rectangle":
      inputSetup = `    int rows, cols;
    cin >> rows >> cols;
    vector<vector<int>> values = readMatrix(rows, cols);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "stack-validate-sequences":
      inputSetup = `    int n;
    cin >> n;
    vector<int> pushed = readArray(n);
    vector<int> popped = readArray(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(pushed, popped) ? "Valid" : "Invalid");`;
      break;
    case "stack-remove-adjacent-k":
      inputSetup = `    string value;
    int k;
    cin >> value >> k;`;
      invocation = `    cout << Solution().${contract.functionName}(value, k);`;
      break;
    case "stack-redundant-brackets":
      inputSetup = `    string expression;
    cin >> expression;`;
      invocation = `    cout << (Solution().${contract.functionName}(expression) ? "Redundant" : "Useful");`;
      break;
    case "stack-celebrity":
      inputSetup = `    int n;
    cin >> n;
    vector<vector<int>> matrix = readMatrix(n, n);`;
      invocation = `    cout << Solution().${contract.functionName}(matrix);`;
      break;
    case "stack-baseball-score":
      inputSetup = `    int n;
    cin >> n;
    vector<string> operations = readTokens(n);`;
      invocation = `    cout << Solution().${contract.functionName}(operations);`;
      break;
    case "stack-backspace-compare":
      inputSetup = `    string first, second;
    cin >> first >> second;`;
      invocation = `    cout << (Solution().${contract.functionName}(first, second) ? "Equal" : "Not Equal");`;
      break;
    case "stack-next-greater-reference":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<int> nums1 = readArray(n);
    vector<int> nums2 = readArray(m);`;
      invocation = `    printArray(Solution().${contract.functionName}(nums1, nums2));`;
      break;
    case "stack-remove-k-digits":
      inputSetup = `    string number;
    int k;
    cin >> number >> k;`;
      invocation = `    cout << Solution().${contract.functionName}(number, k);`;
      break;
    case "bit-odd-even":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << (Solution().${contract.functionName}(n) ? "Odd" : "Even");`;
      break;
    case "queue-process-queries":
      inputSetup = `    int q;
    cin >> q;
    vector<vector<int>> queries(q, vector<int>(2, 0));
    for (int i = 0; i < q; i++) {
        cin >> queries[i][0];
        if (queries[i][0] == 1) cin >> queries[i][1];
    }`;
      invocation = `    printArray(Solution().${contract.functionName}(queries));`;
      break;
    case "queue-circular-queries":
      inputSetup = `    int capacity, q;
    cin >> capacity >> q;
    vector<vector<int>> queries(q, vector<int>(2, 0));
    for (int i = 0; i < q; i++) {
        cin >> queries[i][0];
        if (queries[i][0] == 1) cin >> queries[i][1];
        }`;
      invocation = `    printArray(Solution().${contract.functionName}(capacity, queries));`;
      break;
    case "queue-petrol-pump":
      inputSetup = `    int n;
    cin >> n;
    vector<int> petrol = readArray(n);
    vector<int> distance = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(petrol, distance);`;
      break;
    case "queue-generate-binary":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    printStrings(Solution().${contract.functionName}(n));`;
      break;
    case "queue-rotten-oranges":
      inputSetup = `    int rows, cols;
    cin >> rows >> cols;
    vector<vector<int>> grid = readMatrix(rows, cols);`;
      invocation = `    cout << Solution().${contract.functionName}(grid);`;
      break;
    case "queue-first-non-repeating-stream":
      inputSetup = `    string s;
    cin >> s;`;
      invocation = `    cout << Solution().${contract.functionName}(s);`;
      break;
    case "queue-sliding-window-maximum":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-shortest-subarray-at-least-k":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, k);`;
      break;
    case "queue-jump-game-vi":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, k);`;
      break;
    case "queue-k-largest-elements":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values, k));`;
      break;
    case "queue-task-scheduler":
      inputSetup = `    string tasks;
    int n;
    cin >> tasks >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(tasks, n);`;
      break;
    case "queue-dota2-senate":
      inputSetup = `    string senate;
    cin >> senate;`;
      invocation = `    cout << Solution().${contract.functionName}(senate);`;
      break;
    case "queue-reverse-first-k":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values, k));`;
      break;
    case "binary-search-exact":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "binary-search-lower-bound":
    case "binary-search-search-insert":
    case "binary-search-rotated-search":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "binary-search-first-last":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    printArray(Solution().${contract.functionName}(values, target));`;
      break;
    case "binary-search-min-rotated":
    case "binary-search-peak":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "binary-search-floor-sqrt":
      inputSetup = `    long long x;
    cin >> x;`;
      invocation = `    cout << Solution().${contract.functionName}(x);`;
      break;
    case "binary-search-capacity-speed":
      inputSetup = `    int n, hours;
    cin >> n >> hours;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, hours);`;
      break;
    case "binary-search-capacity-ship":
      inputSetup = `    int n, days;
    cin >> n >> days;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, days);`;
      break;
    case "binary-search-capacity-bouquets":
      inputSetup = `    int n, m, k;
    cin >> n >> m >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values, m, k);`;
      break;
    case "binary-search-median-two-arrays":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<int> first = readArray(n);
    vector<int> second = readArray(m);`;
      invocation = `    cout << Solution().${contract.functionName}(first, second);`;
      break;
    case "bit-count-set-bits":
    case "bit-count-set-bits-kernighan":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "bit-check":
    case "bit-set":
    case "bit-clear":
    case "bit-toggle":
    case "bit-check-right-shift":
      inputSetup = `    int n, index;
    cin >> n >> index;`;
      invocation = `    cout << Solution().${contract.functionName}(n, index);`;
      break;
    case "bit-set-query-batch":
      inputSetup = `    int n, q;
    cin >> n >> q;
    vector<int> positions = readArray(q);`;
      invocation = `    cout << Solution().${contract.functionName}(n, positions);`;
      break;
    case "bit-toggle-range":
      inputSetup = `    int n, left, right;
    cin >> n >> left >> right;`;
      invocation = `    cout << Solution().${contract.functionName}(n, left, right);`;
      break;
    case "bit-subset-sum-count":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "bit-generate-subsets":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printNestedValues(Solution().${contract.functionName}(values));`;
      break;
    case "bit-assignment-mask-count":
      inputSetup = `    int n;
    cin >> n;
    vector<vector<int>> values = readMatrix(n, n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-hamming-distance":
    case "bit-range-bitwise-and":
    case "bit-sum-without-plus":
    case "bit-min-bit-flips":
      inputSetup = `    int first, second;
    cin >> first >> second;`;
      invocation = `    cout << Solution().${contract.functionName}(first, second);`;
      break;
    case "bit-reverse-bits":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "bit-max-xor-pair":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "bit-power-of-two":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << (Solution().${contract.functionName}(n) ? "true" : "false");`;
      break;
    case "bit-power-of-four":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << (Solution().${contract.functionName}(n) ? "true" : "false");`;
      break;
    case "bit-invert-all":
    case "bit-base10-complement":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "recursion-print-name-n-times":
      inputSetup = `    string name;
    int n;
    cin >> name >> n;`;
      invocation = `    Solution().${contract.functionName}(name, n);`;
      break;
    case "recursion-print-1-to-n":
    case "recursion-sum-first-n":
    case "recursion-fibonacci-number":
    case "recursion-sum-digits":
    case "recursion-count-digits":
    case "recursion-climbing-stairs":
    case "recursion-tribonacci":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "recursion-power":
    case "recursion-gcd":
      inputSetup = `    int a, b;
    cin >> a >> b;`;
      invocation = `    cout << Solution().${contract.functionName}(a, b);`;
      break;
    case "recursion-palindrome":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << (Solution().${contract.functionName}(value) ? "true" : "false");`;
      break;
    case "recursion-reverse-string":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << Solution().${contract.functionName}(value);`;
      break;
    case "recursion-binary-search":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << Solution().${contract.functionName}(values, target);`;
      break;
    case "recursion-generate-subsequences":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printNestedValues(Solution().${contract.functionName}(values));`;
      break;
    case "recursion-subset-sum-exists":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    cout << (Solution().${contract.functionName}(values, target) ? "true" : "false");`;
      break;
    case "recursion-combination-sum":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);
    int target;
    cin >> target;`;
      invocation = `    printNestedValues(Solution().${contract.functionName}(values, target));`;
      break;
    case "recursion-generate-permutations":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printNestedValues(Solution().${contract.functionName}(values));`;
      break;
    case "recursion-tower-of-hanoi":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    printStrings(Solution().${contract.functionName}(n));`;
      break;
    case "recursion-josephus":
      inputSetup = `    int n, k;
    cin >> n >> k;`;
      invocation = `    cout << Solution().${contract.functionName}(n, k);`;
      break;
    case "recursion-merge-sort":
    case "recursion-quick-sort":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    printArray(Solution().${contract.functionName}(values));`;
      break;
    case "recursion-sudoku-solver":
      inputSetup = `    vector<vector<int>> board = readMatrix(9, 9);`;
      invocation = `    Solution().${contract.functionName}(board);
    printMatrix(board);`;
      break;
    case "recursion-n-queens":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    printNestedStrings(Solution().${contract.functionName}(n));`;
      break;
    case "bit-xor-1-to-n":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "recursion-factorial":
    case "dp-fibonacci":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "dp-climbing-stairs":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "dp-house-robber":
    case "dp-max-non-adjacent-sum":
    case "dp-min-cost-climbing-stairs":
    case "dp-lis-length":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "dp-unique-paths":
      inputSetup = `    int n, m;
    cin >> n >> m;`;
      invocation = `    cout << Solution().${contract.functionName}(n, m);`;
      break;
    case "dp-min-path-sum":
      inputSetup = `    int rows, cols;
    cin >> rows >> cols;
    vector<vector<int>> grid = readMatrix(rows, cols);`;
      invocation = `    cout << Solution().${contract.functionName}(grid);`;
      break;
    case "dp-subset-sum":
      inputSetup = `    int n, k;
    cin >> n >> k;
    vector<int> values = readArray(n);`;
      invocation = `    cout << (Solution().${contract.functionName}(values, k) ? "Yes" : "No");`;
      break;
    case "dp-knapsack-01":
      inputSetup = `    int n, w;
    cin >> n >> w;
    vector<int> weights = readArray(n);
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(weights, values, w);`;
      break;
    case "dp-coin-change-min-coins":
      inputSetup = `    int n, amount;
    cin >> n >> amount;
    vector<int> coins = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(coins, amount);`;
      break;
    case "dp-bitonic-subsequence":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "dp-lcs-length":
    case "dp-edit-distance":
      inputSetup = `    string first, second;
    cin >> first >> second;`;
      invocation = `    cout << Solution().${contract.functionName}(first, second);`;
      break;
    case "dp-matrix-chain-multiplication":
      inputSetup = `    int n;
    cin >> n;
    vector<int> dims = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(dims);`;
      break;
    case "graph-bfs":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph = readUndirectedGraph(n, m);`;
      invocation = `    printValues(Solution().${contract.functionName}(n, graph));`;
      break;
    case "graph-build-adjacency-list":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<vector<int>> edges = readEdges(m, 2);`;
      invocation = `    printAdjacencyList(Solution().${contract.functionName}(n, edges));`;
      break;
    case "graph-connected-components":
    case "graph-cycle-undirected":
    case "graph-topological-sort":
    case "graph-course-schedule":
    case "graph-shortest-path-unweighted":
    case "graph-dijkstra":
    case "graph-network-delay-time":
    case "graph-kruskal-mst":
    case "graph-prim-mst":
      inputSetup = `    int n, m;
    cin >> n >> m;`;
      if (contract.driverStrategy === "graph-shortest-path-unweighted") {
        inputSetup += `
    vector<vector<int>> edges = readEdges(m, 2);
    int s;
    cin >> s;`;
      } else if (contract.driverStrategy === "graph-dijkstra" || contract.driverStrategy === "graph-network-delay-time" || contract.driverStrategy === "graph-kruskal-mst" || contract.driverStrategy === "graph-prim-mst") {
        inputSetup += `
    vector<vector<int>> edges = readEdges(m, 3);`;
        if (contract.driverStrategy === "graph-dijkstra" || contract.driverStrategy === "graph-network-delay-time") inputSetup += `
    int s;
    cin >> s;`;
      } else {
        inputSetup += `
    vector<vector<int>> edges = readEdges(m, 2);`;
      }
      invocation = contract.driverStrategy === "graph-connected-components"
        ? `    cout << Solution().${contract.functionName}(n, edges);`
        : contract.driverStrategy === "graph-cycle-undirected"
          ? `    cout << (Solution().${contract.functionName}(n, edges) ? "Cycle" : "Acyclic");`
          : contract.driverStrategy === "graph-topological-sort"
            ? `    printArray(Solution().${contract.functionName}(n, edges));`
            : contract.driverStrategy === "graph-course-schedule"
              ? `    cout << (Solution().${contract.functionName}(n, edges) ? "Possible" : "Impossible");`
              : contract.driverStrategy === "graph-shortest-path-unweighted"
                ? `    printArray(Solution().${contract.functionName}(n, edges, s));`
                : contract.driverStrategy === "graph-network-delay-time"
                  ? `    cout << Solution().${contract.functionName}(n, edges, s);`
                  : `    cout << Solution().${contract.functionName}(n, edges);`;
      break;
    case "graph-cycle-directed":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<vector<int>> edges = readEdges(m, 2);`;
      invocation = `    cout << (Solution().${contract.functionName}(n, edges) ? "Cycle" : "Acyclic");`;
      break;
    case "graph-num-islands":
    case "graph-shortest-path-binary-matrix":
      inputSetup = `    int rows, cols;
    cin >> rows >> cols;
    vector<vector<int>> grid = readMatrix(rows, cols);`;
      invocation = `    cout << Solution().${contract.functionName}(grid);`;
      break;
    case "graph-number-of-provinces":
      inputSetup = `    int n;
    cin >> n;
    vector<vector<int>> matrix = readMatrix(n, n);`;
      invocation = `    cout << Solution().${contract.functionName}(matrix);`;
      break;
    default:
      inputSetup = `    throw runtime_error("Unsupported driver strategy: ${contract.driverStrategy}");`;
      invocation = ``;
      break;
  }

  return `${helpers}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

${inputSetup}
${invocation}
    return 0;
}
`;
}

export function buildCppHarnessSource(problem: Problem, studentSource: string): string {
  const contract = requireFunctionContract(problem);
  const providedType = isLinkedListStrategy(contract)
    ? `struct Node {
    int data;
    Node* next;
    explicit Node(int value) : data(value), next(nullptr) {}
};`
    : isTreeStrategy(contract)
      ? `struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    explicit TreeNode(int value) : val(value), left(nullptr), right(nullptr) {}
};`
      : "";
  return `${PORTABLE_CPP_HEADERS}
using namespace std;

${providedType}

${studentSource}

${cppDriverSource(contract)}
`;
}
