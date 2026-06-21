import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import {
  scoreArraySubmissionFromFacts,
  scoreBinarySearchSubmissionFromFacts,
  scoreBitSubmissionFromFacts,
  scoreDpSubmissionFromFacts,
  scoreGraphSubmissionFromFacts,
  scoreLinkedListSubmissionFromFacts,
  scoreQueueSubmissionFromFacts,
  scoreRecursionSubmissionFromFacts,
  scoreStackSubmissionFromFacts
  ,scoreTreeSubmissionFromFacts
} from "../services/analysis-engine/factScoring";
import { matchProblemExpectations } from "../services/analysis-engine/matcher";
import { getProblemById } from "../services/storage";

const javaCheckBit = `
  class Main {
    static int solve(int n, int index) {
      if (index < 0) return 0;
      int mask = 1 << index;
      return (n & mask) == 0 ? 0 : 1;
    }
  }
`;

const cppCheckBit = `
  int solve(int n, int index) {
    if (index < 0) return 0;
    int mask = 1 << index;
    return (n & mask) == 0 ? 0 : 1;
  }
`;

test("language-neutral matcher gives Java and C++ concept parity", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);

  const javaMatch = matchProblemExpectations(problem, analyzeCodeFacts("java", javaCheckBit));
  const cppMatch = matchProblemExpectations(problem, analyzeCodeFacts("cpp", cppCheckBit));

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.equal(javaMatch.conceptMatchScore, 100);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
});

test("facts-native bit scoring gives Java and C++ score parity", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaFacts = analyzeCodeFacts("java", javaCheckBit);
  const cppFacts = analyzeCodeFacts("cpp", cppCheckBit);
  const javaScore = scoreBitSubmissionFromFacts(problem, javaFacts, matchProblemExpectations(problem, javaFacts), execution);
  const cppScore = scoreBitSubmissionFromFacts(problem, cppFacts, matchProblemExpectations(problem, cppFacts), execution);

  assert.deepEqual(javaScore, cppScore);
  assert.equal(javaScore.correctnessScore, 100);
  assert.equal(javaScore.conceptMatchScore, 100);
});

