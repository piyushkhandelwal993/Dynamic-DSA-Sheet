import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { hasFact } from "../services/analysis-engine/facts";

test("java facts normalize array two-pointer signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        public static void main(String[] args) {
          int[] nums = {1, 2, 3, 4};
          int left = 0;
          int right = nums.length - 1;
          while (left < right) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
            left++;
            right--;
          }
        }
      }
    `
  );

  assert.equal(facts.language, "java");
  assert.equal(hasFact(facts, "array"), true);
  assert.equal(hasFact(facts, "loop"), true);
  assert.equal(hasFact(facts, "two-pointers"), true);
  assert.equal(hasFact(facts, "array-traversal"), true);
  assert.equal(hasFact(facts, "in-place-array-update"), true);
  assert.equal(hasFact(facts, "array-reversal"), true);
  assert.equal(hasFact(facts, "single-pass"), true);
});

test("two-pointer detection supports arbitrary names and assignment movement", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      void reverse(int[] nums) {
        int start = 0;
        int end = nums.length - 1;
        while (start < end) {
          int value = nums[start];
          nums[start] = nums[end];
          nums[end] = value;
          start += 1;
          end = end - 1;
        }
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      void reverse(vector<int>& nums) {
        int l = 0;
        int r = nums.size() - 1;
        while (l < r) {
          swap(nums[l], nums[r]);
          ++l;
          r -= 1;
        }
      }
    `
  );

  assert.equal(hasFact(javaFacts, "two-pointers"), true);
  assert.equal(hasFact(javaFacts, "array-reversal"), true);
  assert.equal(hasFact(cppFacts, "two-pointers"), true);
  assert.equal(hasFact(cppFacts, "array-reversal"), true);
});

test("two-pointer detection recognizes same-direction compaction pointers", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      class Solution {
        public void moveZeroes(int[] nums) {
          int left = 0;
          int right = 0;
          while (right < nums.length) {
            if (nums[right] != 0) {
              int temp = nums[left];
              nums[left] = nums[right];
              nums[right] = temp;
              left++;
            }
            right++;
          }
        }
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      void moveZeroes(vector<int>& nums) {
        int left = 0;
        int right = 0;
        while (right < nums.size()) {
          if (nums[right] != 0) {
            swap(nums[left], nums[right]);
            left++;
          }
          right++;
        }
      }
    `
  );

  assert.equal(hasFact(javaFacts, "two-pointers"), true);
  assert.equal(hasFact(javaFacts, "in-place-array-update"), true);
  assert.equal(hasFact(cppFacts, "two-pointers"), true);
  assert.equal(hasFact(cppFacts, "array-traversal"), true);
});

test("binary-search detection does not depend on conventional variable names", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int locate(int[] data, int needle) {
        int beginning = 0;
        int ending = data.length - 1;
        while (beginning <= ending) {
          int pivot = beginning + (ending - beginning) / 2;
          if (data[pivot] == needle) return pivot;
          if (data[pivot] < needle) beginning = pivot + 1;
          else ending = pivot - 1;
        }
        return -1;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int locate(vector<int>& data, int needle) {
        int beginning = 0;
        int ending = data.size() - 1;
        while (beginning <= ending) {
          int pivot = beginning + (ending - beginning) / 2;
          if (data[pivot] == needle) return pivot;
          if (data[pivot] < needle) beginning = pivot + 1;
          else ending = pivot - 1;
        }
        return -1;
      }
    `
  );

  ["binary-search", "sorted-mid-check", "logarithmic-search"].forEach((fact) => {
    assert.equal(hasFact(javaFacts, fact), true, `Java missed ${fact}`);
    assert.equal(hasFact(cppFacts, fact), true, `C++ missed ${fact}`);
  });
});

