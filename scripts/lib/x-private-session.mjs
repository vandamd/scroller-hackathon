import { readFile } from 'node:fs/promises'
import Emusks from 'emusks'

function cookies(text) {
  const strings = [text], direct = {}
  function visit(value) {
    if (typeof value === 'string') strings.push(value)
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (/^(auth_token|ct0)$/i.test(key) && typeof child === 'string') direct[key.toLowerCase()] = child
      visit(child)
    }
  }
  try { visit(JSON.parse(text)) } catch {}
  const all = strings.join('; ')
  return {
    token: direct.auth_token ?? all.match(/(?:^|[;\s])auth_token\s*[=:]\s*["']?([^;"'\s]+)/i)?.[1],
    csrf: direct.ct0 ?? all.match(/(?:^|[;\s])ct0\s*[=:]\s*["']?([^;"'\s]+)/i)?.[1],
  }
}

export async function openPrivateSession() {
  if (!process.env.X_SESSION_FILE) throw new Error('session_file_missing')
  const session = cookies(await readFile(process.env.X_SESSION_FILE, 'utf8'))
  if (process.env.X_AUTH_TOKEN_FILE) {
    const text = (await readFile(process.env.X_AUTH_TOKEN_FILE, 'utf8')).trim()
    session.token = cookies(text).token ?? text.replace(/^["'`]|["'`]$/g, '')
  }
  if (!session.token) throw new Error('token_missing')
  const client = new Emusks()
  if (session.csrf) {
    const { default: clients } = await import(new URL('./clients.js', import.meta.resolve('emusks')).href)
    const profile = clients.web, fingerprints = { ...profile.fingerprints }
    fingerprints.userAgent ??= fingerprints['user-agent']
    client.auth = { auth_token: session.token, csrfToken: session.csrf,
      client: { ...profile, userAgent: fingerprints.userAgent, fingerprints,
        headers: { cookie: `auth_token=${session.token}; ct0=${session.csrf};` } } }
  } else await client.login(session.token)
  return client
}
