import chalk from "chalk";
import fs from "fs";
import { getBaseDir, resetLearningState } from "../services/storage";

export function resetCommand(): void {
  const baseDir = getBaseDir();
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
  resetLearningState();
  console.log(chalk.yellow("Local dsa-sheet data has been fully reset, including progress and skill profile."));
}
