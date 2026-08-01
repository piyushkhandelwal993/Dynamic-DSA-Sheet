import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const batches = {
  "rec-015": [
    {
      candidateType: "correct-optimal",
      label: "reuse-backtrack",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> answer = new ArrayList<>();
        backtrack(candidates, 0, target, new ArrayList<>(), answer);
        return answer;
    }

    private void backtrack(int[] candidates, int index, int remaining, List<Integer> path, List<List<Integer>> answer) {
        if (remaining == 0) {
            answer.add(new ArrayList<>(path));
            return;
        }
        for (int i = index; i < candidates.length; i++) {
            if (candidates[i] > remaining) break;
            path.add(candidates[i]);
            backtrack(candidates, i, remaining - candidates[i], path, answer);
            path.remove(path.size() - 1);
        }
    }
}`,
      notes: "Standard reuse-and-backtrack solution."
    },
    {
      candidateType: "correct-alternate",
      label: "choose-or-skip",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> answer = new ArrayList<>();
        dfs(candidates, 0, target, new ArrayList<>(), answer);
        return answer;
    }

    private void dfs(int[] candidates, int index, int remaining, List<Integer> path, List<List<Integer>> answer) {
        if (remaining == 0) {
            answer.add(new ArrayList<>(path));
            return;
        }
        if (index == candidates.length || remaining < 0) return;
        path.add(candidates[index]);
        dfs(candidates, index, remaining - candidates[index], path, answer);
        path.remove(path.size() - 1);
        dfs(candidates, index + 1, remaining, path, answer);
    }
}`,
      notes: "Two-branch recursion with reuse first."
    },
    {
      candidateType: "suboptimal",
      label: "brute-force-filter",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> answer = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        brute(candidates, 0, target, path, answer);
        return answer;
    }

    private void brute(int[] candidates, int index, int target, List<Integer> path, List<List<Integer>> answer) {
        if (target == 0) {
            answer.add(new ArrayList<>(path));
            return;
        }
        if (index == candidates.length || target < 0) return;
        path.add(candidates[index]);
        brute(candidates, index, target - candidates[index], path, answer);
        path.remove(path.size() - 1);
        brute(candidates, index + 1, target, path, answer);
    }
}`,
      notes: "Valid but less disciplined branching."
    },
    {
      candidateType: "incorrect",
      label: "no-reuse-only",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> answer = new ArrayList<>();
        helper(candidates, 0, target, new ArrayList<>(), answer);
        return answer;
    }

    private void helper(int[] candidates, int index, int remaining, List<Integer> path, List<List<Integer>> answer) {
        if (remaining == 0) {
            answer.add(new ArrayList<>(path));
            return;
        }
        if (index == candidates.length || remaining < 0) return;
        path.add(candidates[index]);
        helper(candidates, index + 1, remaining - candidates[index], path, answer);
        path.remove(path.size() - 1);
        helper(candidates, index + 1, remaining, path, answer);
    }
}`,
      notes: "Forgets reuse and misses valid repeated picks."
    },
    {
      candidateType: "hardcoded",
      label: "sample-only",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> answer = new ArrayList<>();
        if (target == 7) {
            answer.add(Arrays.asList(2, 2, 3));
            answer.add(Arrays.asList(7));
        }
        return answer;
    }
}`,
      notes: "Hardcoded to a sample target."
    }
  ],
  "rec-016": [
    {
      candidateType: "correct-optimal",
      label: "used-array-backtrack",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(nums, used, new ArrayList<>(), answer);
        return answer;
    }

    private void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> answer) {
        if (path.size() == nums.length) {
            answer.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(nums, used, path, answer);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}`,
      notes: "Classic used-array permutation generation."
    },
    {
      candidateType: "correct-alternate",
      label: "swap-recursion",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        permute(nums, 0, answer);
        return answer;
    }

    private void permute(int[] nums, int index, List<List<Integer>> answer) {
        if (index == nums.length) {
            List<Integer> current = new ArrayList<>();
            for (int value : nums) current.add(value);
            answer.add(current);
            return;
        }
        for (int i = index; i < nums.length; i++) {
            swap(nums, index, i);
            permute(nums, index + 1, answer);
            swap(nums, index, i);
        }
    }

    private void swap(int[] nums, int i, int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
}`,
      notes: "In-place swap permutation style."
    },
    {
      candidateType: "incorrect",
      label: "fixed-order",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        answer.add(Arrays.asList(nums[0], nums[1], nums[2]));
        return answer;
    }
}`,
      notes: "Does not actually explore all permutations."
    },
    {
      candidateType: "suboptimal",
      label: "sort-and-accumulate",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> answer = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        build(nums, used, new ArrayList<>(), answer);
        return answer;
    }

    private void build(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> answer) {
        if (path.size() == nums.length) {
            answer.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            build(nums, used, path, answer);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}`,
      notes: "Valid but unnecessary sort."
    },
    {
      candidateType: "hardcoded",
      label: "single-order",
      code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        answer.add(new ArrayList<>());
        for (int value : nums) answer.get(0).add(value);
        return answer;
    }
}`,
      notes: "Returns only one arrangement."
    }
  ],
  "rec-020": [
    {
      candidateType: "correct-optimal",
      label: "memo-topdown",
      code: `import java.util.*;

class Solution {
    private Integer[] memo;

    public int tribonacci(int n) {
        memo = new Integer[n + 1];
        return solve(n);
    }

    private int solve(int n) {
        if (n == 0) return 0;
        if (n == 1 || n == 2) return 1;
        if (memo[n] != null) return memo[n];
        memo[n] = solve(n - 1) + solve(n - 2) + solve(n - 3);
        return memo[n];
    }
}`,
      notes: "Memoized tree recursion."
    },
    {
      candidateType: "correct-alternate",
      label: "iterative-equivalent",
      code: `import java.util.*;

class Solution {
    public int tribonacci(int n) {
        if (n == 0) return 0;
        if (n == 1 || n == 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 3; i <= n; i++) {
            int next = a + b + c;
            a = b;
            b = c;
            c = next;
        }
        return c;
    }
}`,
      notes: "Iterative equivalent, useful contrast candidate."
    },
    {
      candidateType: "incorrect",
      label: "fibonacci-mistake",
      code: `import java.util.*;

class Solution {
    public int tribonacci(int n) {
        if (n <= 1) return n;
        return tribonacci(n - 1) + tribonacci(n - 2);
    }
}`,
      notes: "Wrong recurrence omits the third branch."
    },
    {
      candidateType: "suboptimal",
      label: "recompute-tree",
      code: `import java.util.*;

class Solution {
    public int tribonacci(int n) {
        if (n == 0) return 0;
        if (n == 1 || n == 2) return 1;
        return tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
    }
}`,
      notes: "Correct but exponential tree recursion."
    },
    {
      candidateType: "hardcoded",
      label: "small-cases-only",
      code: `import java.util.*;

class Solution {
    public int tribonacci(int n) {
        int[] known = {0, 1, 1, 2, 4, 7};
        if (n < known.length) return known[n];
        return -1;
    }
}`,
      notes: "Only handles a small prefix."
    }
  ],
  "rec-017": [
    {
      candidateType: "correct-optimal",
      label: "recursive-moves",
      code: `import java.util.*;

class Solution {
    public List<String> towerOfHanoi(int n) {
        List<String> moves = new ArrayList<>();
        solve(n, 'A', 'B', 'C', moves);
        return moves;
    }

    private void solve(int n, char source, char auxiliary, char destination, List<String> moves) {
        if (n == 0) return;
        solve(n - 1, source, destination, auxiliary, moves);
        moves.add(source + "->" + destination);
        solve(n - 1, auxiliary, source, destination, moves);
    }
}`,
      notes: "Classic recursive move construction."
    },
    {
      candidateType: "correct-alternate",
      label: "string-builder-moves",
      code: `import java.util.*;

class Solution {
    public List<String> towerOfHanoi(int n) {
        List<String> moves = new ArrayList<>();
        hanoi(n, "A", "B", "C", moves);
        return moves;
    }

    private void hanoi(int n, String source, String auxiliary, String destination, List<String> moves) {
        if (n == 1) {
            moves.add(source + "->" + destination);
            return;
        }
        hanoi(n - 1, source, destination, auxiliary, moves);
        moves.add(source + "->" + destination);
        hanoi(n - 1, auxiliary, source, destination, moves);
    }
}`,
      notes: "String-parameter variation."
    },
    {
      candidateType: "incorrect",
      label: "single-move-only",
      code: `import java.util.*;

class Solution {
    public List<String> towerOfHanoi(int n) {
        List<String> moves = new ArrayList<>();
        moves.add("A->C");
        return moves;
    }
}`,
      notes: "Only prints the final move."
    },
    {
      candidateType: "suboptimal",
      label: "iterative-simulation",
      code: `import java.util.*;

class Solution {
    public List<String> towerOfHanoi(int n) {
        List<String> moves = new ArrayList<>();
        for (int i = 0; i < (1 << n) - 1; i++) {
            moves.add("A->C");
        }
        return moves;
    }
}`,
      notes: "Uses the right move count but not the right recursion."
    },
    {
      candidateType: "hardcoded",
      label: "n2-sample",
      code: `import java.util.*;

class Solution {
    public List<String> towerOfHanoi(int n) {
        List<String> moves = new ArrayList<>();
        if (n == 2) {
            moves.add("A->B");
            moves.add("A->C");
            moves.add("B->C");
        }
        return moves;
    }
}`,
      notes: "Hardcoded sample output."
    }
  ],
  "rec-021": [
    {
      candidateType: "correct-optimal",
      label: "merge-sort-recursive",
      code: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] nums) {
        if (nums.length <= 1) return nums;
        int mid = nums.length / 2;
        int[] left = Arrays.copyOfRange(nums, 0, mid);
        int[] right = Arrays.copyOfRange(nums, mid, nums.length);
        return merge(mergeSort(left), mergeSort(right));
    }

    private int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            result[k++] = left[i] <= right[j] ? left[i++] : right[j++];
        }
        while (i < left.length) result[k++] = left[i++];
        while (j < right.length) result[k++] = right[j++];
        return result;
    }
}`,
      notes: "Straightforward merge sort."
    },
    {
      candidateType: "correct-alternate",
      label: "inplace-buffer",
      code: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] nums) {
        int[] temp = new int[nums.length];
        sort(nums, temp, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] nums, int[] temp, int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        sort(nums, temp, left, mid);
        sort(nums, temp, mid + 1, right);
        int i = left, j = mid + 1, k = left;
        while (i <= mid && j <= right) temp[k++] = nums[i] <= nums[j] ? nums[i++] : nums[j++];
        while (i <= mid) temp[k++] = nums[i++];
        while (j <= right) temp[k++] = nums[j++];
        for (int p = left; p <= right; p++) nums[p] = temp[p];
    }
}`,
      notes: "In-place merge sort with temp buffer."
    },
    {
      candidateType: "incorrect",
      label: "half-sorted",
      code: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] nums) {
        Arrays.sort(nums);
        return Arrays.copyOf(nums, nums.length - 1);
    }
}`,
      notes: "Drops an element and is not the intended recursion."
    },
    {
      candidateType: "suboptimal",
      label: "recursive-partition-without-merge",
      code: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] nums) {
        if (nums.length <= 1) return nums;
        int mid = nums.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(nums, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(nums, mid, nums.length));
        int[] combined = new int[nums.length];
        System.arraycopy(left, 0, combined, 0, left.length);
        System.arraycopy(right, 0, combined, left.length, right.length);
        Arrays.sort(combined);
        return combined;
    }
}`,
      notes: "Recurses then re-sorts instead of merging."
    },
    {
      candidateType: "hardcoded",
      label: "already-sorted",
      code: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] nums) {
        return nums;
    }
}`,
      notes: "Does nothing."
    }
  ],
  "rec-022": [
    {
      candidateType: "correct-optimal",
      label: "quicksort-hoare",
      code: `import java.util.*;

