import {
  buildTestCaseCoverageReport,
  testCaseCoverageMeetsReleaseFloor,
  testCaseReleaseFloor
} from "../services/testCaseCoverage";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const report = buildTestCaseCoverageReport();

console.log("DSA Sheet test-case coverage");
console.log(`Problems: ${report.totalProblems}`);
console.log(`Executable: ${report.executableProblems}/${report.totalProblems} (${percent(report.executableCoverage)})`);
console.log(`Hidden coverage: ${report.hiddenProblems}/${report.totalProblems} (${percent(report.hiddenCoverage)})`);
console.log(`Sources: ${report.configuredProblems} configured, ${report.curatedProblems} curated, ${report.exampleOnlyProblems} example-only`);
console.log(`Quality: ${report.strongProblems} strong, ${report.basicProblems} basic, ${report.weakProblems} weak, ${report.missingProblems} missing`);
console.log("");
console.log("By topic");

report.topics.forEach((topic) => {
  console.log(
    [
      topic.topicId.padEnd(18),
      `${String(topic.hiddenProblems).padStart(2)}/${String(topic.totalProblems).padEnd(2)} hidden`,
      `${String(topic.strongProblems).padStart(2)} strong`,
      `${String(topic.basicProblems).padStart(2)} basic`,
      `${String(topic.weakProblems).padStart(2)} weak`,
      `${String(topic.missingProblems).padStart(2)} missing`
    ].join("  ")
  );
});

if (!testCaseCoverageMeetsReleaseFloor(report)) {
  console.error("");
  console.error(
    `Release floor missed: executable >= ${percent(testCaseReleaseFloor.executableCoverage)}, hidden >= ${percent(testCaseReleaseFloor.hiddenCoverage)}, missing <= ${testCaseReleaseFloor.missingProblems}.`
  );
  process.exitCode = 1;
}

