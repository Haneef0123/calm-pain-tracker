# Past Days Tab — Redesign Plan

Comparison of current code vs target design (`Pain Tracker App.dc.html`).
Every change needed to make the Past Days tab match the target exactly.

---

## Files Involved

1. `app/layout.tsx`
2. `app/globals.css`
3. `lib/utils.ts`
4. `components/pages/History.tsx`
5. `components/pain/HistoryEntryCard.tsx`

---

## FILE 1 — `app/layout.tsx`

### Add Roboto Mono font

- **Current**: Only `Inter` is loaded from `next/font/google`
- **Target**: `'Roboto Mono', monospace` is used for every pain level number across the entire app
- **Change**: Import `Roboto_Mono` alongside `Inter`, expose it via a CSS variable `--font-roboto-mono`, and register it in Tailwind as `font-mono`

---

## FILE 2 — `app/globals.css`

### 1. Page background color

- **Current**: `--background: 140 10% 73%` → `#B8C1BB` (mid-tone saturated sage)
- **Target**: `#f3f6f3` (near-white, very light sage)
- **Change**: Update `--background` CSS variable to match `#f3f6f3`

### 2. Card surface color

- **Current**: `--card: 140 8% 86%` → `#DCE2DD` (grey-green surface)
- **Target**: All cards are pure `#ffffff` white
- **Change**: Update `--card` to `0 0% 100%`

### 3. Border radius token

- **Current**: `--radius: 0.375rem` = 6px — inherited by all shadcn components
- **Target**: Cards use 18px radius; the token being 6px makes everything look blocky
- **Change**: Update `--radius` to `1.125rem` (18px) to match target card radius

### 4. Pain color system

- **Current**: `pain-low` and `pain-medium` → `text-foreground` (near-black); `pain-high` → `text-destructive` (`#8B2F2F`). Only 2 states.
- **Target**: 11-step color ramp keyed by pain level 0–10:

| Level | Color     | Label       |
| ----- | --------- | ----------- |
| 0     | `#008858` | Green       |
| 1     | `#008858` | Green       |
| 2     | `#09a570` | Light green |
| 3     | `#09a570` | Light green |
| 4     | `#b29334` | Amber       |
| 5     | `#b29334` | Amber       |
| 6     | `#c96a2b` | Orange      |
| 7     | `#e75f53` | Red-orange  |
| 8     | `#d53627` | Red         |
| 9     | `#9e1407` | Deep red    |
| 10    | `#9e1407` | Deep red    |

- **Change**: Remove old `.pain-low`, `.pain-medium`, `.pain-high` classes. The ramp must be applied as inline `style={{ color: ... }}` since Tailwind cannot express dynamic hex values — so the CSS classes are not the right mechanism here (see `lib/utils.ts` change below).

---

## FILE 3 — `lib/utils.ts`

### Replace `getPainLevelClass()` with `getPainColor()`

- **Current**: `getPainLevelClass(level)` returns a Tailwind class string — either `'text-foreground'` or `'text-destructive'`. Only 2 states, wrong colors.
- **Target**: A function `getPainColor(level: number): string` that returns the hex value from the 11-step ramp above, to be used as `style={{ color: getPainColor(entry.painLevel) }}`
- **Change**: Replace the function entirely. Keep the old one briefly if other files reference it and update those call sites.

---

## FILE 4 — `components/pages/History.tsx`

### 1. Container padding

- **Current**: `pt-8` (32px top only) — relies on `PageLayout`'s `px-6` (24px) for horizontal padding
- **Target**: `padding: 28px 20px 24px` — top 28px, sides 20px, bottom 24px
- **Change**: Override padding on the inner div. `PageLayout` applies `px-6`; either pass a prop to suppress it or set negative margins. Simplest: move to `pt-7 px-5 pb-6`.

### 2. Screen entry animation

