import java.util.*;

public class Main {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;
        TreeNode(int val) {
            this.val = val;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Integer[] values = new Integer[n];
        for (int i = 0; i < n; i++) {
            int x = sc.nextInt();
            values[i] = x == -1 ? null : x;
        }
        int target = sc.nextInt();

        if (n == 0 || values[0] == null) {
            System.out.print("Not Found");
            sc.close();
            return;
        }

        TreeNode root = new TreeNode(values[0]);
        Queue<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        int index = 1;
        while (!q.isEmpty() && index < n) {
            TreeNode node = q.poll();
            if (index < n && values[index] != null) {
                node.left = new TreeNode(values[index]);
                q.offer(node.left);
            }
            index++;
            if (index < n && values[index] != null) {
                node.right = new TreeNode(values[index]);
                q.offer(node.right);
            }
            index++;
        }

        TreeNode current = root;
        while (current != null) {
            if (current.val == target) {
                System.out.print("Found");
                sc.close();
                return;
            }
            if (target < current.val) {
                current = current.left;
            } else {
                current = current.right;
            }
        }

        System.out.print("Not Found");
        sc.close();
    }
}