class Solution {
    public int[] quickSort(int[] nums) {
        sort(nums, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] nums, int left, int right) {
        if (left >= right) return;
        int i = left, j = right, pivot = nums[left + (right - left) / 2];
        while (i <= j) {
            while (nums[i] < pivot) i++;
            while (nums[j] > pivot) j--;
            if (i <= j) {
                int tmp = nums[i];
                nums[i] = nums[j];
                nums[j] = tmp;
                i++;
                j--;
            }
        }
        sort(nums, left, j);
        sort(nums, i, right);
    }
}`,
      notes: "Standard quicksort partition recursion."
    },
    {
      candidateType: "correct-alternate",
      label: "lomuto-partition",
      code: `import java.util.*;

class Solution {
    public int[] quickSort(int[] nums) {
        quickSort(nums, 0, nums.length - 1);
        return nums;
    }

    private void quickSort(int[] nums, int low, int high) {
        if (low >= high) return;
        int pivotIndex = partition(nums, low, high);
        quickSort(nums, low, pivotIndex - 1);
        quickSort(nums, pivotIndex + 1, high);
    }

    private int partition(int[] nums, int low, int high) {
        int pivot = nums[high];
        int i = low;
        for (int j = low; j < high; j++) {
            if (nums[j] <= pivot) {
                int temp = nums[i];
                nums[i] = nums[j];
                nums[j] = temp;
                i++;
            }
        }
        int temp = nums[i];
        nums[i] = nums[high];
        nums[high] = temp;
        return i;
    }
}`,
      notes: "Lomuto partition variant."
    },
    {
      candidateType: "incorrect",
      label: "single-pivot-pass",
      code: `import java.util.*;

