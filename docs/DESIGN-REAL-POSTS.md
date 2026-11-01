# Local real-post review deck

The design app can show eight real posts, including avatars, photos, video and
quoted text, without embedding personal feed data in the repository or build.

```sh
# X_SESSION_FILE and optional X_AUTH_TOKEN_FILE reference private session files.
# Select eight rows from the first 40 interleaved likes/bookmarks in a private import.
bun run design:real-posts --rows 6,12,14,17,21,22,29,37

# Run this yourself in Rex, then choose Office in the bottom stage picker.
bun run dev:design
```

Refresh `http://localhost:3001/?stage=office` after generating a new deck. These
are hand-picked examples for reviewing card layout, not algorithm-selected
recommendations. The prototype's Like, Dislike, Skip and Undo remain local.

The import command writes `.local/design-posts/posts.json` and downloaded media
under `.local/design-posts/media/`, with private permissions. It uses read-only
X requests and makes no model calls. Protected/unavailable posts are rejected;
source links and author attribution are retained. File and request budgets keep
large media bounded. Front-card videos autoplay muted and loop, with a pause
control; reduced-motion preferences disable automatic playback. Clicking media
opens a centred native-dialog viewer, with Dismiss at the top left, Escape and
arrow-key navigation, native video controls and byte-range playback/seek support.
Multi-attachment previews are overlapping cards with no shadows. Media uses
white surfaces and the same soft border as the post card, with no press scaling.
Video imports try MP4 variants from highest to lowest bitrate, using the first
available version within the 24 MB per-video limit. Photos currently use X's
medium-sized image variant.

Vite's development-only middleware serves these files at `/__design/posts` and
`/__design/media/<file>`. It reads no session credentials and accepts only GET
and HEAD. Vite's normal file-serving routes deny `.local/`; only the scoped
review-deck middleware serves the sanitised payload and media. The browser validates the deck shape before replacing the fictional
fallback. The development server binds to localhost; do not expose this review
server publicly.

`bun run build:design` always uses the fictional sample deck. The private deck
and media are never imported, copied into `public/`, or included in the build.
Use that build for a public demo or recording without personal feed data.
To return local development to the fictional deck, move the ignored
`.local/design-posts/posts.json` aside and refresh.
