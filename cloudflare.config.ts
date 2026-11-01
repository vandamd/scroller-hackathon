import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  accountId: 'bda64530093a35f153a352460ea45bd8',
  worker: {
    name: 'scroller',
    entrypoint: './.output/server/index.mjs',
    compatibilityDate: '2026-11-01',
    compatibilityFlags: ['nodejs_compat'],
    domains: ['scroller.vandamdinh.com'],
    workersDev: true,
    env: {
      ASSETS: bindings.assets(),
      NODE_ENV: bindings.text('production'),
      VITE_CONVEX_URL: bindings.text('https://cool-lyrebird-50.convex.cloud'),
      VITE_CONVEX_SITE_URL: bindings.text('https://cool-lyrebird-50.convex.site'),
      VITE_SITE_URL: bindings.text('https://scroller.vandamdinh.com'),
      X_SESSION_ENCRYPTION_KEY: bindings.secret(),
    },
    observability: { enabled: true },
  },
})
