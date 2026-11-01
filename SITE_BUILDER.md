# Site Builder (v2)

New pages are built from **pre-designed sections styled by one theme**, inspired by bento.me and modern SaaS landing pages. Users never touch padding or borders. They answer a few questions, click text to edit it, and pick two colors.

## How it works for users

1. **Claim an address, no account needed.** The homepage asks for the page address first (`onepagelaunch.vercel.app/your-product`) and checks it's free as you type. Addresses need at least 3 characters and can't use reserved words like `dashboard` (`src/lib/slug.ts`, also enforced by the API for new addresses). "Start building" opens the editor at `/templates/launch?slug=…`. The product name is pre-filled from the address, and the address is used again when publishing. The draft and address are kept in the browser, so a refresh doesn't lose them.
2. **Answer one short form:** product name, what it does (one line), and what the main button does (**collect emails** for a waitlist, or **open a link**), plus optional links. The page is written from these answers.
3. **Edit and style in one place.** The top bar only holds the page name, the save status and **Publish**. Everything else is in the sidebar on the right:
   - **Tools:** Preview, desktop/mobile view, undo/redo, plus Copy link and View live once published.
   - **Tabs:** Design, and Waitlist when the page collects emails.
   - The top-bar panel button hides the sidebar for more room. It starts hidden on phone-sized screens.

   The **Design** tab has:
   - **Primary color** (buttons and highlights) and **secondary color** (page background). Text, cards, borders and the hero glow are derived from these two. White + indigo is the default "Launch" look; midnight + lavender gives the dark "Bento" look.
   - **What's on your page**: switches for features, pricing, FAQ, testimonials and logos. Switching a section back on restores what you'd written, and nav links follow along.
   - **Fine-tune**: font and corners.
4. **Edit in place:**
   - Click any text to change it.
   - Paste links to add tiles: a GitHub repo with stars, a playable video, an app with its rating, a tweet, a Discord invite, a website card. Social profiles also go into the footer.
   - Hover sections and tiles for more options.
5. **Publish** from the toolbar:
   - Edits autosave as a private draft, and visitors only see what you've published.
   - The button shows **Publish**, then **Live**, then **Publish changes** after further edits.
   - In the playground, Publish asks for a page address, then sign-up. The draft carries over and goes live automatically.
6. **Waitlist:**
   - Pages set to "collect emails" show an email form in the hero and the closing call-to-action. You can switch either one with **Waitlist form** on the section toolbar.
   - Sign-ups appear under **Waitlist** in the editor, with a CSV download.

## Code map

| Path | Purpose |
| --- | --- |
| `src/lib/site/types.ts` | `SiteData` (version 2), `Section` union, `BentoTile` |
| `src/lib/site/themes.ts` | Primary + secondary color → full palette as CSS variables (`--site-bg`, `--site-accent`, …). Older pages without a `background` keep their preset palette. |
| `src/lib/site/sections.ts` | Default content for each section type and the section catalog |
| `src/lib/site/templates.ts` | Templates and `createSiteFromTemplate()` |
| `src/lib/site/quickstart.ts` | Builds a personalized page from the wizard answers |
| `src/components/site/QuickStartWizard.tsx` | The one-step setup form |
| `src/lib/links/detect.ts` | Recognizes what a pasted URL is and builds a tile from the URL alone (works offline) |
| `src/lib/links/fetch-preview.ts` | Server-side enrichment: page metadata, GitHub, YouTube/Loom/Vimeo, X, App Store, Discord |
| `src/lib/links/apply.ts` | Adds pasted links to a page (tiles + footer socials) |
| `src/app/api/link-preview/route.ts` | `POST { text }` → link previews |
| `src/components/site/link-paste-box.tsx` | The "Paste a link" tile in the editor |
| `src/components/site/sections.tsx` | The section components (one renderer for the editor and the live site) |
| `src/components/site/editable.tsx` | `EditableText`, `EditableLink`, `EditableImage` and render mode |
| `src/components/site/SiteEditor.tsx` | Editor shell: top bar with Publish, the sidebar (tools + Design/Waitlist tabs), section chrome, dialogs |
| `src/components/site/SiteProjectClient.tsx` | Owner editor: draft auto-save, Publish |
| `src/components/site/design-panel.tsx` | Primary/secondary colors, section switches, fine-tune |
| `src/lib/site/publish.ts` | Draft vs published helpers (`liveSiteOf`, `draftOf`) |
| `src/lib/site/draft-storage.ts` | Playground draft (and claimed address) in localStorage, carried through sign-up |
| `src/lib/slug.ts` | Page address rules: allowed characters, minimum length, reserved words |
| `src/components/address-form.tsx` | "Claim your address" field with a live availability check (homepage, Publish dialog) |
| `src/app/page.tsx` | The OnePageLaunch homepage |
| `src/components/site/waitlist-form.tsx` | The email form visitors fill in |
| `src/components/site/waitlist-panel.tsx` | The owner's sign-up list and CSV export |
| `src/app/api/waitlist/route.ts` | `POST` join a waitlist (public) · `GET` list sign-ups (owner) |
| `supabase/migrations/…_waitlist_signups.sql` | Table and row-level security for sign-ups |

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

## Publishing

`projects.data` holds the draft. `data.publishedSite` holds what visitors see:

- `null`: never published. Visitors get a "coming soon" page that isn't indexed.
- A snapshot: the live version.
- Missing: the page is from before drafts existed and counts as live. The first auto-save stores its published copy.

The `[slug]` route only sends the published version to visitors' browsers. Owners see the editor, or add `?view=1` to see the live page.

## Waitlist setup

Run these once in the Supabase SQL editor, in order:

1. `supabase/migrations/20261030000000_waitlist_signups.sql` creates `waitlist_signups` with row-level security.
2. `supabase/migrations/20261101000000_waitlist_grants.sql` grants the API roles access to it. Newer Supabase projects don't do this automatically for tables created in SQL. Without it, every sign-up fails with "permission denied".

The row-level security rules are:

- Anyone can add an email to an existing page.
- Only the page's owner can read or delete sign-ups.

The public endpoint also:
- checks the page is live and has a waitlist form,
- validates the email,
- ignores bots that fill a hidden field,
- rate-limits to 10 attempts per minute per IP,
- treats a repeat email as success.

**Recommended:** also set `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys → secret key) in the server environment, e.g. Vercel. The API then saves and lists sign-ups with it, after checking the page exists, is live and has a waitlist form, so sign-ups don't depend on the table's grants or row-level security. It's server-only; never prefix it with `NEXT_PUBLIC_`.

Failed saves are logged with the HTTP status, code, message, details and hint. If the table is missing or access is denied, visitors see "This page isn't accepting sign-ups right now". The editor's Waitlist tab then names the file to run, and the server log says the same (`Error saving waitlist signup … Fix: …`).
