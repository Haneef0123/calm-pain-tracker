# Settings Tab — Redesign Plan

Comparison of current code vs target design (`Pain Tracker App.dc.html`).
Every change needed to make the Settings tab match the target exactly.

---

## Files Involved

1. `components/pain/AccountInfo.tsx`
2. `components/pages/Settings.tsx`

---

## FILE 1 — `components/pain/AccountInfo.tsx`

### Complete restyle — avatar, email, sync label

**Current**: Grey card (`bg-card rounded-sm p-4`), a muted circle with Lucide `<User>` icon (generic silhouette), email in `text-sm font-medium`, subtitle "X entries synced" in `text-label` (14px, font-light, `#4A4F4C`).

**Target**: White card with teal avatar showing the user's initial, email in bold dark text, subtitle with a green inline checkmark SVG.

### 1. Card container

- **Current**: `p-4 bg-card rounded-sm`
- **Target**: `background: #ffffff; border-radius: 18px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(12,12,12,0.05); display: flex; align-items: center; gap: 14px`
- **Change**: Replace with `bg-white rounded-[18px] px-[18px] py-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)] flex items-center gap-[14px]`

### 2. Avatar circle — from icon to initial letter

- **Current**: `w-10 h-10 rounded-full bg-muted flex items-center justify-center` containing Lucide `<User className="w-5 h-5 text-muted-foreground" />`
- **Target**: `width: 44px; height: 44px; border-radius: 9999px; background: #dcf5f7; color: #005b65; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 600` — displays the first character of the email address uppercased (e.g. "H" for haneef@…)
- **Change**: Remove the `<User>` Lucide import. Replace the inner content with `{(email || '?').charAt(0).toUpperCase()}`. Update size from `w-10 h-10` (40px) to `w-11 h-11` (44px). Apply `bg-[#dcf5f7] text-[#005b65] text-[17px] font-semibold`

### 3. Email text

