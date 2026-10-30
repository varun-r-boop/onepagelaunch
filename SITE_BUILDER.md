# Site Builder (v2)

New pages are built from **pre-designed sections styled by one theme**, inspired by bento.me and modern SaaS landing pages. Users never touch padding or borders. They pick a template, click text to edit it, and choose a theme.

## How it works for users

1. Answer 3 quick questions in the setup wizard: product name, what it does (one line), and where the main button goes. The page is written from those answers, so there is no "Acme" placeholder to hunt down.
2. Pick a look (Launch, Bento or Minimal), a brand color, and which sections to include, with a live preview of *their* page. Testimonials and customer logos are off by default so nobody publishes fake social proof.

   The wizard opens automatically for new pages, and anyone can try it without an account at `/templates`. The **Templates** button reopens it later to restyle the page while keeping the name, headline and link.
3. Click any text to edit it in place. Click a button or link to change its text and URL.
4. Hover a section to move, duplicate or delete it, or to add a new section below it.
5. Hover a bento tile to change its type (feature / stat / image / quote / link), size (1×1, 2×1, 1×2, 2×2), icon, accent color or order.
6. Open **Design** to pick a theme preset, accent color, font and corner style.
7. Changes auto-save. Preview on desktop or mobile, then **Copy link** to share it.

## Code map

| Path | Purpose |
| --- | --- |
| `src/lib/site/types.ts` | `SiteData` (version 2), `Section` union, `BentoTile` |
| `src/lib/site/themes.ts` | Theme presets → CSS variables (`--site-bg`, `--site-accent`, …) |
| `src/lib/site/sections.ts` | Default content for each section type and the section catalog |
| `src/lib/site/templates.ts` | Templates and `createSiteFromTemplate()` |
| `src/lib/site/quickstart.ts` | Builds a personalized page from the wizard answers |
| `src/components/site/QuickStartWizard.tsx` | The 2-step setup wizard with live preview |
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