class Solution {
    public int[] quickSort(int[] nums) {
        Arrays.sort(nums);
        return new int[] { nums[0] };
    }
}`,
      notes: "Returns only one value."
    },
    {
      candidateType: "suboptimal",
      label: "partition-then-sort",
      code: `import java.util.*;

class Solution {
    public int[] quickSort(int[] nums) {
        if (nums.length <= 1) return nums;
        int pivot = nums[0];
        List<Integer> left = new ArrayList<>();
        List<Integer> right = new ArrayList<>();
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] < pivot) left.add(nums[i]);
            else right.add(nums[i]);
        }
        Collections.sort(left);
        Collections.sort(right);
        int[] result = new int[nums.length];
        int k = 0;
        for (int value : left) result[k++] = value;
        result[k++] = pivot;
        for (int value : right) result[k++] = value;
        return result;
    }
}`,
      notes: "Uses partitioning but resorts halves."
    },
    {
      candidateType: "hardcoded",
      label: "unchanged",
      code: `import java.util.*;

class Solution {
    public int[] quickSort(int[] nums) {
        return nums;
    }
}`,
      notes: "No sorting at all."
    }
  ],
  "rec-023": [
    {
      candidateType: "correct-optimal",
      label: "backtracking-board",
      code: `import java.util.*;