test("facts-native scoring penalizes non-bitwise constant-time workarounds", () => {
  const problem = getProblemById("bit-002");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      string solve(int n) {
        if (n == 0) return "Even";
        return n % 2 ? "Odd" : "Even";
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreBitSubmissionFromFacts(problem, facts, expectation);

  assert.equal(expectation.detection.matchedConcepts.includes("odd-even-check"), true);
  assert.equal(expectation.detection.matchedConcepts.includes("bitwise-and"), false);
  assert.ok(score.conceptMatchScore < 60);
  assert.equal(score.complexityScore, 45);
});

const javaReverseArray = `
  class Main {
    static void reverse(int[] values) {
      int left = 0;
      int right = values.length - 1;
      while (left < right) {
        int temporary = values[left];
        values[left] = values[right];
        values[right] = temporary;
        left++;
        right--;
      }
    }
  }
`;

const cppReverseArray = `
  void reverseArray(vector<int>& values) {
    int left = 0;
    int right = values.size() - 1;
    while (left < right) {
      swap(values[left], values[right]);
      left++;
      right--;
    }
  }
`;

test("facts-native array scoring gives Java and C++ two-pointer parity", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaFacts = analyzeCodeFacts("java", javaReverseArray);
  const cppFacts = analyzeCodeFacts("cpp", cppReverseArray);
  const javaExpectation = matchProblemExpectations(problem, javaFacts);
  const cppExpectation = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreArraySubmissionFromFacts(problem, javaFacts, javaExpectation, execution);
  const cppScore = scoreArraySubmissionFromFacts(problem, cppFacts, cppExpectation, execution);

  assert.deepEqual(javaExpectation.detection, cppExpectation.detection);
  assert.deepEqual(javaExpectation.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.equal(javaScore.conceptMatchScore, 100);
});

test("array matcher recognizes frequency counting in Java and C++", () => {
  const problem = getProblemById("arr-005");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int mostFrequent(int[] values) {
        Map<Integer, Integer> frequency = new HashMap<>();
        for (int value : values) {
          frequency.put(value, frequency.getOrDefault(value, 0) + 1);
        }
        return frequency.size();
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int mostFrequent(vector<int>& values) {
        unordered_map<int, int> frequency;
        for (int value : values) {
          frequency[value]++;
        }
        return frequency.size();
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(problem, javaFacts).detection, {
    matchedConcepts: ["frequency-counting"],
    missingConcepts: []
  });
  assert.deepEqual(matchProblemExpectations(problem, cppFacts).detection, {
    matchedConcepts: ["frequency-counting"],
    missingConcepts: []
  });
});

test("array matcher recognizes Kadane, sliding window, and prefix products", () => {
  const kadaneProblem = getProblemById("arr-007");
  const windowProblem = getProblemById("arr-010");
  const productProblem = getProblemById("arr-012");
  assert.ok(kadaneProblem);
  assert.ok(windowProblem);
  assert.ok(productProblem);

  const kadaneFacts = analyzeCodeFacts(
    "java",
    `
      int best(int[] values) {
        int currentSum = values[0];
        int bestSum = values[0];
        for (int i = 1; i < values.length; i++) {
          currentSum = Math.max(values[i], currentSum + values[i]);
          bestSum = Math.max(bestSum, currentSum);
        }
        return bestSum;
      }
    `
  );
  const windowFacts = analyzeCodeFacts(
    "cpp",
    `
      int longest(vector<int>& values, int target) {
        int left = 0, bestLength = 0, currentSum = 0;
        for (int right = 0; right < values.size(); right++) {
          currentSum += values[right];
          while (currentSum > target) currentSum -= values[left++];
          if (currentSum == target) bestLength = max(bestLength, right - left + 1);
        }
        return bestLength;
      }
    `
  );
  const productFacts = analyzeCodeFacts(
    "cpp",
    `
      vector<int> productExceptSelf(vector<int>& values) {
        vector<int> answer(values.size(), 1);
        int prefixProduct = 1;
        for (int i = 0; i < values.size(); i++) {
          answer[i] = prefixProduct;
          prefixProduct *= values[i];
        }
        int suffixProduct = 1;
        for (int i = values.size() - 1; i >= 0; i--) {
          answer[i] *= suffixProduct;
          suffixProduct *= values[i];
        }
        return answer;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(kadaneProblem, kadaneFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(windowProblem, windowFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(productProblem, productFacts).detection.missingConcepts, []);
});

test("facts-native array scoring penalizes quadratic work for a linear problem", () => {
  const problem = getProblemById("arr-005");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int mostFrequent(vector<int>& values) {
        int answer = values[0];
        int bestCount = 0;
        for (int i = 0; i < values.size(); i++) {
          int count = 0;
          for (int j = 0; j < values.size(); j++) {
            if (values[i] == values[j]) count++;
          }
          if (count > bestCount) {
            bestCount = count;
            answer = values[i];
          }
        }
        return answer;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreArraySubmissionFromFacts(problem, facts, expectation);

  assert.deepEqual(expectation.detection.matchedConcepts, []);
  assert.equal(score.complexityScore, 35);
  assert.ok(score.finalScore < 65);
});

test("stack matcher gives Java and C++ parity for an array-backed stack", () => {
  const problem = getProblemById("st-001");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      class ArrayStack {
        int[] values = new int[100];
        int top = -1;
        void push(int value) { values[++top] = value; }
        int pop() { return top < 0 ? -1 : values[top--]; }
        int peek() { return top < 0 ? -1 : values[top]; }
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      class ArrayStack {
        int values[100];
        int top = -1;
      public:
        void push(int value) { values[++top] = value; }
        int pop() { return top < 0 ? -1 : values[top--]; }
        int peek() { return top < 0 ? -1 : values[top]; }
      };
    `
  );

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
});

test("facts-native stack scoring gives Java and C++ monotonic-stack parity", () => {
  const problem = getProblemById("st-009");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int[] nextGreater(int[] values) {
        int[] answer = new int[values.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = values.length - 1; i >= 0; i--) {
          while (!stack.isEmpty() && stack.peek() <= values[i]) stack.pop();
          answer[i] = stack.isEmpty() ? -1 : stack.peek();
          stack.push(values[i]);
        }
        return answer;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      vector<int> nextGreater(vector<int>& values) {
        vector<int> answer(values.size(), -1);
        stack<int> candidates;
        for (int i = values.size() - 1; i >= 0; i--) {
          while (!candidates.empty() && candidates.top() <= values[i]) candidates.pop();
          answer[i] = candidates.empty() ? -1 : candidates.top();
          candidates.push(values[i]);
        }
        return answer;
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreStackSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreStackSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.equal(javaScore.conceptMatchScore, 100);
  assert.ok(javaScore.complexityScore >= 90);
});

test("stack matcher recognizes expression evaluation and histogram logic", () => {
  const postfixProblem = getProblemById("st-005");
  const histogramProblem = getProblemById("st-014");
  assert.ok(postfixProblem);
  assert.ok(histogramProblem);

  const postfixFacts = analyzeCodeFacts(
    "java",
    `
      int evaluate(String expression) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (char token : expression.toCharArray()) {
          if (Character.isDigit(token)) stack.push(token - '0');
          else {
            int right = stack.pop();
            int left = stack.pop();
            switch (token) {
              case '+': stack.push(left + right); break;
              case '-': stack.push(left - right); break;
              case '*': stack.push(left * right); break;
              default: stack.push(left / right);
            }
          }
        }
        return stack.pop();
      }
    `
  );
  const histogramFacts = analyzeCodeFacts(
    "cpp",
    `
      long long largestRectangle(vector<int>& heights) {
        stack<int> indices;
        long long maxArea = 0;
        for (int i = 0; i <= heights.size(); i++) {
          int currentHeight = i == heights.size() ? 0 : heights[i];
          while (!indices.empty() && heights[indices.top()] > currentHeight) {
            int height = heights[indices.top()];
            indices.pop();
            int width = indices.empty() ? i : i - indices.top() - 1;
            maxArea = max(maxArea, 1LL * height * width);
          }
          indices.push(i);
        }
        return maxArea;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(postfixProblem, postfixFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(histogramProblem, histogramFacts).detection.missingConcepts, []);
});

test("facts-native stack scoring penalizes quadratic next-greater scans", () => {
  const problem = getProblemById("st-009");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      vector<int> nextGreater(vector<int>& values) {
        vector<int> answer(values.size(), -1);
        for (int i = 0; i < values.size(); i++) {
          for (int j = i + 1; j < values.size(); j++) {
            if (values[j] > values[i]) {
              answer[i] = values[j];
              break;
            }
          }
        }
        return answer;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreStackSubmissionFromFacts(problem, facts, expectation);

  assert.deepEqual(expectation.detection.matchedConcepts, []);
  assert.equal(score.complexityScore, 35);
  assert.ok(score.finalScore < 60);
});

test("facts-native linked-list scoring gives Java and C++ reversal parity", () => {
  const problem = getProblemById("ll-006");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      Node reverse(Node head) {
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
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
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
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreLinkedListSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreLinkedListSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.equal(javaScore.conceptMatchScore, 100);
});

test("linked-list matcher recognizes middle and cycle patterns", () => {
  const middleProblem = getProblemById("ll-007");
  const cycleProblem = getProblemById("ll-008");
  assert.ok(middleProblem);
  assert.ok(cycleProblem);

  const middleFacts = analyzeCodeFacts(
    "java",
    `
      Node middle(Node head) {
        if (head == null) return null;
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
          slow = slow.next;
          fast = fast.next.next;
        }
        return slow;
      }
    `
  );
  const cycleFacts = analyzeCodeFacts(
    "cpp",
    `
      bool hasCycle(ListNode* head) {
        if (!head) return false;
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast != nullptr && fast->next != nullptr) {
          slow = slow->next;
          fast = fast->next->next;
          if (slow == fast) return true;
        }
        return false;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(middleProblem, middleFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(cycleProblem, cycleFacts).detection.missingConcepts, []);
});

test("linked-list matcher recognizes sorted merge and duplicate removal", () => {
  const mergeProblem = getProblemById("ll-009");
  const duplicateProblem = getProblemById("ll-010");
  assert.ok(mergeProblem);
  assert.ok(duplicateProblem);

  const mergeFacts = analyzeCodeFacts(
    "java",
    `
      Node merge(Node l1, Node l2) {
        Node dummy = new Node(0);
        Node tail = dummy;
        while (l1 != null && l2 != null) {
          if (l1.data <= l2.data) {
            tail.next = l1;
            l1 = l1.next;
          } else {
            tail.next = l2;
            l2 = l2.next;
          }
          tail = tail.next;
        }
        tail.next = l1 != null ? l1 : l2;
        return dummy.next;
      }
    `
  );
  const duplicateFacts = analyzeCodeFacts(
    "cpp",
    `
      ListNode* removeDuplicates(ListNode* head) {
        if (!head) return nullptr;
        ListNode* curr = head;
        while (curr != nullptr && curr->next != nullptr) {
          if (curr->val == curr->next->val) curr->next = curr->next->next;
          else curr = curr->next;
        }
        return head;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(mergeProblem, mergeFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(duplicateProblem, duplicateFacts).detection.missingConcepts, []);
});

test("facts-native linked-list scoring penalizes traversal for constant-time head insertion", () => {
  const problem = getProblemById("ll-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "java",
    `
      Node insertAtHead(Node head, int value) {
        Node curr = head;
        while (curr != null) {
          curr = curr.next;
        }
        Node newNode = new Node(value);
        newNode.next = head;
        head = newNode;
        return head;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreLinkedListSubmissionFromFacts(problem, facts, expectation);

  assert.deepEqual(expectation.detection.missingConcepts, []);
  assert.equal(score.complexityScore, 45);
});

test("queue matcher gives Java and C++ parity for an array-backed queue", () => {
  const problem = getProblemById("q-001");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      class ArrayQueue {
        int[] values = new int[100];
        int front = 0;
        int rear = 0;
        void enqueue(int value) { values[rear++] = value; }
        int dequeue() { return front == rear ? -1 : values[front++]; }
        int peek() { return front == rear ? -1 : values[front]; }
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      class ArrayQueue {
        int values[100];
        int front = 0;
        int rear = 0;
      public:
        void enqueue(int value) { values[rear++] = value; }
        int dequeue() { return front == rear ? -1 : values[front++]; }
        int peek() { return front == rear ? -1 : values[front]; }
      };
    `
  );

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
});

test("facts-native queue scoring gives Java and C++ deque parity", () => {
  const problem = getProblemById("q-008");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int[] maximums(int[] values, int k) {
        Deque<Integer> deque = new ArrayDeque<>();
        int[] answer = new int[values.length - k + 1];
        for (int i = 0; i < values.length; i++) {
          while (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.pollFirst();
          while (!deque.isEmpty() && values[deque.peekLast()] <= values[i]) deque.pollLast();
          deque.offerLast(i);
          if (i >= k - 1) answer[i - k + 1] = values[deque.peekFirst()];
        }
        return answer;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      vector<int> maximums(vector<int>& values, int k) {
        deque<int> candidates;
        vector<int> answer;
        for (int i = 0; i < values.size(); i++) {
          while (!candidates.empty() && candidates.front() <= i - k) candidates.pop_front();
          while (!candidates.empty() && values[candidates.back()] <= values[i]) candidates.pop_back();
          candidates.push_back(i);
          if (i >= k - 1) answer.push_back(values[candidates.front()]);
        }
        return answer;
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreQueueSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreQueueSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.ok(javaScore.complexityScore >= 90);
});

test("queue matcher recognizes binary generation, grid BFS, and circular tour", () => {
  const binaryProblem = getProblemById("q-005");
  const bfsProblem = getProblemById("q-006");
  const tourProblem = getProblemById("q-004");
  assert.ok(binaryProblem);
  assert.ok(bfsProblem);
  assert.ok(tourProblem);

  const binaryFacts = analyzeCodeFacts(
    "java",
    `
      void generate(int n) {
        Queue<String> queue = new ArrayDeque<>();
        queue.offer("1");
        for (int i = 0; i < n; i++) {
          String current = queue.poll();
          System.out.println(current);
          queue.offer(current + "0");
          queue.offer(current + "1");
        }
      }
    `
  );
  const bfsFacts = analyzeCodeFacts(
    "cpp",
    `
      int rottenOranges(vector<vector<int>>& grid) {
        queue<pair<int, int>> cells;
        int directions[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!cells.empty()) {
          int row = cells.front().first;
          int col = cells.front().second;
          cells.pop();
          for (auto& direction : directions) {
            int nextRow = row + direction[0];
            int nextCol = col + direction[1];
            cells.push({nextRow, nextCol});
          }
        }
        return 0;
      }
    `
  );
  const tourFacts = analyzeCodeFacts(
    "java",
    `
      int startTour(int[] petrol, int[] distance) {
        int totalBalance = 0;
        int currentBalance = 0;
        int start = 0;
        for (int i = 0; i < petrol.length; i++) {
          int balance = petrol[i] - distance[i];
          totalBalance += balance;
          currentBalance += balance;
          if (currentBalance < 0) {
            start = i + 1;
            currentBalance = 0;
          }
        }
        return totalBalance < 0 ? -1 : start;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(binaryProblem, binaryFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(bfsProblem, bfsFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(tourProblem, tourFacts).detection.missingConcepts, []);
});

test("queue matcher recognizes bounded heaps and task scheduling", () => {
  const topKProblem = getProblemById("q-011");
  const schedulerProblem = getProblemById("q-012");
  assert.ok(topKProblem);
  assert.ok(schedulerProblem);

  const topKFacts = analyzeCodeFacts(
    "java",
    `
      List<Integer> topK(int[] values, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int value : values) {
          heap.offer(value);
          if (heap.size() > k) heap.poll();
        }
        return new ArrayList<>(heap);
      }
    `
  );
  const schedulerFacts = analyzeCodeFacts(
    "cpp",
    `
      int schedule(vector<int>& frequency, int cooldown) {
        priority_queue<int> available;
        queue<pair<int, int>> cooling;
        int time = 0;
        while (!available.empty() || !cooling.empty()) {
          time++;
          if (!available.empty()) available.pop();
          if (!cooling.empty() && cooling.front().second <= time) {
            available.push(cooling.front().first);
            cooling.pop();
          }
        }
        return time;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(topKProblem, topKFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(schedulerProblem, schedulerFacts).detection.missingConcepts, []);
});

test("facts-native queue scoring penalizes quadratic sliding-window scans", () => {
  const problem = getProblemById("q-008");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      vector<int> maximums(vector<int>& values, int k) {
        vector<int> answer;
        for (int i = 0; i + k <= values.size(); i++) {
          int best = values[i];
          for (int j = i; j < i + k; j++) best = max(best, values[j]);
          answer.push_back(best);
        }
        return answer;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreQueueSubmissionFromFacts(problem, facts, expectation);

  assert.deepEqual(expectation.detection.matchedConcepts, []);
  assert.equal(score.complexityScore, 35);
});

test("facts-native binary-search scoring gives Java and C++ exact-search parity", () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int search(int[] values, int target) {
        int left = 0;
        int right = values.length - 1;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (values[mid] == target) return mid;
          if (values[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int search(vector<int>& values, int target) {
        int left = 0;
        int right = values.size() - 1;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (values[mid] == target) return mid;
          if (values[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreBinarySearchSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreBinarySearchSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.ok(javaScore.complexityScore >= 90);
});

test("binary-search matcher recognizes lower, upper, and insert boundaries", () => {
  const lowerProblem = getProblemById("bs-002");
  const insertProblem = getProblemById("bs-004");
  assert.ok(lowerProblem);
  assert.ok(insertProblem);

  const lowerFacts = analyzeCodeFacts(
    "java",
    `
      int lowerBound(int[] values, int target) {
        int left = 0, right = values.length - 1, ans = values.length;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (values[mid] >= target) {
            ans = mid;
            right = mid - 1;
          } else left = mid + 1;
        }
        return ans;
      }
    `
  );
  const insertFacts = analyzeCodeFacts(
    "cpp",
    `
      int searchInsert(vector<int>& values, int target) {
        int left = 0, right = values.size() - 1, ans = values.size();
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (values[mid] >= target) {
            ans = mid;
            right = mid - 1;
          } else left = mid + 1;
        }
        return ans;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(lowerProblem, lowerFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(insertProblem, insertFacts).detection.missingConcepts, []);
});

test("binary-search matcher recognizes rotated arrays, peaks, and square roots", () => {
  const rotatedProblem = getProblemById("bs-005");
  const peakProblem = getProblemById("bs-007");
  const sqrtProblem = getProblemById("bs-008");
  assert.ok(rotatedProblem);
  assert.ok(peakProblem);
  assert.ok(sqrtProblem);

  const rotatedFacts = analyzeCodeFacts(
    "java",
    `
      int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
          int mid = left + (right - left) / 2;
          if (nums[mid] == target) return mid;
          if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
          } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
          }
        }
        return -1;
      }
    `
  );
  const peakFacts = analyzeCodeFacts(
    "cpp",
    `
      int peak(vector<int>& values) {
        int left = 0, right = values.size() - 1;
        while (left < right) {
          int mid = left + (right - left) / 2;
          if (values[mid] < values[mid + 1]) left = mid + 1;
          else right = mid;
        }
        return left;
      }
    `
  );
  const sqrtFacts = analyzeCodeFacts(
    "java",
    `
      long floorSqrt(long value) {
        long left = 0, right = value, ans = 0;
        while (left <= right) {
          long mid = left + (right - left) / 2;
          long square = 1L * mid * mid;
          if (square <= value) {
            ans = mid;
            left = mid + 1;
          } else right = mid - 1;
        }
        return ans;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(rotatedProblem, rotatedFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(peakProblem, peakFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(sqrtProblem, sqrtFacts).detection.missingConcepts, []);
});

test("binary-search matcher recognizes capacity and partition searches", () => {
  const capacityProblem = getProblemById("bs-009");
  const partitionProblem = getProblemById("bs-012");
  assert.ok(capacityProblem);
  assert.ok(partitionProblem);

  const capacityFacts = analyzeCodeFacts(
    "cpp",
    `
      bool canFinish(vector<int>& piles, int hours, int speed) { return true; }
      int minimumSpeed(vector<int>& piles, int hours) {
        int low = 1, high = 100, answer = high;
        while (low <= high) {
          int mid = low + (high - low) / 2;
          if (canFinish(piles, hours, mid)) {
            answer = mid;
            high = mid - 1;
          } else low = mid + 1;
        }
        return answer;
      }
    `
  );
  const partitionFacts = analyzeCodeFacts(
    "java",
    `
      double median(int[] first, int[] second) {
        int low = 0, high = first.length;
        while (low <= high) {
          int cut1 = low + (high - low) / 2;
          int cut2 = (first.length + second.length + 1) / 2 - cut1;
          int left1 = cut1 == 0 ? Integer.MIN_VALUE : first[cut1 - 1];
          int right1 = cut1 == first.length ? Integer.MAX_VALUE : first[cut1];
          int left2 = cut2 == 0 ? Integer.MIN_VALUE : second[cut2 - 1];
          int right2 = cut2 == second.length ? Integer.MAX_VALUE : second[cut2];
          if (left1 <= right2 && left2 <= right1) return Math.max(left1, left2);
          if (left1 > right2) high = cut1 - 1;
          else low = cut1 + 1;
        }
        return 0;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(capacityProblem, capacityFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(partitionProblem, partitionFacts).detection.missingConcepts, []);
});

test("facts-native binary-search scoring penalizes a linear exact search", () => {
  const problem = getProblemById("bs-001");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int search(vector<int>& values, int target) {
        for (int i = 0; i < values.size(); i++) {
          if (values[i] == target) return i;
        }
        return -1;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreBinarySearchSubmissionFromFacts(problem, facts, expectation);

  assert.deepEqual(expectation.detection.matchedConcepts, []);
  assert.equal(score.complexityScore, 35);
});

test("facts-native tree scoring gives Java and C++ height parity", () => {
  const problem = getProblemById("tr-005");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      int height(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(height(root.left), height(root.right));
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      int height(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(height(root->left), height(root->right));
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreTreeSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreTreeSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
  assert.ok(javaScore.complexityScore >= 90);
});

test("tree matcher recognizes diameter, balance, and BST operations", () => {
  const diameterProblem = getProblemById("tr-006");
  const balanceProblem = getProblemById("tr-007");
  const searchProblem = getProblemById("tr-008");
  const mutationProblem = getProblemById("tr-010");
  assert.ok(diameterProblem);
  assert.ok(balanceProblem);
  assert.ok(searchProblem);
  assert.ok(mutationProblem);

  const diameterFacts = analyzeCodeFacts(
    "java",
    `
      int diameter = 0;
      int height(TreeNode root) {
        if (root == null) return 0;
        int leftHeight = height(root.left);
        int rightHeight = height(root.right);
        diameter = Math.max(diameter, leftHeight + rightHeight);
        return 1 + Math.max(leftHeight, rightHeight);
      }
    `
  );
  const balanceFacts = analyzeCodeFacts(
    "cpp",
    `
      int balancedHeight(TreeNode* root) {
        if (!root) return 0;
        int left = balancedHeight(root->left);
        int right = balancedHeight(root->right);
        if (left == -1 || right == -1 || abs(left - right) > 1) return -1;
        return 1 + max(left, right);
      }
    `
  );
  const searchFacts = analyzeCodeFacts(
    "java",
    `
      boolean search(TreeNode root, int target) {
        while (root != null) {
          if (root.val == target) return true;
          if (target < root.val) root = root.left;
          else root = root.right;
        }
        return false;
      }
    `
  );
  const mutationFacts = analyzeCodeFacts(
    "cpp",
    `
      TreeNode* insertNode(TreeNode* root, int value) {
        if (!root) return new TreeNode(value);
        if (value < root->val) root->left = insertNode(root->left, value);
        else root->right = insertNode(root->right, value);
        return root;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(diameterProblem, diameterFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(balanceProblem, balanceFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(searchProblem, searchFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(mutationProblem, mutationFacts).detection.missingConcepts, []);
});

test("tree matcher recognizes views, LCA, construction, and serialization", () => {
  const viewProblem = getProblemById("tr-009");
  const lcaProblem = getProblemById("tr-013");
  const constructionProblem = getProblemById("tr-014");
  const serializationProblem = getProblemById("tr-015");
  assert.ok(viewProblem);
  assert.ok(lcaProblem);
  assert.ok(constructionProblem);
  assert.ok(serializationProblem);

  const viewFacts = analyzeCodeFacts(
    "java",
    `
      List<Integer> leftView(TreeNode root) {
        List<Integer> answer = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
          int levelSize = queue.size();
          for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            if (i == 0) answer.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
          }
        }
        return answer;
      }
    `
  );
  const lcaFacts = analyzeCodeFacts(
    "cpp",
    `
      TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root || root == p || root == q) return root;
        TreeNode* left = lowestCommonAncestor(root->left, p, q);
        TreeNode* right = lowestCommonAncestor(root->right, p, q);
        if (left != nullptr && right != nullptr) return root;
        return left ? left : right;
      }
    `
  );
  const constructionFacts = analyzeCodeFacts(
    "java",
    `
      TreeNode buildTree(int[] preorder, int[] inorder, Map<Integer, Integer> inorderMap, int left, int right) {
        if (left > right) return null;
        int rootValue = preorder[preorderIndex++];
        TreeNode root = new TreeNode(rootValue);
        int splitIndex = inorderMap.get(rootValue);
        root.left = buildTree(preorder, inorder, inorderMap, left, splitIndex - 1);
        root.right = buildTree(preorder, inorder, inorderMap, splitIndex + 1, right);
        return root;
      }
    `
  );
  const serializationFacts = analyzeCodeFacts(
    "cpp",
    `
      string serialize(TreeNode* root) {
        queue<TreeNode*> nodes;
        vector<string> tokens;
        nodes.push(root);
        while (!nodes.empty()) {
          TreeNode* node = nodes.front();
          nodes.pop();
          if (!node) {
            tokens.push_back("#");
            continue;
          }
          tokens.push_back(to_string(node->val));
          nodes.push(node->left);
          nodes.push(node->right);
        }
        return "";
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(viewProblem, viewFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(lcaProblem, lcaFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(constructionProblem, constructionFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(serializationProblem, serializationFacts).detection.missingConcepts, []);
});

test("facts-native tree scoring penalizes repeated-height balance checks", () => {
  const problem = getProblemById("tr-007");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "java",
    `
      int height(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(height(root.left), height(root.right));
      }
      boolean isBalanced(TreeNode root) {
        if (root == null) return true;
        int leftHeight = height(root.left);
        int rightHeight = height(root.right);
        return Math.abs(leftHeight - rightHeight) <= 1
          && isBalanced(root.left)
          && isBalanced(root.right);
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreTreeSubmissionFromFacts(problem, facts, expectation);

  assert.equal(score.complexityScore, 35);
  assert.ok(score.qualityScore < 80);
});

test("facts-native graph scoring gives Java and C++ BFS parity", () => {
  const problem = getProblemById("gr-003");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      void bfs(List<List<Integer>> graph) {
        boolean[] visited = new boolean[graph.size()];
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(0);
        visited[0] = true;
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
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      void bfs(vector<vector<int>>& graph) {
        vector<bool> visited(graph.size(), false);
        queue<int> frontier;
        frontier.push(0);
        visited[0] = true;
        while (!frontier.empty()) {
          int node = frontier.front();
          frontier.pop();
          for (int neighbor : graph[node]) {
            if (!visited[neighbor]) {
              visited[neighbor] = true;
              frontier.push(neighbor);
            }
          }
        }
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 3,
    totalCount: 3,
    failedCases: []
  };

  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);
  const javaScore = scoreGraphSubmissionFromFacts(problem, javaFacts, javaMatch, execution);
  const cppScore = scoreGraphSubmissionFromFacts(problem, cppFacts, cppMatch, execution);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.matchedConcepts, problem.expectedConcepts);
  assert.deepEqual(javaScore, cppScore);
});

test("graph matcher recognizes components, cycles, and grid shortest paths", () => {
  const componentsProblem = getProblemById("gr-004");
  const cycleProblem = getProblemById("gr-005");
  const gridProblem = getProblemById("gr-008");
  assert.ok(componentsProblem);
  assert.ok(cycleProblem);
  assert.ok(gridProblem);

  const componentsFacts = analyzeCodeFacts(
    "java",
    `
      void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
        visited[node] = true;
        for (int neighbor : graph.get(node)) if (!visited[neighbor]) dfs(neighbor, graph, visited);
      }
      int components(List<List<Integer>> graph) {
        boolean[] visited = new boolean[graph.size()];
        int components = 0;
        for (int i = 0; i < graph.size(); i++) {
          if (!visited[i]) {
            components++;
            dfs(i, graph, visited);
          }
        }
        return components;
      }
    `
  );
  const cycleFacts = analyzeCodeFacts(
    "cpp",
    `
      bool dfs(int node, int parent, vector<vector<int>>& graph, vector<bool>& visited) {
        visited[node] = true;
        for (int neighbor : graph[node]) {
          if (!visited[neighbor] && dfs(neighbor, node, graph, visited)) return true;
          if (visited[neighbor] && neighbor != parent) return true;
        }
        return false;
      }
    `
  );
  const gridFacts = analyzeCodeFacts(
    "java",
    `
      int shortestPath(int[][] grid) {
        Queue<int[]> queue = new ArrayDeque<>();
        int[][] distance = new int[grid.length][grid[0].length];
        int[][] directions = {{1,0},{-1,0},{0,1},{0,-1}};
        queue.offer(new int[] {0, 0});
        while (!queue.isEmpty()) {
          int[] cell = queue.poll();
          int row = cell[0], col = cell[1];
          for (int[] direction : directions) {
            int nextRow = row + direction[0];
            int nextCol = col + direction[1];
            distance[nextRow][nextCol] = distance[row][col] + 1;
            queue.offer(new int[] {nextRow, nextCol});
          }
        }
        return distance[grid.length - 1][grid[0].length - 1];
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(componentsProblem, componentsFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(cycleProblem, cycleFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(gridProblem, gridFacts).detection.missingConcepts, []);
});

test("graph matcher recognizes topological sort, Dijkstra, DSU, and MST", () => {
  const topoProblem = getProblemById("gr-009");
  const dijkstraProblem = getProblemById("gr-012");
  const dsuProblem = getProblemById("gr-014");
  const mstProblem = getProblemById("gr-015");
  assert.ok(topoProblem);
  assert.ok(dijkstraProblem);
  assert.ok(dsuProblem);
  assert.ok(mstProblem);

  const topoFacts = analyzeCodeFacts(
    "java",
    `
      List<Integer> topo(List<List<Integer>> graph, int[] indegree) {
        Queue<Integer> queue = new ArrayDeque<>();
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < indegree.length; i++) if (indegree[i] == 0) queue.offer(i);
        while (!queue.isEmpty()) {
          int node = queue.poll();
          order.add(node);
          for (int neighbor : graph.get(node)) if (--indegree[neighbor] == 0) queue.offer(neighbor);
        }
        return order;
      }
    `
  );
  const dijkstraFacts = analyzeCodeFacts(
    "cpp",
    `
      void dijkstra(vector<vector<pair<int,int>>>& graph, int source) {
        vector<long long> dist(graph.size(), 1e18);
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<pair<long long,int>>> pq;
        dist[source] = 0;
        pq.push({0, source});
        while (!pq.empty()) {
          auto [distance, node] = pq.top();
          pq.pop();
          for (auto [neighbor, weight] : graph[node]) {
            if (dist[node] + weight < dist[neighbor]) {
              dist[neighbor] = dist[node] + weight;
              pq.push({dist[neighbor], neighbor});
            }
          }
        }
      }
    `
  );
  const dsuFacts = analyzeCodeFacts(
    "java",
    `
      int find(int node) {
        if (parent[node] == node) return node;
        return parent[node] = find(parent[node]);
      }
      void union(int first, int second) {
        int rootA = find(first), rootB = find(second);
        if (rank[rootA] < rank[rootB]) parent[rootA] = rootB;
        else parent[rootB] = rootA;
      }
    `
  );
  const mstFacts = analyzeCodeFacts(
    "cpp",
    `
      long long kruskal(vector<Edge>& edges) {
        sort(edges.begin(), edges.end());
        long long cost = 0;
        for (auto edge : edges) {
          if (find(edge.u) != find(edge.v)) {
            unite(edge.u, edge.v);
            cost += edge.weight;
          }
        }
        return cost;
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(topoProblem, topoFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(dijkstraProblem, dijkstraFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(dsuProblem, dsuFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(mstProblem, mstFacts).detection.missingConcepts, []);
});

test("facts-native graph scoring penalizes DFS for unweighted shortest path", () => {
  const problem = getProblemById("gr-011");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "java",
    `
      void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
        visited[node] = true;
        for (int neighbor : graph.get(node)) {
          if (!visited[neighbor]) dfs(neighbor, graph, visited);
        }
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreGraphSubmissionFromFacts(problem, facts, expectation);

  assert.equal(score.complexityScore, 35);
  assert.ok(score.qualityScore < 80);
});

test("facts-native DP scoring gives Java and C++ rolling-state parity", () => {
  const problem = getProblemById("dp-002");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts(
    "java",
    `
      long climb(int n) {
        if (n == 1) return 1;
        long previous = 1, current = 2;
        for (int step = 3; step <= n; step++) {
          long next = previous + current;
          previous = current;
          current = next;
        }
        return current;
      }
    `
  );
  const cppFacts = analyzeCodeFacts(
    "cpp",
    `
      long long climb(int n) {
        if (n == 1) return 1;
        long long previous = 1, current = 2;
        for (int step = 3; step <= n; step++) {
          long long next = previous + current;
          previous = current;
          current = next;
        }
        return current;
      }
    `
  );
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 2,
    totalCount: 2,
    failedCases: []
  };
  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.missingConcepts, []);
  assert.deepEqual(
    scoreDpSubmissionFromFacts(problem, javaFacts, javaMatch, execution),
    scoreDpSubmissionFromFacts(problem, cppFacts, cppMatch, execution)
  );
});

test("DP matcher recognizes grid, sequence, string, and interval families", () => {
  const gridProblem = getProblemById("dp-006");
  const sequenceProblem = getProblemById("dp-011");
  const stringProblem = getProblemById("dp-013");
  const intervalProblem = getProblemById("dp-015");
  assert.ok(gridProblem);
  assert.ok(sequenceProblem);
  assert.ok(stringProblem);
  assert.ok(intervalProblem);

  const gridFacts = analyzeCodeFacts(
    "java",
    `
      long paths(int rows, int cols) {
        long[][] dp = new long[rows][cols];
        for (int i = 0; i < rows; i++) {
          for (int j = 0; j < cols; j++) {
            if (i == 0 || j == 0) dp[i][j] = 1;
            else dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
          }
        }
        return dp[rows - 1][cols - 1];
      }
    `
  );
  const sequenceFacts = analyzeCodeFacts(
    "cpp",
    `
      int lis(vector<int>& nums) {
        vector<int> dp(nums.size(), 1);
        for (int i = 0; i < nums.size(); i++)
          for (int j = 0; j < i; j++)
            if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);
        return *max_element(dp.begin(), dp.end());
      }
    `
  );
  const stringFacts = analyzeCodeFacts(
    "java",
    `
      int lcs(String first, String second) {
        int[][] dp = new int[first.length() + 1][second.length() + 1];
        for (int i = 1; i <= first.length(); i++)
          for (int j = 1; j <= second.length(); j++)
            if (first.charAt(i - 1) == second.charAt(j - 1)) dp[i][j] = 1 + dp[i - 1][j - 1];
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        return dp[first.length()][second.length()];
      }
    `
  );
  const intervalFacts = analyzeCodeFacts(
    "cpp",
    `
      int solve(int n) {
        vector<vector<int>> dp(n, vector<int>(n));
        for (int len = 2; len <= n; len++)
          for (int i = 0; i + len <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = min(dp[i][j - 1], dp[i + 1][j]);
          }
        return dp[0][n - 1];
      }
    `
  );

  assert.deepEqual(matchProblemExpectations(gridProblem, gridFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(sequenceProblem, sequenceFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(stringProblem, stringFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(intervalProblem, intervalFacts).detection.missingConcepts, []);
});

test("facts-native DP scoring penalizes uncached exponential recursion", () => {
  const problem = getProblemById("dp-001");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "java",
    `
      int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreDpSubmissionFromFacts(problem, facts, expectation);

  assert.equal(score.complexityScore, 25);
  assert.ok(score.qualityScore < 70);
});

test("facts-native recursion scoring gives Java and C++ factorial parity", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const javaFacts = analyzeCodeFacts("java", `int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }`);
  const cppFacts = analyzeCodeFacts("cpp", `int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }`);
  const execution = {
    usedTestCases: true,
    compileSucceeded: true,
    passedCount: 2,
    totalCount: 2,
    failedCases: []
  };
  const javaMatch = matchProblemExpectations(problem, javaFacts);
  const cppMatch = matchProblemExpectations(problem, cppFacts);

  assert.deepEqual(javaMatch.detection, cppMatch.detection);
  assert.deepEqual(javaMatch.detection.missingConcepts, []);
  assert.deepEqual(
    scoreRecursionSubmissionFromFacts(problem, javaFacts, javaMatch, execution),
    scoreRecursionSubmissionFromFacts(problem, cppFacts, cppMatch, execution)
  );
});

test("recursion matcher recognizes subsequences, permutations, memoization, divide and search", () => {
  const subsequenceProblem = getProblemById("rec-013");
  const permutationProblem = getProblemById("rec-016");
  const memoProblem = getProblemById("rec-019");
  const divideProblem = getProblemById("rec-021");
  const searchProblem = getProblemById("rec-024");
  assert.ok(subsequenceProblem);
  assert.ok(permutationProblem);
  assert.ok(memoProblem);
  assert.ok(divideProblem);
  assert.ok(searchProblem);

  const subsequenceFacts = analyzeCodeFacts("java", `
    void generate(int index, int[] nums, List<Integer> path) {
      if (index == nums.length) return;
      path.add(nums[index]);
      generate(index + 1, nums, path);
      path.remove(path.size() - 1);
      generate(index + 1, nums, path);
    }
  `);
  const permutationFacts = analyzeCodeFacts("cpp", `
    void permute(int index, vector<int>& nums) {
      if (index == nums.size()) return;
      for (int i = index; i < nums.size(); i++) {
        swap(nums[index], nums[i]);
        permute(index + 1, nums);
        swap(nums[index], nums[i]);
      }
    }
  `);
  const memoFacts = analyzeCodeFacts("java", `
    int climb(int n, int[] memo) {
      if (n <= 1) return 1;
      if (memo[n] != -1) return memo[n];
      return memo[n] = climb(n - 1, memo) + climb(n - 2, memo);
    }
  `);
  const divideFacts = analyzeCodeFacts("cpp", `
    void mergeSort(vector<int>& arr, int left, int right) {
      if (left >= right) return;
      int mid = (left + right) / 2;
      mergeSort(arr, left, mid);
      mergeSort(arr, mid + 1, right);
      merge(arr, left, mid, right);
    }
  `);
  const searchFacts = analyzeCodeFacts("java", `
    void queens(int row, char[][] board) {
      if (row == board.length) return;
      for (int column = 0; column < board.length; column++) {
        if (!isSafe(board, row, column)) continue;
        board[row][column] = 'Q';
        queens(row + 1, board);
        board[row][column] = '.';
      }
    }
  `);

  assert.deepEqual(matchProblemExpectations(subsequenceProblem, subsequenceFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(permutationProblem, permutationFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(memoProblem, memoFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(divideProblem, divideFacts).detection.missingConcepts, []);
  assert.deepEqual(matchProblemExpectations(searchProblem, searchFacts).detection.missingConcepts, []);
});

test("facts-native recursion scoring penalizes an iterative substitute", () => {
  const problem = getProblemById("rec-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts("cpp", `
    int factorial(int n) {
      int answer = 1;
      for (int value = 2; value <= n; value++) answer *= value;
      return answer;
    }
  `);
  const score = scoreRecursionSubmissionFromFacts(problem, facts, matchProblemExpectations(problem, facts));

  assert.ok(score.correctnessScore <= 35);
  assert.ok(score.finalScore < 60);
});
