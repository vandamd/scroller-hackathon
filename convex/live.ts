import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'
import { liveView } from './liveValidators'
import { accountFor, enqueue, hasActiveLike, postFor, promoteEdition, queueFeed, readPosts, readProfile } from './liveHelpers'
import type { LiveView } from '../src/lib/live-contract'

export const view = query({
  args: {}, returns: liveView,
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    const runtime = await ctx.db.query('liveRuntime').withIndex('by_key', q => q.eq('key', 'worker')).unique()
    if (!account) return { stage: 'connect' as const, activity: 'idle' as const, account: null, profile: null, profileAccepted: false, counts: { likes: 0, bookmarks: 0, unique: 0 }, error: null, edition: null, readyCount: 0, lastCheckedAt: null, workerHeartbeatAt: runtime?.heartbeatAt ?? null }
    const edition = account.currentEditionId ? await ctx.db.get(account.currentEditionId) : null
    const ready = await ctx.db.query('livePosts').withIndex('by_ownerId_and_generation_and_state', q => q.eq('ownerId', user._id).eq('generation', account.generation).eq('state', 'ready')).take(16)
    const result: LiveView = { stage: account.stage, activity: account.activity, account: account.account, profile: readProfile(account), profileAccepted: account.profileAccepted, counts: account.counts, error: account.error, edition: edition ? { id: edition._id, posts: readPosts(edition.postsJson), cursor: edition.cursor } : null, readyCount: ready.length, lastCheckedAt: account.lastCheckedAt, workerHeartbeatAt: runtime?.heartbeatAt ?? null }
    return result
  },
})

export const connect = mutation({
  args: { sealedCredentials: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (args.sealedCredentials.length < 40 || args.sealedCredentials.length > 12_000) throw new Error('Invalid connection details')
    const old = await accountFor(ctx, user._id)
    const data = { ownerId: user._id, generation: (old?.generation ?? 0) + 1, enabled: true, stage: 'scanning' as const, activity: 'connecting' as const, sealedCredentials: args.sealedCredentials, account: null, profileJson: null, authorsJson: '[]', profileAccepted: false, counts: { likes: 0, bookmarks: 0, unique: 0 }, error: null, advanceRequested: false, nextFetchAt: Date.now(), lastCheckedAt: null, recentProcessedIds: [] }
    if (old) await ctx.db.replace(old._id, data)
    else await ctx.db.insert('liveAccounts', data)
    const account = (await accountFor(ctx, user._id))!
    await enqueue(ctx, account, 'connect')
    return null
  },
})

export const acceptTaste = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    if (!account?.profileJson) throw new Error('Your taste scan is not ready')
    if (account.lastCheckedAt === null) throw new Error('Your first stack is still being prepared')
    await ctx.db.patch(account._id, { profileAccepted: true, stage: 'office', error: null, advanceRequested: false })
    if (account.lastCheckedAt === null) await queueFeed(ctx, { ...account, profileAccepted: true })
    return null
  },
})

export const heartbeat = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const activity = await ctx.db.query('liveActivity').withIndex('by_ownerId', q => q.eq('ownerId', user._id)).unique()
    const activeUntil = Date.now() + 5 * 60_000
    if (activity) await ctx.db.patch(activity._id, { activeUntil })
    else await ctx.db.insert('liveActivity', { ownerId: user._id, activeUntil })
    const account = await accountFor(ctx, user._id)
    if (account?.profileAccepted && account.enabled && account.nextFetchAt <= Date.now()) await queueFeed(ctx, account)
    return null
  },
})

export const retry = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    if (!account?.enabled || !account.sealedCredentials) throw new Error('Reconnect X to try again')
    if (account.profileAccepted) {
      await ctx.db.patch(account._id, { stage: 'office', error: null })
      await queueFeed(ctx, account)
      return null
    }
    if (account.profileJson) {
      await ctx.db.patch(account._id, { stage: 'taste', error: null })
      await queueFeed(ctx, { ...account, profileAccepted: true })
      return null
    }
    const queued = await ctx.db.query('liveJobs').withIndex('by_ownerId_and_generation_and_state', q => q.eq('ownerId', user._id).eq('generation', account.generation).eq('state', 'queued')).take(32)
    if (queued.some(job => job.kind === 'profile' || job.kind === 'connect')) return null
    const active = account.activeJobId ? await ctx.db.get(account.activeJobId) : null
    if (active?.state === 'running') return null
    const kind = account.account ? 'profile' : 'connect'
    await ctx.db.patch(account._id, { stage: 'scanning', activity: kind === 'profile' ? 'profiling' : 'connecting', error: null })
    await enqueue(ctx, account, kind)
    return null
  },
})

