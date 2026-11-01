import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth/minimal'
import { anonymous } from 'better-auth/plugins/anonymous'
import { v } from 'convex/values'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import authConfig from './auth.config'

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) throw new Error('SITE_URL is not configured on the Convex deployment')

  const trustedOrigins = [siteUrl, ...(process.env.ADDITIONAL_TRUSTED_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean)]
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  return betterAuth({
    baseURL: { allowedHosts: trustedOrigins.map(origin => new URL(origin).host), fallback: siteUrl },
    trustedOrigins,
    database: authComponent.adapter(ctx),
    // Keep the existing hosted frontend working until it is redeployed.
    socialProviders: clientId && clientSecret ? { google: { clientId, clientSecret } } : {},
    session: {
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    plugins: [anonymous(), convex({ authConfig, jwksRotateOnTokenGenerationError: true })],
  })
}

export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), v.object({ id: v.string(), name: v.string(), email: v.string(), image: v.union(v.string(), v.null()) })),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    return user ? { id: user._id, name: user.name, email: user.email, image: user.image ?? null } : null
  },
})