test("linked-list pointer techniques do not depend on cursor names", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      Node reverse(Node entrance) {
        Node behind = null;
        Node walker = entrance;
        while (walker != null) {
          Node saved = walker.next;
          walker.next = behind;
          behind = walker;
          walker = saved;
        }
        return behind;
      }

      boolean cycle(Node entrance) {
        Node turtle = entrance;
        Node rabbit = entrance;
        while (rabbit != null && rabbit.next != null) {
          turtle = turtle.next;
          rabbit = rabbit.next.next;
          if (turtle == rabbit) return true;
        }
        return false;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      Node* reverse(Node* entrance) {
        Node* behind = nullptr;
        Node* walker = entrance;
        while (walker != nullptr) {
          Node* saved = walker->next;
          walker->next = behind;
          behind = walker;
          walker = saved;
        }
        return behind;
      }

      bool cycle(Node* entrance) {
        Node* turtle = entrance;
        Node* rabbit = entrance;
        while (rabbit != nullptr && rabbit->next != nullptr) {
          turtle = turtle->next;
          rabbit = rabbit->next->next;
          if (turtle == rabbit) return true;
        }
        return false;
      }
    `
  );

  ["linked-list-reversal", "fast-slow-pointers", "linked-list-cycle-detection"].forEach((fact) => {
    assert.equal(hasFact(javaFacts, fact), true, `Java missed ${fact}`);
    assert.equal(hasFact(cppFacts, fact), true, `C++ missed ${fact}`);
  });
});

test("array strategy detection does not depend on accumulator names", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int gain(int[] prices) {
        int floor = prices[0];
        int reward = 0;
        for (int price : prices) {
          floor = Math.min(floor, price);
          reward = Math.max(reward, price - floor);
        }
        return reward;
      }

      int segment(int[] values) {
        int ending = values[0];
        int overall = values[0];
        for (int i = 1; i < values.length; i++) {
          ending = Math.max(values[i], ending + values[i]);
          overall = Math.max(overall, ending);
        }
        return overall;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int gain(vector<int>& prices) {
        int floor = prices[0];
        int reward = 0;
        for (int price : prices) {
          floor = min(floor, price);
          reward = max(reward, price - floor);
        }
        return reward;
      }

      int segment(vector<int>& values) {
        int ending = values[0];
        int overall = values[0];
        for (int i = 1; i < values.size(); i++) {
          ending = max(values[i], ending + values[i]);
          overall = max(overall, ending);
        }
        return overall;
      }
    `
  );

  ["min-max-tracking", "stock-profit", "kadane-algorithm"].forEach((fact) => {
    assert.equal(hasFact(javaFacts, fact), true, `Java missed ${fact}`);
    assert.equal(hasFact(cppFacts, fact), true, `C++ missed ${fact}`);
  });
});