- **Current**: `animate-fade-in` — `translateY(4px)` over `0.15s ease-out`
- **Target**: `translateY(10px)` over `0.25s ease` — 2.5× more travel, 65% slower
- **Change**: Update the `fade-in` keyframe in `tailwind.config.ts` to use `translateY(10px)` and `0.25s ease`, OR add a new `animate-fade-up` animation class.

### 3. Page title

- **Current**: `text-heading` class → `text-xl font-semibold tracking-tight` = 20px, `-0.025em` tracking
- **Target**: `font-size: 24px; line-height: 30px; font-weight: 600; color: #1c211d; letter-spacing: -0.02em`
- **Change**: Replace `text-heading` with explicit classes: `text-2xl leading-[30px] font-semibold tracking-[-0.02em] text-[#1c211d]`

### 4. Subtitle (entry count)

- **Current**: `text-label mt-1` → `text-sm font-light tracking-normal text-muted-foreground` = 14px, light weight, `#4A4F4C`
- **Target**: `font-size: 13px; color: #8a908b` — 13px, regular weight, lighter grey
- **Change**: Replace with `text-[13px] text-[#8a908b]`, remove `mt-1` (handled by flex gap)

### 5. Layout structure: margin vs gap

- **Current**: `mb-8` on `<header>` (32px gap below header), then list starts
- **Target**: Entire screen is a flex column with `gap: 14px` between all children
- **Change**: Wrap contents in `flex flex-col gap-[14px]`, remove `mb-8` from header

### 6. List container spacing

- **Current**: `space-y-1` = 4px between cards (almost none)
- **Target**: `gap: 10px` between cards
- **Change**: Replace `space-y-1` with `flex flex-col gap-[10px]`

### 7. Empty state

- **Current**: Generic `text-muted-foreground` color, plain `text-sm`
- **Target**: Should use `#1c211d` for primary text and `#8a908b` for secondary text, matching the new palette
- **Change**: Update colors in the empty state block to match

---

## FILE 5 — `components/pain/HistoryEntryCard.tsx`

This file has the most changes.

### 1. Card wrapper — no card shape currently

- **Current**: `border-b border-border` — a single bottom hairline, no background, no shape
- **Target**: `background: #ffffff; border-radius: 18px; box-shadow: 0 1px 2px rgba(12,12,12,0.05); overflow: hidden`
- **Change**: Replace `border-b border-border` with `bg-white rounded-[18px] shadow-[0_1px_2px_rgba(12,12,12,0.05)] overflow-hidden`
- **Visual impact**: Highest of all changes — transforms a flat list into a card-based layout

### 2. Collapsed row button — padding

- **Current**: `py-4` (16px top/bottom) — no horizontal padding on button itself
- **Target**: `padding: 15px 18px` — both axes on the button
- **Change**: Replace `py-4` with `py-[15px] px-[18px]`

### 3. Collapsed row button — hover

- **Current**: `hover:opacity-75` — entire row fades out on hover
- **Target**: `background: #fafbfa` — subtle background tint on hover
- **Change**: Replace `hover:opacity-75` with `hover:bg-[#fafbfa]`, add `transition-colors`

### 4. Collapsed row button — gap

- **Current**: `gap-4` = 16px
- **Target**: `gap: 14px`
- **Change**: Replace `gap-4` with `gap-[14px]`

### 5. Pain level number — font

- **Current**: Inter (default sans), `text-4xl` = 36px
- **Target**: Roboto Mono, 26px
- **Change**: Add `font-mono` class, change `text-4xl` to `text-[26px]`

### 6. Pain level number — width

- **Current**: `w-12` = 48px
- **Target**: `width: 34px`
- **Change**: Replace `w-12` with `w-[34px]`

### 7. Pain level number — color

- **Current**: `getPainLevelClass(entry.painLevel)` → Tailwind class, 2 states (black / dark red)
- **Target**: Full 11-step ramp, applied as `style={{ color: getPainColor(entry.painLevel) }}`
- **Change**: Remove `getPainLevelClass` call, add inline `style={{ color: getPainColor(entry.painLevel) }}`

