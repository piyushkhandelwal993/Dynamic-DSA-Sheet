# dsa-sheet

`dsa-sheet` is a Node.js + TypeScript adaptive DSA learning tool with both a CLI and a desktop app foundation. It now includes Bit Manipulation, Arrays, Recursion, and Linked List, with local Java execution and concept-aware feedback.

## Features

- Personalized next-problem recommendation with prerequisite awareness
- Topic worlds for Bit Manipulation, Arrays, Recursion, and Linked List
- Starter-file generation and local workspace management
- Local Java compilation and execution against problem test cases
- Static Java code analysis for concept detection and code quality feedback
- Local JSON storage in `~/.dsa-sheet`
- No database and no external APIs

## Installation

```bash
cd dsa-sheet
npm install
npm run build
npm link
```

After linking, the CLI command is available as:

```bash
dsa --help
```

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run desktop
npm run desktop:dev
npm run desktop:package
npm run desktop:dist
```

## Sample Usage

```bash
dsa init
dsa topics
dsa next
dsa start bit-001
dsa submit bit-001
dsa stats
dsa revise
dsa learn left-shift
```

## Desktop App

The repo now includes an Electron desktop shell under [`desktop/`](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop). On a normal macOS or Windows machine you can run:

```bash
npm install
npm run build
npm run desktop
```

The desktop app provides:

- topic switching
- quest and world overview
- problem browser
- in-app Java editor
- save and submit flow powered by the same TypeScript engine as the CLI

For deeper product docs, see:

- [docs/desktop-app.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/desktop-app.md)
- [docs/design-system.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/design-system.md)
- [docs/ui-gap-checklist.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/ui-gap-checklist.md)
- [docs/publishing-desktop.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/publishing-desktop.md)
- [docs/first-release-checklist.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/first-release-checklist.md)
- [docs/versioning-and-updates.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/versioning-and-updates.md)
- [docs/windows-preview-install.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/windows-preview-install.md)

## Adaptive Recommendation System

The CLI updates a local skill profile after each submission and uses it to recommend the next step:

- Revision-due problems come first.
- Weak concepts are prioritized before harder topics.
- Prerequisite gaps block advanced recommendations.
- Easy problems are preferred before medium and hard ones.
- Beginner problems can be skipped when the same concept is solved well three times.
- If a student uses a workaround approach instead of the intended bit trick, the CLI recommends remedial concepts and targeted easy problems.

## Storage

The CLI and desktop app create these local files:

- `~/.dsa-sheet/profile.json`
- `~/.dsa-sheet/progress.json`
- `~/.dsa-sheet/skill-profile.json`
- `~/.dsa-sheet/submissions/`
- `~/.dsa-sheet/workspace/`

## MVP Notes

- Java submissions only
- Local execution happens on the client machine
- Problems with test cases use real compile/run-based correctness
- Problems without test cases still fall back to heuristic correctness
# Analyzer Benchmark

Run the adversarial Java/C++ analyzer benchmark before a release:

```bash
npm run benchmark:analyzer
```

The command reports labeled precision, recall, and Java/C++ parity and exits unsuccessfully when the release quality floor is missed.

## Test-Case Coverage

Audit executable and hidden boundary-case coverage before a release:

```bash
npm run audit:test-cases
```

Java and C++ use the same effective test-case registry. The audit distinguishes authoritative configured or curated cases from weaker example-only fallback coverage and fails when the release floor is missed.

Problem stdin/stdout serialization follows [docs/problem-io-contract.md](docs/problem-io-contract.md).