test("DP detection does not depend on dp memo or rolling-state names", () => {
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int solve(int position, int[] values, int[] cache) {
        if (position < 0) return 0;
        if (cache[position] != -1) return cache[position];
        int include = values[position] + solve(position - 2, values, cache);
        int exclude = solve(position - 1, values, cache);
        return cache[position] = Math.max(include, exclude);
      }

      int fib(int n) {
        int older = 0;
        int newer = 1;
        for (int step = 2; step <= n; step++) {
          int combined = older + newer;
          older = newer;
          newer = combined;
        }
        return newer;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int solve(int position, vector<int>& values, vector<int>& cache) {
        if (position < 0) return 0;
        if (cache[position] != -1) return cache[position];
        int include = values[position] + solve(position - 2, values, cache);
        int exclude = solve(position - 1, values, cache);
        return cache[position] = max(include, exclude);
      }

      int fib(int n) {
        int older = 0;
        int newer = 1;
        for (int step = 2; step <= n; step++) {
          int combined = older + newer;
          older = newer;
          newer = combined;
        }
        return newer;
      }
    `
  );

  ["dp-memoization", "dp-state-transition", "bottom-up-dp", "dp-space-optimization"].forEach((fact) => {
    assert.equal(hasFact(javaFacts, fact), true, `Java missed ${fact}`);
    assert.equal(hasFact(cppFacts, fact), true, `C++ missed ${fact}`);
  });
});

test("java facts normalize hash map and hardcoded anti-patterns", () => {
  const mapFacts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        public int count(int[] nums) {
          Map<Integer, Integer> freq = new HashMap<>();
          for (int n : nums) {
            freq.put(n, freq.getOrDefault(n, 0) + 1);
          }
          return freq.size();
        }
      }
    `
  );

  assert.equal(hasFact(mapFacts, "hash-map"), true);
  assert.equal(hasFact(mapFacts, "loop"), true);

  const hardcodedFacts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        public int solve() {
          return 42;
        }
      }
    `
  );

  assert.equal(hasFact(hardcodedFacts, "hardcoded-output"), true);
});

test("java facts normalize stack and monotonic-stack signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        public static void main(String[] args) {
          int[] arr = {4, 5, 2, 10};
          Deque<Integer> st = new ArrayDeque<>();
          for (int i = arr.length - 1; i >= 0; i--) {
            while (!st.isEmpty() && st.peek() <= arr[i]) {
              st.pop();
            }
            st.push(arr[i]);
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "stack-like"), true);
  assert.equal(hasFact(facts, "stack-operations"), true);
  assert.equal(hasFact(facts, "monotonic-stack"), true);
  assert.equal(hasFact(facts, "linear-amortized"), true);
});

test("java facts normalize parenthesis matching signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        public static void main(String[] args) {
          Deque<Character> stack = new ArrayDeque<>();
          String s = "()[]{}";
          for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);
            else if (!stack.isEmpty()) stack.pop();
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "stack-like"), true);
  assert.equal(hasFact(facts, "parenthesis-matching"), true);
});

test("java facts normalize recursion and base-case signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Demo {
        public static int factorial(int n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
      }
    `
  );

  assert.equal(hasFact(facts, "recursive-call"), true);
  assert.equal(hasFact(facts, "base-case"), true);
  assert.equal(hasFact(facts, "multiple-recursive-calls"), false);
});

