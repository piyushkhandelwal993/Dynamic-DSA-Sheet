import { CodeFacts, SupportedAnalysisLanguage } from "./facts";
import { analyzeWithAdapter, getLanguageAnalysisAdapter } from "./adapters";

export function analyzeCodeFacts(language: SupportedAnalysisLanguage, content: string): CodeFacts {
  return analyzeWithAdapter(getLanguageAnalysisAdapter(language), content);
}