### 8. Date text — weight and color

- **Current**: `text-sm font-medium` — 14px, medium weight, inherits foreground
- **Target**: `font-size: 14px; font-weight: 600; color: #1c211d`
- **Change**: Replace `text-sm font-medium` with `text-sm font-semibold text-[#1c211d]`

### 9. Subtitle row — completely new structure

This is the second biggest structural change in the card.

**Current**: A single `text-label truncate flex items-center gap-1` line containing:

- Lucide `<Star>` icon (12px, `text-yellow-500`)
- Plain text: disc level (e.g. "L4-L5")
- Plain text: `+N` for secondary discs

**Target**: Two distinct elements in a `flex items-center gap-[6px]` row:

**Element A — Disc chip pill:**

- `display: inline-flex; align-items: center; gap: 4px`
- `background: #f1f3f1; color: #3b3b3b`
- `border-radius: 9999px; padding: 2px 9px`
- `font-size: 11px; font-weight: 600`
- Contains: a custom inline SVG star (9×9, `fill: #dfb437`) + disc level text (e.g. "L4-L5")

**Element B — Region · time text:**

- `font-size: 12px; color: #919191`
- Content: `{region} · {time}` — e.g. "Lumbar · 8:15 AM"
- **Note**: Time is currently absent from the collapsed row entirely — this is new

**Change**: Remove the existing subtitle element, add the pill + region·time row. The `previewText` logic simplifies to just `primaryDisc?.level`. Secondary disc count (`+N`) is dropped from collapsed view.

### 10. Chevron — replace swapping icons with rotating single icon

- **Current**: Conditional `{isExpanded ? <ChevronUp .../> : <ChevronDown .../>}` — two separate Lucide icons swapping abruptly
- **Target**: Single SVG `<path d="M5 8l5 5 5-5">` with `transform: rotate(0deg)` → `rotate(180deg)` and `transition: transform 0.2s ease`
- **Current size**: `w-4 h-4` = 16px, `text-muted-foreground`
- **Target size**: 18×18, `stroke: #ababab`, `stroke-width: 1.6`, `stroke-linecap: round`, `stroke-linejoin: round`
- **Change**: Remove lucide imports for `ChevronDown`/`ChevronUp`. Add inline SVG with `style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}`

### 11. Expanded area — container

- **Current**: `pb-4 pl-16 pr-4 space-y-3 animate-fade-in`
  - 64px left indent to align under text column
  - `space-y-3` (12px gap)
  - No top border
- **Target**: `border-top: 1px solid #f0f2f0; padding: 14px 18px 16px; flex flex-col gap: 10px; animation: fadeUp 0.2s ease`
  - No left indent — content is flush at 18px from card edge
  - Top border `#f0f2f0` separates header from expanded content
  - `gap: 10px`
- **Change**: Replace class string with `border-t border-[#f0f2f0] pt-[14px] pb-[16px] px-[18px] flex flex-col gap-[10px] animate-fade-in`

### 12. Expanded content — structure is completely different

**Current sections shown (6+ items):**

1. Full date/time string
2. Spine Region
3. Disc Levels (with styled chips)
4. Sensations
5. Radiation
6. Aggravating Positions
7. Neurological Signs
8. Notes

**Target sections shown (3 items only):**

1. TIME + FEELS LIKE in a horizontal row
2. Notes (if present) — italic, in quotes
3. Delete button

**Change**: Remove all intermediate sections. The collapsed row already shows disc chip + region, so the expanded view focuses only on time context, sensation quality, and notes.

### 13. TIME and FEELS LIKE section — new layout and label style

**Label style:**

- **Current**: `text-label mb-1` = 14px, font-light, `#4A4F4C`
- **Target**: `font-size: 10px; letter-spacing: 0.1em; font-weight: 600; color: #ababab`
- **Change**: Use `text-[10px] tracking-[0.1em] font-semibold text-[#ababab]`

