import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { buildRoadmapInferenceStatement, extractProblemPageFromHtml } from "../services/problemPageIngestion";

test("extractProblemPageFromHtml reads LeetCode-style next-data question content", () => {
  const html = `
    <html>
      <head><title>Ignore Me</title></head>
      <body>
        <script id="__NEXT_DATA__" type="application/json">
          {
            "props": {
              "pageProps": {
                "dehydratedState": {
                  "queries": [
                    {
                      "state": {
                        "data": {
                          "question": {
                            "title": "Count Complete Tree Nodes",
                            "difficulty": "Medium",
                            "content": "<p>Given the <code>root</code> of a <strong>complete binary tree</strong>, return the number of the nodes in the tree.</p><p>Constraints apply.</p>"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        </script>
      </body>
    </html>
  `;

  const result = extractProblemPageFromHtml("https://leetcode.com/problems/count-complete-tree-nodes/", html);
  assert.equal(result?.title, "Count Complete Tree Nodes");
  assert.equal(result?.difficulty, "Medium");
  assert.equal(result?.platform, "leetcode");
  assert.equal(result?.source, "leetcode-next-data");
  assert.equal(result?.statementText?.includes("complete binary tree"), true);
  assert.equal(result?.statementText?.includes("Constraints apply"), true);
});

test("extractProblemPageFromHtml reads GFG-style page content with structured metadata", () => {
  const html = `
    <html>
      <head><title>First negative integer in every window of size k | GeeksforGeeks</title></head>
      <body>
        <section>
          <h2>Difficulty : Medium</h2>
          <h3>Problem Statement</h3>
          <p>Given an array and an integer k, find the first negative integer in every window of size k.</p>
          <h3>Constraints</h3>
          <ul>
            <li>1 <= n <= 100000</li>
            <li>1 <= k <= n</li>
          </ul>
          <h3>Example 1</h3>
          <p>Input: 8 3 -8 2 3 -6 10 and k = 2</p>
          <p>Output: -8 0 -6 -6</p>
          <p>Explanation: Each window reports its first negative value.</p>
        </section>
      </body>
    </html>
  `;

  const result = extractProblemPageFromHtml(
    "https://www.geeksforgeeks.org/problems/first-negative-integer-in-every-window-of-size-k3345/1",
    html
  );
  assert.equal(result?.platform, "gfg");
  assert.equal(result?.difficulty, "Medium");
  assert.equal(result?.source, "gfg-html");
  assert.equal(result?.statementText?.includes("first negative integer in every window of size k"), true);
  assert.equal(result?.constraints?.includes("1 <= n <= 100000"), true);
  assert.equal((result?.examples?.length ?? 0) >= 1, true);
});

test("extractProblemPageFromHtml falls back to plain html text extraction", () => {
  const html = `
    <html>
      <head>
        <title>Sample Problem</title>
      </head>
      <body>
        <main>
          <h1>Sample Problem</h1>
          <p>Count words in a sentence.</p>
          <p>Use one pass.</p>
        </main>
      </body>
    </html>
  `;

  const result = extractProblemPageFromHtml("https://example.com/problem/sample", html);
  assert.equal(result?.title, "Sample Problem");
  assert.equal(result?.source, "html");
  assert.equal(result?.statementText?.includes("Count words in a sentence"), true);
  assert.equal(result?.statementText?.includes("Use one pass"), true);
});

test("buildRoadmapInferenceStatement falls back to provided statement when fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network down");
  };

  try {
    const result = await buildRoadmapInferenceStatement(
      "https://leetcode.com/problems/example/",
      "Manual statement text"
    );
    assert.equal(result, "Manual statement text");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("buildRoadmapInferenceStatement includes structured fetched metadata", async () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-problem-page-metadata-"));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => `
      <html>
        <body>
          <script id="__NEXT_DATA__" type="application/json">
            {
              "props": {
                "pageProps": {
                  "question": {
                    "title": "Sample Graph Problem",
                    "difficulty": "Hard",
                    "topicTags": [{"name":"Graph"},{"name":"Breadth-First Search"}],
                    "content": "<p>Given a graph, find the shortest path.</p><ul><li>1 <= n <= 1000</li></ul>"
                  }
                }
              }
            }
          </script>
        </body>
      </html>
    `
  }) as Response;

  try {
    const result = await buildRoadmapInferenceStatement("https://leetcode.com/problems/sample-graph-problem-v2/");
    assert.equal(result?.includes("Title: Sample Graph Problem"), true);
    assert.equal(result?.includes("Difficulty: Hard"), true);
    assert.equal(result?.includes("Tags: Graph, Breadth-First Search"), true);
    assert.equal(result?.includes("Constraints: 1 <= n <= 1000"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetch path reuses cached metadata on later calls", async () => {
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-problem-page-cache-"));
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return {
      ok: true,
      text: async () => `
        <html>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "question": {
                      "title": "Cached Problem",
                      "difficulty": "Easy",
                      "content": "<p>Count nodes.</p>"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `
    } as Response;
  };

  try {
    const first = await buildRoadmapInferenceStatement("https://leetcode.com/problems/cached-problem/");
    const second = await buildRoadmapInferenceStatement("https://leetcode.com/problems/cached-problem/");
    assert.equal(first?.includes("Title: Cached Problem"), true);
    assert.equal(second?.includes("Title: Cached Problem"), true);
    assert.equal(fetchCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
