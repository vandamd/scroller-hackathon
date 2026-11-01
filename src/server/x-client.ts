import Emusks, { type Client, type Timeline, type Tweet, type User } from 'emusks'
import { z } from 'zod'
import { livePostSchema, type AuthorTally, type LivePost, type XCredentials } from '../lib/live-contract'
import { postInitials } from '../lib/post-initials'

export type XClient = Emusks

export function safeXError(error: unknown): string {
  const value = error instanceof Error ? error.message : ''
  if (/rate.limit|temporarily limited|too many/i.test(value)) return 'X has temporarily limited sign-ins. Please wait a few minutes and try again.'
  if (/incorrect password|password was incorrect|wrong password/i.test(value)) return 'The X email or password was not recognised. Please try again.'
  if (/challenge|two.factor|alternate.identifier|verification|browser|castle|password/i.test(value)) {
    return 'X requires additional verification. Please sign in on X and try again.'
  }
  const code = z.object({ status: z.number().optional() }).safeParse(error)
  if (code.success && code.data.status === 429) return 'X is busy. Please try again in a few minutes.'
  if (/auth|token|csrf|session|login|unauthor/i.test(value)) return 'Your X session could not be verified. Please reconnect X.'
  return 'X could not complete that request. Please try again.'
}

export async function connectX(credentials: XCredentials): Promise<XClient> {
  const client = new Emusks()
  if (credentials.mode === 'session' && credentials.csrfToken) {
    const moduleUrl = new URL('./clients.js', import.meta.resolve('emusks')).href
    const profile: Client = (await import(moduleUrl)).default.web
    const fingerprints = { ...profile.fingerprints! }
    fingerprints.userAgent ??= fingerprints['user-agent']
    client.auth = {
      auth_token: credentials.authToken, csrfToken: credentials.csrfToken,
      client: { ...profile, fingerprints,
        headers: { cookie: `auth_token=${credentials.authToken}; ct0=${credentials.csrfToken};` } },
    }
  } else if (credentials.mode === 'session') {
    await client.login({ auth_token: credentials.authToken })
  } else {
    await client.login({ type: 'password', username: credentials.username, password: credentials.password,
      timeout: 35, debug: false,
      onRequest: (type) => {
        if (type === 'alternate_identifier') return undefined
        throw new Error('X requires additional verification')
      },
    })
  }
  return client
}

export async function getXAccount(client: XClient): Promise<Pick<User, 'id' | 'username' | 'name'>> {
  let user = client.user
  if (!user?.id) {
    try { user = await client.account.viewer() }
    catch {
      const settings = z.object({ screen_name: z.string().min(1) }).parse(await client.account.settings())
      user = await client.users.getByUsername(settings.screen_name)
    }
  }
  if (!user?.id || !user.username) throw new Error('X session is invalid')
  return { id: user.id, username: user.username, name: user.name }
}

export function sessionCredentials(client: XClient): XCredentials {
  const token = client.auth?.auth_token
  if (!token) throw new Error('X session is unavailable')
  return { mode: 'session', authToken: token, ...(client.auth?.csrfToken ? { csrfToken: client.auth.csrfToken } : {}) }
}

const mediaSchema = z.object({
  type: z.string(), url: z.string().optional(), media_url_https: z.string().optional(), ext_alt_text: z.string().optional(),
  video_info: z.object({ variants: z.array(z.object({ content_type: z.string(), url: z.string(), bitrate: z.number().optional() })) }).optional(),
})

export function safeMediaUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['pbs.twimg.com', 'video.twimg.com'].includes(url.hostname) ? url.href : undefined
  } catch { return undefined }
}

export function photoUrls(tweet: Tweet, limit = 2): string[] {
  return tweet.media.map(value => mediaSchema.safeParse(value)).filter(result => result.success)
    .map(result => result.data).filter(media => media.type === 'photo')
    .flatMap(media => {
      const source = safeMediaUrl(media.media_url_https)
      if (!source) return []
      const url = new URL(source)
      url.searchParams.set('name', 'medium')
      return [url.href]
    }).slice(0, limit)
}

