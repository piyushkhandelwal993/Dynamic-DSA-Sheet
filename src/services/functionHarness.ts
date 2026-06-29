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
      return `        return head;`;
    case "array-sorted-check":
      return `        return false;`;
    case "array-maximum":
    case "tree-height":
      return `        return 0;`;
    case "array-second-largest":
    case "array-highest-frequency":
    case "array-max-subarray":
    case "array-remove-duplicates":
    case "array-longest-sum-k-positive":
    case "array-stock-profit":
    case "array-count-positive":
    case "array-max-consecutive-ones":
      return `        return 0;`;
    case "array-pair-sum-sorted":
      return `        return false;`;
    case "array-range-sum":
      return `        return 0L;`;
    case "array-product-except-self":
    case "array-running-sum":
      return `        return new int[0];`;
    case "array-left-rotate-one":
    case "array-move-zeroes":
    case "array-reverse":
      return `        // Write your code here.`;
    case "tree-preorder":
      return `        return new ArrayList<>();`;
    case "stack-balanced-brackets":
      return `        return false;`;
    case "queue-reverse-first-k":
      return `        return values;`;
    case "binary-search-exact":
      return `        return -1;`;
    case "bit-check":
      return `        return 0;`;
    case "recursion-factorial":
    case "dp-fibonacci":
      return `        return 0;`;
    case "graph-bfs":
      return `        return new ArrayList<>();`;
  }
}

function cppMethodStub(contract: FunctionContract): string {
  switch (contract.driverStrategy) {
    case "linked-list-length":
      return `        return 0;`;
    case "linked-list-search":
      return `        return false;`;
    case "linked-list-reverse":
      return `        return head;`;
    case "array-sorted-check":
      return `        return false;`;
    case "array-maximum":
    case "tree-height":
      return `        return 0;`;
    case "array-second-largest":
    case "array-highest-frequency":
    case "array-max-subarray":
    case "array-remove-duplicates":
    case "array-longest-sum-k-positive":
    case "array-stock-profit":
    case "array-count-positive":
    case "array-max-consecutive-ones":
      return `        return 0;`;
    case "array-pair-sum-sorted":
      return `        return false;`;
    case "array-range-sum":
      return `        return 0LL;`;
    case "array-product-except-self":
    case "array-running-sum":
      return `        return {};`;
    case "array-left-rotate-one":
    case "array-move-zeroes":
    case "array-reverse":
      return `        // Write your code here.`;
    case "tree-preorder":
      return `        return {};`;
    case "stack-balanced-brackets":
      return `        return false;`;
    case "queue-reverse-first-k":
      return `        return values;`;
    case "binary-search-exact":
      return `        return -1;`;
    case "bit-check":
      return `        return 0;`;
    case "recursion-factorial":
    case "dp-fibonacci":
      return `        return 0;`;
    case "graph-bfs":
      return `        return {};`;
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

function isArrayLikeStrategy(contract: FunctionContract): boolean {
  return isArrayStrategy(contract) ||
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

    private static void printValues(List<Integer> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(values.get(i));
        }
    }`;

  const helpers = isLinkedListStrategy(contract)
    ? linkedListHelpers
    : isArrayLikeStrategy(contract)
      ? arrayHelpers
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
    case "array-maximum":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
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
    case "array-max-consecutive-ones":
      inputSetup = `        int n = sc.nextInt();
        int[] values = readArray(sc, n);`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(values));`;
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
      inputSetup = `        int n = sc.nextInt();
        TreeNode root = readTree(sc, n);`;
      invocation = `        printValues(new Solution().${contract.functionName}(root));`;
      break;
    case "stack-balanced-brackets":
      inputSetup = `        String value = sc.next();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(value) ? "Balanced" : "Not Balanced");`;
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
    case "bit-check":
      inputSetup = `        int n = sc.nextInt();
        int index = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n, index));`;
      break;
    case "recursion-factorial":
    case "dp-fibonacci":
      inputSetup = `        int n = sc.nextInt();`;
      invocation = `        System.out.print(new Solution().${contract.functionName}(n));`;
      break;
    case "graph-bfs":
      inputSetup = `        int n = sc.nextInt();
        int m = sc.nextInt();
        List<List<Integer>> graph = readUndirectedGraph(sc, n, m);`;
      invocation = `        printValues(new Solution().${contract.functionName}(n, graph));`;
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
    : isArrayLikeStrategy(contract)
      ? arrayHelpers
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
    case "array-maximum":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
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
    case "array-max-consecutive-ones":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    cout << Solution().${contract.functionName}(values);`;
      break;
    case "array-reverse":
      inputSetup = `    int n;
    cin >> n;
    vector<int> values = readArray(n);`;
      invocation = `    Solution().${contract.functionName}(values);
    printArray(values);`;
      break;
    case "tree-height":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);`;
      invocation = `    cout << Solution().${contract.functionName}(root);`;
      break;
    case "tree-preorder":
      inputSetup = `    int n;
    cin >> n;
    TreeNode* root = readTree(n);`;
      invocation = `    printValues(Solution().${contract.functionName}(root));`;
      break;
    case "stack-balanced-brackets":
      inputSetup = `    string value;
    cin >> value;`;
      invocation = `    cout << (Solution().${contract.functionName}(value) ? "Balanced" : "Not Balanced");`;
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
    case "bit-check":
      inputSetup = `    int n, index;
    cin >> n >> index;`;
      invocation = `    cout << Solution().${contract.functionName}(n, index);`;
      break;
    case "recursion-factorial":
    case "dp-fibonacci":
      inputSetup = `    int n;
    cin >> n;`;
      invocation = `    cout << Solution().${contract.functionName}(n);`;
      break;
    case "graph-bfs":
      inputSetup = `    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph = readUndirectedGraph(n, m);`;
      invocation = `    printValues(Solution().${contract.functionName}(n, graph));`;
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