test("java facts normalize backtracking recursion signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      class Demo {
        void dfs(int index, int[] nums, List<Integer> path) {
          if (index == nums.length) return;
          path.add(nums[index]);
          dfs(index + 1, nums, path);
          path.remove(path.size() - 1);
          dfs(index + 1, nums, path);
        }
      }
    `
  );

  assert.equal(hasFact(facts, "recursive-call"), true);
  assert.equal(hasFact(facts, "multiple-recursive-calls"), true);
  assert.equal(hasFact(facts, "backtracking-undo"), true);
});

test("java facts normalize lower-bound binary search signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        public static void main(String[] args) {
          int[] arr = {1, 2, 4, 4, 9};
          int target = 4;
          int left = 0;
          int right = arr.length - 1;
          int ans = arr.length;
          while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] >= target) {
              ans = mid;
              right = mid - 1;
            } else {
              left = mid + 1;
            }
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "binary-search"), true);
  assert.equal(hasFact(facts, "lower-upper-bound"), true);
  assert.equal(hasFact(facts, "sorted-mid-check"), true);
  assert.equal(hasFact(facts, "logarithmic-search"), true);
});

test("java facts normalize answer-space binary search signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static boolean canFinish(int[] piles, int h, int speed) { return true; }
        public static void main(String[] args) {
          int low = 1;
          int high = 100;
          int ans = high;
          while (low <= high) {
            int mid = low + (high - low) / 2;
            if (canFinish(new int[] {3, 6, 7, 11}, 8, mid)) {
              ans = mid;
              high = mid - 1;
            } else {
              low = mid + 1;
            }
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "binary-search"), true);
  assert.equal(hasFact(facts, "answer-space-search"), true);
});

test("java facts normalize linked-list reversal signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      class Node { int data; Node next; }
      public class Main {
        static Node reverse(Node head) {
          if (head == null) return null;
          Node prev = null;
          Node curr = head;
          while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
          }
          return prev;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "linked-list-traversal"), true);
  assert.equal(hasFact(facts, "linked-list-reversal"), true);
  assert.equal(hasFact(facts, "linked-list-edge-check"), true);
});

test("java facts normalize fast-slow pointer signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      class Node { int data; Node next; }
      public class Main {
        static Node middle(Node head) {
          Node slow = head;
          Node fast = head;
          while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
          }
          return slow;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "linked-list-traversal"), true);
  assert.equal(hasFact(facts, "fast-slow-pointers"), true);
});

test("java facts normalize dummy-node and deletion signals", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      class Node { int data; Node next; Node(int value) { data = value; } }
      public class Main {
        static Node remove(Node head) {
          Node dummy = new Node(0);
          dummy.next = head;
          Node prev = dummy;
          Node curr = head;
          while (curr != null) {
            if (curr.data == 0) prev.next = curr.next;
            else prev = curr;
            curr = curr.next;
          }
          return dummy.next;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "dummy-node"), true);
  assert.equal(hasFact(facts, "node-deletion"), true);
  assert.equal(hasFact(facts, "linked-list-traversal"), true);
});

test("java facts normalize queue operations and BFS processing", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        public static void main(String[] args) {
          Queue<Integer> queue = new ArrayDeque<>();
          queue.offer(1);
          while (!queue.isEmpty()) {
            int current = queue.poll();
            if (current < 4) queue.offer(current + 1);
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "queue-like"), true);
  assert.equal(hasFact(facts, "queue-operations"), true);
  assert.equal(hasFact(facts, "bfs-queue-processing"), true);
  assert.equal(hasFact(facts, "queue-edge-check"), true);
});

test("java facts normalize circular queue index management", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class CircularQueue {
        int[] values = new int[8];
        int front = 0;
        int rear = 0;
        void offer(int value) {
          values[rear] = value;
          rear = (rear + 1) % values.length;
        }
        int poll() {
          int value = values[front];
          front = (front + 1) % values.length;
          return value;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "circular-queue"), true);
});

test("java facts normalize deque sliding-window processing", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        static void maximums(int[] values, int windowSize) {
          Deque<Integer> deque = new ArrayDeque<>();
          for (int index = 0; index < values.length; index++) {
            while (!deque.isEmpty() && deque.peekFirst() <= index - windowSize) deque.pollFirst();
            while (!deque.isEmpty() && values[deque.peekLast()] <= values[index]) deque.pollLast();
            deque.offerLast(index);
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "deque-window"), true);
  assert.equal(hasFact(facts, "linear-amortized"), true);
});

test("java facts normalize recursive tree traversal", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      class TreeNode { int val; TreeNode left, right; }
      public class Main {
        static int height(TreeNode root) {
          if (root == null) return 0;
          return 1 + Math.max(height(root.left), height(root.right));
        }
      }
    `
  );

  assert.equal(hasFact(facts, "tree-node"), true);
  assert.equal(hasFact(facts, "recursive-tree-traversal"), true);
  assert.equal(hasFact(facts, "tree-edge-check"), true);
});

test("java facts normalize level-order tree traversal", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      class TreeNode { int val; TreeNode left, right; }
      public class Main {
        static void levelOrder(TreeNode root) {
          if (root == null) return;
          Queue<TreeNode> queue = new ArrayDeque<>();
          queue.offer(root);
          while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "tree-node"), true);
  assert.equal(hasFact(facts, "level-order-tree-traversal"), true);
  assert.equal(hasFact(facts, "bfs-queue-processing"), true);
});

