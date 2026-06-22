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
