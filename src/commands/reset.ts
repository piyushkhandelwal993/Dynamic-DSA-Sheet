import fs from "fs";
import chalk from "chalk";
import { getBaseDir } from "../services/storage";

export function resetCommand(): void {
  const baseDir = getBaseDir();
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
  console.log(chalk.yellow("Local dsa-sheet data has been reset."));
}
