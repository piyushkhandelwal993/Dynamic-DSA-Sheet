# DSA Sheet 2.0 Design System

## Product Goal

The product is **not** a dashboard.

The product loop is:

```text
Current Task
    ↓
Solve
    ↓
Feedback
    ↓
Next Task
    ↓
Solve Again
```

At any moment, the user should know:

1. What should I do now?
2. Why am I doing it?
3. What comes next?

If a UI element does not support one of those questions, it should be removed or moved into a secondary view.

## Design Principles

The desktop app should feel like a blend of:

- LeetCode
- Linear
- Raycast
- Duolingo progression
- VS Code

The guiding keywords are:

- Focused
- Minimal
- Fast
- Professional
- Adaptive

Avoid:

- gamified clutter
- too many charts on the main screen
- too many badges
- too many competing accent colors

## Visual Direction

The base visual direction is dark, calm, and editor-first.

Primary goals:

- strong contrast for code and reading
- low-noise panels
- one clear accent color
- progression visible, but not loud

The reference image for this direction is:

![DSA Sheet 2.0 reference](/Users/piyushkhandelwal/Downloads/ChatGPT%20Image%20Jun%2014,%202026,%2012_39_10%20PM.png)

## Design Tokens

### Colors

```json
{
  "background": "#0B1020",
  "surface": "#121A2D",
  "surfaceSecondary": "#17233A",
  "primary": "#7C3AED",
  "primaryHover": "#8B5CF6",
  "success": "#22C55E",
  "warning": "#F59E0B",
  "danger": "#EF4444",
  "textPrimary": "#F8FAFC",
  "textSecondary": "#94A3B8",
  "border": "#24324D"
}
```

### Border Radius

```json
{
  "sm": 8,
  "md": 12,
  "lg": 16,
  "xl": 24
}
```

### Shadows

```css
card-shadow:
0 8px 24px rgba(0,0,0,.25);

primary-glow:
0 0 20px rgba(124,58,237,.35);
```

## Typography

### Font

- Primary: `Inter`
- Fallback: `system-ui`

### Sizes

```json
{
  "title": 28,
  "section": 20,
  "cardTitle": 16,
  "body": 14,
  "caption": 12
}
```

## Layout System

### Sidebar

- collapsed width: `72px`
- expanded width: `240px`

### Practice Layout

```text
┌───────────────────────────────┐
│ Header                        │
├───────────────────────────────┤
│ Current Task Strip            │
├─────────────┬─────────────────┤
│ Problem     │ Monaco Editor   │
│             │                 │
├─────────────┴─────────────────┤
│ Result Tabs                   │
└───────────────────────────────┘
```

## Screen Responsibilities

### Practice

Purpose:

- current task
- solving
- feedback

Must include:

- current task strip
- problem statement
- Monaco editor
- result tabs

Must not include:

- heavy analytics
- large world maps
- busy charts
- full problem-library workflow by default

### Progress

Purpose:

- analytics only

Contains:

- streak calendar
- topic progress
- skill radar or skill bars
- submission trend

Must not include:

- editor
- problem statement

### World

Purpose:

- progression

Contains:

- world path
- zones
- unlock states
- recommendation context

Style:

- dark fantasy map
- soft gradients
- subtle particles

### Problems

Purpose:

- library

Contains:

- search
- filters
- problem list
- difficulty
- status

Must not become the primary workflow.

## Core Components

### Current Task Strip

This is the highest-priority component in the product.

```json
{
  "component": "CurrentTaskStrip",
  "height": 88,
  "background": "surface",
  "left": {
    "label": "Current Task",
    "problem": "Two Sum",
    "difficulty": "Easy"
  },
  "right": {
    "streak": 12,
    "topicProgress": "23/30"
  }
}
```

Visual intent:

```text
Current Task
Two Sum

🔥 12       23/30
```

Rules:

- always visible on `Practice`
- always tells the learner what to do now
- never gets visually buried under lower-priority cards

### Next Task Card

Shown after submit.

```json
{
  "component": "NextTaskCard",
  "title": "Contains Duplicate",
  "difficulty": "Easy",
  "reason": "HashMap reinforcement",
  "xp": 25
}
```

Rules:

- should feel like a clean handoff
- should not compete with execution feedback until the user is ready

### Recommendation Card

Small card only.

Never larger than `240px`.

```json
{
  "component": "AdaptiveCoach",
  "title": "Why this problem?",
  "reason": "Repeated misses on hash lookups"
}
```

Rules:

- explanation should be concise
- explanation should be learner-facing, not system-facing

### World Node

```json
{
  "component": "WorldNode",
  "states": [
    "locked",
    "current",
    "completed"
  ]
}
```

State rules:

- `locked`
  - opacity: `0.4`
- `current`
  - purple glow
  - scale `1.08`
- `completed`
  - green check

## Icons

Use Lucide icons.

```json
{
  "Practice": "Code2",
  "Progress": "BarChart3",
  "World": "Map",
  "Problems": "BookOpen",
  "Streak": "Flame",
  "Success": "CircleCheck",
  "Failed": "CircleX",
  "Run": "Play",
  "Submit": "Send"
}
```

## Motion

Motion should be subtle and purposeful.

### Task Completion

Duration:

```text
600ms
```

Sequence:

```text
Green check
XP counter increase
Confetti burst
Next Task Card slides up
```

### Current Task Hover

```text
scale: 1.02
duration: 150ms
```

## Empty States

### New User

```text
🦉

Welcome to DSA Sheet.

Start with your first task.
```

### No Streak

```text
🔥

Solve today to begin a streak.
```

## Success Modal

```json
{
  "title": "Great Work",
  "xp": 25,
  "streak": 1,
  "nextTask": "Contains Duplicate"
}
```

Visual hierarchy:

```text
✓ Great Work

+25 XP

+1 Day Streak

Next:
Contains Duplicate

[ Start Next Task ]
```

## Core UX Rules

Every screen should help answer:

```text
What am I learning?
What should I solve next?
Why was it recommended?
```

If a screen cannot answer those clearly, it needs to be simplified.

## Asset Prompts

These prompts can be used later for art direction and illustration generation.

### World Background

```text
Dark fantasy coding map, floating islands representing DSA topics, Arrays kingdom, Linked List forest, Graph mountains, Dynamic Programming temple, premium game UI, dark purple theme, concept art, ultra detailed
```

### Empty State Owl

```text
Friendly intelligent owl mentor, purple and blue accents, modern vector illustration, coding education platform mascot, transparent background
```

### Achievement Badge Set

```text
Modern achievement badge pack for coding platform, arrays badge, hashmap badge, graph badge, dp badge, clean vector style, transparent background
```

## Implementation Notes

This design system should guide:

- desktop shell restyling
- component refactors
- future illustration work
- icon usage
- view hierarchy

It should also override older lighter-theme experiments when there is a conflict, because this system is the current intended product direction.
