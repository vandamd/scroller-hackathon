# Agreed product direction

Paper document: [OpenAI Hackathon](https://app.paper.design/file/01M6BH1M4GD27BYFXWYYJP742E/p-1-0).

Six main journey artboards, arranged left to right (including the scan state):

1. Welcome: a logo centred at the top, with Continue with Google at the centre of
   the viewport. No illustration, introductory copy, sign-in heading or sample link.
2. Connect X: logo centred at the top, with the account cards centred in the
   viewport and no introductory column or step counter. X uses username/email
   and password; a verification state is needed when X requests it. Instagram
   is visible and disabled.
3. Taste scan and readback: after connecting X, show Tanner working at his desk,
   “Getting to know your taste.”, a brief likes/bookmarks status and an
   indeterminate progress bar. This loading artboard precedes the taste cards.
   After scanning, show
   “Your taste, so far.” beneath the centred logo. A centred 412px card stack
   presents one observation at a time in 26px text, with slightly offset cards,
   a small position counter and 44px previous/next arrows on either side. The
   heading is centred at 32px with a quiet source caption. No supporting examples,
   descriptions or disclosure chevrons. Finish with a full-width cobalt
   “Looks like me” pill. There is no tweak action or extra editing step.
   The personalised feed supplies candidate
   interests; useful tools, ideas to try, good explanations, visual inspiration
   and funny/weird posts guide selection internally. The topic picker is removed.
   Paper uses illustrative profile copy, not live analysis.
4. Office: only a large isometric office and the accepted post stack on the
   right, with original links and Like, Dislike and Skip pill buttons below. No
   page heading, progress counters, status rows or delivery promotion. A 56px
   icon rail follows Stuffi.love: office, accounts and deliveries in the centre;
   the account/theme menu at the bottom. Crop the SVG’s internal whitespace so
   layout follows the visible artwork: 760px office, 64px gap, 432px post stack,
   and 64px outer margins within the content area. Vertically centre both.
5. MCP: a single centred 480px block with a server address and copy action,
   access key and Create key pill, one line describing access, and Open Poke.
   Use the same icon rail as the office. No introductory column or promotional
   copy. The address is a reserved example, not a deployed endpoint. Poke
   retrieves accepted posts; scheduling is configured in Poke.

## Card exploration

The separate runnable prototype is `bun dev:design` at localhost:3001. It uses
eight fictional posts, overlapping cards, Like/Dislike/Skip, Undo and a finite
completion state. Faux onboarding includes Welcome, an editable X connection form,
an indefinite simulated scan and the five taste cards with side arrows. The X icon
stands alone, without a duplicate X label or sample-account badge. Form values are
not submitted or stored. Scanning only ends when the user manually changes stages;
its bar sweeps at a constant speed and Tanner emits small random discovery icons.
Taste cards share the dashboard’s physical stack component and smooth Undo return,
with pretty text wrapping. Both side arrows use neutral styling and are hidden at
the corresponding end of the stack. Onboarding stages crossfade with a 240ms blur;
the logo remains still between onboarding stages. The office handoff also fades.
Reduced motion removes blur and decorative scanning motion.
The bottom preview picker jumps to any stage; `?stage=` links persist across
reloads and work with browser back/forward. Sign-in and connection buttons only
advance the local prototype. There are no auth or feed requests. Taste-card and
post-stack progress remain in memory when switching stages. The picker belongs
only to the separate design app, including its shareable build.
A single office screen places the large office on the left and the
432px post stack on the right, with a 64px gap. The layout becomes vertical on
narrow screens. The 56px Hugeicons rail has one office destination and a theme
control at the bottom; there are no separate stack/office pages or sidebar restart.
Office monitors have
clipped feed overlays using the illustration’s exact screen projection. Their
scrolling pauses at each post, varies between desks and loops seamlessly.
Reduced motion keeps feeds still. This is illustrative activity.
Agent names and roles sit in small floating nameplates above their heads, with
short connecting lines. The floor labels are removed, and monitors stay clear.
Furniture includes two facing sofas, a round pedestal coffee table, rug and bookshelf.
The original 3D bots sit on round pedestal stools with no chair backs. The flat
cobalt character studies in Paper are an unused exploration.
Their heads show rear service panels with vents, small screws and one cobalt
status light, rather than eyes facing away from the monitors. Staggered head
tilts, body leans and short alternating typing bursts suggest work, with pauses
between bursts. There is no pause button; reduced motion keeps them still.
Tanner is the taste keeper, Felix the finder and Eddie the editor. Choosing Like,
Dislike or Undo emits a small filled reaction icon beside Tanner, with no bubble
or visible text. Each icon independently floats up and away before fading out;
repeat choices can leave several icons on screen together. Start position, drift,
height, tilt, scale and duration vary slightly, sampled once per accepted choice.
Completed icons are removed individually. Pointer
choices also trigger a slower 560ms nod, shake or tilt, without restarting the office. A new choice
can create another icon without removing earlier ones. Skip advances the card without a response from
Tanner or a taste-learning signal.
The design app embeds the generated `office-art.svg` inline so feedback can reach
Tanner’s head. These reactions reflect real prototype button presses; the general
working animation remains illustrative. Run `bun run render:office` to update assets.
The sofas sit on opposite sides of the table, with the rug spanning the seating
area. The bookshelf is turned 90° with its back along the left office edge.
The sofa has full-depth arms, a cobalt cushion and a striped throw. A fringed
rug and a leafy plant on the bookshelf soften the room; the spiky floor planter
is removed.
The filing cabinet is painted as one ordered group so all three drawer fronts
retain their outlines. Stack actions run left to right: red Dislike, neutral
Skip and cobalt Like, with matching contrast in dark mode.
No introductory line or “Why this?” panel.
The X mark uses Hugeicons’ `NewTwitterIcon`.
Decisions stay in memory; there is no live social or AI integration. Pointer
choices use Motion’s AnimatePresence for 420ms directional departures, with
opacity held for the first 220ms so the card remains visible as it moves. The
remaining cards follow after 80ms using a softer physical spring. Undo reverses
the departure with a 420ms ease-out tween and no spring overshoot;
restart cancels the active deck. The completion state is a normal final card,
appearing behind the last posts and advancing with the same poses and spring.
The action row retains its height on completion to prevent a layout jump.
Exits control readiness without timers.
Keyboard activation and reduced motion advance immediately. This is a
throwaway design app under `design/`.

Eight labelled card studies sit in two rows below the main journey in Paper:
native text, native media, media first, quiet note, quoted post, link preview,
peek-through stack and split layout. Each uses a 432px card area, Public Sans
400, fictional example posts and separate feedback/navigation controls.
The dashboard prototype uses native media in an overlapping deck inspired by
Stuffi.love’s album-cover list thumbnails. Three full cards share nearby centres
with unequal offsets and small rotations (-3.5°, +2.3° and -0.6° at the front).
The rear cards overlap behind the front card rather than forming preview rows.
Three equal-width pills sit below it: filled cobalt Like, soft grey Dislike
and soft grey Skip. These are static Paper controls; the intended behaviour is
to advance to the next post after each choice, with Skip giving no taste feedback.

## Visual decisions

Public Sans Regular (400), one weight everywhere. Hierarchy uses size, spacing
and contrast. White surfaces, near-black text, soft grey borders and cobalt
`#2457F5` for primary actions restore the initial colour direction. Light mode is
the default and current design focus; retain dark mode. NoScroll remains a
reference for restrained typography and spacing. Buttons are pills, with filled
primary actions. Keep copy functional and brief: no header taglines or repeated
sign-in explanations. The isometric office uses subtle grey shading and a blue
active screen.
Sidebar icons use Hugeicons’ free stroke-rounded set: Home01, Link04, Plug01
and MoreHorizontal, at 20px with a 1.5px stroke. Copy01 is used for the MCP URL.
The active destination has a cobalt icon on a soft grey circular surface.
Anatomy-inspired isometric solids provide the personality. Avec inspired the
overlapping post-stack interaction. No fonts, illustrations or copy were taken
from Avec.

The office SVG was generated from original geometry using Anatomy’s
MIT-licensed `iso-kit.ts`. Its source is
`scripts/render-office.ts`; the outputs are `public/office-light.svg` and
`public/office-dark.svg`. `public/office-prototype.svg` is the initial concept.
The illustrated post and activity counts in Paper are example content, not live
results. The prototype is a set of editable design screens, not connected auth
or a working MCP endpoint.

## Implementation boundaries

- Proposed taste onboarding: import up to 50 recent likes and 50 bookmarks,
  deduplicate by tweet ID, classify with bounded concurrency, aggregate topic
  matches, and let the user confirm preferences before entering the office.
  Manual selection must work without either source. Installed emusks 2.3.20
  exposes `client.bookmarks.get()`; likes use the custom `graphql("Likes", …)`
  path in the existing Scroller project. Neither has been live-verified in this
  app. No private history has been imported for this design work.
- Parallel Decisions supplies typed answers against explicit criteria, not
  free-form discovered category names. Start with a small versioned topic list
  plus post styles. Use per-topic `noul` questions for overlapping interests,
  and `choice` with an unknown/other option for a primary post style. Questions
  about one post can share a request; unrelated posts use separate requests.
  Handle refusals independently. User choices override inferred preferences.
  Parallel’s web grounding adds a dependency; classification availability must
  not block onboarding. This is a proposed integration, not implemented yet.
- Use `@convex-dev/better-auth`, the compatible Better Auth version documented by
  the component, its Convex plugin, and the Google provider.
- Google signs users into Scroller; it does not grant access to their X feed.
- Require authenticated ownership checks for profiles, runs, feedback and finds.
  The capability-token scaffold has been replaced with Better Auth user ownership.
- X credentials establish a session. Do not log or persist passwords. Keep
  resulting session tokens server-side and encrypted at rest.
- Current emusks supports credential login but may launch a visible Chrome for
  Castle tokens. Its types explicitly note that X rejects headless tokens in
  this release. This is a deployment blocker to resolve early, not something a
  form alone fixes. Keep the existing session-based path as a development aid.
- Poke uses a bearer key. Store only the key hash and map it to the Scroller user;
  do not authorise access using the unverified `X-Poke-User-Id` header alone.
- Proposed tool: `list_accepted_posts({ since?, limit? })`, returning stable IDs,
  original links, short reasons and a next cursor. Scope keys to accepted posts.
- Pulling saved finds is separate from refreshing a social feed. Decide the
  office's bounded refresh cadence before promising fresh daily deliveries.
- The MCP must be reachable over HTTPS. Poke documents a local tunnel for a demo.

## Remaining deadline risks

The Google OAuth provider and development Convex component are now configured;
the sign-in request redirects to Google with the correct localhost callback.
A real user must complete the Google consent flow to verify the full round trip.
Deployable X login with verification challenges, background scout execution,
public MCP hosting and time for the final video and public-link checks remain.

## Primary documentation checked

- https://docs.parallel.ai/decisions/decisions-quickstart
- https://docs.parallel.ai/decisions/question-types
- https://docs.parallel.ai/decisions/best-practices
- https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- https://better-auth.com/docs/authentication/google
- https://poke.com/docs/mcp-servers
- Installed `emusks@2.3.20` README and login TypeScript declarations
