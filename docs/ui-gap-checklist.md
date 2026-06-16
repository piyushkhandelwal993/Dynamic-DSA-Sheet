# UI Gap Checklist

See also:

- [docs/design-system.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/design-system.md)
- [docs/desktop-app.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/desktop-app.md)

Reference image:

![DSA Sheet 2.0 reference](/Users/piyushkhandelwal/Downloads/ChatGPT%20Image%20Jun%2014,%202026,%2012_39_10%20PM.png)

## Purpose

This document tracks what is already aligned with the reference image and what is still pending in the desktop UI.

It is intentionally practical:

- what is done
- what is partially done
- what is still missing
- what should be implemented next

## Status Key

- `Done`: matches the reference direction well enough for now
- `Partial`: implemented, but still visually or behaviorally weaker than the reference
- `Pending`: not implemented or not at the expected fidelity yet
- `Blocked by stability`: should not be polished further until layout/state issues are fully stable

## Overall Summary

### Done

- app-level multi-view structure exists: `Practice`, `Progress`, `World`, `Problems`
- problem-left / editor-right solving flow exists
- Monaco editor is integrated
- `Run` and `Submit` are separate actions
- result area is tabbed into `Summary`, `Execution`, and `Next Step`
- success handoff modal exists
- dark design system direction is established

### Partial

- current task strip
- practice top bar
- result cards
- problems library
- world map styling
- progress analytics composition
- icon consistency
- motion polish

### Pending / Needs Work

- fully polished toolbar fidelity
- premium world illustration layer
- polished chart system
- onboarding / first-use guidance
- layout hardening and recovery UX

## Screen-by-Screen Checklist

## Practice

### Layout

- `Done`: left problem / right editor split exists
- `Done`: result section sits below the workspace
- `Partial`: spacing and alignment between header, task strip, workspace, and result section still need cleanup
- `Blocked by stability`: split persistence and startup layout need to be fully reliable before more polish

### Top Bar

- `Partial`: active topic / context exists
- `Partial`: player chip exists
- `Partial`: utility actions exist
- `Pending`: compact breadcrumb-style hierarchy like the reference
- `Pending`: cleaner icon rhythm and button sizing
- `Pending`: tighter alignment between topic, difficulty, actions, and profile

### Current Task Strip

- `Done`: current task is clearly shown
- `Done`: next-task flow is central to the screen
- `Partial`: visual density and hierarchy are weaker than the reference
- `Pending`: stronger compact stat cards for streak and topic completion
- `Pending`: more premium card composition and spacing

### Problem Panel

- `Done`: problem information is on the left
- `Done`: problem sections use tabs
- `Partial`: typography rhythm is not yet as clean as the reference
- `Pending`: tighter metadata row for topic, difficulty, and expected complexity
- `Pending`: examples and constraints need more polished section styling

### Editor Panel

- `Done`: Monaco editor is active
- `Done`: focus mode exists
- `Done`: save state and editor controls exist
- `Partial`: editor toolbar still feels heavier and less refined than the reference
- `Pending`: better grouping of save/run/submit controls
- `Pending`: more polished editor header and status presentation

### Result Section

- `Done`: tabbed summary/execution/next-step flow exists
- `Partial`: result information architecture is correct, but the visual fidelity is lower than the reference
- `Pending`: stronger score ring or gauge
- `Pending`: more visual metric rows
- `Pending`: cleaner concept-chip grouping
- `Pending`: more polished failed-case cards
- `Pending`: stronger recommendation card hierarchy

## Progress

- `Done`: separate analytics view exists
- `Partial`: streak / progress / trend information exists
- `Pending`: stronger chart layout composition
- `Pending`: better card hierarchy and spacing
- `Pending`: visual polish for streak calendar and trend chart
- `Pending`: more intentional strongest-skill presentation

## World

- `Done`: separate world/progression view exists
- `Done`: zone concept exists
- `Partial`: world nodes and path are present but still lighter than the reference
- `Pending`: illustrated world background
- `Pending`: stronger node states and path visuals
- `Pending`: richer “current zone” emphasis
- `Pending`: more atmospheric fantasy-map presentation

## Problems

- `Done`: separate library view exists
- `Partial`: search / filter / status direction exists in some form
- `Pending`: full polished problem-table layout
- `Pending`: stronger row density and scanability
- `Pending`: better difficulty and status chips
- `Pending`: clearer manual-jump workflow

## Cross-Cutting UI

### Iconography

- `Partial`: icons exist in major flows
- `Pending`: fully consistent icon family, sizing, and stroke weight across all screens

### Motion

- `Partial`: success modal has motion polish
- `Pending`: subtle hover/transition polish across tabs, cards, and navigation
- `Pending`: more consistent state-change motion language

### Empty States

- `Partial`: some empty-state guidance exists
- `Pending`: fully designed new-user state
- `Pending`: fully designed no-task / no-progress / no-streak states

### Discoverability

- `Partial`: some tooltips and shortcuts exist
- `Pending`: broader tooltip coverage
- `Pending`: stronger first-use hints
- `Pending`: lightweight onboarding flow

### Stability / Recovery

- `Pending`: `Reset Layout`
- `Pending`: `Reset Desktop Preferences`
- `Pending`: robust startup-state recovery for broken saved layout states
- `Blocked by stability`: additional polish should not outrun layout reliability

## Done vs Pending by Priority

## Priority 1

- stabilize layout and state restoration
- add reset/recovery controls
- clean up Practice screen spacing and toolbar grouping
- improve result-section readability

## Priority 2

- refine current-task strip
- improve Problems table layout
- polish Progress card composition
- unify iconography

## Priority 3

- add world illustration layer
- improve chart visuals
- add broader motion polish
- add first-time onboarding states

## Recommended Next UI Sprint

### Sprint 1: Stability and Core Practice

- finish layout/state hardening
- add `Reset Layout` and `Reset Preferences`
- clean up Practice header
- clean up task strip
- improve result hierarchy

### Sprint 2: Secondary Views

- polish Problems library
- polish Progress cards and charts
- tighten World node/path visuals

### Sprint 3: Premium Finish

- world background art
- icon consistency pass
- onboarding and empty states
- motion polish

## Definition of “Reference-Matched Enough”

The desktop UI does not need to be pixel-identical to the reference.

It should meet these conditions:

- `Practice` feels coding-first and uncluttered
- the current task is unmistakable
- the result flow is readable and useful
- `Progress`, `World`, and `Problems` feel like distinct secondary views
- visual style feels intentional, modern, and cohesive
- layout does not break or restore into confusing states
