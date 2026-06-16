import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        Deque<Character> st = new ArrayDeque<>();

        boolean ok = true;
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                st.push(ch);
            } else {
                if (st.isEmpty()) {
                    ok = false;
                    break;
                }
                char open = st.pop();
                if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) {
                    ok = false;
                    break;
                }
            }
        }

        if (!st.isEmpty()) {
            ok = false;
        }

        System.out.print(ok ? "Balanced" : "Not Balanced");
        sc.close();
    }
}
