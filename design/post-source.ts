import { z } from 'zod'
import type { SampleTweet } from './posts'

const asset = z.string().regex(/^\/__design\/media\/[a-f0-9]{20}\.(jpg|png|webp|gif|mp4)$/)
const secureUrl = z.url().refine(value => value.startsWith('https://'))
const privateDeck = z.object({ posts: z.array(z.object({
  id:z.string(),name:z.string(),handle:z.string(),initials:z.string(),time:z.string(),text:z.string(),
  originalUrl:secureUrl,url:secureUrl.optional(),linkLabel:z.string().optional(),
  avatarUrl:asset.optional(),photos:z.array(z.object({src:asset,alt:z.string()})),
  video:z.object({src:asset,poster:asset.optional()}).optional(),
  quote:z.object({name:z.string(),handle:z.string(),text:z.string(),originalUrl:secureUrl.optional()}).optional(),why:z.string(),
})).length(8) })

export async function loadPrivateDesignPosts(signal: AbortSignal): Promise<SampleTweet[] | null> {
  if (!import.meta.env.DEV) return null
  try {
    const response=await fetch('/__design/posts',{signal,cache:'no-store'})
    if (!response.ok || response.status===204) return null
    const data:unknown=await response.json()
    const parsed=privateDeck.safeParse(data)
    return parsed.success ? parsed.data.posts : null
  } catch { return null }
}
