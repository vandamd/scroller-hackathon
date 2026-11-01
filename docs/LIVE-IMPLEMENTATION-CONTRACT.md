# Live implementation handoff

All agents share this checkout. Do not touch another agent's owned files, deploy,
commit or start a dev server. Root owns integration, env and deployment. No tests
are to be written. Use Bun and British English. Aim to finish implementation by
16:30 London, leaving integration and a user test before 17:00.

Shared types and runtime schemas: `src/lib/live-contract.ts` (root owned).

## Backend public user API (`api.live`)

- `view({})`: authenticated query returning `LiveView` (no credentials).
- `connect({sealedCredentials})`: authenticated mutation; enqueue connect job,
  advance to scanning. A fresh generation invalidates old jobs and private state.
- `acceptTaste({})`: accept existing profile, stage office. The first feed starts
  while the user reviews their profile; retry retrieval if it has not completed.
- `heartbeat({})`: mark active for ~5 minutes; periodic server scheduling uses
  ~2-minute active and ~5-minute away cadence.
- `openOffice({})`: resume unread cards; on a later visit, promote prepared posts
  only after a background check newer than the previous stack's completion.
  Completed sessions show “Check back later” with no manual restart.
- `rate({actionId,postId,choice:'like'|'dislike'|'skip'})`: owned current front card
  only, idempotent action ID; record feedback and advance. Like enqueues X write.
- `undo({})`: undo last active choice in edition and restore cursor; unlike only
  an app-added X like. Handle Undo arriving before Like job completion safely.
- `disconnect({})`: invalidate generation and remove/disable sensitive state.

## Worker public service API (`api.liveWorker`, actions verify WORKER_SECRET)

- `claim({workerSecret,workerId})`: returns `WorkerJob | null`; atomic bounded
  lease, only one job/account, generation check. Updates worker heartbeat.
- `complete({workerSecret,jobId,lease,resultJson})`: validates structured JSON,
  commits atomically and enqueues next phase when appropriate.
- `fail({workerSecret,jobId,lease,message})`: sanitised error only. X write
  failures are silent to UI and preserve local taste feedback; feed errors retain
  current edition. Never log credentials or post content.

Worker completion JSON:

- connect: `{kind:'connect',sealedCredentials,account:{id,username,name}}`.
- profile: `{kind:'profile',profile:TasteProfile,authors:AuthorTally[],counts:{likes,bookmarks,unique}}`.
- feed: `{kind:'feed',posts:LivePost[],inspected:number}` in accepted X source order.
- like: `{kind:'like',alreadyLiked:boolean,changed:boolean}`; worker checks current
  remote like state before writing. Undo removes only a newly created like.
- unlike: `{kind:'unlike',changed:boolean}`.

Worker payload (JSON string): connect/profile can be `{}`; feed contains
`seenPostIds:string[]` (bounded) and optionally active local feedback; likes and
unlikes contain `postId:string` and backend feedback metadata as needed.

## Credentials and runtime

Root supplies server-only AES-256-GCM credential helpers at
`src/server/credential-box.ts`: `sealCredentials(XCredentials):string` and
`openCredentials(string):XCredentials`. Key is `X_SESSION_ENCRYPTION_KEY` (base64
32 bytes), present only in local web/worker env; Convex stores opaque encrypted
credentials. OpenAI key stays only on the worker. Worker secret stays in local
env and Convex deployment env. Public APIs derive owner from Better Auth.

The separate Bun worker polls Convex for durable leased jobs. Convex cron queues
due feed jobs, so browser closure does not stop work if the worker is available.
It must be hosted as an always-on process for remote production coverage; local
development coverage lasts while the command runs.

## Scope and UI

Use the existing design components and styles for the real `/office` route;
keep the standalone design app unchanged. Welcome uses real Google auth.
Connection supports username/password and a saved-session fallback (X can demand
browser/2FA steps). No password retained after connection: replace with sealed
session cookies. Instagram disabled. Scan four months by post publication date,
bounded pagination and model budgets; use at most ~100 representative posts and
~12 images for initial synthesis rather than sending thousands.

Luna is `gpt-6-luna`; no Parallel service. Profile synthesis must use real data
and not invent five observations. Feed: first page, top candidates first,
deduplicate, score only new posts, up to 4 concurrent Luna calls, preserve X order
among accepted posts. Cache/seen state in Convex. No global engagement threshold.
Current edition never reshuffles. Queue at most 16, edition at most 8.

Local feedback updates future selection; Skip is neutral, Undo reverses. Like
also writes to X. Sync rejection is silent. Never show synthetic content as live.
