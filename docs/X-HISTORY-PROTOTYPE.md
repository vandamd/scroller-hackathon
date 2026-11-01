# X history backfill prototype

Read-only pagination of the current account's bookmarks and likes using the
existing unofficial `emusks` client. No OpenAI requests, model costs, account
changes or Convex writes are made by this command.

```sh
# Set X_SESSION_FILE and optionally X_AUTH_TOKEN_FILE to private session files.
bun run prototype:x-history

# Smaller metadata probe, one page per source.
bun run prototype:x-history --pages 1

# Resume from a printed private checkpoint directory.
bun run prototype:x-history --resume .local/x-history/<timestamp> --pages 40
```

The default window is four calendar months, based on post publication dates
(`--months 4`). The default budget is 40 additional pages per source, requesting 50 posts per
page, within a five-minute work budget. It stops on exhaustion, an empty page,
repeated cursor, no new posts, rate limits or the budget. It does not wait out
rate limits or retry failed requests. Checkpoints preserve progress and cursors.

All exports, checkpoint cursors, author IDs, source post IDs and first-page raw
responses remain under ignored `.local/x-history/`, with private permissions.
Do not copy them into demos or tracked files. The previous small history import
is left in place. Output `history.json` uses the input shape of the taste
prototype and retains media URLs and author IDs for later processing.

## The publication-date boundary

The requested cutoff defaults to four calendar months before the run begins.
The user selected publication date as the window definition. The observed
responses do not include an explicit time when the current user liked or
bookmarked each post. `created_at` is when the post was published, so it cannot
answer when it was saved. A post from years ago might have been saved yesterday.

Bookmark `sortIndex` values appear consistent with a Unix-millisecond ordering
key shifted left by 20 bits. The export records this interpretation only as
`saved_at_estimate`, together with its unverified derivation. It is not an
explicit save date and is not used to filter posts or stop pagination.
The likes ordering keys observed in the probe resolve to
the request time under a Snowflake interpretation and must not be used as like
dates. `interaction_at` remains null for both sources.

`summary.json` distinguishes publication dates, estimated bookmark-save dates
and unknown interaction dates, and records why each source stopped. It always
marks `publicationWindowCoverageVerified: false`. Reaching an endpoint's end is not proof
that X exposes the account's complete historical activity.

`recent-posts-subset.json` contains currently liked/bookmarked posts that were
themselves published within the window. Older posts are excluded by the chosen
publication-date rule, even if saved recently. `history.json` retains all
retrieved posts. Both files retain author IDs; new imports also retain
`author_username` for display. IDs are the stable identity key.

This experiment checks backfill feasibility. Onboarding should start with a
bounded recent sample and process deeper history later if it improves the
profile; a backfill must not block the core journey indefinitely.

References: [installed client bookmark API](https://emusks.tiago.zip/tweets/bookmarks),
[X bookmark endpoint](https://docs.x.com/x-api/users/get-bookmarks),
[X likes endpoint](https://docs.x.com/x-api/users/get-liked-posts).
The public X API documentation does not establish the unofficial sort-index
encoding; that interpretation comes only from the observed response metadata.
