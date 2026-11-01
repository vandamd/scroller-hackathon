import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import Emusks from 'emusks'

// Read-only history experiment. Never use a post's publication date as its save date.
const { values } = parseArgs({ options: {
  pages: { type: 'string', default: '40' },
  months: { type: 'string', default: '4' },
  resume: { type: 'string' },
} })
const maxPages = Number(values.pages)
const months = Number(values.months)
if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error('Choose 1–100 pages per source.')
if (!Number.isInteger(months) || months < 1 || months > 24) throw new Error('Choose 1–24 months.')
const log = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const originalConsole = { ...console }
let activeSource
let rateRemaining
const privateJson = async (path, value) => {
  await writeFile(path, JSON.stringify(value, null, 2), { mode: 0o600 })
  await chmod(path, 0o600)
}
function cookies(text) {
  const strings = [text], direct = {}
  function visit(value) {
    if (typeof value === 'string') strings.push(value)
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (/^(auth_token|ct0)$/i.test(key) && typeof child === 'string') direct[key.toLowerCase()] = child
      visit(child)
    }
  }
  try { visit(JSON.parse(text)) } catch {}
  const all = strings.join('; ')
  return {
    token: direct.auth_token ?? all.match(/(?:^|[;\s])auth_token\s*[=:]\s*["']?([^;"'\s]+)/i)?.[1],
    csrf: direct.ct0 ?? all.match(/(?:^|[;\s])ct0\s*[=:]\s*["']?([^;"'\s]+)/i)?.[1],
  }
}
function findEntries(value, out = []) {
  if (!value || typeof value !== 'object') return out
  if (value.entryId && value.content) out.push(value)
  for (const child of Object.values(value)) if (child && typeof child === 'object') findEntries(child, out)
  return out
}
function metadataFields(value, path = '', out = new Set()) {
  if (!value || typeof value !== 'object') return out
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`
    if (/sortIndex|timestamp|liked_at|favorited_at|bookmarked_at|bookmark_info/i.test(key)) out.add(next.replace(/\.\d+/g, '.[]'))
    if (child && typeof child === 'object') metadataFields(child, next, out)
  }
  return out
}
function normalise(tweet, entry, source) {
  const sortIndex = entry?.sortIndex ?? null
  let savedAtEstimate = null
  if (source === 'bookmarks' && /^\d+$/.test(String(sortIndex))) {
    const milliseconds = Number(BigInt(sortIndex) >> 20n)
    if (milliseconds >= Date.parse(tweet.created_at) && milliseconds <= Date.now() + 60_000) {
      savedAtEstimate = new Date(milliseconds).toISOString()
    }
  }
  return {
    id: tweet.id, root_id: tweet.retweeting?.id ?? tweet.id,
    author_id: tweet.user?.id ?? null,
    author_username: tweet.user?.username ?? null,
    text: tweet.text ?? '', created_at: tweet.created_at ?? null,
    quote_text: tweet.quoting?.text ?? '', quoted_post_id: tweet.quoting?.id ?? null,
    media_types: (tweet.media ?? []).map(m => m.type).filter(Boolean),
    media: (tweet.media ?? []).map(m => ({
      type: m.type, url: m.media_url_https ?? null, alt_text: m.ext_alt_text ?? null,
    })),
    interaction_at: null,
    timeline_sort_index: sortIndex,
    saved_at_estimate: savedAtEstimate,
    saved_at_estimate_method: savedAtEstimate ? 'Unverified bookmark sortIndex Unix-millisecond interpretation; not an explicit API save timestamp.' : null,
  }
}
async function main() {
  if (!process.env.X_SESSION_FILE) throw new Error('session_file_missing')
  const session = cookies(await readFile(process.env.X_SESSION_FILE, 'utf8'))
  if (process.env.X_AUTH_TOKEN_FILE) {
    const text = (await readFile(process.env.X_AUTH_TOKEN_FILE, 'utf8')).trim()
    session.token = cookies(text).token ?? text.replace(/^["'`]|["'`]$/g, '')
  }
  if (!session.token) throw new Error('token_missing')
  const started = new Date()
  const cutoff = new Date(started)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months)
  const runDir = values.resume ?? `.local/x-history/${started.toISOString().replace(/[:.]/g, '-')}`
  if (!runDir.startsWith('.local/x-history/')) throw new Error('private_resume_path_required')
  await mkdir(runDir, { recursive: true, mode: 0o700 })
  await chmod(runDir, 0o700)
  const state = values.resume ? JSON.parse(await readFile(`${runDir}/checkpoint.json`, 'utf8')) : {
    startedAt: started.toISOString(), cutoff: cutoff.toISOString(), months,
    likes: { posts: [], pages: 0, cursor: null, stop: null },
    bookmarks: { posts: [], pages: 0, cursor: null, stop: null },
  }
  const client = new Emusks()
  for (const key of ['log', 'warn', 'error', 'info']) console[key] = () => {}
  if (session.csrf) {
    const { default: clients } = await import(new URL('./clients.js', import.meta.resolve('emusks')).href)
    const profile = clients.web, fingerprints = { ...profile.fingerprints }
    fingerprints.userAgent ??= fingerprints['user-agent']
    client.auth = { auth_token: session.token, csrfToken: session.csrf,
      client: { ...profile, userAgent: fingerprints.userAgent, fingerprints,
        headers: { cookie: `auth_token=${session.token}; ct0=${session.csrf};` } } }
  } else state.viewerId = (await client.login(session.token))?.id
  client.onResponse = info => {
    const header = Object.entries(info.headers ?? {}).find(([key]) => key.toLowerCase() === 'x-rate-limit-remaining')?.[1]
    const remaining = Number(Array.isArray(header) ? header[0] : header)
    rateRemaining = Number.isFinite(remaining) ? remaining : undefined
  }
  const { default: parseTimeline } = await import(new URL('./parsers/timeline.js', import.meta.resolve('emusks')).href)
  const streamOrder = ['bookmarks', 'likes']
  const persisted = async () => privateJson(`${runDir}/checkpoint.json`, state)
  for (const source of streamOrder) {
    activeSource = source
    const stream = state[source]
    if (stream.stop === 'exhausted') continue
    stream.stop = null
    stream.error = null
    rateRemaining = undefined
    if (source === 'likes' && !state.viewerId) {
      try {
        const settings = await client.account.settings()
        state.viewerId = (await client.users.getByUsername(settings.screen_name))?.id
      } catch (error) {
        stream.stop = 'viewer_unavailable'
        stream.error = { kind: error?.name ?? 'Error', httpStatus: error?.status ?? null }
        await persisted()
        continue
      }
    }
    const found = new Map(stream.posts.map(p => [p.id, p]))
    const seenCursors = new Set()
    for (let n = 0; n < maxPages; n++) {
      if (performance.now() - began > 300_000) { stream.stop = 'time_budget'; break }
      try {
        const cursor = stream.cursor ?? undefined
        const page = source === 'bookmarks' ? await client.bookmarks.get({ count: 50, cursor })
          : parseTimeline(await client.graphql('Likes', {
            variables: { userId: state.viewerId, count: 50, cursor, includePromotedContent: false,
              withClientEventToken: false, withBirdwatchNotes: false, withVoice: true, withV2Timeline: true },
            fieldToggles: { withArticlePlainText: false, withArticleRichContentState: false, withAuxiliaryUserLabels: false },
          }))
        stream.pages++
        if (page.raw?.errors?.length) {
          stream.error = { codes: page.raw.errors.map(e => e.code).filter(Number.isFinite) }
          if (!page.tweets?.length) { stream.stop = 'api_error'; break }
        }
        const before = found.size
        const entries = findEntries(page.raw)
        const entriesById = new Map(entries.map(entry => [entry.entryId.match(/^tweet-(\d+)/)?.[1], entry]))
        for (const tweet of page.tweets ?? []) if (tweet.id && !tweet.tombstone) found.set(tweet.id, normalise(tweet, entriesById.get(tweet.id), source))
        if (stream.pages === 1) {
          await privateJson(`${runDir}/${source}-first-page.json`, page.raw)
          stream.metadataFields = [...metadataFields(findEntries(page.raw))]
        }
        stream.posts = [...found.values()]
        const next = page.nextCursor
        stream.cursor = next ?? null
        log({ status: 'page', source, pages: stream.pages, posts: found.size, hasMore: !!next })
        if (!next) stream.stop = 'exhausted'
        else if (!(page.tweets?.length)) stream.stop = 'empty_page'
        else if (next === cursor || seenCursors.has(next)) stream.stop = 'repeated_cursor'
        else if (found.size === before) stream.stop = 'no_new_posts'
        else if (rateRemaining != null && rateRemaining <= 3) stream.stop = 'rate_budget'
        seenCursors.add(next)
        await persisted()
        if (stream.stop) break
        await new Promise(resolve => setTimeout(resolve, 250))
      } catch (error) {
        stream.stop = error?.status === 429 ? 'rate_limited' : 'request_failed'
        stream.error = { kind: error?.name ?? 'Error', httpStatus: error?.status ?? null,
          codes: (error?.errors ?? []).map(e => e.code).filter(Number.isFinite) }
        break
      }
    }
    stream.stop ??= 'page_budget'
    await persisted()
  }
  const merged = new Map()
  for (const source of streamOrder) for (const post of state[source].posts) {
    const key = post.root_id
    const existing = merged.get(key)
    if (existing) { if (!existing.sources.includes(source)) existing.sources.push(source) }
    else merged.set(key, { ...post, sources: [source] })
  }
  const posts = [...merged.values()]
  const windowPosts = posts.filter(post => {
    const published = Date.parse(post.created_at)
    return published >= Date.parse(state.cutoff) && published <= Date.parse(state.startedAt)
  })
  const summary = {
    runDir, cutoff: state.cutoff, asOf: state.startedAt, uniquePosts: posts.length,
    likes: { count: state.likes.posts.length, pages: state.likes.pages, stop: state.likes.stop },
    bookmarks: { count: state.bookmarks.posts.length, pages: state.bookmarks.pages, stop: state.bookmarks.stop },
    windowMonths: state.months ?? null,
    dateBasis: 'publication_date',
    exactInteractionDatesAvailable: false,
    publicationWindowCoverageVerified: false,
    publishedWithinWindow: windowPosts.length,
    bookmarksWithEstimatedSaveDate: state.bookmarks.posts.filter(p => p.saved_at_estimate).length,
    bookmarksEstimatedWithinWindow: state.bookmarks.posts.filter(p => Date.parse(p.saved_at_estimate) >= Date.parse(state.cutoff)).length,
    note: 'The requested window uses post publication dates. All retrieved saves are retained in history.json; recent-posts-subset.json applies the publication cutoff. Pagination may be incomplete.',
  }
  await privateJson(`${runDir}/history.json`, { fetched_at: new Date().toISOString(), ...summary, posts })
  await privateJson(`${runDir}/recent-posts-subset.json`, {
    fetched_at: new Date().toISOString(), ...summary,
    selection: 'Currently liked/bookmarked posts published within the requested window. Older posts are excluded by the requested publication-date filter. Pagination may be incomplete.',
    posts: windowPosts,
  })
  await privateJson(`${runDir}/summary.json`, summary)
  log({ status: 'complete', ...summary })
}
const began = performance.now()
const timer = setTimeout(() => { log({ status: 'timeout', source: activeSource }); process.exit(1) }, 330_000)
main().catch(error => { log({ status: 'failed', kind: error?.name ?? 'Error', httpStatus: error?.status ?? null }); process.exitCode = 1 })
  .finally(async () => { clearTimeout(timer); await Emusks.close().catch(() => {}); Object.assign(console, originalConsole) })
