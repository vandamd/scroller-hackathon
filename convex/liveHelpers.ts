import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { livePostSchema, tasteProfileSchema, authorTallySchema } from '../src/lib/live-contract'
import { z } from 'zod'
import { postInitials } from '../src/lib/post-initials'

export type Account = Doc<'liveAccounts'>
export const readProfile = (account: Account) => account.profileJson ? tasteProfileSchema.parse(JSON.parse(account.profileJson)) : null
export const readAuthors = (account: Account) => z.array(authorTallySchema).parse(JSON.parse(account.authorsJson))
export const readPosts = (json: string) => z.array(livePostSchema).parse(JSON.parse(json)).map(post => ({ ...post, initials: postInitials(post.name) }))
export const accountFor = (ctx: QueryCtx | MutationCtx, ownerId: string) => ctx.db.query('liveAccounts').withIndex('by_ownerId', q => q.eq('ownerId', ownerId)).unique()
export const postFor = (ctx: QueryCtx | MutationCtx, account: Account, postId: string) => ctx.db.query('livePosts').withIndex('by_ownerId_and_generation_and_postId', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation).eq('postId', postId)).unique()

export async function enqueue(ctx: MutationCtx, account: Account, kind: Doc<'liveJobs'>['kind'], payload: object = {}) {
  return ctx.db.insert('liveJobs', { ownerId: account.ownerId, generation: account.generation, kind, payload: JSON.stringify(payload), state: 'queued', availableAt: Date.now(), attempts: 0 })
}

export async function queueFeed(ctx: MutationCtx, account: Account) {
  if (!account.enabled || !account.profileAccepted) return
  const queued = await ctx.db.query('liveJobs').withIndex('by_ownerId_and_generation_and_kind_and_state', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation).eq('kind', 'feed').eq('state', 'queued')).first()
  if (queued) return
  const running = account.activeJobId ? await ctx.db.get(account.activeJobId) : null
  if (running?.kind === 'feed' && running.state === 'running') return
  await enqueue(ctx, account, 'feed')
  await ctx.db.patch(account._id, { activity: 'fetching' })
}

export async function promoteEdition(ctx: MutationCtx, account: Account) {
  const ready = await ctx.db.query('livePosts').withIndex('by_ownerId_and_generation_and_state', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation).eq('state', 'ready')).order('asc').take(8)
  if (!ready.length) return false
  const posts = ready.map(post => livePostSchema.parse(JSON.parse(post.postJson)))
  const editionId = await ctx.db.insert('liveEditions', { ownerId: account.ownerId, generation: account.generation, postsJson: JSON.stringify(posts), cursor: 0 })
  for (const post of ready) await ctx.db.patch(post._id, { state: 'current' })
  await ctx.db.patch(account._id, { currentEditionId: editionId, advanceRequested: false, completedAt: undefined })
  return true
}

export async function hasActiveLike(ctx: QueryCtx | MutationCtx, account: Account, postId: string) {
  const feedback = await ctx.db.query('liveFeedback').withIndex('by_ownerId_and_generation_and_postId', q => q.eq('ownerId', account.ownerId).eq('generation', account.generation).eq('postId', postId)).order('desc').take(20)
  return feedback.some(item => item.choice === 'like' && !item.undone)
}
