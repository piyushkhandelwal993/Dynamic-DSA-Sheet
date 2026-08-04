import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { invalidateCatalogCache } from "../services/catalog";
import { getDefaultTopicId, getTopicMeta, getTopicMetas, getTopicProblems, getTopicRoadmap } from "../services/storage";
import { ProblemPoolRole } from "../types";

const originalBaseDir = process.env.DSA_SHEET_HOME;
process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-topic-pack-tests-"));
invalidateCatalogCache();

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;
  invalidateCatalogCache();
});

test("topic registry exposes the default topic pack", () => {
  assert.equal(getDefaultTopicId(), "programming-mathematics");
  assert.equal(getTopicMeta("programming-mathematics")?.name, "Programming Mathematics");
  assert.ok(getTopicProblems("programming-mathematics").length >= 5);
});

test("topic registry exposes roadmap metadata", () => {
  const originalBaseDir = process.env.DSA_SHEET_HOME;
  process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-topic-pack-catalog-"));
  invalidateCatalogCache();

  try {
    const metas = getTopicMetas();
    assert.equal(metas.some((meta) => meta.id === "programming-mathematics"), true);
    assert.equal(metas.some((meta) => meta.id === "arrays"), true);
    assert.equal(metas.some((meta) => meta.id === "binary-search"), true);
    assert.equal(metas.some((meta) => meta.id === "dp"), true);
    assert.equal(metas.some((meta) => meta.id === "graphs"), true);
    assert.equal(metas.some((meta) => meta.id === "linked-list"), true);
    assert.equal(metas.some((meta) => meta.id === "prefix-suffix"), true);
    assert.equal(metas.some((meta) => meta.id === "queue"), true);
    assert.equal(metas.some((meta) => meta.id === "recursion"), true);
    assert.equal(metas.some((meta) => meta.id === "sliding-window"), true);
    assert.equal(metas.some((meta) => meta.id === "stack"), true);
    assert.equal(metas.some((meta) => meta.id === "strings"), true);
    assert.equal(metas.some((meta) => meta.id === "trees"), true);
    assert.equal(metas.some((meta) => meta.id === "two-pointers"), true);
    assert.ok(getTopicRoadmap("programming-mathematics").length >= 5);
    assert.ok(getTopicProblems("programming-mathematics").length >= 5);
    assert.ok(getTopicRoadmap("bit-manipulation").length > 5);
    assert.ok(getTopicProblems("arrays").length >= 10);
    assert.ok(getTopicProblems("binary-search").length >= 10);
    assert.ok(getTopicProblems("dp").length >= 12);
    assert.ok(getTopicProblems("graphs").length >= 12);
    assert.ok(getTopicProblems("linked-list").length >= 10);
    assert.ok(getTopicProblems("prefix-suffix").length >= 8);
    assert.ok(getTopicProblems("queue").length >= 10);
    assert.ok(getTopicProblems("recursion").length >= 20);
    assert.ok(getTopicProblems("sliding-window").length >= 6);
    assert.ok(getTopicProblems("stack").length >= 15);
    assert.ok(getTopicProblems("strings").length >= 10);
    assert.ok(getTopicProblems("trees").length >= 12);
    assert.ok(getTopicProblems("two-pointers").length >= 9);
  } finally {
    if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
    else process.env.DSA_SHEET_HOME = originalBaseDir;
    invalidateCatalogCache();
  }
});

test("adaptive pool topics expose healthy role coverage", () => {
  const adaptiveTopicIds = [
    "programming-mathematics",
    "arrays",
    "bit-manipulation",
    "binary-search",
    "dp",
    "graphs",
    "linked-list",
    "prefix-suffix",
    "queue",
    "recursion",
    "sliding-window",
    "stack",
    "strings",
    "trees",
    "two-pointers"
  ];
  const requiredRoles: ProblemPoolRole[] = ["core", "practice", "challenge"];

  for (const topicId of adaptiveTopicIds) {
    const problems = getTopicProblems(topicId);
    const roles = new Set(problems.map((problem) => problem.poolRole ?? "core"));

    assert.ok(problems.every((problem) => problem.variantGroup), `${topicId} should assign a variant group to every adaptive problem`);
    assert.ok(problems.every((problem) => typeof problem.masteryWeight === "number"), `${topicId} should assign mastery weights`);

    for (const role of requiredRoles) {
      assert.equal(roles.has(role), true, `${topicId} should include ${role} pool problems`);
    }
  }
});
