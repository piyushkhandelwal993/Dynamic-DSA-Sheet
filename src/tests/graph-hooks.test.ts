import test from "node:test";
import assert from "node:assert/strict";
import { analyzeGraphJavaContent, detectGraphConcepts } from "../services/topics/graphHooks";
import { getProblemById } from "../services/storage";

test("graph analyzer detects adjacency plus bfs traversal", () => {
  const analysis = analyzeGraphJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        List<List<Integer>> graph = new ArrayList<>();
        Queue<Integer> q = new ArrayDeque<>();
        boolean[] visited = new boolean[5];
        q.offer(0);
        while (!q.isEmpty()) {
          int node = q.poll();
          for (int nei : graph.get(node)) {
            if (!visited[nei]) {
              visited[nei] = true;
              q.offer(nei);
            }
          }
        }
      }
    }
  `);

  assert.equal(analysis.signals.usesGraphAdjacency, true);
  assert.equal(analysis.signals.usesGraphTraversal, true);
});

test("graph concept detector recognizes dijkstra pattern", () => {
  const problem = getProblemById("gr-012");
  assert.ok(problem);

  const analysis = analyzeGraphJavaContent(`
    import java.util.*;
    public class Main {
      public static void main(String[] args) {
        long[] dist = new long[5];
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));
        pq.offer(new long[] {0, 0});
        while (!pq.isEmpty()) {
          long[] cur = pq.poll();
          int node = (int) cur[0];
          for (int[] edge : new ArrayList<int[]>()) {
            int nei = edge[0];
            int weight = edge[1];
            if (dist[node] + weight < dist[nei]) {
              dist[nei] = dist[node] + weight;
              pq.offer(new long[] {nei, dist[nei]});
            }
          }
        }
      }
    }
  `);

  const detection = detectGraphConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("dijkstra"), true);
});
