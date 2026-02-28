---
title: RetireView Style Guide
last_updated: 2026-02-28
owner: Design System
purpose: Reference for building new components that match the app's visual identity
---

# RetireView Style Guide

## Design Direction: "Refined Wealth"

Dark-first financial dashboard. Emerald green = growth/prosperity. Gold = highlights/accents. Instrument Serif for display, Plus Jakarta Sans for body. Subtle grain texture. Entrance animations.

## Color Tokens

All colors use oklch. Reference via CSS variables or Tailwind utilities.

### Core Palette

| Token | Tailwind | Usage |
|-------|----------|-------|
| `--background` | `bg-background` | Page background (dark charcoal) |
| `--card` | `bg-card` | Card/panel surfaces |
| `--foreground` | `text-foreground` | Primary text |
| `--muted-foreground` | `text-muted-foreground` | Secondary text, labels |
| `--border` | `border-border` | All borders |

### Brand Colors

| Token | Tailwind | Usage |
|-------|----------|-------|
| `--emerald` | `text-emerald` / `bg-emerald` | Positive values, primary accent, progress |
| `--emerald-muted` | `bg-emerald-muted` | Subtle emerald backgrounds (15% opacity) |
| `--gold` | `text-gold` / `bg-gold` | Secondary accent, highlights, rates |
| `--gold-muted` | `bg-gold-muted` | Subtle gold backgrounds (15% opacity) |
| `--destructive` | `text-destructive` | Negative values, errors |

### Chart Colors

5-step palette: `--chart-1` through `--chart-5`. Use `var(--color-chart-N)` in Recharts.

```
chart-1: emerald (primary)
chart-2: teal-green (secondary)
chart-3: gold (accent)
chart-4: deep teal
chart-5: dark cyan
```

## Typography

### Fonts

- **Display**: `font-display` (Instrument Serif) — page titles, hero numbers, card section headers
- **Body**: `font-sans` (Plus Jakarta Sans) — everything else

### Hierarchy

| Element | Classes |
|---------|---------|
| Page title | `font-display text-4xl tracking-tight text-foreground` |
| Section header | `font-display text-lg text-foreground` |
| Hero number | `font-display text-5xl tracking-tight text-foreground` |
| Stat value | `text-2xl font-bold text-foreground` |
| Label | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| Body text | `text-sm text-muted-foreground` |

## Component Patterns

### Stat Card

Use for metric displays. No shadcn Card wrapper — use raw divs.

```tsx
<div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-1">
  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
    Label
  </p>
  <p className="mt-2 text-2xl font-bold text-foreground">
    $1,234.56
  </p>
  <p className="mt-1 text-sm text-muted-foreground">subtitle</p>
</div>
```

### Chart Container

Wrap Recharts in styled div, not shadcn Card.

```tsx
<div className="animate-fade-up delay-3 rounded-xl border border-border bg-card p-6">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="font-display text-lg text-foreground">Chart Title</h3>
    {/* toggle or controls */}
  </div>
  <ResponsiveContainer width="100%" height={350}>
    {/* chart */}
  </ResponsiveContainer>
</div>
```

### Hero Section

Large feature card with gradient background.

```tsx
<div className="animate-scale-in relative overflow-hidden rounded-2xl border border-border bg-card p-8">
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-muted via-transparent to-gold-muted" />
  <div className="relative">
    {/* content */}
  </div>
</div>
```

## Animation Classes

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fade-up` | Fade in + slide up 12px | 0.5s ease-out |
| `animate-fade-in` | Simple fade in | 0.4s ease-out |
| `animate-scale-in` | Fade in + scale from 95% | 0.4s ease-out |
| `animate-glow-pulse` | Pulsing opacity (0.6–1) | 3s infinite |
| `animate-draw-ring` | SVG ring stroke animation | 1.5s ease-out |

### Stagger Delays

Apply `delay-1` through `delay-5` (100ms increments) for cascading entrance:

```tsx
<div className="animate-fade-up delay-1">First</div>
<div className="animate-fade-up delay-2">Second</div>
<div className="animate-fade-up delay-3">Third</div>
```

## Utility Classes

| Class | Effect |
|-------|--------|
| `card-hover` | translateY(-1px) + shadow on hover |
| `ring-glow` | Emerald drop-shadow for SVG elements |
| `grain` | Applied to `<body>` — subtle noise texture overlay |

## Recharts Styling

### Axis Ticks

```tsx
<XAxis
  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
  axisLine={{ stroke: 'var(--color-border)' }}
  tickLine={false}
/>
<YAxis
  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
  axisLine={false}
  tickLine={false}
/>
```

### Grid

```tsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="var(--color-border)"
  strokeOpacity={0.5}
/>
```

### Tooltip

```tsx
<Tooltip
  contentStyle={{
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
  }}
/>
```

### Gradient Fills (for Area/Line charts)

```tsx
<defs>
  <linearGradient id="myGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity={0.3} />
    <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity={0} />
  </linearGradient>
</defs>
<Area fill="url(#myGradient)" stroke="var(--color-emerald)" />
```

## Color Semantics

- **Positive values** (gains, growth, on-track): `text-emerald`
- **Negative values** (losses, behind): `text-destructive`
- **Neutral values**: `text-foreground`
- **Rates, percentages, highlights**: `text-gold`
- **Labels, descriptions**: `text-muted-foreground`

## Don'ts

- Don't use Inter, Roboto, Arial, or system fonts
- Don't use white backgrounds or light theme
- Don't use shadcn Card for chart wrappers or stat cards (use styled divs)
- Don't skip entrance animations on new content sections
- Don't use inline colors — always reference CSS variables
- Don't use `className="stroke-muted"` — use `stroke="var(--color-border)"` for Recharts