test("java facts normalize BST and LCA logic", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      class TreeNode { int val; TreeNode left, right; }
      public class Main {
        static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
          if (root == null || root == p || root == q) return root;
          if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left, p, q);
          if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right, p, q);
          return root;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "bst-logic"), true);
  assert.equal(hasFact(facts, "lowest-common-ancestor"), true);
});

test("java facts normalize graph adjacency and BFS traversal", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        static void bfs(List<List<Integer>> graph, int start) {
          boolean[] visited = new boolean[graph.size()];
          Queue<Integer> queue = new ArrayDeque<>();
          queue.offer(start);
          visited[start] = true;
          while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int neighbor : graph.get(node)) {
              if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
              }
            }
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "graph-adjacency"), true);
  assert.equal(hasFact(facts, "graph-traversal"), true);
  assert.equal(hasFact(facts, "graph-bfs"), true);
  assert.equal(hasFact(facts, "graph-edge-check"), true);
});

test("java facts normalize topological sorting and disjoint set", () => {
  const topoFacts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        static void topo(List<List<Integer>> graph, int[] indegree) {
          Queue<Integer> queue = new ArrayDeque<>();
          for (int node = 0; node < indegree.length; node++) {
            if (indegree[node] == 0) queue.offer(node);
          }
          while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int neighbor : graph.get(node)) {
              if (--indegree[neighbor] == 0) queue.offer(neighbor);
            }
          }
        }
      }
    `
  );
  const dsuFacts = analyzeCodeFacts(
    "java",
    `
      class Dsu {
        int[] parent;
        int find(int node) {
          if (parent[node] != node) parent[node] = find(parent[node]);
          return parent[node];
        }
        void union(int left, int right) {
          parent[find(left)] = find(right);
        }
      }
    `
  );

  assert.equal(hasFact(topoFacts, "topological-sort"), true);
  assert.equal(hasFact(dsuFacts, "disjoint-set-union"), true);
});

test("java facts normalize Dijkstra relaxation", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        static void dijkstra(List<List<int[]>> graph, int source) {
          long[] dist = new long[graph.size()];
          PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(item -> item[1]));
          pq.offer(new long[] {source, 0});
          while (!pq.isEmpty()) {
            long[] current = pq.poll();
            int node = (int) current[0];
            for (int[] edge : graph.get(node)) {
              int neighbor = edge[0];
              int weight = edge[1];
              if (dist[node] + weight < dist[neighbor]) {
                dist[neighbor] = dist[node] + weight;
                pq.offer(new long[] {neighbor, dist[neighbor]});
              }
            }
          }
        }
      }
    `
  );

  assert.equal(hasFact(facts, "graph-adjacency"), true);
  assert.equal(hasFact(facts, "shortest-path-relaxation"), true);
});

