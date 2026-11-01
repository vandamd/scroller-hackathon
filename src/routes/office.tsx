import { createFileRoute, redirect } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { getCurrentUser } from '../lib/auth.functions'
import { liveApi } from '../lib/live-api'
import { LiveOffice } from '../components/live-office'

export const Route = createFileRoute('/office')({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated || !await getCurrentUser()) throw redirect({ to: '/' })
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(liveApi.view, {}))
  },
  component: LiveOffice,
})
