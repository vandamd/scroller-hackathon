# Taste synthesis prototype

A local experiment to compare models for the first onboarding synthesis pass.
It uses a private X history import and the OpenAI Responses API. It does not
update the app, write to Convex, run Decisions, or fetch linked pages.
An optional image step retrieves photos through the existing X session and uses
Luna to produce descriptions before synthesis.

## Run

Use Bun from the repository root. Put `OPENAI_API_KEY` in the ignored `.env.local`
file, or set `OPENAI_API_KEY_FILE` to a private file containing only the key.
Never prefix the key with `VITE_`, paste it into a command, or put it in tracked files.

```sh
# Prepare the identical comparison input without making any paid calls.
bun run prototype:taste --prepare

# One synthesis request with Luna (the default).
bun run prototype:taste

# Optionally compare another model.
bun run prototype:taste --models gpt-6.1-terra
```

For the image pass, set `X_SESSION_FILE` to a private file containing the saved
X cookies. If the auth token was refreshed separately, set `X_AUTH_TOKEN_FILE`
to that private token file too. These paths and files must not be committed.

```sh
# Analyse up to eight photos; prints the private enriched-history path.
bun run prototype:taste:images

# Use the printed history-images.json path for the second step.
bun run prototype:taste --input .local/taste-images/<timestamp>/history-images.json
```

The image pass retrieves metadata for photo posts within the same sample,
downloads one photo per selected post, and sends the actual pixels with the post
text to Luna. It records visible details and uncertainty as `image_description`.
The synthesis pass can cite exact excerpts from these descriptions; those are
model observations rather than independently verified visual facts. Only still
photos are analysed: videos, GIFs, quoted media and remaining carousel images
remain unknown. Default limit eight images, maximum twelve (`--limit 12`).
Image bytes, observations, usage and the enriched import stay under ignored
`.local/taste-images/`, with private permissions.

The default private input is `.local/interests/history-refreshed.json`, produced
by the earlier authorised X import. Use `--input /path/to/history.json` for another
import with the same shape. The command does not refresh the X session itself.

## What it compares

- Up to 40 deduplicated posts, alternating liked and bookmarked posts in the
  import's returned order. All models receive the same input, prompt and schema.
- Text and quoted text, each capped at 2,400 characters. Handles and URLs are
  replaced. Optional image descriptions come from the separate vision pass;
  missing descriptions are explicitly treated as unseen media.
- `gpt-6-luna`, `gpt-6.1-sol`, `gpt-6.1-terra`, all at low reasoning effort and
  Standard service tier. Each call has a 6,000 output-token cap, 120-second
  timeout and zero automatic retries. A failed model is not silently replaced.
  Astra has been removed from the available models. The separate image call
  uses Luna, high image detail and a 5,000 output-token cap.
- Structured JSON with a summary, up to five preferences, selection rules,
  counterexamples, exact supporting excerpts and limitations.
- Local checks reject invented post references/excerpts, duplicate preference
  IDs and preferences with fewer than two distinct supporting posts. These
  checks establish reference integrity, not whether a preference is meaningful.
- Latency, input/output/reasoning/cache usage and estimated USD token cost.
  Rates are pinned to official Standard short-context pricing checked on
  1 November 2026. Cost includes reported cache-write tokens at the 30-minute
  rate; recheck pricing before future comparisons. No tools are enabled.

## Private output

Each invocation creates `.local/taste-prototype/<timestamp>/` with the sample,
prompt/schema, per-model results and `comparison.json`. The directory is ignored
by Git and created with private permissions. These files contain personal feed
data and inferred preferences: do not copy them into public docs or demos.
The API request sets `store: false`; this does not override OpenAI's separate
service data-handling policies.

Judge models by specificity, distinct preferences, honest treatment of missing
media, valid evidence and useful card copy, as well as latency and cost. One
sample and one run per model are a smoke comparison, not a quality benchmark.
The original import lacks author IDs, so this prototype cannot verify support
across different authors. It must not be presented as a validated live profile.

Sources: [model guide](https://developers.openai.com/api/docs/guides/latest-model),
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs),
[pricing](https://developers.openai.com/api/docs/pricing).
