import inquirer from "inquirer";
import chalk from "chalk";
import { getDefaultTopicId, initializeStudentFiles, isInitialized } from "../services/storage";
import { StudentProfile } from "../types";

export async function initCommand(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Student name:",
      validate: (value: string) => (value.trim() ? true : "Name is required.")
    },
    {
      type: "input",
      name: "batch",
      message: "Batch:",
      validate: (value: string) => (value.trim() ? true : "Batch is required.")
    },
    {
      type: "input",
      name: "preferredLanguage",
      message: "Preferred language:",
      default: "Java"
    },
    {
      type: "list",
      name: "currentLevel",
      message: "Current level:",
      choices: ["beginner", "intermediate", "advanced"]
    }
  ]);

  const profile: StudentProfile = {
    studentId: "local",
    name: answers.name.trim(),
    batch: answers.batch.trim(),
    preferredLanguage: answers.preferredLanguage.trim() || "Java",
    currentLevel: answers.currentLevel,
    activeTopicId: getDefaultTopicId(),
    createdAt: new Date().toISOString()
  };

  initializeStudentFiles(profile);

  const message = isInitialized()
    ? "Profile and local progress files are ready."
    : "Initialization completed.";

  console.log(chalk.green(message));
}
