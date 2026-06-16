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

    static int height(TreeNode root) {
        if (root == null) {
            return 0;
        }
        return 1 + Math.max(height(root.left), height(root.right));
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n == 0) {
            System.out.print(0);
            sc.close();
            return;
        }

        Integer[] values = new Integer[n];
        for (int i = 0; i < n; i++) {
            int x = sc.nextInt();
            values[i] = x == -1 ? null : x;
        }

        if (values[0] == null) {
            System.out.print(0);
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

        System.out.print(height(root));
        sc.close();
    }
}
