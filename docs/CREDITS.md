# Existing code, templates and assets

The application work in this repository began during the hackathon on
1 November 2026. No complete app template was copied.

- **Scroller**, an existing local project by the author: reference for using
  `emusks`, reading X likes and home timelines, and learning a preference profile.
  Personal feed data and credentials are kept out of tracked files.
- **Story**, an existing local project by the author: reference for Instagram
  mobile sessions. Its existing private session was used for one read-only feed
  check; no session or feed contents were copied into this repository.
- **Anatomy**, © 2026 Ryan, MIT: `iso-kit.ts` and `iso.css` copied into
  `src/components/iso/`, with the original licence alongside them. The office's
  geometry and composition are new. https://github.com/wheresryan22/anatomy
- **Avec**: reference for the accepted-post stack interaction. No assets or source
  copied. https://www.avec.ai/
- **Stuffi.love**, an existing project by the author: reference for the narrow
  icon sidebar, loosely aligned album covers and overlapping media previews.
- **Hugeicons**, © 2025 Hugeicons, MIT: the Paper sidebar, MCP copy action and
  design playground use SVG paths from `@hugeicons/core-free-icons` 4.4.0. The
  prototype’s paths are in `design/icon.tsx`; the original licence is kept in
  `docs/licences/hugeicons.md`. https://hugeicons.com/icons
  Hacker News and Reddit source cards use `News01Icon` and `RedditIcon` from
  the same set.
- **Public Sans**: chosen typeface, Regular (400). The Paper prototype uses the
  font available in Paper. The app self-hosts the Latin 400 normal files via
  `@fontsource/public-sans`, licensed under OFL-1.1.
- **Google**: the sign-in mark in `public/google-mark.svg` is Google's unmodified
  official light round icon asset, downloaded from
  https://developers.google.com/static/identity/images/branding_guideline_sample_lt_rd_sl.svg.
  Used for the Google sign-in action. Brand guidance:
  https://developers.google.com/identity/branding-guidelines.
- **Motion**: MIT-licensed dependency for the design playground’s card exits,
  spring transitions and presence handling. https://motion.dev/
- **CraftMyCV**, an existing project by the author: reference for the Convex
  Better Auth component, Google provider, session cookies and ownership checks.
  The integration was adapted from Next.js to TanStack Start. No credentials,
  personal CVs or application-specific features were copied.
- **NoScroll**, an existing project by the author: reference for the restrained
  typography and spacing. Scroller uses the initial white, grey and blue palette,
  filled pill buttons, and light mode as the default.
- **emusks**: AGPL-3.0-only dependency. The application distribution must account
  for its licence and provide corresponding source when required.
  `patches/emusks@2.3.20.patch` adapts Castle script discovery to X's current
  startup asset and handles lookup rejection before launching Chrome.
- **Codex**: repository and prior-context inspection, current-docs research,
  source compatibility check, original office geometry, Paper screen creation,
  visual review and initial application scaffolding. This is a concrete example
  of Codex helping resolve whether an existing Instagram session could read a
  home feed before committing hackathon time to the integration.

Social posts and counters in the public design build are illustrative samples.
For local review, the development app can show eight real X posts from an ignored
private import. Author names and links to the original posts provide attribution;
their text and media are not included in tracked files or public builds.
