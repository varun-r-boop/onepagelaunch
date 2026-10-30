# Site Builder (v2)

New pages are built from **pre-designed sections styled by one theme**, inspired by bento.me and modern SaaS landing pages. Users never touch padding or borders. They pick a template, click text to edit it, and choose a theme.

## How it works for users

1. Answer 3 quick questions in the setup wizard: product name, what it does (one line), and where the main button goes. The page is written from those answers, so there is no "Acme" placeholder to hunt down.
2. Pick a look (Launch, Bento or Minimal), a brand color, and which sections to include, with a live preview of *their* page. Testimonials and customer logos are off by default so nobody publishes fake social proof.

   The wizard opens automatically for new pages, and anyone can try it without an account at `/templates`. The **Templates** button reopens it later to restyle the page while keeping the name, headline and link.
3. **Paste links to add content.** Paste any link (or several at once) into a grid's "Paste a link" box, into the wizard's "Your links" field, or anywhere on the page. Each one becomes the right kind of tile: a GitHub repo with stars, a playable YouTube/Loom/Vimeo video, a tweet as a quote, an App Store app with its rating, a Discord invite with member count, a booking link, or a website preview card. Social profiles (X, LinkedIn, Instagram, email…) also go into the footer.
4. Click any text to edit it in place. Click a button or link to change its text and URL.
5. Hover a section to move, duplicate or delete it, or to add a new section below it.
6. Hover a bento tile to change its type (feature / stat / image / quote / link), size (1×1, 2×1, 1×2, 2×2), icon, accent color or order.
7. Open **Design** to pick a theme preset, accent color, font and corner style.
8. Changes auto-save. Preview on desktop or mobile, then **Copy link** to share it.

## Code map

| Path | Purpose |
| --- | --- |
| `src/lib/site/types.ts` | `SiteData` (version 2), `Section` union, `BentoTile` |
| `src/lib/site/themes.ts` | Theme presets → CSS variables (`--site-bg`, `--site-accent`, …) |
| `src/lib/site/sections.ts` | Default content for each section type and the section catalog |
| `src/lib/site/templates.ts` | Templates and `createSiteFromTemplate()` |
| `src/lib/site/quickstart.ts` | Builds a personalized page from the wizard answers |
| `src/components/site/QuickStartWizard.tsx` | The 2-step setup wizard with live preview |
| `src/lib/links/detect.ts` | Recognizes what a pasted URL is and builds a tile from the URL alone (works offline) |
| `src/lib/links/fetch-preview.ts` | Server-side enrichment: page metadata, GitHub, YouTube/Loom/Vimeo, X, App Store, Discord |
| `src/lib/links/apply.ts` | Adds pasted links to a page (tiles + footer socials) |
| `src/app/api/link-preview/route.ts` | `POST { text }` → link previews |
| `src/components/site/link-paste-box.tsx` | The "Paste a link" tile in the editor |
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

## Link previews and security

`/api/link-preview` fetches URLs that users paste, so it is locked down:

- Only `http`/`https` on ports 80/443, with no credentials in the URL.
- Hostnames are resolved, and private, loopback, link-local and cloud-metadata addresses are refused. Every redirect hop is checked again.
- 5 second timeout, 512 KB read limit, at most 12 links per request, and 30 requests per minute per IP (in memory, so per server instance).
- Results are cached in memory for 6 hours.
- Videos only embed from YouTube (no-cookie), Loom and Vimeo player URLs. This is checked again when rendering, so stored data can't inject other iframes.

If a fetch fails (blocked site, rate limit, offline), the tile is still built from the URL alone. Set `GITHUB_TOKEN` so repo tiles can show live stars beyond GitHub's 60 unauthenticated requests per hour.

Known limitation: DNS is checked before the request rather than pinned for it, so a DNS-rebinding attack is theoretically possible. Pinning the resolved IP with a custom fetch agent would close that.
