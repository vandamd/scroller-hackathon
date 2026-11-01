import { readFileSync } from 'node:fs'

export function privateRuntimeValue(name: string): string | undefined {
  if (process.env[name]) return process.env[name]
  if (process.env.NODE_ENV === 'production') return undefined
  try {
    const text = readFileSync('.env.local', 'utf8')
    const value = text.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim()
    return value?.replace(/^(['"])(.*)\1$/, '$2')
  } catch { return undefined }
}
