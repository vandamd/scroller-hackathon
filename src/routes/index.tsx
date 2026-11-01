import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '../lib/auth.functions'
import { LiveWelcome } from '../components/live-office'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated && await getCurrentUser()) throw redirect({ to: '/office' })
  },
  component: Welcome,
})

function Welcome() {
  const search = Route.useSearch()
  return <LiveWelcome signInError={Boolean(search.error)} />
}