function decode(text: string | undefined) {
  return (text ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

export function normalisePost(wrapper: Tweet): LivePost | null {
  const tweet = wrapper.retweeting ?? wrapper
  if (!tweet.user?.id || !tweet.user.username || tweet.user.protected || !tweet.id) return null
  const date = Date.parse(tweet.created_at)
  if (!Number.isFinite(date)) return null
  const media = tweet.media.map(value => mediaSchema.safeParse(value)).filter(result => result.success).map(result => result.data)
  let text = decode(tweet.text)
  for (const item of media) if (item.url) text = text.replaceAll(item.url, '')
  let artifact: { url: string; linkLabel: string } | undefined
  for (const value of tweet.urls) {
    const parsed = z.object({ url: z.string(), expanded_url: z.string().optional(), display_url: z.string().optional() }).safeParse(value)
    if (!parsed.success || !parsed.data.expanded_url) continue
    try {
      const url = new URL(parsed.data.expanded_url)
      if (url.protocol !== 'https:') continue
      if (!['x.com', 'twitter.com', 't.co'].includes(url.hostname) && !artifact) {
        artifact = { url: url.href, linkLabel: parsed.data.display_url ?? url.hostname }
        text = text.replaceAll(parsed.data.url, '')
      }
    } catch { /* Unusable links remain plain post text. */ }
  }
  const photos = media.filter(item => item.type === 'photo').flatMap(item => {
    const src = safeMediaUrl(item.media_url_https)
    return src ? [{ src, alt: item.ext_alt_text ?? `Image attached to ${tweet.user!.name}'s post` }] : []
  })
  const moving = media.find(item => ['video', 'animated_gif'].includes(item.type))
  const bestVideo = moving?.video_info?.variants.filter(item => item.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0)).find(item => safeMediaUrl(item.url))
  const video = bestVideo ? { src: bestVideo.url, ...(safeMediaUrl(moving?.media_url_https) ? { poster: moving!.media_url_https } : {}) } : undefined
  const quote = tweet.quoting?.user && !tweet.quoting.user.protected
    ? { name: tweet.quoting.user.name, handle: tweet.quoting.user.username, text: decode(tweet.quoting.text), originalUrl: `https://x.com/${tweet.quoting.user.username}/status/${tweet.quoting.id}` } : undefined
  const avatarUrl = safeMediaUrl(tweet.user.profile_picture?.url)
  return livePostSchema.parse({
    id: tweet.id, authorId: tweet.user.id, name: tweet.user.name, handle: tweet.user.username,
    initials: postInitials(tweet.user.name),
    time: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date),
    publishedAt: date, text: text.trim(), originalUrl: `https://x.com/${tweet.user.username}/status/${tweet.id}`,
    ...artifact,
    ...(avatarUrl ? { avatarUrl } : {}), photos, ...(video ? { video } : {}), ...(quote ? { quote } : {}),
    viewerLiked: Boolean(tweet.engagement?.liked),
  })
}

export type HistoryPost = { tweet: Tweet; sources: ('likes' | 'bookmarks')[] }

export async function readHistory(client: XClient, userId: string, options: { pages?: number; months?: number } = {}) {
  const cutoff = new Date()
  cutoff.setUTCMonth(cutoff.getUTCMonth() - (options.months ?? 4))
  const parseTimeline: (raw: unknown) => Timeline = (await import(new URL('./parsers/timeline.js', import.meta.resolve('emusks')).href)).default
  const merged = new Map<string, HistoryPost>()
  const counts = { likes: 0, bookmarks: 0, unique: 0 }
  let succeeded = 0
  for (const source of ['bookmarks', 'likes'] as const) {
    let cursor: string | undefined
    const seenCursors = new Set<string>()
    const seenPosts = new Set<string>()
    for (let pageNumber = 0; pageNumber < (options.pages ?? 3); pageNumber++) {
      let page: Timeline
      try {
        page = source === 'bookmarks' ? await client.bookmarks.get({ count: 50, cursor }) : parseTimeline(await client.graphql('Likes', {
          variables: { userId, count: 50, cursor, includePromotedContent: false, withClientEventToken: false,
            withBirdwatchNotes: false, withVoice: true, withV2Timeline: true },
          fieldToggles: { withArticlePlainText: false, withArticleRichContentState: false, withAuxiliaryUserLabels: false },
        }))
      } catch { break }
      if (page.raw?.errors?.length && !page.tweets.length) break
      succeeded++
      for (const wrapper of page.tweets) {
        const tweet = wrapper.retweeting ?? wrapper
        if (!tweet.user || tweet.user.protected || Date.parse(tweet.created_at) < cutoff.getTime()) continue
        if (!seenPosts.has(tweet.id)) { counts[source]++; seenPosts.add(tweet.id) }
        const previous = merged.get(tweet.id)
        if (previous) { if (!previous.sources.includes(source)) previous.sources.push(source) }
        else merged.set(tweet.id, { tweet, sources: [source] })
      }
      if (!page.nextCursor || seenCursors.has(page.nextCursor) || !page.tweets.length) break
      seenCursors.add(page.nextCursor)
      cursor = page.nextCursor
      // The API is not guaranteed to be ordered by publication date: don't stop on an old post.
    }
  }
  if (!succeeded) throw new Error('Your X history could not be read. Please reconnect X.')
  counts.unique = merged.size
  const authors = new Map<string, AuthorTally>()
  for (const { tweet, sources } of merged.values()) {
    const user = tweet.user!
    const author = authors.get(user.id) ?? { authorId: user.id, username: user.username, likedPosts: 0, bookmarkedPosts: 0, distinctPosts: 0 }
    author.likedPosts += Number(sources.includes('likes'))
    author.bookmarkedPosts += Number(sources.includes('bookmarks'))
    author.distinctPosts++
    authors.set(user.id, author)
  }
  return { posts: [...merged.values()], counts, authors: [...authors.values()].sort((a, b) => b.distinctPosts - a.distinctPosts).slice(0, 100) }
}

export async function closeX() { await Emusks.close() }
