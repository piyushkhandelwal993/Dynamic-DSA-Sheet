import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int write = 0;
        for (int read = 0; read < n; read++) {
            if (arr[read] != 0) {
                arr[write++] = arr[read];
            }
        }
        while (write < n) {
            arr[write++] = 0;
        }

        for (int i = 0; i < n; i++) {
            if (i > 0) {
                System.out.print(" ");
            }
            System.out.print(arr[i]);
        }
        sc.close();
    }
}
