function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceIdentifiers(content: string, roles: Record<string, string>): string {
  const entries = Object.entries(roles)
    .filter(([source, target]) => source && source !== target)
    .sort(([left], [right]) => right.length - left.length);

  if (!entries.length) return content;

  const placeholders = new Map<string, string>();
  let normalized = content;
  entries.forEach(([source], index) => {
    const placeholder = `__dsa_role_${index}__`;
    placeholders.set(placeholder, roles[source]);
    normalized = normalized.replace(new RegExp(`\\b${escapeRegex(source)}\\b`, "g"), placeholder);
  });
  placeholders.forEach((target, placeholder) => {
    normalized = normalized.replace(new RegExp(escapeRegex(placeholder), "g"), target);
  });
  return normalized;
}

function inferBinarySearchRoles(content: string): Record<string, string> {
  const roles: Record<string, string> = {};
  const safeMid =
    /\b([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\s*\+\s*\(\s*([a-zA-Z_]\w*)\s*-\s*\2\s*\)\s*\/\s*2\b/.exec(content);
  const simpleMid =
    /\b([a-zA-Z_]\w*)\s*=\s*\(\s*([a-zA-Z_]\w*)\s*\+\s*([a-zA-Z_]\w*)\s*\)\s*\/\s*2\b/.exec(content);
  const match = safeMid ?? simpleMid;
  if (!match) return roles;

  const midpoint = match[1];
  let lower = match[2];
  let upper = match[3];
  const midpointName = escapeRegex(midpoint);

  const movesUp = (name: string) =>
    new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*${midpointName}\\s*\\+\\s*1\\b`).test(content);
  const movesDown = (name: string) =>
    new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*${midpointName}(?:\\s*-\\s*1)?\\b`).test(content);
  const firstMovesUp = movesUp(lower);
  const firstMovesDown = movesDown(lower);
  const secondMovesUp = movesUp(upper);
  const secondMovesDown = movesDown(upper);
  if (firstMovesDown && secondMovesUp) {
    [lower, upper] = [upper, lower];
  } else if (!firstMovesUp && !secondMovesDown) {
    return roles;
  }

  if (!/^(?:mid|cut1|cut2)$/.test(midpoint)) roles[midpoint] = "mid";
  roles[lower] = "left";
  roles[upper] = "right";

  const indexedMid = new RegExp(`\\b([a-zA-Z_]\\w*)\\s*\\[\\s*${midpointName}\\s*\\]`).exec(content);
  if (indexedMid) roles[indexedMid[1]] = "values";

  const comparison = new RegExp(
    `(?:\\b[a-zA-Z_]\\w*\\s*\\[\\s*${midpointName}\\s*\\]\\s*(?:==|<=|>=|<|>)\\s*([a-zA-Z_]\\w*)\\b|\\b([a-zA-Z_]\\w*)\\s*(?:==|<=|>=|<|>)\\s*[a-zA-Z_]\\w*\\s*\\[\\s*${midpointName}\\s*\\])`
  ).exec(content);
  const target = comparison?.[1] ?? comparison?.[2];
  if (target && !roles[target]) roles[target] = "target";

  return roles;
}

export function normalizeBinarySearchRoles(content: string): string {
  return replaceIdentifiers(content, inferBinarySearchRoles(content));
}

function inferLinkedListRoles(content: string, access: "." | "->"): Record<string, string> {
  const roles: Record<string, string> = {};
  const member = escapeRegex(access);

  const oneStep = new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*\\1${member}next\\b`,
    "g"
  );
  const twoStep = new RegExp(
    `\\b([a-zA-Z_]\\w*)\\s*=\\s*\\1${member}next${member}next\\b`,
    "g"
  );
  const oneStepNames = Array.from(content.matchAll(oneStep), (match) => match[1]);
  const twoStepNames = Array.from(content.matchAll(twoStep), (match) => match[1]);
  const slow = oneStepNames.find((name) => !twoStepNames.includes(name));
  const fast = twoStepNames[0];
  if (slow && fast) {
    roles[slow] = "slow";
    roles[fast] = "fast";
  }

  const reverseLink = new RegExp(
    `\\b([a-zA-Z_]\\w*)${member}next\\s*=\\s*([a-zA-Z_]\\w*)\\b`
  ).exec(content);
  if (reverseLink) {
    const current = reverseLink[1];
    const previous = reverseLink[2];
    const previousAdvance = new RegExp(
      `\\b${escapeRegex(previous)}\\s*=\\s*${escapeRegex(current)}\\b`
    ).test(content);
    const previousStartsEmpty = new RegExp(
      `\\b${escapeRegex(previous)}\\s*=\\s*(?:null|nullptr|NULL)\\b`
    ).test(content);
    if (previousAdvance && previousStartsEmpty) {
      roles[current] = "curr";
      roles[previous] = "prev";
      const currentAdvance = new RegExp(
        `\\b${escapeRegex(current)}\\s*=\\s*([a-zA-Z_]\\w*)\\b`
      ).exec(content.slice(reverseLink.index + reverseLink[0].length));
      if (currentAdvance?.[1] && currentAdvance[1] !== previous) {
        roles[currentAdvance[1]] = "next";
      }
    }
  }

  const headGuard = new RegExp(
    `(?:\\b([a-zA-Z_]\\w*)\\s*==\\s*(?:null|nullptr|NULL)|!\\s*([a-zA-Z_]\\w*)\\b)`
  ).exec(content);
  const head = headGuard?.[1] ?? headGuard?.[2];
  if (head && !roles[head]) roles[head] = "head";

  return roles;
}

export function normalizeJavaLinkedListRoles(content: string): string {
  return replaceIdentifiers(content, inferLinkedListRoles(content, "."));
}

export function normalizeCppLinkedListRoles(content: string): string {
  return replaceIdentifiers(content, inferLinkedListRoles(content, "->"));
}
