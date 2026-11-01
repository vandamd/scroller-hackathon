import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { stateSchema } from '../src/lib/model'
import { authComponent } from './auth'
import { initialState } from '../src/lib/model'

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const office = await ctx.db.query('offices').withIndex('by_owner', q => q.eq('ownerId', user._id)).unique()
    return office ? stateSchema.parse(JSON.parse(office.state)) : null
  },
})

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const office = await ctx.db.query('offices').withIndex('by_owner', q => q.eq('ownerId', user._id)).unique()
    if (!office) {
      await ctx.db.insert('offices', {
        ownerId: user._id,
        state: JSON.stringify(initialState()),
        updatedAt: Date.now(),
      })
    }
  },
})

export const updateBrief = mutation({
  args: { brief: v.string() },
  handler: async (ctx, { brief }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (brief.length > 1000) throw new Error('Keep your brief to 1,000 characters')
    const office = await ctx.db.query('offices').withIndex('by_owner', q => q.eq('ownerId', user._id)).unique()
    if (!office) throw new Error('Office not found')
    const state = stateSchema.parse(JSON.parse(office.state))
    state.profile = { summary: brief.trim(), interests: state.profile?.interests ?? [], avoid: state.profile?.avoid ?? [] }
    await ctx.db.patch(office._id, { state: JSON.stringify(state), updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const office = await ctx.db.query('offices').withIndex('by_owner', q => q.eq('ownerId', user._id)).unique()
    if (office) await ctx.db.delete(office._id)
  },
})