class Solution {
    public void solveSudoku(int[][] board) {
        solve(board);
    }

    private boolean solve(int[][] board) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] == 0) {
                    for (int digit = 1; digit <= 9; digit++) {
                        if (isValid(board, row, col, digit)) {
                            board[row][col] = digit;
                            if (solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isValid(int[][] board, int row, int col, int digit) {
        for (int i = 0; i < 9; i++) {
            if (board[row][i] == digit || board[i][col] == digit) return false;
        }
        int startRow = (row / 3) * 3;
        int startCol = (col / 3) * 3;
        for (int r = startRow; r < startRow + 3; r++) {
            for (int c = startCol; c < startCol + 3; c++) {
                if (board[r][c] == digit) return false;
            }
        }
        return true;
    }
}`,
      notes: "Classic recursive Sudoku solver."
    },
    {
      candidateType: "incorrect",
      label: "fill-row-only",
      code: `import java.util.*;

class Solution {
    public void solveSudoku(int[][] board) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] == 0) board[row][col] = row + 1;
            }
        }
    }
}`,
      notes: "Does not solve the puzzle."
    },
    {
      candidateType: "suboptimal",
      label: "scan-and-fill",
      code: `import java.util.*;

class Solution {
    public void solveSudoku(int[][] board) {
        solve(board);
    }

