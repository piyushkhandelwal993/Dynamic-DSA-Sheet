import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Queue<String> q = new ArrayDeque<>();
        q.offer("1");

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            String cur = q.poll();
            if (i > 0) {
                out.append(' ');
            }
            out.append(cur);
            q.offer(cur + "0");
            q.offer(cur + "1");
        }

        System.out.print(out);
        sc.close();
    }
}
