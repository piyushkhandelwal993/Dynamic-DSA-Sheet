public class DecimalToBinaryModulo {
    public static String toBinary(int n) {
        if (n == 0) {
            return "0";
        }

        StringBuilder answer = new StringBuilder();
        while (n > 0) {
            answer.append(n % 2);
            n /= 2;
        }
        return answer.reverse().toString();
    }
}