    private boolean solve(int[][] board) {
        int[] cell = findEmpty(board);
        if (cell == null) return true;
        int row = cell[0], col = cell[1];
        for (int digit = 1; digit <= 9; digit++) {
            if (isValid(board, row, col, digit)) {
                board[row][col] = digit;
                if (solve(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    private int[] findEmpty(int[][] board) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] == 0) return new int[] { row, col };
            }
        }
        return null;
    }

    private boolean isValid(int[][] board, int row, int col, int digit) {
        for (int i = 0; i < 9; i++) {
            if (board[row][i] == digit || board[i][col] == digit) return false;
        }
        return true;
    }
}`,
      notes: "Valid but weaker validation."
    },
    {
      candidateType: "hardcoded",
      label: "sample-grid-only",
      code: `import java.util.*;

class Solution {
    public void solveSudoku(int[][] board) {
        if (board.length == 9) {
            board[0][0] = 5;
        }
    }
}`,
      notes: "Only patches a sample cell."
    },
    {
      candidateType: "correct-alternate",
      label: "constraint-sets",
      code: `import java.util.*;

class Solution {
    public void solveSudoku(int[][] board) {
        boolean[][] rows = new boolean[9][10];
        boolean[][] cols = new boolean[9][10];
        boolean[][] boxes = new boolean[9][10];
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                int value = board[row][col];
                if (value != 0) mark(rows, cols, boxes, row, col, value, true);
            }
        }
        solve(board, rows, cols, boxes);
    }

    private boolean solve(int[][] board, boolean[][] rows, boolean[][] cols, boolean[][] boxes) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] == 0) {
                    for (int digit = 1; digit <= 9; digit++) {
                        int box = (row / 3) * 3 + col / 3;
                        if (!rows[row][digit] && !cols[col][digit] && !boxes[box][digit]) {
                            board[row][col] = digit;
                            mark(rows, cols, boxes, row, col, digit, true);
                            if (solve(board, rows, cols, boxes)) return true;
                            mark(rows, cols, boxes, row, col, digit, false);
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    private void mark(boolean[][] rows, boolean[][] cols, boolean[][] boxes, int row, int col, int digit, boolean value) {
        rows[row][digit] = value;
        cols[col][digit] = value;
        boxes[(row / 3) * 3 + col / 3][digit] = value;
    }
}`,
      notes: "Alternate constraint-tracking style."
    }
  ],
  "rec-024": [
    {
      candidateType: "correct-optimal",
      label: "row-by-row",
      code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> answer = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        boolean[] cols = new boolean[n];
        boolean[] diag1 = new boolean[2 * n];
        boolean[] diag2 = new boolean[2 * n];
        place(0, board, cols, diag1, diag2, answer);
        return answer;
    }

    private void place(int row, char[][] board, boolean[] cols, boolean[] diag1, boolean[] diag2, List<List<String>> answer) {
        if (row == board.length) {
            List<String> solution = new ArrayList<>();
            for (char[] current : board) solution.add(new String(current));
            answer.add(solution);
            return;
        }
        for (int col = 0; col < board.length; col++) {
            int d1 = row - col + board.length;
            int d2 = row + col;
            if (cols[col] || diag1[d1] || diag2[d2]) continue;
            board[row][col] = 'Q';
            cols[col] = diag1[d1] = diag2[d2] = true;
            place(row + 1, board, cols, diag1, diag2, answer);
            board[row][col] = '.';
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
    }
}`,
      notes: "Canonical N-Queens backtracking."
    },
    {
      candidateType: "incorrect",
      label: "first-row-only",
      code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> answer = new ArrayList<>();
        List<String> board = new ArrayList<>();
        for (int row = 0; row < n; row++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            if (row == 0) line[0] = 'Q';
            board.add(new String(line));
        }
        answer.add(board);
        return answer;
    }
}`,
      notes: "Does not search for all valid placements."
    },
    {
      candidateType: "suboptimal",
      label: "set-based",
      code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> answer = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        dfs(0, board, new HashSet<>(), new HashSet<>(), new HashSet<>(), answer);
        return answer;
    }

    private void dfs(int row, char[][] board, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2, List<List<String>> answer) {
        if (row == board.length) {
            List<String> solution = new ArrayList<>();
            for (char[] current : board) solution.add(new String(current));
            answer.add(solution);
            return;
        }
        for (int col = 0; col < board.length; col++) {
            int a = row - col, b = row + col;
            if (cols.contains(col) || d1.contains(a) || d2.contains(b)) continue;
            board[row][col] = 'Q';
            cols.add(col); d1.add(a); d2.add(b);
            dfs(row + 1, board, cols, d1, d2, answer);
            board[row][col] = '.';
            cols.remove(col); d1.remove(a); d2.remove(b);
        }
    }
}`,
      notes: "Set-based constraint tracking."
    },
    {
      candidateType: "hardcoded",
      label: "single-board",
      code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> answer = new ArrayList<>();
        if (n == 1) {
            answer.add(Collections.singletonList("Q"));
        }
        return answer;
    }
}`,
      notes: "Only handles n=1."
    },
    {
      candidateType: "correct-alternate",
      label: "column-per-row",
      code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        int[] queenCol = new int[n];
        Arrays.fill(queenCol, -1);
        List<List<String>> answer = new ArrayList<>();
        search(0, n, queenCol, answer);
        return answer;
    }

    private void search(int row, int n, int[] queenCol, List<List<String>> answer) {
        if (row == n) {
            List<String> board = new ArrayList<>();
            for (int r = 0; r < n; r++) {
                char[] line = new char[n];
                Arrays.fill(line, '.');
                line[queenCol[r]] = 'Q';
                board.add(new String(line));
            }
            answer.add(board);
            return;
        }
        for (int col = 0; col < n; col++) {
            if (safe(row, col, queenCol)) {
                queenCol[row] = col;
                search(row + 1, n, queenCol, answer);
                queenCol[row] = -1;
            }
        }
    }

    private boolean safe(int row, int col, int[] queenCol) {
        for (int r = 0; r < row; r++) {
            int c = queenCol[r];
            if (c == col || Math.abs(r - row) == Math.abs(c - col)) return false;
        }
        return true;
    }
}`
    }
  ]
};

for (const [problemId, candidates] of Object.entries(batches)) {
  const outDir = path.join(root, "training", "generated", problemId);
  fs.mkdirSync(outDir, { recursive: true });
  candidates.forEach((candidate, index) => {
    const id = `cand_${problemId.replace("rec-", "r")}_${String(index + 1).padStart(2, "0")}`;
    const record = {
      schemaVersion: 1,
      id,
      importedAt: new Date().toISOString(),
      problemId,
      language: "java",
      practiceMode: "beginner",
      candidateType: candidate.candidateType,
      label: candidate.label,
      code: candidate.code,
      notes: candidate.notes,
      model: "manual-import",
      promptVersion: "v1",
      sourceFile: "scripts/create-recursion-candidate-batches.mjs"
    };
    fs.writeFileSync(path.join(outDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);
  });
}
