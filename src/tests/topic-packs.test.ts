import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultTopicId, getTopicMeta, getTopicMetas, getTopicProblems, getTopicRoadmap } from "../services/storage";

test("topic registry exposes the default topic pack", () => {
  assert.equal(getDefaultTopicId(), "bit-manipulation");
  assert.equal(getTopicMeta("bit-manipulation")?.name, "Bit Manipulation");
  assert.ok(getTopicProblems("bit-manipulation").length >= 40);
});

test("topic registry exposes roadmap metadata", () => {
  const metas = getTopicMetas();
  assert.equal(metas.some((meta) => meta.id === "arrays"), true);
  assert.equal(metas.some((meta) => meta.id === "binary-search"), true);
  assert.equal(metas.some((meta) => meta.id === "dp"), true);
  assert.equal(metas.some((meta) => meta.id === "graphs"), true);
  assert.equal(metas.some((meta) => meta.id === "linked-list"), true);
  assert.equal(metas.some((meta) => meta.id === "queue"), true);
  assert.equal(metas.some((meta) => meta.id === "recursion"), true);
  assert.equal(metas.some((meta) => meta.id === "stack"), true);
  assert.equal(metas.some((meta) => meta.id === "trees"), true);
  assert.ok(getTopicRoadmap("bit-manipulation").length > 5);
  assert.ok(getTopicProblems("arrays").length >= 10);
  assert.ok(getTopicProblems("binary-search").length >= 10);
  assert.ok(getTopicProblems("dp").length >= 12);
  assert.ok(getTopicProblems("graphs").length >= 12);
  assert.ok(getTopicProblems("linked-list").length >= 10);
  assert.ok(getTopicProblems("queue").length >= 10);
  assert.ok(getTopicProblems("recursion").length >= 20);
  assert.ok(getTopicProblems("stack").length >= 15);
  assert.ok(getTopicProblems("trees").length >= 12);
});
