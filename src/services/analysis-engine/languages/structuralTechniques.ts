function maxCall(language: "java" | "cpp"): string {
  return language === "java" ? "Math\\.max" : "(?:std::)?max";
}

function minCall(language: "java" | "cpp"): string {
  return language === "java" ? "Math\\.min" : "(?:std::)?min";
}

export function detectsRunningExtreme(content: string, language: "java" | "cpp"): boolean {
  const maximum = maxCall(language);
  const minimum = minCall(language);
  return (
    new RegExp(`\\b([a-zA-Z_]\\w*)\\s*=\\s*${maximum}\\s*\\(\\s*\\1\\s*,`).test(content) ||
    new RegExp(`\\b([a-zA-Z_]\\w*)\\s*=\\s*${minimum}\\s*\\(\\s*\\1\\s*,`).test(content) ||
    /\bif\s*\(\s*([^;()]+?)\s*[<>]\s*([a-zA-Z_]\w*)\s*\)[\s\S]{0,100}\b\2\s*=\s*\1\s*;/.test(content)
  );
}

export function detectsKadaneRecurrence(content: string, language: "java" | "cpp"): boolean {
  const maximum = maxCall(language);
  const recurrence = new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*${maximum}\\s*\\(\\s*([^,;]+)\\s*,\\s*\\1\\s*\\+\\s*\\2\\s*\\)`
  );
  const bestUpdate = new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*${maximum}\\s*\\(\\s*\\1\\s*,\\s*([a-zA-Z_]\\w*)\\s*\\)`
  );
  const recurrenceMatch = recurrence.exec(content);
  if (!recurrenceMatch) return false;
  const bestMatch = bestUpdate.exec(content);
  return Boolean(bestMatch && bestMatch[2] === recurrenceMatch[1]);
}

export function detectsStockProfit(content: string, language: "java" | "cpp"): boolean {
  const minimum = minCall(language);
  const maximum = maxCall(language);
  const minUpdate = new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*${minimum}\\s*\\(\\s*\\1\\s*,\\s*([^);]+)\\)`
  ).exec(content);
  if (!minUpdate) return false;
  const minVariable = minUpdate[1];
  return new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*${maximum}\\s*\\(\\s*\\1\\s*,\\s*[^,;]+-\\s*${minVariable}\\s*\\)`
  ).test(content);
}

export function detectsMemoizedRecurrence(content: string): boolean {
  const indexedCache = /\b([a-zA-Z_]\w*)\s*\[[^\]]+\]/g;
  const counts = new Map<string, number>();
  for (const match of content.matchAll(indexedCache)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  return Array.from(counts.entries()).some(([name, count]) => {
    if (count < 3) return false;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cacheRead = new RegExp(`\\bif\\s*\\([^)]*${escaped}\\s*\\[[^\\]]+\\][^)]*\\)`).test(content);
    const cacheWrite = new RegExp(`\\b(?:return\\s+)?${escaped}\\s*\\[[^\\]]+\\]\\s*=`).test(content);
    return cacheRead && cacheWrite;
  });
}

export function detectsTabulation(content: string): boolean {
  if (!/\b(?:for|while)\s*\(/.test(content)) return false;
  const assignment = /\b([a-zA-Z_]\w*)\s*\[([^\]]+)\]\s*=\s*([^;]+)/g;
  for (const match of content.matchAll(assignment)) {
    const escaped = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\s*\\[[^\\]]+\\]`).test(match[3])) return true;
  }
  return false;
}

export function detectsRollingState(content: string): boolean {
  if (!/\b(?:for|while)\s*\(/.test(content)) return false;
  const assignments = Array.from(
    content.matchAll(/\b([a-zA-Z_]\w*)\s*=\s*([^;]+);/g),
    (match) => ({ target: match[1], expression: match[2] })
  );
  return assignments.some((assignment) => {
    const dependencies = assignments.filter(
      (candidate) =>
        candidate.target !== assignment.target &&
        new RegExp(`\\b${candidate.target}\\b`).test(assignment.expression)
    );
    return dependencies.length >= 2;
  });
}

export function detectsNestedAdjacency(content: string, language: "java" | "cpp"): boolean {
  if (language === "java") {
    return /\b(?:List|ArrayList)\s*<\s*(?:List|ArrayList)\s*</.test(content);
  }
  return /\bvector\s*<\s*vector\s*</.test(content);
}

export function detectsDistanceRelaxation(content: string): boolean {
  return /\b([a-zA-Z_]\w*)\s*\[([^\]]+)\]\s*>\s*\1\s*\[([^\]]+)\]\s*\+\s*([a-zA-Z_]\w*|\w+\.[a-zA-Z_]\w*|\w+->[a-zA-Z_]\w*)/.test(content) ||
    /\b([a-zA-Z_]\w*)\s*\[([^\]]+)\]\s*\+\s*([a-zA-Z_]\w*|\w+\.[a-zA-Z_]\w*|\w+->[a-zA-Z_]\w*)\s*<\s*\1\s*\[([^\]]+)\]/.test(content);
}

export function detectsPathCompression(content: string): boolean {
  const assignment =
    /\b([a-zA-Z_]\w*)\s*\[([^\]]+)\]\s*=\s*([a-zA-Z_]\w*)\s*\(([^;]*)\)\s*;/g;
  for (const match of content.matchAll(assignment)) {
    const collection = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const index = match[2].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${collection}\\s*\\[\\s*${index}\\s*\\]`).test(match[4])) {
      return true;
    }
  }
  return false;
}

export function detectsCircularIndexing(content: string): boolean {
  return /\b([a-zA-Z_]\w*)\s*=\s*\(\s*\1\s*\+\s*1\s*\)\s*%\s*([a-zA-Z_]\w*|\d+)/.test(content);
}

export function detectsTreeBranchRecursion(content: string, access: "." | "->"): boolean {
  const member = access === "." ? "\\." : "->";
  return new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*\\([^)]*\\)\\s*\\{[\\s\\S]{0,700}\\1\\s*\\(\\s*\\w+${member}left\\s*\\)[\\s\\S]{0,350}\\1\\s*\\(\\s*\\w+${member}right\\s*\\)`
  ).test(content);
}

export function detectsMinTrackingStack(content: string, language: "java" | "cpp"): boolean {
  const min = language === "java" ? "Math\\.min" : "(?:std::)?min";
  const stackOperations =
    language === "java"
      ? /\.(?:push|pop|peek|addLast|removeLast|getLast)\s*\(/
      : /\.(?:push|pop|top|push_back|pop_back|back)\s*\(/;
  return stackOperations.test(content) && new RegExp(`${min}\\s*\\(`).test(content);
}