test("java facts normalize memoized dynamic programming", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;
      public class Main {
        static int solve(int index, int[] values, int[] memo) {
          if (index < 0) return 0;
          if (memo[index] != -1) return memo[index];
          int pick = values[index] + solve(index - 2, values, memo);
          int skip = solve(index - 1, values, memo);
          return memo[index] = Math.max(pick, skip);
        }
      }
    `
  );

  assert.equal(hasFact(facts, "dp-memoization"), true);
  assert.equal(hasFact(facts, "dp-state-transition"), true);
  assert.equal(hasFact(facts, "dp-edge-check"), true);
});

test("java facts normalize bottom-up and space-optimized DP", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static int fibonacci(int n) {
          if (n == 0) return 0;
          int[] dp = new int[n + 1];
          int prev = 0;
          int curr = 1;
          dp[0] = prev;
          dp[1] = curr;
          for (int i = 2; i <= n; i++) {
            int next = prev + curr;
            dp[i] = dp[i - 1] + dp[i - 2];
            prev = curr;
            curr = next;
          }
          return curr;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "bottom-up-dp"), true);
  assert.equal(hasFact(facts, "dp-state-transition"), true);
  assert.equal(hasFact(facts, "dp-space-optimization"), true);
  assert.equal(hasFact(facts, "reduced-dp-space"), true);
});

test("java facts normalize knapsack and interval DP", () => {
  const knapsackFacts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static boolean subsetSum(int[] values, int target) {
          boolean[][] dp = new boolean[values.length + 1][target + 1];
          for (int i = 1; i <= values.length; i++) {
            for (int sum = 1; sum <= target; sum++) {
              dp[i][sum] = dp[i - 1][sum];
            }
          }
          return dp[values.length][target];
        }
      }
    `
  );
  const intervalFacts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static void solve(int n) {
          int[][] dp = new int[n][n];
          for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len <= n; i++) {
              int j = i + len - 1;
              dp[i][j] = Math.min(dp[i][j - 1], dp[i + 1][j]);
            }
          }
        }
      }
    `
  );

  assert.equal(hasFact(knapsackFacts, "knapsack-dp"), true);
  assert.equal(hasFact(intervalFacts, "interval-dp"), true);
});

test("java facts normalize bit-mask operations", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static int checkBit(int n, int index) {
          if (index < 0) return 0;
          int mask = 1 << index;
          return (n & mask) == 0 ? 0 : 1;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "bitwise-and"), true);
  assert.equal(hasFact(facts, "left-shift"), true);
  assert.equal(hasFact(facts, "bit-edge-check"), true);
  assert.equal(hasFact(facts, "bit-hardcoding"), false);
});

test("java facts do not flag array scan literals as bit hardcoding", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      import java.util.*;

      public class Main {
        public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          int arr[] = new int[n];
          for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
          }
          boolean isSorted = true;
          for (int i = 1; i < n; i++) {
            if (arr[i - 1] > arr[i]) {
              isSorted = false;
            }
          }
          if (isSorted) {
            System.out.println("Sorted");
          } else {
            System.out.println("Not Sorted");
          }
          sc.close();
        }
      }
    `
  );

  assert.equal(hasFact(facts, "array-traversal"), true);
  assert.equal(hasFact(facts, "bit-hardcoding"), false);
});

test("java facts normalize Kernighan bit counting", () => {
  const facts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static int countBits(int n) {
          if (n == 0) return 0;
          int count = 0;
          while (n != 0) {
            n &= (n - 1);
            count++;
          }
          return count;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "bitwise-and"), true);
  assert.equal(hasFact(facts, "clear-lowest-set-bit"), true);
});

test("java facts normalize non-bitwise binary workarounds", () => {
  const stringFacts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static String binary(int n) {
          return Integer.toBinaryString(n);
        }
      }
    `
  );
  const moduloFacts = analyzeCodeFacts(
    "java",
    `
      public class Main {
        static int parity(int n) {
          return n % 2;
        }
      }
    `
  );

  assert.equal(hasFact(stringFacts, "binary-string-conversion"), true);
  assert.equal(hasFact(moduloFacts, "modulo-division-by-two"), true);
});

test("cpp facts normalize arrays, hash maps, and two pointers", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      #include <bits/stdc++.h>
      using namespace std;
      int main() {
        vector<int> values = {1, 2, 3, 4};
        unordered_map<int, int> frequency;
        int left = 0;
        int right = values.size() - 1;
        while (left < right) {
          swap(values[left], values[right]);
          left++;
          right--;
        }
      }
    `
  );

  assert.equal(facts.language, "cpp");
  assert.equal(hasFact(facts, "array"), true);
  assert.equal(hasFact(facts, "hash-map"), true);
  assert.equal(hasFact(facts, "two-pointers"), true);
});

