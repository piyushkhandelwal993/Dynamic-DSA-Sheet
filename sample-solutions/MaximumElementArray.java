import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int best = sc.nextInt();
        for (int i = 1; i < n; i++) {
            best = Math.max(best, sc.nextInt());
        }
        System.out.print(best);
        sc.close();
    }
}
