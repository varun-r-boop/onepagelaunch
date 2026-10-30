# Site Builder (v2)

New pages are built from **pre-designed sections styled by one theme**, inspired by bento.me and modern SaaS landing pages. Users never touch padding or borders. They pick a template, click text to edit it, and choose a theme.

## How it works for users

1. Pick a template (Launch, Bento or Minimal). The picker opens automatically for new pages, and anyone can try them without an account at `/templates`.
2. Click any text to edit it in place. Click a button or link to change its text and URL.
3. Hover a section to move, duplicate or delete it, or to add a new section below it.
4. Hover a bento tile to change its type (feature / stat / image / quote / link), size (1×1, 2×1, 1×2, 2×2), icon, accent color or order.
5. Open **Design** to pick a theme preset, accent color, font and corner style.
6. Changes auto-save. Preview on desktop or mobile, then use **View live**.

## Code map

| Path | Purpose |
| --- | --- |
| `src/lib/site/types.ts` | `SiteData` (version 2), `Section` union, `BentoTile` |
| `src/lib/site/themes.ts` | Theme presets → CSS variables (`--site-bg`, `--site-accent`, …) |
| `src/lib/site/sections.ts` | Default content for each section type and the section catalog |
| `src/lib/site/templates.ts` | Templates and `createSiteFromTemplate()` |
| `src/components/site/sections.tsx` | The section components (one renderer for the editor and the live site) |
| `src/components/site/editable.tsx` | `EditableText`, `EditableLink`, `EditableImage` and render mode |
| `src/components/site/SiteEditor.tsx` | Editor shell: toolbar, section chrome, dialogs, Design panel |
| `src/components/site/SiteProjectClient.tsx` | Loads a saved project, with auto-save for owners |

Layouts use container queries (`@container`, `@3xl:`), so the editor's mobile preview frame shows the real mobile layout.

## Compatibility

Projects are stored in the same `projects.data` JSON column. `isSiteData()` (data has `version: 2`) picks the new renderer, and older block-based projects still open in the old editor. Owners of old projects see a banner offering to switch.

## Adding a section type

1. Add the interface to the `Section` union in `types.ts`.
2. Add defaults in `createSection()` and an entry in `SECTION_CATALOG`.
3. Add a view in `sections.tsx` and a case in `SectionView`.
