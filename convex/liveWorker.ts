import { action, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { z } from 'zod'
import { authorTallySchema, livePostSchema, scanCountsSchema, tasteProfileSchema, type WorkerJob } from '../src/lib/live-contract'
import { jobResult } from './liveValidators'
import { accountFor, enqueue, hasActiveLike, postFor, promoteEdition, queueFeed, readAuthors, readProfile } from './liveHelpers'

const resultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('connect'), sealedCredentials: z.string().min(40).max(12_000), account: z.object({ id: z.string(), username: z.string(), name: z.string() }) }),
  z.object({ kind: z.literal('profile'), profile: tasteProfileSchema, authors: z.array(authorTallySchema).max(1000), counts: scanCountsSchema }),
  z.object({ kind: z.literal('feed'), posts: z.array(livePostSchema).max(40), inspected: z.number(), processedPostIds: z.array(z.string()).max(100).optional() }),
  z.object({ kind: z.literal('like'), alreadyLiked: z.boolean(), changed: z.boolean() }),
  z.object({ kind: z.literal('unlike'), changed: z.boolean() }),
])
const postPayload = z.object({ postId: z.string(), feedbackId: z.string().optional() })
const connectionErrors = new Set([
  'X has temporarily limited sign-ins. Please wait a few minutes and try again.',
  'The X email or password was not recognised. Please try again.',
  'X requires additional verification. Please sign in on X and try again.',
  'X is busy. Please try again in a few minutes.',
  'Your X session could not be verified. Please reconnect X.',
])

async function authorise(secret: string) {
  const expected = process.env.WORKER_SECRET
  if (!expected || !secret) throw new Error('Worker unavailable')
  const encode = new TextEncoder()
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', encode.encode(expected)), crypto.subtle.digest('SHA-256', encode.encode(secret))])
  const first = new Uint8Array(a), second = new Uint8Array(b)
  let difference = 0
  for (let i = 0; i < first.length; i++) difference |= first[i] ^ second[i]
  if (difference) throw new Error('Not authorised')
}

export const claim = action({
  args: { workerSecret: v.string(), workerId: v.string() }, returns: v.union(jobResult, v.null()),
  handler: async (ctx, args): Promise<WorkerJob | null> => {
    await authorise(args.workerSecret)
    if (!args.workerId || args.workerId.length > 100) throw new Error('Invalid worker')
    return ctx.runMutation(internal.liveWorker.claimJob, { workerId: args.workerId, lease: crypto.randomUUID() })
  },
})

export const complete = action({
  args: { workerSecret: v.string(), jobId: v.id('liveJobs'), lease: v.string(), resultJson: v.string() }, returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await authorise(args.workerSecret)
    if (args.resultJson.length > 500_000) throw new Error('Worker result too large')
    const result = resultSchema.parse(JSON.parse(args.resultJson))
    return ctx.runMutation(internal.liveWorker.completeJob, { jobId: args.jobId, lease: args.lease, resultJson: JSON.stringify(result) })
  },
})

export const fail = action({
  args: { workerSecret: v.string(), jobId: v.id('liveJobs'), lease: v.string(), message: v.string() }, returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await authorise(args.workerSecret)
    const message = connectionErrors.has(args.message) ? args.message : undefined
    return ctx.runMutation(internal.liveWorker.failJob, { jobId: args.jobId, lease: args.lease, message })
  },
})

