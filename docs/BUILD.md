# Scroller: hackathon build

Built during the DevDay Exchange Community Hackathon, London, 1 November 2026.
Working window: 12:00–17:00 London time. Feature freeze: 16:00.

## The complete journey

Sign in with Google using Better Auth and its Convex component, connect an X
account using X credentials, learn a taste profile from recent likes, and send
a small office of agents to inspect a bounded batch. Receive up to five original
posts with specific reasons, then give feedback that informs the next edition.
A separate sample mode uses fictional content and requires no social account.
Instagram stays visible but disabled today, even though the session check worked.
A read-only MCP lets Poke retrieve accepted posts on a schedule managed by Poke.

## Office model

The profile desk maintains the brief. The scout desk inspects actual candidates.
The editor desk removes repetition and returns a finite edition. Counts and
activity messages report completed work. The office stops when the edition is done.
Engagement is not a ranking signal. Useful, beautiful and funny can all be valuable.

## Visual concept and parts

Compact isometric SVG, inspired by Anatomy’s four-tone solids and precise detail.
Three desks on one base: floor, feet, rim, floor seams; for each desk, tabletop,
four legs, apron, monitor foot, stem, body, bezel, display, display rows, keyboard,
key rows, mouse mat, mouse, chair base, chair stem, seat, back, agent body, agent
head, eyes, status lamp, paper tray and paper. Shared pinboard, notice cards,
filing unit, drawers, handles, plant pot, leaves, mug and clock. More than 60 parts.
Screens light for the role currently working. The out-tray fills only when finds
have been selected. Respect reduced motion. Desk details also appear in accessible
HTML, and the scene itself is decorative.

## Delivery order

1. Verify integrations and current documentation.
2. Working framework, office and sample journey.
3. Live X likes and timeline, OpenAI structured selection, feedback and Convex state.
4. Google sign-in and a per-user read-only MCP for accepted posts; Instagram disabled.
5. Build/type checks, manual journey checks, public README and credits.
6. By 16:00: freeze; record a maximum 90-second demo; verify public links signed out.

## Initial evidence

- Repository began with an empty README and no application code.
- Scroller uses `emusks@2.3.3`, a reverse-engineered X client; licence AGPL-3.0-only.
- Story exports an `instagrapi@3.2.2` mobile session and uses it from Rust.
- Read-only Instagram check on 1 November returned status ok, 6 feed entries,
  4 media entries and a next-page cursor. No post contents or secrets were printed.
- GitHub origin exists but is currently private; make it public after checking files.
- Four desktop screens were created and visually reviewed in the user's Paper file.
- The app foundation now runs: Better Auth Google OAuth, authenticated SSR,
  protected office queries, per-user brief persistence, and a public sample route.
  Types and production builds pass. OAuth initiation and anonymous route
  protection were checked. Full Google sign-in still needs the user's consent.
  Live X connection, ranking, feedback, MCP and hosting remain to be implemented.

## Codex contribution

Codex inspected the existing integrations, checked current primary documentation,
restored Story’s existing Instagram session and verified the home feed without
exposing credentials. This directly removed an integration uncertainty. Record
further concrete build and verification work here before submission.

## Sources

- Event: https://luma.com/dde-ldn-hack
- Codex: https://developers.openai.com/codex
- Codex quickstart: https://developers.openai.com/codex/quickstart
- OpenAI developer docs: https://developers.openai.com/
- Cookbook: https://developers.openai.com/cookbook
- TanStack Start: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
- Convex: https://docs.convex.dev/quickstart/tanstack-start
- Instagram feed: https://subzeroid.github.io/instagrapi/latest/usage-guide/media/
- Anatomy: https://github.com/wheresryan22/anatomy
- Design: https://app.paper.design/file/01M6BH1M4GD27BYFXWYYJP742E/p-1-0
- Better Auth + Convex: https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- Google: https://better-auth.com/docs/authentication/google
- Poke MCP: https://poke.com/docs/mcp-servers
