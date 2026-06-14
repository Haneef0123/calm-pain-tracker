# Patterns Tab — Redesign Plan

Comparison of current code vs target design (`Pain Tracker App.dc.html`).
Every change needed to make the Patterns tab match the target exactly.

---

## Files Involved

1. `components/pain/TimeRangeSelector.tsx`
2. `components/pain/StatsCard.tsx`
3. `components/pages/Trends.tsx`

---

## FILE 1 — `components/pain/TimeRangeSelector.tsx`

### Complete restyle to pill segmented control

**Current**: Three loose buttons with individual borders (`px-4 py-2 text-sm rounded-sm border`), laid out with `flex gap-2`. Active state: `bg-foreground text-background border-foreground`. Looks like three separate tags.

**Target**: A single pill-shaped container that houses all three options — identical pattern to the region selector on the Today tab.

**Container change**:
- Current: `flex gap-2` (no background)
- Target: `background: #eaeeea; border-radius: 9999px; padding: 4px; gap: 4px`
- Tailwind: `flex bg-[#eaeeea] rounded-full p-1 gap-1`

**Each button change**:
- Current: `px-4 py-2 text-sm rounded-sm border transition-all duration-100`
- Target: `flex: 1; border: none; border-radius: 9999px; padding: 9px 8px; font-size: 13px; font-weight: 600; transition: all 0.15s ease`
- Active state — target: `background: #ffffff; box-shadow: 0 1px 2px rgba(12,12,12,0.08); color: #1c211d`
- Inactive state — target: `background: transparent; color: #6b716c`
- Tailwind active: `flex-1 rounded-full py-[9px] px-2 text-[13px] font-semibold bg-white text-[#1c211d] shadow-[0_1px_2px_rgba(12,12,12,0.08)]`
- Tailwind inactive: `flex-1 rounded-full py-[9px] px-2 text-[13px] font-semibold bg-transparent text-[#6b716c]`

**Visual impact**: Medium — transforms a tag-row into a unified segmented pill matching the Today tab's region switcher.

---

## FILE 2 — `components/pain/StatsCard.tsx`

### Add white card shell and restyle label + value

**Current**: The component has NO card background — it is a plain `div` with `text-center flex flex-col`. The label uses `text-label mb-2 min-h-[2.5rem]` (14px, font-light, minimum height forces tall label area). The value uses `font-mono text-4xl font-semibold tabular-nums` (36px).

**Target**: Each stat is a self-contained white card.

**Card wrapper change**:
- Current: `<div className="text-center flex flex-col">`
- Target: `background: #ffffff; border-radius: 16px; padding: 14px 8px; box-shadow: 0 1px 2px rgba(12,12,12,0.05); display: flex; flex-direction: column; align-items: center; gap: 4px`
- Tailwind: `bg-white rounded-2xl py-[14px] px-2 shadow-[0_1px_2px_rgba(12,12,12,0.05)] flex flex-col items-center gap-1`

**Label change**:
- Current: `text-label mb-2 min-h-[2.5rem] flex items-center justify-center` — 14px, font-light, `#4A4F4C`, with minimum height
- Target: `font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #919191` — uppercase-style small caps
- Tailwind: `text-[11px] font-semibold tracking-[0.08em] text-[#919191]`
- Remove `mb-2` and `min-h-[2.5rem]` — gap is handled by the card's `gap: 4px`

**Value change**:
- Current: `font-mono text-4xl font-semibold tabular-nums` → 36px Inter (or Roboto Mono if already wired)
- Target: `font-family: 'Roboto Mono', monospace; font-size: 30px; font-weight: 600; line-height: 1`
- Tailwind: `font-mono text-[30px] font-semibold leading-none`
- Color already uses `getPainColor(value)` via inline `style` — keep as-is

**Visual impact**: High — transforms flat text into three white cards that visually anchor the stats row.

---

## FILE 3 — `components/pages/Trends.tsx`

