public class CheckIthBit {
    public static int checkBit(int n, int i) {
        if (i < 0) {
            return 0;
        }
        int mask = 1 << i;
        return (n & mask) != 0 ? 1 : 0;
    }
}
