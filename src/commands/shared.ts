import chalk from "chalk";
import { isInitialized } from "../services/storage";

export function ensureInitialized(): void {
  if (!isInitialized()) {
    console.log(chalk.yellow("Run `dsa init` first."));
    process.exit(1);
  }
}
