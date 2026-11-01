import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { xCredentialsSchema, type XCredentials } from '../lib/live-contract'
import { privateRuntimeValue } from './runtime-config'

function encryptionKey() {
  const encoded = privateRuntimeValue('X_SESSION_ENCRYPTION_KEY')
  if (!encoded) throw new Error('X connection encryption is not configured')
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) throw new Error('X connection encryption is not configured')
  return key
}

export function sealCredentials(credentials: XCredentials): string {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(xCredentialsSchema.parse(credentials)), 'utf8'), cipher.final()])
  return ['v1', nonce.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function openCredentials(sealed: string): XCredentials {
  const [version, nonce, tag, ciphertext, extra] = sealed.split('.')
  if (version !== 'v1' || !nonce || !tag || !ciphertext || extra) throw new Error('Invalid saved X connection')
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(nonce, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()])
    return xCredentialsSchema.parse(JSON.parse(plaintext.toString('utf8')))
  } catch { throw new Error('Could not open the saved X connection') }
}
