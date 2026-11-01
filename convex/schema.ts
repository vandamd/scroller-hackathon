import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { accountIdentity, counts, jobKind } from './liveValidators'

export default defineSchema({
  offices: defineTable({
    ownerId: v.string(),
    state: v.string(),
    updatedAt: v.number(),
  }).index('by_owner', ['ownerId']),
  liveAccounts: defineTable({
    ownerId: v.string(), generation: v.number(), enabled: v.boolean(),
    stage: v.union(v.literal('connect'), v.literal('scanning'), v.literal('taste'), v.literal('office'), v.literal('error')),
    activity: v.union(v.literal('idle'), v.literal('connecting'), v.literal('profiling'), v.literal('fetching')),
    sealedCredentials: v.string(), account: v.union(accountIdentity, v.null()),
    profileJson: v.union(v.string(), v.null()), authorsJson: v.string(), profileAccepted: v.boolean(), counts,
    error: v.union(v.string(), v.null()), currentEditionId: v.optional(v.id('liveEditions')),
    activeJobId: v.optional(v.id('liveJobs')), advanceRequested: v.boolean(), nextFetchAt: v.number(),
    lastCheckedAt: v.union(v.number(), v.null()), completedAt: v.optional(v.number()), recentProcessedIds: v.array(v.string()),
  }).index('by_ownerId', ['ownerId']).index('by_enabled_and_profileAccepted_and_nextFetchAt', ['enabled', 'profileAccepted', 'nextFetchAt']),
  livePosts: defineTable({
    ownerId: v.string(), generation: v.number(), postId: v.string(), postJson: v.string(),
    state: v.union(v.literal('ready'), v.literal('current'), v.literal('seen')), appLikeOwned: v.boolean(),
  }).index('by_ownerId_and_generation_and_postId', ['ownerId', 'generation', 'postId'])
    .index('by_ownerId_and_generation_and_state', ['ownerId', 'generation', 'state'])
    .index('by_ownerId_and_generation', ['ownerId', 'generation']),
  liveEditions: defineTable({ ownerId: v.string(), generation: v.number(), postsJson: v.string(), cursor: v.number() })
    .index('by_ownerId_and_generation', ['ownerId', 'generation']),
  liveFeedback: defineTable({
    ownerId: v.string(), generation: v.number(), editionId: v.id('liveEditions'), postId: v.string(), actionId: v.string(), position: v.number(),
    choice: v.union(v.literal('like'), v.literal('dislike'), v.literal('skip')), undone: v.boolean(),
    syncState: v.union(v.literal('none'), v.literal('queued'), v.literal('done'), v.literal('failed')),
  }).index('by_ownerId_and_actionId', ['ownerId', 'actionId'])
    .index('by_editionId_and_position', ['editionId', 'position'])
    .index('by_ownerId_and_generation_and_postId', ['ownerId', 'generation', 'postId'])
    .index('by_ownerId_and_generation', ['ownerId', 'generation']),
  liveJobs: defineTable({
    ownerId: v.string(), generation: v.number(), kind: jobKind, payload: v.string(),
    state: v.union(v.literal('queued'), v.literal('running'), v.literal('done'), v.literal('failed'), v.literal('cancelled')),
    availableAt: v.number(), attempts: v.number(), lease: v.optional(v.string()), leaseUntil: v.optional(v.number()), workerId: v.optional(v.string()),
  }).index('by_state_and_availableAt', ['state', 'availableAt'])
    .index('by_state_and_leaseUntil', ['state', 'leaseUntil'])
    .index('by_ownerId_and_generation_and_kind_and_state', ['ownerId', 'generation', 'kind', 'state'])
    .index('by_ownerId_and_generation_and_state', ['ownerId', 'generation', 'state'])
    .index('by_ownerId_and_generation', ['ownerId', 'generation']),
  liveActivity: defineTable({ ownerId: v.string(), activeUntil: v.number() }).index('by_ownerId', ['ownerId']),
  liveRuntime: defineTable({ key: v.string(), heartbeatAt: v.number() }).index('by_key', ['key']),
})
