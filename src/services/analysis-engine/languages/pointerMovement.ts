function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function movesUp(content: string, variable: string): boolean {
  const name = escapeRegex(variable);
  return new RegExp(
    `(?:\\b${name}\\s*\\+\\+|\\+\\+\\s*${name}\\b|\\b${name}\\s*\\+=\\s*1\\b|\\b${name}\\s*=\\s*${name}\\s*\\+\\s*1\\b)`
  ).test(content);
}

function movesDown(content: string, variable: string): boolean {
  const name = escapeRegex(variable);
  return new RegExp(
    `(?:\\b${name}\\s*--|--\\s*${name}\\b|\\b${name}\\s*-=\\s*1\\b|\\b${name}\\s*=\\s*${name}\\s*-\\s*1\\b)`
  ).test(content);
}

function appearsInLoopCondition(content: string, variable: string): boolean {
  const name = escapeRegex(variable);
  return new RegExp(`\\b(?:for|while)\\s*\\([^\\n{};]*\\b${name}\\b`).test(content);
}

function hasIndexedAccessWithVariable(content: string, variable: string): boolean {
  const name = escapeRegex(variable);
  return new RegExp(`\\[[^\\]]*\\b${name}\\b[^\\]]*\\]`).test(content);
}

function hasAssignmentUsingVariable(content: string, variable: string): boolean {
  const name = escapeRegex(variable);
  return new RegExp(`=\\s*[^;\\n]*\\b${name}\\b|\\b${name}\\b[^;\\n]*=`).test(content);
}

export function detectOpposingPointerMovement(content: string): boolean {
  if (!/\b(?:for|while)\s*\(/.test(content)) {
    return false;
  }

  const comparison = /\b([a-zA-Z_]\w*)\s*(?:<|<=|>|>=|!=)\s*([a-zA-Z_]\w*)\b/g;
  let match = comparison.exec(content);

  while (match) {
    const first = match[1];
    const second = match[2];
    if (
      first !== second &&
      ((movesUp(content, first) && movesDown(content, second)) ||
        (movesDown(content, first) && movesUp(content, second)))
    ) {
      return true;
    }
    match = comparison.exec(content);
  }

  return false;
}

export function detectSameDirectionDualPointers(content: string): boolean {
  if (!/\b(?:for|while)\s*\(/.test(content)) {
    return false;
  }

  const variables = Array.from(
    new Set(
      [...content.matchAll(/\b(?:int|long|size_t|Integer)\s+([a-zA-Z_]\w*)\s*=\s*0\b/g)].map((match) => match[1])
    )
  );

  for (const first of variables) {
    for (const second of variables) {
      if (first === second) continue;
      if (!movesUp(content, first) || !movesUp(content, second)) continue;
      if (!appearsInLoopCondition(content, second)) continue;
      if (!hasIndexedAccessWithVariable(content, first) || !hasIndexedAccessWithVariable(content, second)) continue;
      if (!hasAssignmentUsingVariable(content, first) && !hasAssignmentUsingVariable(content, second)) continue;

      const unconditionalAdvance = new RegExp(`(?:^|[\\s{};])(?:${escapeRegex(second)}\\s*\\+\\+|\\+\\+\\s*${escapeRegex(second)}\\b|${escapeRegex(second)}\\s*\\+=\\s*1\\b|${escapeRegex(second)}\\s*=\\s*${escapeRegex(second)}\\s*\\+\\s*1\\b)`);
      const conditionalAdvance = new RegExp(
        `if\\s*\\([^)]*\\)\\s*\\{?[\\s\\S]{0,200}(?:${escapeRegex(first)}\\s*\\+\\+|\\+\\+\\s*${escapeRegex(first)}\\b|${escapeRegex(first)}\\s*\\+=\\s*1\\b|${escapeRegex(first)}\\s*=\\s*${escapeRegex(first)}\\s*\\+\\s*1\\b)`
      );

      if (unconditionalAdvance.test(content) && conditionalAdvance.test(content)) {
        return true;
      }
    }
  }

  return false;
}