- **Current**: `text-sm font-medium truncate` — 14px, medium weight, default foreground
- **Target**: `font-size: 14px; font-weight: 600; color: #1c211d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- **Change**: Replace `text-sm font-medium` with `text-[14px] font-semibold text-[#1c211d]`. Keep `truncate`.

### 4. Sync label — add green checkmark SVG

- **Current**: `<p className="text-label">{entryCount} entries synced</p>` — 14px, font-light, `#4A4F4C`, plain text only
- **Target**: `font-size: 12px; color: #008858; display: flex; align-items: center; gap: 5px` — inline SVG check + text
- **Change**: Replace `<p className="text-label">` with a `<span className="flex items-center gap-[5px] text-[12px] text-[#008858]">`. Add an inline SVG checkmark before the text:

```jsx
<svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M4 10.5l4 4 8-9" />
</svg>
{entryCount} entries synced
```

---

## FILE 2 — `components/pages/Settings.tsx`

This file has the most changes. The core structural shift is from **5 individual shadcn `<Button>` components with `space-y-[14px]`** to **two grouped white card lists with inset dividers** — the same pattern used in native iOS settings screens.

### 1. Container padding

- **Current**: `page-shell page-stack` CSS utility classes
- **Target**: `padding: 28px 20px 24px; display: flex; flex-direction: column; gap: 14px`
- **Change**: Same as other pages — `pt-7 px-5 pb-6 flex flex-col gap-[14px]`

### 2. Page title

- **Current**: `<h1 className="page-title">Settings</h1>` — `page-title` = 20px
- **Target**: `font-size: 24px; line-height: 30px; font-weight: 600; color: #1c211d; letter-spacing: -0.02em`
- **Change**: Replace `page-title` with `text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-[#1c211d]`

### 3. Remove shadcn `<Button>` + `<AlertDialog>` imports for row buttons

- **Current**: Uses `Button` from `@/components/ui/button`, `AlertDialog` + 7 sub-components from `@/components/ui/alert-dialog`
- **Target**: Plain `<button>` HTML elements — no shadcn wrappers
- **Change**: Remove the `Button` import. Remove all `AlertDialog*` imports and JSX blocks (see change #9 for how confirmation UX changes). Replace each `<Button>` with a raw `<button>`.

### 4. Remove Lucide icon imports — replace with inline SVGs

- **Current**: Imports `Download, Trash2, LogOut, UserX, BarChart3` from `lucide-react`
- **Target**: Custom inline SVGs matching the reference, all 18×18 with `stroke: #525252; stroke-width: 1.6; stroke-linecap: round`
- **Change**: Remove the lucide import entirely. Inline each SVG directly in JSX:

| Row             | SVG path(s)                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Admin analytics | `<path d="M4 16V9M10 16V4M16 16v-5">`                                                                                             |
| Export CSV      | `<path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 16h12">`                                                                          |
| Clear entries   | `<path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0-.7 9a1.8 1.8 0 0 1-1.8 1.7H8a1.8 1.8 0 0 1-1.8-1.7l-.7-9">` |
| Sign out        | `<path d="M8 17H5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 5 3h3M13 14l4-4-4-4M17 10H8">`                                        |
| Delete account  | `<circle cx="8" cy="6.5" r="3"/><path d="M3 17c0-2.8 2.2-5 5-5 1 0 1.9.3 2.7.8M14 13l4 4M18 13l-4 4">` — `stroke: currentColor` (inherits red) |

Chevron (right arrow, 15×15, `stroke: #c6c6c6`): `<path d="M8 5l5 5-5 5">`

### 5. Restructure: individual buttons → two grouped card lists

This is the biggest structural change. The `space-y-[14px]` div with 5 individual buttons becomes two white card groups.

**Group 1 — Data group** (Admin analytics, Export CSV, Clear all entries):

```jsx
<div className="bg-white rounded-[18px] shadow-[0_1px_2px_rgba(12,12,12,0.05)] overflow-hidden flex flex-col">
  {showAdminAnalytics && (
    <>
      <SettingsRow icon={...} label="Admin analytics" onClick={...} />
      <RowDivider />
    </>
  )}
  <SettingsRow icon={...} label="Export CSV" onClick={handleExport} />
  <RowDivider />
  <SettingsRow icon={...} label="Clear all entries" onClick={handleClearAll} />
</div>
```

**Group 2 — Account actions group** (Sign out, Delete account):

```jsx
<div className="bg-white rounded-[18px] shadow-[0_1px_2px_rgba(12,12,12,0.05)] overflow-hidden flex flex-col">
  <SettingsRow icon={...} label="Sign out" onClick={handleSignOut} />
  <RowDivider />
  <SettingsRow icon={...} label="Delete account" onClick={handleDeleteAccount} danger />
</div>
```

### 6. Row button structure

Each row is a plain `<button>` with this exact layout:

- **Current**: shadcn `<Button variant="outline" className="w-full justify-start h-12 bg-card border-border">` with Lucide icon + text
- **Target**: `display: flex; align-items: center; gap: 14px; padding: 15px 18px; border: none; background: transparent; font-family: inherit; font-size: 14px; font-weight: 500; color: #1c211d; cursor: pointer; text-align: left; width: 100%;`
- Hover: `background: #fafbfa`
- Contents: `[18×18 SVG icon] [label text, flex: 1] [15×15 chevron SVG]`
- Tailwind: `flex w-full items-center gap-[14px] px-[18px] py-[15px] border-none bg-transparent font-[inherit] text-[14px] font-medium text-[#1c211d] cursor-pointer text-left hover:bg-[#fafbfa] transition-colors`

For the **Delete account** row only:
- `color: #d53627; font-weight: 600`
- Hover: `background: #fdf7f6`
- **No chevron** on this row — the target omits the right arrow for destructive actions

### 7. Inset divider between rows

A divider element lives between each row inside a group:

- **Current**: No dividers — buttons are fully separated with `space-y-[14px]`
- **Target**: `height: 1px; background: #f0f2f0; margin: 0 18px` — inset from both sides
- **Change**: Add `<div className="h-px bg-[#f0f2f0] mx-[18px]" />` between rows

Extract as a local constant: `const RowDivider = () => <div className="h-px bg-[#f0f2f0] mx-[18px]" />;`

### 8. Admin analytics row — Link → button with router.push

- **Current**: shadcn `<Button asChild>` wrapping a `<Link href="/admin/analytics">` — navigates via Next.js `<Link>`
- **Target**: Plain `<button>` like all other rows. Navigation handled internally.
- **Change**: Replace `<Link>` with a `<button onClick={() => router.push('/admin/analytics')}>`. Keep the `router` import already present in the file.

### 9. Confirmation dialogs — AlertDialogs → inline confirmation state

- **Current**: `<AlertDialog>` modals for "Clear all entries" and "Delete account" — clicking the row opens a modal with Cancel + Confirm
- **Target**: The reference design shows no AlertDialog modals — direct click buttons. However, since these are destructive actions, a safe approach is to use **inline confirmation** instead: first click changes the button to a "Confirm delete?" state, second click confirms. This matches the spirit of the target (no modal) while keeping safety.

**Implementation**:
- Add `confirmingClear: boolean` and `confirmingDelete: boolean` state (default `false`)
- On first click: set state to `true`, auto-reset after 3 seconds via `setTimeout`
- On second click (when confirming): execute the action

**Alternative**: If the user prefers to keep the AlertDialog for safety, the structural (visual) changes can still be applied — just wrap the new-style row button in `<AlertDialogTrigger asChild>`. Note this in implementation.

### 10. Sign out row — loading state

- **Current**: `disabled={isSigningOut}` on shadcn Button, label changes to "Signing out..."
- **Target**: Plain button with same logic — keep `disabled` and label swap
- **Change**: Carry over the `isSigningOut` state and disabled/label logic to the new plain `<button>` element

### 11. Footer text — new element

- **Current**: No footer text exists
- **Target**: `<p style="text-align: center; font-size: 11.5px; color: #ababab;">Pain Tracker · Your data stays yours</p>`
- **Change**: Add `<p className="text-center text-[11.5px] text-[#ababab] mt-1">Pain Tracker · Your data stays yours</p>` at the bottom of the flex column, after the two card groups

---

## Summary Table

| Area                     | Current                                     | Target                                          | Priority   |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- | ---------- |
| Account card shape       | Grey `bg-card rounded-sm p-4`               | White card, 18px radius, shadow                 | High       |
| Account avatar           | Muted circle + Lucide User icon             | Teal circle (`#dcf5f7`) with email initial      | High       |
| Account sync label       | Plain text, 14px font-light                 | Green checkmark SVG + text, 12px `#008858`      | High       |
| Button layout            | 5 individual shadcn Buttons, `space-y`      | Two grouped white card lists with inset dividers| High       |
| Row structure            | `<Button variant="outline" h-12>`           | Plain `<button>`, 15px padding, chevron right   | High       |
| Row dividers             | None (separate cards)                       | `1px #f0f2f0` inset dividers between rows       | High       |
| Icons                    | Lucide React components                     | Inline SVGs, 18×18, `stroke: #525252`           | Medium     |
| Delete account row style | `text-destructive border-destructive/30`    | `color: #d53627; font-weight: 600`; no chevron  | Medium     |
| Delete account hover     | `hover:bg-destructive/10`                   | `hover:bg-[#fdf7f6]`                            | Medium     |
| Page title               | 20px `page-title`                           | 24px, `#1c211d`                                 | Medium     |
| AlertDialog modals       | Full modal for Clear + Delete               | Inline confirmation state (or keep dialog)      | Medium     |
| Admin analytics nav      | `<Button asChild><Link>`                    | `<button onClick={() => router.push(...)}`      | Low        |
| Row hover                | shadcn default (border change)              | `background: #fafbfa`                           | Low        |
| Footer text              | None                                        | "Pain Tracker · Your data stays yours"          | Low        |
