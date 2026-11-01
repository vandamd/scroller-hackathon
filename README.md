# Scroller

A little office that reads your X feed and brings back a finite stack of good posts.
Built during the DevDay Exchange Community Hackathon, London, 1 November 2026.

Connect X with auth_token → scan likes and bookmarks → review your taste → read and rate a stack.
Tanner keeps your taste, Felix finds posts and Eddie edits the stack.

## Stack

Bun, TanStack Start and Query, Convex, Better Auth, OpenAI `gpt-6-luna` and `emusks`.
Luna uses low reasoning effort and Fast mode, which carries premium API pricing.
Convex stores private account state and coordinates background jobs. A separate
Bun worker runs the native X client and image-aware model calls. “Parallel” means
up to four concurrent model requests; there is no Parallel service dependency.

## Run locally

Requires Bun 1.4.4+, Node 22.12+, a Convex development deployment,
an OpenAI API key with access to `gpt-6-luna`, and an X session's
`auth_token`. This is an unofficial X integration; sessions can expire.

```sh
bun install --frozen-lockfile
cp .env.example .env.local
```

Set the public deployment URLs and private worker secrets in `.env.local`.
The `.cloud` and `.site` URLs must belong to the same deployment. Keep this file
private. `WORKER_SECRET` must match the value on Convex;
`X_SESSION_ENCRYPTION_KEY` must be a base64-encoded random 32-byte key.
Generate separate random values for these two secrets.

Select your existing **development** project with `bunx convex dev --configure existing`.
If using `CONVEX_DEPLOY_KEY`, use a development key. Configure these variables
on that development deployment through the Convex dashboard:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Random secret of at least 32 bytes |
| `WORKER_SECRET` | Same private value as the Bun worker |

No Google OAuth setup is required. Submitting an X token automatically creates
a private browser session. The worker verifies the token before reading X data;
Convex still checks session ownership for all account reads and writes. Credentials
remain encrypted. Reopening the same browser resumes the session; a new browser,
expired session or signing out requires reconnecting and a fresh taste scan.

```sh
bun run dev
```

This syncs the development backend, then starts the web app, Convex watcher and
Bun worker. Open [localhost:3000](http://localhost:3000).
Individual commands are `bun run dev:web`, `bun run dev:convex` and
`bun run dev:worker`. Keep the worker running: cloud scheduling alone cannot read
X while its native worker is stopped or the machine is asleep.

## How it works

- Onboarding reads at most three pages each of likes and bookmarks, filtering by
  publication date within four months. It is a bounded sample, not a complete
  four-month interaction history. Duplicate posts count once per source.
- Luna analyses up to 100 representative posts and 12 still images. Taste cards
  require matching evidence from at least two posts. It identifies the value of
  posts, such as useful tools or satisfying explanations, rather than topic picks.
- The first For You page supplies up to 20 unseen candidates per run. Luna
  judges text and available still images; essential unseen video remains unknown.
  Accepted posts retain X's order, with at most two posts per author.
  This first stack prepares during the taste readback, before onboarding finishes.
- Convex checks due work each minute. Successful runs schedule the next check
  about two minutes later while active or five minutes later while away.
  The current edition stays fixed; up to sixteen posts wait for the next stack.
  Finish on “Check back later”. There is no restart or manual refresh button.
  A later visit can open a prepared stack after a fresh background check.
- Like saves feedback and queues a real X like. Dislike is local; Skip is neutral.
  X write failures are silent in the UI.
- Images can be opened in a media viewer. Videos use the highest supplied MP4
  bitrate, play muted, and offer a pause control. Video playback does not imply
  that the recommendation model watched it.

Instagram and the Poke MCP are unfinished stretch features. Neither is needed for
the core journey. The UI retains dark mode; light mode is the main design focus.

## Design playground

```sh
bun dev:design
```

Open [localhost:3001](http://localhost:3001). The bottom stage picker explores
simulated Connect, Scanning, Taste and Office screens without credentials.
Scanning waits for manual stage changes. Feedback is in memory and makes no X writes.
The public build contains fictional posts. An optional ignored local import can
supply real posts during private development; personal feed data is not bundled
into the public design build.

## Checks and hosting

```sh
bun run check
bun run build:design
```

The first command checks app and Convex types and builds the TanStack app.
No automated tests were added. Read-only live checks have exercised saved-session
verification, token-only login, image-aware taste synthesis and fresh For You
judgement. The complete feedback journey needs manual verification.

`bun run build` produces `.output/`; `bun run start` runs the Node server.
The hackathon deployment uses Cloudflare Worker `scroller` at
[scroller.vandamdinh.com](https://scroller.vandamdinh.com), sharing the existing
Convex development deployment as requested. Local testing currently takes
priority: `SITE_URL` on Convex points to `http://localhost:3000`, and
`ADDITIONAL_TRUSTED_ORIGINS` includes the hosted origin. Auth resolves the
request's origin from this allowlist so each site uses its own browser session.

```sh
bun run build:cloudflare
cf deploy --prebuilt --secrets-file /path/to/private-secrets.json
```

The private JSON file contains only `X_SESSION_ENCRYPTION_KEY`, matching the Bun
worker's key. Never commit it. `cloudflare.config.ts` declares public bindings;
`scripts/package-cloudflare.ts` packages Nitro's Cloudflare output for the `cf`
CLI. The uploaded assets contain no private design imports or environment files.

The native X worker currently runs locally with `bun run dev:worker`, using the
same encryption key, worker secret and Convex deployment. It must remain running
on an awake machine for new scans, feed preparation and X likes. Cloudflare serves
the web app; the native worker still needs a persistent Bun host for unattended
operation. OpenAI credentials stay on that worker, not on the public web app.

## Demo and credits

[Demo recording outline](docs/DEMO.md) · [Asset and existing-code credits](docs/CREDITS.md)
· [Paper prototype](https://app.paper.design/file/01M6BH1M4GD27BYFXWYYJP742E/p-1-0)

The auth pattern was adapted from the author's CraftMyCV project. The original
office uses the MIT-licensed Anatomy drawing kit; Hugeicons, Public Sans and other
assets are credited in the linked file. Existing Scroller and Story informed X
and Instagram compatibility work; their private data is excluded.

Codex split the implementation across UI, Convex and worker agents, verified
current APIs and ran real image-aware Luna and X retrieval checks. It found and
fixed a TanStack server-function API mismatch and a Convex schema index error,
then traced a stalled connection to an X-client password-login failure.

[Codex docs](https://developers.openai.com/codex)
· [OpenAI developer docs](https://developers.openai.com/)
· [Convex/Better Auth setup](https://labs.convex.dev/better-auth/framework-guides/tanstack-start)
· [Event](https://luma.com/dde-ldn-hack)
