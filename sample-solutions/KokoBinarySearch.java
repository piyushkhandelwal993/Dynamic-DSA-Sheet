import java.util.*;

public class Main {
    public static boolean canFinish(int[] piles, int h, int speed) {
        long hours = 0;
        for (int pile : piles) {
            hours += (pile + speed - 1) / speed;
        }
        return hours <= h;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int h = sc.nextInt();
        int[] piles = new int[n];
        int right = 0;
        for (int i = 0; i < n; i++) {
            piles[i] = sc.nextInt();
            right = Math.max(right, piles[i]);
        }

        int left = 1;
        int ans = right;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (canFinish(piles, h, mid)) {
                ans = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        System.out.print(ans);
        sc.close();
    }
}
