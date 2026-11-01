import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth/minimal'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import authConfig from './auth.config'

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) throw new Error('SITE_URL is not configured on the Convex deployment')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    socialProviders: clientId && clientSecret ? { google: { clientId, clientSecret } } : {},
    session: {
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    plugins: [convex({ authConfig, jwksRotateOnTokenGenerationError: true })],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    return user ? { id: user._id, name: user.name, email: user.email, image: user.image ?? null } : null
  },
})