test("cpp facts normalize stack, queue, and binary search", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      #include <bits/stdc++.h>
      using namespace std;
      int main() {
        stack<int> pending;
        queue<int> frontier;
        vector<int> values = {1, 3, 5, 8};
        int left = 0;
        int right = values.size() - 1;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (values[mid] < 5) left = mid + 1;
          else right = mid - 1;
        }
      }
    `
  );

  assert.equal(hasFact(facts, "stack-like"), true);
  assert.equal(hasFact(facts, "queue-like"), true);
  assert.equal(hasFact(facts, "binary-search"), true);
  assert.equal(hasFact(facts, "sorted-mid-check"), true);
});

test("cpp facts normalize linked-list and tree techniques", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      struct ListNode { int val; ListNode* next; };
      struct TreeNode { int val; TreeNode* left; TreeNode* right; };
      ListNode* reverse(ListNode* head) {
        if (!head) return nullptr;
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
          ListNode* next = curr->next;
          curr->next = prev;
          prev = curr;
          curr = next;
        }
        return prev;
      }
      int height(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(height(root->left), height(root->right));
      }
    `
  );

  assert.equal(hasFact(facts, "linked-list-reversal"), true);
  assert.equal(hasFact(facts, "recursive-tree-traversal"), true);
  assert.equal(hasFact(facts, "tree-node"), true);
});

test("cpp facts normalize graphs and dynamic programming", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      #include <bits/stdc++.h>
      using namespace std;
      void bfs(vector<vector<int>>& graph, int start) {
        vector<bool> visited(graph.size());
        queue<int> frontier;
        frontier.push(start);
        while (!frontier.empty()) {
          int node = frontier.front();
          frontier.pop();
          for (int neighbor : graph[node]) {
            if (!visited[neighbor]) frontier.push(neighbor);
          }
        }
      }
      int solve(int index, vector<int>& values, vector<int>& memo) {
        if (index < 0) return 0;
        if (memo[index] != -1) return memo[index];
        int pick = values[index] + solve(index - 2, values, memo);
        int skip = solve(index - 1, values, memo);
        return memo[index] = max(pick, skip);
      }
    `
  );

  assert.equal(hasFact(facts, "graph-adjacency"), true);
  assert.equal(hasFact(facts, "graph-bfs"), true);
  assert.equal(hasFact(facts, "dp-memoization"), true);
  assert.equal(hasFact(facts, "dp-state-transition"), true);
});

test("cpp facts normalize bit techniques", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int countBits(int n) {
        if (n == 0) return 0;
        int count = 0;
        while (n != 0) {
          n &= (n - 1);
          count++;
        }
        return count;
      }
    `
  );

  assert.equal(hasFact(facts, "bitwise-and"), true);
  assert.equal(hasFact(facts, "clear-lowest-set-bit"), true);
  assert.equal(hasFact(facts, "bit-edge-check"), true);
});

