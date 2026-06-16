import java.util.ArrayList;
import java.util.List;

public class SubsequencesRecursive {
    public static List<List<Integer>> allSubsequences(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        dfs(0, nums, new ArrayList<>(), answer);
        return answer;
    }

    private static void dfs(int index, int[] nums, List<Integer> path, List<List<Integer>> answer) {
        if (index == nums.length) {
            answer.add(new ArrayList<>(path));
            return;
        }

        path.add(nums[index]);
        dfs(index + 1, nums, path, answer);
        path.remove(path.size() - 1);

        dfs(index + 1, nums, path, answer);
    }
}
