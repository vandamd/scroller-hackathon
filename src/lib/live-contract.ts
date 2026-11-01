import { z } from 'zod'

export const tastePreferenceSchema = z.object({
  id: z.string(), title: z.string(), description: z.string(), rule: z.string(),
  counterexample: z.string(),
  evidence: z.array(z.object({ postId: z.string(), field: z.enum(['text', 'quoteText', 'imageDescription']), excerpt: z.string() })),
})
export const tasteProfileSchema = z.object({
  summary: z.string(), preferences: z.array(tastePreferenceSchema).max(5), limitations: z.array(z.string()),
})
export const authorTallySchema = z.object({
  authorId: z.string(), username: z.string(), likedPosts: z.number(), bookmarkedPosts: z.number(), distinctPosts: z.number(),
})
export const livePostSchema = z.object({
  id: z.string(), authorId: z.string(), name: z.string(), handle: z.string(), initials: z.string(),
  time: z.string(), publishedAt: z.number(), text: z.string(), originalUrl: z.string(),
  url: z.string().optional(), linkLabel: z.string().optional(), avatarUrl: z.string().optional(),
  photos: z.array(z.object({ src: z.string(), alt: z.string() })),
  video: z.object({ src: z.string(), poster: z.string().optional() }).optional(),
  quote: z.object({ name: z.string(), handle: z.string(), text: z.string(), originalUrl: z.string().optional() }).optional(),
  viewerLiked: z.boolean(),
})
export const scanCountsSchema = z.object({ likes: z.number(), bookmarks: z.number(), unique: z.number() })
export const liveViewSchema = z.object({
  stage: z.enum(['connect', 'scanning', 'taste', 'office', 'error']),
  activity: z.enum(['idle', 'connecting', 'profiling', 'fetching']),
  account: z.object({ id: z.string(), username: z.string(), name: z.string() }).nullable(),
  profile: tasteProfileSchema.nullable(), profileAccepted: z.boolean(),
  counts: scanCountsSchema, error: z.string().nullable(),
  edition: z.object({ id: z.string(), posts: z.array(livePostSchema), cursor: z.number() }).nullable(),
  readyCount: z.number(), lastCheckedAt: z.number().nullable(), workerHeartbeatAt: z.number().nullable(),
})
export const xCredentialsSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('password'), username: z.string().min(1).max(200), password: z.string().min(1).max(500) }),
  z.object({ mode: z.literal('session'), authToken: z.string().min(20).max(500), csrfToken: z.string().max(500).optional() }),
])
export const workerJobSchema = z.object({
  id: z.string(), lease: z.string(), kind: z.enum(['connect', 'profile', 'feed', 'like', 'unlike']),
  generation: z.number(), sealedCredentials: z.string(), payload: z.string(),
  profile: tasteProfileSchema.nullable(), authors: z.array(authorTallySchema),
})

export type TasteProfile = z.infer<typeof tasteProfileSchema>
export type AuthorTally = z.infer<typeof authorTallySchema>
export type LivePost = z.infer<typeof livePostSchema>
export type LiveView = z.infer<typeof liveViewSchema>
export type XCredentials = z.infer<typeof xCredentialsSchema>
export type WorkerJob = z.infer<typeof workerJobSchema>