**Layout:**

- Both TIME and FEELS LIKE sit in a `flex gap-[18px]` horizontal row
- Each is a `flex flex-col gap-[2px]` with label above value
- Value style: `font-size: 13px; color: #3b3b3b`

**Content:**

- TIME: `format(date, 'h:mm a')` — e.g. "8:15 AM"
- FEELS LIKE: `entry.sensations.map(getSensationLabel).join(', ')` — or "—" if none

### 14. Notes — italic, quoted, no label

- **Current**:

  ```jsx
  <p className="text-label mb-1">Notes</p>
  <p className="text-sm">{entry.notes}</p>
  ```

  Labeled, plain text, 14px, light weight

- **Target**:

  ```html
  <p
    style="font-size: 13px; line-height: 19px; color: #777777; font-style: italic;"
  >
    "{{ e.notes }}"
  </p>
  ```

  No label, italic, wrapped in `"..."` curly quotes, `color: #777777`, `line-height: 19px`

- **Change**: Remove the label `<p>`, update value `<p>` to `text-[13px] leading-[19px] text-[#777777] italic`, wrap text in `"“{entry.notes}”"` (curly quotes)

### 15. Delete button — remove AlertDialog, full restyle

**Current**: Uses `<AlertDialog>` confirmation modal — click "Delete" → modal appears → click "Delete" again to confirm

**Target**: Direct delete on single click — no modal

**Current button style**: shadcn `<Button variant="ghost" size="sm">` with Lucide `<Trash2>`, text "Delete", `text-destructive hover:bg-destructive/10`

**Target button style**:

- Plain `<button>` element (not shadcn Button)
- `align-self: flex-start` (left-aligned in flex column)
- `border: none; background: transparent`
- `color: #d53627; font-size: 13px; font-weight: 600`
- `padding: 6px 10px; margin-left: -10px` (negative margin to align visually with card edge)
- `border-radius: 9999px` (pill shape)
- Hover: `background: #fcebe9` (light red tint)
- Icon: custom inline SVG trash 14×14 (not Lucide `Trash2`)
- Text: "Delete entry" (not just "Delete")

**Change**: Remove the entire `<AlertDialog>` import and JSX block. Replace with a plain `<button>` with inline SVG and the styling above. Call `onDelete()` directly on click.

---

## Summary Table

| Area                | Current                     | Target                          | Priority   |
| ------------------- | --------------------------- | ------------------------------- | ---------- |
| Page background     | `#B8C1BB` mid sage          | `#f3f6f3` near-white            | High       |
| Card shape          | Flat `border-b` only        | White card, 18px radius, shadow | High       |
| Pain number font    | Inter, 36px                 | Roboto Mono, 26px               | High       |
| Pain number color   | 2 states (black / dark red) | 11-step severity ramp           | High       |
| Subtitle row        | Plain text + lucide star    | Pill chip + region·time         | High       |
| Expanded content    | 6+ labeled sections         | TIME / FEELS LIKE / notes only  | High       |
| Delete button       | AlertDialog modal           | Direct inline button            | Medium     |
| Section label style | 14px font-light             | 10px font-600 letter-spaced     | Medium     |
| Notes style         | Labeled plain text          | No label, italic, quoted        | Medium     |
| Chevron             | Two swapping icons          | One rotating SVG                | Medium     |
| Card list spacing   | `space-y-1` = 4px           | `gap: 10px`                     | Medium     |
| Page title size     | 20px                        | 24px, `#1c211d`                 | Medium     |
| Header/list gap     | `mb-8` = 32px               | `gap: 14px` uniform             | Low–Medium |
| Hover behavior      | Opacity fade                | Background tint                 | Low        |
| Card radius token   | 6px global                  | 18px                            | Low        |
| Roboto Mono font    | Not loaded                  | Loaded via next/font            | Low        |