export const openOffice = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    if (!account?.profileAccepted || !account.enabled) throw new Error('Connect your account first')
    const edition = account.currentEditionId ? await ctx.db.get(account.currentEditionId) : null
    if (!edition || edition.cursor < readPosts(edition.postsJson).length) return null
    if (account.completedAt === undefined) {
      await ctx.db.patch(account._id, { completedAt: Date.now(), advanceRequested: false })
      return null
    }
    if (account.lastCheckedAt !== null && account.lastCheckedAt > account.completedAt) await promoteEdition(ctx, account)
    return null
  },
})

export const rate = mutation({
  args: { actionId: v.string(), postId: v.string(), choice: v.union(v.literal('like'), v.literal('dislike'), v.literal('skip')) }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!args.actionId || args.actionId.length > 100) throw new Error('Invalid action')
    const existing = await ctx.db.query('liveFeedback').withIndex('by_ownerId_and_actionId', q => q.eq('ownerId', user._id).eq('actionId', args.actionId)).unique()
    if (existing) { if (existing.postId !== args.postId || existing.choice !== args.choice) throw new Error('Action already used'); return null }
    const account = await accountFor(ctx, user._id)
    const edition = account?.currentEditionId ? await ctx.db.get(account.currentEditionId) : null
    if (!account?.enabled || !edition || edition.ownerId !== user._id) throw new Error('No active stack')
    const post = readPosts(edition.postsJson)[edition.cursor]
    if (!post || post.id !== args.postId) throw new Error('This card has already moved')
    const feedbackId = await ctx.db.insert('liveFeedback', { ownerId: user._id, generation: account.generation, editionId: edition._id, postId: args.postId, actionId: args.actionId, position: edition.cursor, choice: args.choice, undone: false, syncState: args.choice === 'like' && !post.viewerLiked ? 'queued' : 'none' })
    const stored = await postFor(ctx, account, post.id)
    if (stored) await ctx.db.patch(stored._id, { state: 'seen' })
    await ctx.db.patch(edition._id, { cursor: edition.cursor + 1 })
    if (edition.cursor + 1 === readPosts(edition.postsJson).length) await ctx.db.patch(account._id, { completedAt: Date.now(), advanceRequested: false })
    if (args.choice === 'like' && !post.viewerLiked) await enqueue(ctx, account, 'like', { postId: post.id, feedbackId })
    return null
  },
})

export const undo = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    const edition = account?.currentEditionId ? await ctx.db.get(account.currentEditionId) : null
    if (!account?.enabled || !edition || edition.ownerId !== user._id || edition.cursor < 1) return null
    const position = edition.cursor - 1
    const actions = await ctx.db.query('liveFeedback').withIndex('by_editionId_and_position', q => q.eq('editionId', edition._id).eq('position', position)).order('desc').take(20)
    const feedback = actions.find(item => !item.undone)
    if (!feedback) return null
    await ctx.db.patch(feedback._id, { undone: true })
    await ctx.db.patch(edition._id, { cursor: position })
    await ctx.db.patch(account._id, { completedAt: undefined })
    const post = await postFor(ctx, account, feedback.postId)
    if (post) await ctx.db.patch(post._id, { state: 'current' })
    if (feedback.choice === 'like' && post?.appLikeOwned && !await hasActiveLike(ctx, account, feedback.postId)) await enqueue(ctx, account, 'unlike', { postId: feedback.postId })
    return null
  },
})

export const disconnect = mutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx)
    const account = await accountFor(ctx, user._id)
    if (account) await ctx.db.patch(account._id, { enabled: false, generation: account.generation + 1, stage: 'connect', activity: 'idle', sealedCredentials: '', account: null, profileJson: null, authorsJson: '[]', profileAccepted: false, counts: { likes: 0, bookmarks: 0, unique: 0 }, error: null, currentEditionId: undefined, activeJobId: undefined, advanceRequested: false, recentProcessedIds: [] })
    return null
  },
})
