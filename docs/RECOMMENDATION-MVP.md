# Current recommendation plan

Product decisions updated 1 November 2026. The live pipeline is implemented in
the main app. The separate design app deliberately retains simulated state.

## Stack and responsibilities

- Convex stores profiles, candidate state, editions and feedback, and coordinates
  the work. X retrieval uses the server runtime proven to support `emusks`.
- OpenAI `gpt-6-luna` judges post content and images against the accepted taste
  criteria, returning structured JSON. Start with at most four concurrent model
  requests, with hard candidate and time budgets.
- "Parallel" means concurrent requests. No Parallel service or Decisions API
  is part of the chosen stack. Earlier research documents assumed otherwise.
- Felix retrieves; Tanner supplies the saved taste criteria and frequently
  liked/bookmarked authors; Eddie applies local ranking and variety rules.

## When to retrieve

The user wants genuine background preparation and timely arrivals. This replaces
the earlier manual-only retrieval proposal. Proposed starting intervals, still
to measure against the account's actual X limits and scoring latency:

1. Fetch immediately after onboarding or on return if no usable prepared stack
   exists. Resume unread cards without discarding the current edition.
2. While the office is in use, check roughly every two minutes. While away, check
   roughly every five minutes. Browser presence/activity only changes the
   desired interval; the fetch itself is a server job, not a browser timer.
3. Normally read the first Home page (roughly 20–30 entries), preserve its ranked
   positions, deduplicate by canonical post ID and process only unseen content.
   Judge at most twenty unseen candidates, at most four model calls in flight.
4. Keep the current card/edition stable. Hold fresh accepted posts in a bounded
   ready queue (initial proposal: at most sixteen). Surface availability promptly
   and make a future eight-card edition ready for a later visit. The first edition
   prepares during onboarding. Completed sessions say “Check back later”; there
   is no restart button. A later visit can open a prepared edition after a new
   background check. Background fetching does not extend the current session.
5. Permit only one run per account, reuse content/media assessments, and back off
   on rate limits or session failure. Track candidate first-seen time and source
   rank separately from publication date. Timings are targets, not freshness SLAs.
6. Later, Poke reads the prepared queue or requests a bounded refresh through MCP
   on the user's chosen schedule. Avoid duplicate browser/MCP/background jobs.

Convex scheduled internal functions coordinate due work and persist results;
reactive queries deliver ready records to the app. The X reader still needs an
available server runtime that supports the native `emusks` transport. A local
script alone cannot provide background coverage when that machine is asleep.

## One edition

Retrieve one Home page and score at most twenty unseen candidates. Remove ads,
unavailable posts, duplicates and previously encountered posts before scoring.

Give Luna the saved criteria, the original post text and sufficient media
evidence. Reuse private cached image descriptions where available; missing
essential media remains unknown. Video playback in the review app does not mean
that the recommender has watched a video. Limit frame/transcript processing to
an explicit later implementation budget.

The structured result records criterion matches, the kind of value offered,
evidence coverage and whether the content is substantial enough to judge.
Unknown is not a negative preference. Evidence completeness gates acceptance.

Treat X's feed order as a strong relevance prior, not a guarantee of importance
or publication recency. For the first version, use the source order among posts
that pass the content/evidence checks, with light adjustments for duplication,
variety and explicit taste feedback. Repeatedly liked/bookmarked authors are a
modest secondary signal, using stable IDs with usernames for display; they do
not bypass content checks. Select a finite edition of up to eight original posts
with limited author repetition. Store order and profile revision as one edition.

## Feedback

Like teaches the local profile and should also like the original post on X.
Dislike is local preference feedback; Skip is neutral. Undo reverses local
feedback and removes an X like only if Scroller added it. Preserve pre-existing
likes. X write failures stay silent in the UI for now, retaining local feedback
and private sync status. Do not infer an unlike or missing bookmark from an
incomplete import, and do not count a repeated import as a second interaction.

Keep explicit local feedback separate from imported X state so a later sync
does not count the same app-created like twice. Reweight criteria between
editions; do not regenerate the full four-month profile after every choice.

## Current verification

Private X history retrieval, image-aware synthesis, author-frequency counts and
fresh For You scoring have passed live read-only checks. Convex persistence,
editions, scheduling and feedback are wired into the main app. Real X likes and
Undo still need user verification. The design app's reactions stay local.
Fresh password login is currently limited by X; a library asset-lookup crash was
fixed with a reproducible dependency patch. There is no Parallel service.
