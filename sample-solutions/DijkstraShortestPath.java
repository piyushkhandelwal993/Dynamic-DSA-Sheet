import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            graph.add(new ArrayList<>());
        }

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            int w = sc.nextInt();
            graph.get(u).add(new int[] {v, w});
            graph.get(v).add(new int[] {u, w});
        }

        int src = sc.nextInt();
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;

        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));
        pq.offer(new long[] {src, 0});

        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            int node = (int) cur[0];
            long d = cur[1];
            if (d != dist[node]) {
                continue;
            }
            for (int[] edge : graph.get(node)) {
                int nei = edge[0];
                int w = edge[1];
                if (dist[node] + w < dist[nei]) {
                    dist[nei] = dist[node] + w;
                    pq.offer(new long[] {nei, dist[nei]});
                }
            }
        }

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                out.append(' ');
            }
            out.append(dist[i] == Long.MAX_VALUE ? -1 : dist[i]);
        }

        System.out.print(out);
        sc.close();
    }
}
