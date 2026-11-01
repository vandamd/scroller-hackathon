import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL

if (!convexUrl || !convexSiteUrl) {
  throw new Error('Set VITE_CONVEX_URL and VITE_CONVEX_SITE_URL in .env.local')
}

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({ convexUrl, convexSiteUrl })