test("cpp stream operators are not classified as bit shifts", () => {
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int main() {
        ios::sync_with_stdio(false);
        cin.tie(nullptr);
        int n;
        cin >> n;
        vector<int> arr(n);
        for (int i = 0; i < n; i++) cin >> arr[i];
        int target;
        cin >> target;
        int answer = -1;
        for (int i = 0; i < n; i++) {
          if (arr[i] == target) {
            answer = i;
            break;
          }
        }
        cout << answer << '\\n';
        return 0;
      }
    `
  );

  assert.equal(hasFact(facts, "left-shift"), false);
  assert.equal(hasFact(facts, "right-shift"), false);
  assert.equal(hasFact(facts, "base-case"), false);
  assert.equal(hasFact(facts, "array-traversal"), true);
});

test("java structural facts do not depend on graph, tree, queue, or stack names", () => {
  const graphFacts = analyzeCodeFacts(
    "java",
    `
      void inspect(List<List<Integer>> network, int source) {
        boolean[] marked = new boolean[network.size()];
        Queue<Integer> pending = new ArrayDeque<>();
        pending.offer(source);
        while (!pending.isEmpty()) {
          int item = pending.poll();
          marked[item] = true;
          for (int adjacent : network.get(item)) {
            if (!marked[adjacent]) pending.offer(adjacent);
          }
        }
      }
    `
  );
  const shortestPathFacts = analyzeCodeFacts(
    "java",
    `
      void improve(int[] costs, int from, int to, int amount) {
        if (costs[to] > costs[from] + amount) {
          costs[to] = costs[from] + amount;
        }
      }
    `
  );
  const disjointSetFacts = analyzeCodeFacts(
    "java",
    `
      int rootOf(int[] leader, int item) {
        if (leader[item] != item) {
          leader[item] = rootOf(leader, leader[item]);
        }
        return leader[item];
      }
    `
  );
  const treeFacts = analyzeCodeFacts(
    "java",
    `
      int measure(TreeNode branch) {
        if (branch == null) return 0;
        return 1 + Math.max(measure(branch.left), measure(branch.right));
      }
    `
  );
  const queueFacts = analyzeCodeFacts(
    "java",
    `
      void advance() {
        writeCursor = (writeCursor + 1) % limit;
      }
    `
  );
  const stackFacts = analyzeCodeFacts(
    "java",
    `
      void store(Deque<Integer> values, Deque<Integer> lows, int item) {
        values.push(item);
        lows.push(lows.isEmpty() ? item : Math.min(item, lows.peek()));
      }
    `
  );

  assert.equal(hasFact(graphFacts, "graph-adjacency"), true);
  assert.equal(hasFact(shortestPathFacts, "shortest-path-relaxation"), true);
  assert.equal(hasFact(disjointSetFacts, "disjoint-set-union"), true);
  assert.equal(hasFact(treeFacts, "recursive-tree-traversal"), true);
  assert.equal(hasFact(queueFacts, "circular-queue"), true);
  assert.equal(hasFact(stackFacts, "min-stack"), true);
});

test("cpp structural facts do not depend on graph, tree, queue, or stack names", () => {
  const graphFacts = analyzeCodeFacts(
    "cpp",
    `
      void inspect(vector<vector<int>>& network, int source) {
        vector<bool> marked(network.size());
        queue<int> pending;
        pending.push(source);
        while (!pending.empty()) {
          int item = pending.front();
          pending.pop();
          marked[item] = true;
          for (int adjacent : network[item]) {
            if (!marked[adjacent]) pending.push(adjacent);
          }
        }
      }
    `
  );
  const shortestPathFacts = analyzeCodeFacts(
    "cpp",
    `
      void improve(vector<int>& costs, int from, int to, int amount) {
        if (costs[to] > costs[from] + amount) {
          costs[to] = costs[from] + amount;
        }
      }
    `
  );
  const disjointSetFacts = analyzeCodeFacts(
    "cpp",
    `
      int rootOf(vector<int>& leader, int item) {
        if (leader[item] != item) {
          leader[item] = rootOf(leader, leader[item]);
        }
        return leader[item];
      }
    `
  );
  const treeFacts = analyzeCodeFacts(
    "cpp",
    `
      int measure(TreeNode* branch) {
        if (!branch) return 0;
        return 1 + max(measure(branch->left), measure(branch->right));
      }
    `
  );
  const queueFacts = analyzeCodeFacts(
    "cpp",
    `
      void advance() {
        writeCursor = (writeCursor + 1) % limit;
      }
    `
  );
  const stackFacts = analyzeCodeFacts(
    "cpp",
    `
      void store(stack<int>& values, stack<int>& lows, int item) {
        values.push(item);
        lows.push(lows.empty() ? item : min(item, lows.top()));
      }
    `
  );

  assert.equal(hasFact(graphFacts, "graph-adjacency"), true);
  assert.equal(hasFact(shortestPathFacts, "shortest-path-relaxation"), true);
  assert.equal(hasFact(disjointSetFacts, "disjoint-set-union"), true);
  assert.equal(hasFact(treeFacts, "recursive-tree-traversal"), true);
  assert.equal(hasFact(queueFacts, "circular-queue"), true);
  assert.equal(hasFact(stackFacts, "min-stack"), true);
});
