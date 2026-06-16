# Desktop App Guide

See also: [docs/design-system.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/design-system.md)
See also: [docs/ui-gap-checklist.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/ui-gap-checklist.md)

## Overview

The desktop app is the GUI layer for `dsa-sheet`. It is built with Electron and reuses the same TypeScript learning engine as the CLI.

The current desktop direction is:

- keep the main experience centered on solving one problem at a time
- make the `Practice` view feel like a coding platform
- keep adaptive coaching visible, but not distracting
- move heavy analytics and gamification into separate views

## Current Product Shape

The desktop app is split into 4 views:

1. `Practice`
2. `Progress`
3. `World`
4. `Problems`

### Practice

This is the default screen and should stay the simplest.

It includes:

- current topic / world header
- next task strip
- streak count
- solved count for the active topic
- problem panel on the left
- Monaco editor on the right
- result panel below the workspace

The result panel is tabbed into:

- `Summary`
- `Execution`
- `Next Step`

### Progress

This is the analytics screen.

It includes:

- streak calendar
- submission trend
- topic progress
- strongest skills / concept bars

### World

This is the gamified progression screen.

It includes:

- why the current recommendation was chosen
- world zones and unlock states

### Problems

This is the manual browsing screen.

It includes:

- full problem bank for the active topic
- manual jump into any problem

## Practice View Principles

The `Practice` view follows these rules:

- always show the current problem and editor
- always make the next task obvious
- keep the screen calm during solving
- show detailed feedback only after save or submit
- avoid mixing analytics, world progression, and coding on one screen

### What stays visible

- current topic
- next task
- streak count
- solved count
- problem statement
- editor
- save / submit actions

### What stays hidden until needed

- result details
- compile/test failures
- likely cause hints
- next recommendation explanation

### What lives outside Practice

- progress graphs
- skill bars
- world zones
- manual problem browsing

## Editor Design

The desktop app now uses Monaco instead of a plain textarea.

Current editor features:

- Java syntax highlighting
- line numbers
- bracket matching
- indentation guides
- automatic layout
- editor font size controls
- save state badge
- cursor position
- selection count
- line count
- `Cmd/Ctrl + S` save shortcut

The editor area currently supports:

- `Open File`
- `Save`
- `Submit`

## Current Submission UX

After a submit, feedback is split into 3 tabs.

### Summary

Shows:

- final score
- correctness
- concept match
- quality
- complexity
- detected concepts
- missing concepts

### Execution

Shows:

- compile result
- tests passed
- failed test cases
- compiler error details when compilation fails

### Next Step

Shows:

- likely cause
- adaptive recommendation

## Local Execution Model

Execution still happens on the client machine.

Current flow:

1. user starts a problem
2. desktop app creates or opens the local workspace file
3. user writes Java code in Monaco
4. user saves or submits
5. submission service compiles and runs Java locally
6. adaptive engine updates progress, skill profile, and rewards

## Core Files

### Desktop shell

- [desktop/index.html](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop/index.html)
- [desktop/styles.css](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop/styles.css)
- [desktop/renderer.js](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop/renderer.js)
- [desktop/main.js](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop/main.js)
- [desktop/preload.js](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/desktop/preload.js)

### Shared desktop services

- [src/services/desktopApp.ts](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/src/services/desktopApp.ts)
- [src/services/submission.ts](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/src/services/submission.ts)
- [src/services/workspace.ts](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/src/services/workspace.ts)
- [src/services/javaRunner.ts](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/src/services/javaRunner.ts)

## Known UX Direction

The desktop app is intentionally moving away from a dashboard-first layout.

The target is:

- coding-first
- focused
- low-noise
- adaptive, but not overwhelming

That means:

- `Practice` should feel closer to LeetCode
- `Progress` should feel like analytics
- `World` should feel like progression
- `Problems` should feel like a library

## Next Recommended Improvements

### Short term

- add a `Run` button separate from `Submit`
- show execution output before it affects progress
- make the problem panel use smaller tabs like `Description`, `Examples`, `Hints`
- improve result cards visually

### Medium term

- add custom input run mode
- add editor theme switch
- add split result tabs with clearer icons and visual status
- add a resizable problem/editor split pane

### Longer term

- package signed desktop builds for macOS and Windows
- add optional account sync
- add more topic-aware world progression visuals

## How To Run

```bash
npm install
npm run build
npm run desktop
```

For development:

```bash
npm run desktop:dev
```
