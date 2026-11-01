import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '../lib/auth.functions'
import { LiveWelcome } from '../components/live-office'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated && await getCurrentUser()) throw redirect({ to: '/office' })
  },
  component: LiveWelcome,
})
