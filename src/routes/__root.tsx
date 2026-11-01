import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { authClient } from '../lib/auth-client'
import { getAuthToken } from '../lib/auth.functions'
import stylesheet from '../styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; convexQueryClient: ConvexQueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Scroller' },
      { name: 'description', content: 'Your agents scroll. You get the good bits. A small, finite edition of things you might love.' },
    ],
    links: [
      { rel: 'stylesheet', href: stylesheet },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const token = await getAuthToken()
    if (token) context.convexQueryClient.serverHttpClient?.setAuth(token)
    else context.convexQueryClient.serverHttpClient?.clearAuth()
    return { token, isAuthenticated: Boolean(token) }
  },
  component: Root,
})

function Root() {
  const { convexQueryClient, token } = Route.useRouteContext()
  return (
    <ConvexBetterAuthProvider client={convexQueryClient.convexClient} authClient={authClient} initialToken={token}>
      <html lang="en-GB">
        <head><HeadContent /></head>
        <body><Outlet /><Scripts /></body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