export const claimJob = internalMutation({
  args: { workerId: v.string(), lease: v.string() }, returns: v.union(jobResult, v.null()),
  handler: async (ctx, args): Promise<WorkerJob | null> => {
    const now = Date.now()
    const runtime = await ctx.db.query('liveRuntime').withIndex('by_key', q => q.eq('key', 'worker')).unique()
    if (!runtime) await ctx.db.insert('liveRuntime', { key: 'worker', heartbeatAt: now })
    else if (runtime.heartbeatAt < now - 15_000) await ctx.db.patch(runtime._id, { heartbeatAt: now })
    const expired = await ctx.db.query('liveJobs').withIndex('by_state_and_leaseUntil', q => q.eq('state', 'running').lte('leaseUntil', now)).take(8)
    for (const job of expired) {
      await ctx.db.patch(job._id, { state: job.attempts >= 3 ? 'failed' : 'queued', availableAt: now, lease: undefined, leaseUntil: undefined })
      const account = await accountFor(ctx, job.ownerId)
      if (account?.activeJobId === job._id) {
        await ctx.db.patch(account._id, { activeJobId: undefined, activity: 'idle' })
        if (job.attempts >= 3 && job.kind === 'connect') await ctx.db.patch(account._id, { stage: 'connect', sealedCredentials: '', error: 'X couldn’t connect. Check your auth_token.' })
        if (job.attempts >= 3 && job.kind === 'profile') await ctx.db.patch(account._id, { stage: 'error', error: 'The scan took too long. Try again.' })
        if (job.attempts >= 3 && job.kind === 'feed' && !account.profileAccepted) await ctx.db.patch(account._id, { error: 'Your first stack couldn’t be prepared. Try again.' })
      }
    }
    const queued = await ctx.db.query('liveJobs').withIndex('by_state_and_availableAt', q => q.eq('state', 'queued').lte('availableAt', now)).take(32)
    for (const job of queued) {
      const account = await accountFor(ctx, job.ownerId)
      if (!account?.enabled || account.generation !== job.generation) { await ctx.db.patch(job._id, { state: 'cancelled' }); continue }
      if (account.activeJobId) {
        const active = await ctx.db.get(account.activeJobId)
        if (active?.state === 'running' && (active.leaseUntil ?? 0) > now) continue
      }
      if (job.kind === 'like' || job.kind === 'unlike') {
        const payload = postPayload.parse(JSON.parse(job.payload))
        const post = await postFor(ctx, account, payload.postId)
        const feedbackId = payload.feedbackId ? ctx.db.normalizeId('liveFeedback', payload.feedbackId) : null
        const feedback = feedbackId ? await ctx.db.get(feedbackId) : null
        if (!post || (job.kind === 'like' && (!feedback || feedback.undone || feedback.choice !== 'like')) || (job.kind === 'unlike' && (!post.appLikeOwned || await hasActiveLike(ctx, account, payload.postId)))) {
          await ctx.db.patch(job._id, { state: 'cancelled' }); continue
        }
      }
      const lease = args.lease
      await ctx.db.patch(job._id, { state: 'running', lease, leaseUntil: now + 5 * 60_000, workerId: args.workerId, attempts: job.attempts + 1 })
      const activity = job.kind === 'connect' ? 'connecting' : job.kind === 'profile' ? 'profiling' : job.kind === 'feed' ? 'fetching' : account.activity
      await ctx.db.patch(account._id, { activeJobId: job._id, activity })
      let payload = job.payload
      if (job.kind === 'feed') {
        const feedback = await ctx.db.query('liveFeedback').withIndex('by_ownerId_and_generation', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation)).order('desc').take(100)
        const examples = []
        for (const item of feedback.filter(item => !item.undone && item.choice !== 'skip').slice(0, 16)) {
          const source = await postFor(ctx, account, item.postId)
          const post = source ? livePostSchema.parse(JSON.parse(source.postJson)) : null
          examples.push({ postId: item.postId, choice: item.choice, authorId: post?.authorId ?? null, text: post?.text.slice(0, 600) ?? '' })
        }
        payload = JSON.stringify({ seenPostIds: account.recentProcessedIds, feedback: examples })
      }
      return { id: job._id, lease, kind: job.kind, generation: job.generation, sealedCredentials: account.sealedCredentials, payload, profile: readProfile(account), authors: readAuthors(account) }
    }
    return null
  },
})

