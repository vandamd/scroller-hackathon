import { v } from 'convex/values'

export const accountIdentity = v.object({ id: v.string(), username: v.string(), name: v.string() })
export const counts = v.object({ likes: v.number(), bookmarks: v.number(), unique: v.number() })
export const preference = v.object({
  id: v.string(), title: v.string(), description: v.string(), rule: v.string(), counterexample: v.string(),
  evidence: v.array(v.object({ postId: v.string(), field: v.union(v.literal('text'), v.literal('quoteText'), v.literal('imageDescription')), excerpt: v.string() })),
})
export const profile = v.object({ summary: v.string(), preferences: v.array(preference), limitations: v.array(v.string()) })
export const author = v.object({ authorId: v.string(), username: v.string(), likedPosts: v.number(), bookmarkedPosts: v.number(), distinctPosts: v.number() })
export const post = v.object({
  id: v.string(), authorId: v.string(), name: v.string(), handle: v.string(), initials: v.string(), time: v.string(), publishedAt: v.number(), text: v.string(), originalUrl: v.string(),
  url: v.optional(v.string()), linkLabel: v.optional(v.string()), avatarUrl: v.optional(v.string()),
  photos: v.array(v.object({ src: v.string(), alt: v.string() })),
  video: v.optional(v.object({ src: v.string(), poster: v.optional(v.string()) })),
  quote: v.optional(v.object({ name: v.string(), handle: v.string(), text: v.string(), originalUrl: v.optional(v.string()) })), viewerLiked: v.boolean(),
})
export const jobKind = v.union(v.literal('connect'), v.literal('profile'), v.literal('feed'), v.literal('like'), v.literal('unlike'))
export const jobResult = v.object({ id: v.string(), lease: v.string(), kind: jobKind, generation: v.number(), sealedCredentials: v.string(), payload: v.string(), profile: v.union(profile, v.null()), authors: v.array(author) })
export const liveView = v.object({
  stage: v.union(v.literal('connect'), v.literal('scanning'), v.literal('taste'), v.literal('office'), v.literal('error')),
  activity: v.union(v.literal('idle'), v.literal('connecting'), v.literal('profiling'), v.literal('fetching')),
  account: v.union(accountIdentity, v.null()), profile: v.union(profile, v.null()), profileAccepted: v.boolean(), counts,
  error: v.union(v.string(), v.null()), edition: v.union(v.object({ id: v.string(), posts: v.array(post), cursor: v.number() }), v.null()),
  readyCount: v.number(), lastCheckedAt: v.union(v.number(), v.null()), workerHeartbeatAt: v.union(v.number(), v.null()),
})
