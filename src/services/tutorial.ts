import { Concept, Problem } from "../types";

export function buildMiniTutorial(concept: Concept, problem?: Problem): string[] {
  const lines: string[] = [];
  lines.push(`${concept.name}: ${concept.description}`);
  lines.push(`Java pattern: ${concept.exampleJava}`);

  if (concept.id === "binary-representation") {
    lines.push("Modulo/division can produce the correct binary string, but this module expects direct bitwise reasoning.");
    lines.push("Use n & 1 to read the current last bit.");
    lines.push("Use n >> 1 to move to the next bit.");
  } else if (concept.id === "odd-even-check") {
    lines.push("The last bit decides odd or even.");
    lines.push("Use (n & 1) instead of n % 2 to practice direct bit access.");
  } else if (concept.id === "check-ith-bit") {
    lines.push("Create a mask with 1 << i, then test it with n & mask.");
    lines.push("You can also shift n right by i and inspect the last bit.");
  }

  if (problem) {
    lines.push(`Retry target: resubmit ${problem.id} using this concept.`);
  }

  return lines;
}