export const completeJob = internalMutation({
  args: { jobId: v.id('liveJobs'), lease: v.string(), resultJson: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || job.state !== 'running' || job.lease !== args.lease) return null
    const account = await accountFor(ctx, job.ownerId)
    if (!account?.enabled || account.generation !== job.generation) { await ctx.db.patch(job._id, { state: 'cancelled' }); return null }
    const result = resultSchema.parse(JSON.parse(args.resultJson))
    if (result.kind !== job.kind) throw new Error('Worker result did not match job')
    const now = Date.now()
    await ctx.db.patch(job._id, { state: 'done', leaseUntil: undefined })
    await ctx.db.patch(account._id, { activeJobId: undefined, activity: 'idle' })
    if (result.kind === 'connect') {
      await ctx.db.patch(account._id, { sealedCredentials: result.sealedCredentials, account: result.account, stage: 'scanning', activity: 'profiling', error: null })
      await enqueue(ctx, { ...account, sealedCredentials: result.sealedCredentials }, 'profile')
    } else if (result.kind === 'profile') {
      await ctx.db.patch(account._id, { profileJson: JSON.stringify(result.profile), authorsJson: JSON.stringify(result.authors), counts: result.counts, stage: 'taste', activity: 'fetching', error: null })
      await enqueue(ctx, account, 'feed')
    } else if (result.kind === 'feed') {
      const ready = await ctx.db.query('livePosts').withIndex('by_ownerId_and_generation_and_state', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation).eq('state', 'ready')).order('asc').take(32)
      const freshPosts = []
      const incomingIds = new Set<string>()
      for (const post of result.posts) {
        if (incomingIds.has(post.id)) continue
        incomingIds.add(post.id)
        if (freshPosts.length < 16 && !await postFor(ctx, account, post.id)) freshPosts.push(post)
      }
      const overflow = Math.max(0, ready.length + freshPosts.length - 16)
      for (const old of ready.slice(0, overflow)) await ctx.db.patch(old._id, { state: 'seen' })
      for (const post of freshPosts) await ctx.db.insert('livePosts', { ownerId: account.ownerId, generation: account.generation, postId: post.id, postJson: JSON.stringify(post), state: 'ready', appLikeOwned: false })
      const ids = [...new Set([...account.recentProcessedIds, ...(result.processedPostIds ?? []), ...result.posts.map(post => post.id)])].slice(-600)
      const activity = await ctx.db.query('liveActivity').withIndex('by_ownerId', q => q.eq('ownerId', account.ownerId)).unique()
      await ctx.db.patch(account._id, { recentProcessedIds: ids, lastCheckedAt: now, nextFetchAt: now + (activity && activity.activeUntil > now ? 2 : 5) * 60_000, error: null })
      if (!account.currentEditionId) await promoteEdition(ctx, account)
    } else {
      const payload = postPayload.parse(JSON.parse(job.payload))
      const stored = await postFor(ctx, account, payload.postId)
      if (result.kind === 'like') {
        const feedbackId = payload.feedbackId ? ctx.db.normalizeId('liveFeedback', payload.feedbackId) : null
        const feedback = feedbackId ? await ctx.db.get(feedbackId) : null
        if (feedback) await ctx.db.patch(feedback._id, { syncState: 'done' })
        if (stored && result.changed) await ctx.db.patch(stored._id, { appLikeOwned: true })
        if (stored && (stored.appLikeOwned || result.changed) && !await hasActiveLike(ctx, account, payload.postId)) await enqueue(ctx, account, 'unlike', { postId: payload.postId })
      } else if (stored && result.changed) await ctx.db.patch(stored._id, { appLikeOwned: false })
    }
    return null
  },
})

export const failJob = internalMutation({
  args: { jobId: v.id('liveJobs'), lease: v.string(), message: v.optional(v.string()) }, returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || job.state !== 'running' || job.lease !== args.lease) return null
    await ctx.db.patch(job._id, { state: 'failed', leaseUntil: undefined })
    const account = await accountFor(ctx, job.ownerId)
    if (!account || account.generation !== job.generation) return null
    await ctx.db.patch(account._id, { activeJobId: undefined, activity: 'idle' })
    if (job.kind === 'connect') await ctx.db.patch(account._id, { stage: 'connect', sealedCredentials: '', error: args.message && connectionErrors.has(args.message) ? args.message : 'X couldn’t connect. Check your auth_token.' })
    if (job.kind === 'profile') await ctx.db.patch(account._id, { stage: 'error', error: 'Tanner couldn’t finish the scan. Try again.' })
    if (job.kind === 'feed') await ctx.db.patch(account._id, { nextFetchAt: Date.now() + 15 * 60_000, ...(!account.profileAccepted ? { error: 'Your first stack couldn’t be prepared. Try again.' } : {}) })
    if (job.kind === 'like') {
      const payload = postPayload.parse(JSON.parse(job.payload))
      const id = payload.feedbackId ? ctx.db.normalizeId('liveFeedback', payload.feedbackId) : null
      if (id && await ctx.db.get(id)) await ctx.db.patch(id, { syncState: 'failed' })
    }
    return null
  },
})

export const queueDue = internalMutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const now = Date.now()
    const accounts = await ctx.db.query('liveAccounts').withIndex('by_enabled_and_profileAccepted_and_nextFetchAt', q => q.eq('enabled', true).eq('profileAccepted', true).lte('nextFetchAt', now)).take(40)
    for (const account of accounts) {
      if (!account.profileAccepted) continue
      await queueFeed(ctx, account)
      await ctx.db.patch(account._id, { nextFetchAt: now + 2 * 60_000 })
    }
    return null
  },
})