This file has the most changes.

### 1. Container padding

- **Current**: `page-shell page-stack` CSS utility classes — these apply top padding and a vertical stack layout
- **Target**: `padding: 28px 20px 24px; display: flex; flex-direction: column; gap: 14px`
- **Change**: Same pattern as Past Days — override padding to `pt-7 px-5 pb-6` inside the inner div (or remove `page-shell page-stack` and inline the equivalent). Ensure the flex + `gap-[14px]` structure replaces margin-based spacing.

### 2. Page title

- **Current**: `<h1 className="page-title">Patterns</h1>` — `page-title` maps to `text-xl font-semibold tracking-tight` (20px)
- **Target**: `font-size: 24px; line-height: 30px; font-weight: 600; color: #1c211d; letter-spacing: -0.02em`
- **Change**: Replace `page-title` with explicit classes: `text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-[#1c211d]`

### 3. Remove "Showing X days" paragraph

- **Current**: A standalone `<p className="text-center text-xs text-muted-foreground">Showing {rangeLabel}</p>` sits between the stats grid and the chart
- **Target**: This text is gone as a standalone element. The range label moves into the chart card header (see change #6 below)
- **Change**: Delete that `<p>` element entirely

### 4. Chart card container

- **Current**: `rounded-[18px] border border-border bg-card p-[18px]`
- **Target**: `background: #ffffff; border-radius: 18px; padding: 18px 14px 14px; box-shadow: 0 1px 2px rgba(12,12,12,0.05)`
- **Change**: Replace classes with `bg-white rounded-[18px] pt-[18px] px-[14px] pb-[14px] shadow-[0_1px_2px_rgba(12,12,12,0.05)]` — remove `border border-border`, remove uniform `p-[18px]`, add shadow

### 5. Chart card header — title and right label

- **Current**:
  - Left label: `<h2 className="text-sm font-medium text-muted-foreground">Pain Level</h2>` — 14px, medium, `#4A4F4C`
  - Right label: `<p className="text-xs text-muted-foreground">{chartData.length} entries</p>` — entry count
- **Target**:
  - Left label: `font-size: 14px; font-weight: 600; color: #1c211d` — "Pain level" (lowercase 'l')
  - Right label: `font-size: 12px; color: #ababab` — `{rangeLabel}` (e.g. "Last 7 days"), NOT entry count
- **Change**:
  - Left: `text-[14px] font-semibold text-[#1c211d]`, text content → "Pain level"
  - Right: `text-[12px] text-[#ababab]`, content → `{rangeLabel}` (already computed in the component)

### 6. Chart — switch from LineChart to ComposedChart with Area + Line

- **Current**: `<LineChart>` with a single `<Line>` — no area fill under the line
- **Target**: Gradient teal area fill under the line (opacity 16% at top → 0% at bottom)
- **Change**: Replace `<LineChart>` with `<ComposedChart>` from recharts. Add a `<defs>` with a `<linearGradient>` named `areaGradient`, then add an `<Area>` component before the `<Line>`. Import `ComposedChart, Area` from recharts.

```jsx
// Gradient definition (inside <ResponsiveContainer>):
<defs>
  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#008391" stopOpacity={0.16} />
    <stop offset="100%" stopColor="#008391" stopOpacity={0} />
  </linearGradient>
</defs>

// Area component (before Line):
<Area
  type="monotone"
  dataKey="pain"
  fill="url(#areaGradient)"
  stroke="none"
  animationDuration={300}
/>
```

### 7. Chart — line color and width

- **Current**: `stroke="hsl(var(--foreground))"` (near-black), `strokeWidth={2}`
- **Target**: `stroke: #008391` (teal), `stroke-width: 2.5`, `stroke-linecap: round`
- **Change**: Update `<Line>` props: `stroke="#008391"` `strokeWidth={2.5}` — recharts handles `strokeLinecap` via `dot` rendering, not the line itself; the visual effect of round caps is largely from `strokeLinecap="round"` on the SVG path, which recharts applies automatically

### 8. Chart — grid lines

- **Current**: `<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3}>`  — horizontal dashed lines at ~30% opacity
- **Target**: Horizontal solid lines `stroke: #eef1ee; stroke-width: 1` — no dashes, full opacity, slightly different color
- **Change**: Update `<CartesianGrid>` props: `strokeDasharray=""` (or remove it), `stroke="#eef1ee"`, remove `opacity={0.3}`

### 9. Chart — Y-axis tick color

- **Current**: `tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}`
- **Target**: `fill: #ababab; font-size: 10px`
- **Change**: `tick={{ fontSize: 10, fill: '#ababab' }}`

### 10. Chart — X-axis tick color

- **Current**: `tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}`
- **Target**: `fill: #919191; font-size: 10.5px`
- **Change**: `tick={{ fontSize: 10.5, fill: '#919191' }}`

### 11. Chart — dot color ramp (CustomDot)

- **Current**: `CustomDot` uses 2-state color logic: `painLevel <= 6 ? 'hsl(var(--foreground))' : 'hsl(var(--destructive))'`
- **Target**: Full 11-step ramp from `getPainColor()`, matching the color used in history cards
- **Change**: Replace the 2-state logic with `getPainColor(painLevel)`. Import `getPainColor` from `@/lib/utils`.
- Also change dot `stroke` from `"hsl(var(--background))"` to `"#ffffff"` for consistency with the target

### 12. Chart — selected dot enlargement

- **Current**: All dots render at the same `r={4}`. `activeDot` from recharts handles hover enlargement.
- **Target**: The selected dot (from click, not hover) renders at a larger radius; the rest remain small
- **Change**: Add `selectedPoint: ChartDataPoint | null` state (default `null`). Pass `selectedPoint` into `CustomDot` via the recharts `dot` prop as a callback. In `CustomDot`, check if this dot's `payload.timestamp === selectedPoint?.timestamp` — if so, render `r={6}` instead of `r={4}`.

### 13. Chart — remove Recharts Tooltip, add click-to-select

- **Current**: `<Tooltip content={<CustomTooltip />}>` — a floating tooltip on hover showing date, pain level, disc info, notes
- **Target**: No floating tooltip. Instead, clicking a dot updates `selectedPoint` state, which renders a static detail card below the chart. The hint text reads "Tap points for details".
- **Change**:
  - Remove `<Tooltip>` from the chart JSX
  - Remove the `CustomTooltip` component definition
  - In `CustomDot`, add an `onClick` handler on the outer `<circle>` (hit area) that calls a `onSelect(payload)` callback
  - Pass `onSelect={setSelectedPoint}` through recharts' dot callback prop

  Recharts `dot` prop as a function: `dot={(props) => <CustomDot {...props} selectedTimestamp={selectedPoint?.timestamp} onSelect={setSelectedPoint} />}`

### 14. Selected point detail card — new element below chart

This is an entirely new section that does not exist in the current code.

**Placement**: Inside the chart card `<div>`, below the `<ResponsiveContainer>`.

**Shown when**: `selectedPoint !== null`. If null, show nothing (or a faint "Tap a point" hint only).

**Structure**:
```
[background: #f7f9f7, border-radius: 14px, padding: 12px 14px, flex row, gap: 12px]
  ├── Pain number — Roboto Mono, 26px, font-weight 600, color = getPainColor(selectedPoint.pain)
  └── Right column [flex col, gap: 2px, flex: 1]
        ├── Date — 13px, font-weight 600, color #1c211d — e.g. "Jun 7, 2026 · 8:15 AM"
        └── Meta — 12px, color #777777 — primary disc + region (e.g. "L4-L5 · Lumbar")
  └── Severity badge — right-aligned, background = pain surface color, text = pain accent color
        — pill shape, padding: 4px 11px, font-size 12px, font-weight 600
        — content: getPainLevelVisuals(selectedPoint.pain).severity (e.g. "Mild", "Moderate")
```

**Tailwind classes**:
- Container: `bg-[#f7f9f7] rounded-[14px] p-[12px_14px] flex items-center gap-3 mt-0.5`
- Pain number: `font-mono text-[26px] font-semibold leading-none`
- Right col: `flex flex-col gap-0.5 flex-1 min-w-0`
- Date: `text-[13px] font-semibold text-[#1c211d]`
- Meta: `text-[12px] text-[#777777]`
- Badge: `px-[11px] py-1 rounded-full text-[12px] font-semibold`

**Severity badge colors** — use `getPainLevelVisuals()` which already returns `accent` and `surface` CSS variables. Apply them as inline style: `style={{ background: visuals.surface, color: visuals.accent }}`.

### 15. Chart hint text

- **Current**: `<p className="text-xs text-muted-foreground text-center mt-2">{PAGE_CONTENT.chartHint}</p>` — "Lines connect recorded entries • Tap points for details"
- **Target**: `font-size: 11.5px; color: #ababab; text-align: center` — "Tap points for details" only
- **Change**: Replace class with `text-[11.5px] text-[#ababab] text-center mt-0.5`. Update content to just "Tap points for details".

### 16. Empty state (chart card when ≤ 1 entry)

- **Current**: `rounded-[18px] border border-border bg-card p-8 text-center` with `text-muted-foreground`
- **Target**: Same card style as the main chart card: white, no border, shadow
- **Change**: Replace `border border-border bg-card` with `bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]`. Update text color from `text-muted-foreground` to `text-[#8a908b]`.

### 17. Loading skeleton border radius

- **Current**: Skeleton rects use `rounded-sm` (2px)
- **Target**: Cards use `rounded-[18px]` — skeleton should hint at the actual card shape
- **Change**: Update skeleton divs from `rounded-sm` to `rounded-[18px]`

---

## Summary Table

| Area                    | Current                                   | Target                                      | Priority   |
| ----------------------- | ----------------------------------------- | ------------------------------------------- | ---------- |
| Range selector          | Three loose bordered buttons              | Single pill segmented control (`#eaeeea`)   | High       |
| Stats cards             | Flat, no background, 36px number          | White card, 16px radius, 30px Roboto Mono   | High       |
| Chart line color        | Black `hsl(var(--foreground))`            | Teal `#008391`                              | High       |
| Chart area fill         | None                                      | Teal gradient (16% → 0%)                    | High       |
| Tooltip → detail card   | Floating Recharts tooltip on hover        | Static detail card below chart on tap       | High       |
| Selected dot state      | No selection state                        | Click sets `selectedPoint`, enlarges dot    | High       |
| Chart header            | "Pain Level" + entry count                | "Pain level" + range label                  | Medium     |
| "Showing X days" text   | Standalone paragraph between stats/chart  | Removed (label moved to chart header)       | Medium     |
| Page title size         | 20px `page-title`                         | 24px, `#1c211d`                             | Medium     |
| Dot color ramp          | 2-state (black / dark red)                | 11-step `getPainColor()` ramp               | Medium     |
| Grid lines              | Dashed, `opacity: 0.3`                    | Solid `#eef1ee`, full opacity               | Medium     |
| Chart card container    | `border border-border bg-card p-[18px]`   | White, shadow, asymmetric padding           | Medium     |
| Chart hint text         | Long hint with "Lines connect…"           | "Tap points for details" only               | Low        |
| Axis tick colors        | `muted-foreground`                        | Y: `#ababab` 10px / X: `#919191` 10.5px    | Low        |
| Empty chart card style  | Bordered `bg-card`                        | White shadow card, `#8a908b` text           | Low        |
| Loading skeleton radii  | `rounded-sm` (2px)                        | `rounded-[18px]`                            | Low        |
