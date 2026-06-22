# Internet Detective - Design System

---

# 1. Design Vision

## Design Philosophy

Internet Detective should feel like a futuristic cyberpunk control terminal rather than a traditional web application.

The interface represents an underground hacker network where players compete to solve visual investigations.

The UI should feel:

* Fast
* Tactical
* Futuristic
* Competitive
* Immersive
* High-tech
* Slightly industrial

Avoid:

* Corporate dashboards
* Flat material design
* Rounded playful interfaces
* Bright white backgrounds
* Generic SaaS aesthetics

---

# 2. Visual Inspiration

Primary inspirations:

* Cyberpunk 2077
* Blade Runner 2049
* TRON Legacy
* Ghost in the Shell
* The Matrix
* Deus Ex
* Akira
* Watch Dogs
* Terminal Interfaces
* Sci-fi HUDs

---

# 3. Design Principles

Every screen should prioritize:

* Information hierarchy
* Readability
* Fast interactions
* Competitive atmosphere
* Responsive layouts
* Consistent spacing
* Minimal distractions

The interface should always communicate:

> "You're inside a futuristic investigation terminal."

---

# 4. Color Palette

## Background

```text
#0A0A0F
```

Deep matte black.

---

## Surface

```text
#12121A
```

Cards

Panels

Dialogs

---

## Elevated Surface

```text
#1A1A26
```

Hover states

Dropdowns

Navigation

---

## Primary Accent

```text
#00FF88
```

Buttons

Highlights

Active timer

Success

---

## Secondary Accent

```text
#00D4FF
```

Information

Links

Secondary buttons

Player highlights

---

## Warning

```text
#FFC857
```

Round ending

Low timer

Warnings

---

## Danger

```text
#FF3366
```

Errors

Disconnected

Delete

Game Over

---

## Text

Primary

```text
#F3F4F6
```

Secondary

```text
#9CA3AF
```

Muted

```text
#6B7280
```

---

## Borders

```text
#2A2A3A
```

Thin subtle borders.

---

# 5. Typography

## Headings

Orbitron

Used for:

* Titles
* Timer
* Scores
* Leaderboard

---

## Body

JetBrains Mono

Used for:

* Descriptions
* Instructions
* Paragraphs

---

## Labels

Share Tech Mono

Used for:

* Buttons
* Badges
* Status
* IDs
* Room Codes

---

# 6. Spacing System

Base spacing:

```text
4px
```

Scale:

```text
4
8
12
16
20
24
32
40
48
64
96
```

Never use arbitrary spacing unless absolutely necessary.

---

# 7. Border Radius

Use minimal rounding.

```text
2px

4px

6px
```

Avoid large rounded corners.

The application should feel industrial.

---

# 8. Shadows

Cards

Very subtle

Hover

Soft neon glow

Buttons

Green glow

Dialogs

Dark elevated shadow

Avoid heavy drop shadows.

---

# 9. Layout

Maximum content width

```text
1400px
```

Sections

Centered

Consistent margins

Responsive

---

# 10. Navigation

Desktop

Top navigation bar.

Contains:

Logo

Host

Join

Settings

Profile (future)

---

Mobile

Collapsed navigation.

Bottom actions when appropriate.

---

# 11. Page Design

## Landing Page

Sections:

Hero

↓

Features

↓

How It Works

↓

Technology

↓

CTA

↓

Footer

---

## Host Dashboard

Layout

```text
────────────────────────────────────

Header

────────────────────────────────────

Sidebar

Game Controls

Leaderboard

Player List

Round Info

────────────────────────────────────
```

---

## Player Screen

Layout

```text
Header

↓

Target Status

↓

Timer

↓

Upload Area

↓

Submission Status
```

Simple.

Focused.

Minimal.

---

## Results Screen

Large centered leaderboard.

Animated ranking changes.

Winning player highlighted.

---

# 12. Cards

Cards should have:

* dark background
* thin border
* subtle glow
* clean spacing

No excessive decoration.

---

# 13. Buttons

Primary

Green

Filled

---

Secondary

Blue

Outline

---

Danger

Red

Filled

---

Ghost

Transparent

---

Buttons should animate smoothly.

---

# 14. Forms

Inputs

Dark background.

Thin border.

Green focus state.

Clear labels.

Validation messages underneath.

---

# 15. Icons

Use Lucide Icons.

Style:

Thin stroke

Consistent sizing

Minimalistic

Do not mix icon styles.

---

# 16. Animations

Animations should communicate state.

Preferred animations:

Fade

Slide

Scale

Glow

Leaderboard movement

Number counting

Timer pulse

Avoid:

Bounce

Elastic

Overly playful animations

---

# 17. Loading States

Skeleton loaders.

Progress indicators.

Spinner only when unavoidable.

Show progress for uploads.

---

# 18. Leaderboard

Must feel competitive.

Display:

Position

Player

Score

Movement indicator

Movement:

↑

↓

—

Animate ranking transitions.

Winning player:

* Green glow
* Larger card
* Trophy icon

---

# 19. Timer

The timer is the most important visual element during gameplay.

Behavior:

Above 15 seconds

Green

10–15 seconds

Yellow

Below 10 seconds

Red

Final 5 seconds

Pulse animation

Subtle screen glow

---

# 20. Upload Zone

Large drop area.

Desktop:

* Paste Image
* Upload File
* Drag & Drop

Mobile:

* Upload from Gallery
* Choose File

Display preview immediately.

Show upload progress.

Allow replacing image before submission.

---

# 21. Notifications

Toast notifications.

Top-right.

Auto dismiss.

Success

Green

Warning

Yellow

Error

Red

Information

Blue

---

# 22. Responsive Design

Desktop

Primary experience.

Tablet

Slightly condensed layout.

Mobile

Optimized for:

Portrait orientation

One-handed interaction

Large touch targets

Readable typography

---

# 23. Accessibility

Support:

Keyboard navigation

Visible focus states

ARIA labels

High contrast

Screen readers

Reduced motion preferences

---

# 24. Component Library

Create reusable components for:

* Button
* Card
* Input
* Modal
* Dialog
* Badge
* Avatar
* Timer
* Leaderboard
* Player Card
* Upload Zone
* QR Code
* Navigation Bar
* Sidebar
* Toast
* Tooltip
* Loading Screen
* Empty State
* Error State
* Confirmation Dialog

No duplicated UI components.

---

# 25. Motion Guidelines

Animations should feel:

Fast

Clean

Mechanical

Responsive

Typical duration:

100ms

150ms

200ms

300ms

Use easing for smooth transitions.

Avoid slow animations.

---

# 26. Design Consistency Rules

Every new component must:

* Match the existing color palette.
* Use the established typography.
* Follow the spacing system.
* Reuse existing components whenever possible.
* Be fully responsive.
* Support dark mode (the application is dark-only).
* Be accessible.
* Avoid inline styles.
* Use Tailwind CSS utilities consistently.

Never introduce new colors, spacing scales, typography, or interaction patterns unless they are added to this document first.

---

# 27. Overall User Experience

The application should feel like a polished multiplayer game rather than a traditional CRUD application.

Every interaction should reinforce the feeling of speed, competition, and immersion.

Players should always understand:

* What the current game state is.
* How much time remains.
* Whether their submission succeeded.
* Their current ranking.
* What happens next.

The experience should be intuitive enough that a first-time player can join a room, submit an image, and understand the entire gameplay loop without external instructions.
