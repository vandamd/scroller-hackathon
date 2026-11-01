import { createServerFn } from '@tanstack/react-start'
import { makeFunctionReference } from 'convex/server'
import { xCredentialsSchema } from './live-contract'
import { fetchAuthMutation, fetchAuthQuery } from './auth-server'
import { api } from '../../convex/_generated/api'

export const connectX = createServerFn({ method: 'POST' })
  .validator((value: unknown) => xCredentialsSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await fetchAuthQuery(api.auth.getCurrentUser)
    if (!user) throw new Error('Sign in before connecting X')
    const { sealCredentials } = await import('../server/credential-box')
    const connect = makeFunctionReference<'mutation', { sealedCredentials: string }, null>('live:connect')
    await fetchAuthMutation(connect, { sealedCredentials: sealCredentials(data) })
    return { connected: true }
  })

