import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import Emusks from 'emusks'
import { openPrivateSession } from './lib/x-private-session.mjs'

const { values } = parseArgs({ options: {
  input: { type: 'string', default: '.local/interests/history-refreshed.json' },
  rows: { type: 'string', default: '1,2,3,4,5,6,7,8' },
} })
const rows = values.rows.split(',').map(Number)
if (rows.length !== 8 || new Set(rows).size !== 8 || rows.some(n => !Number.isInteger(n) || n < 1 || n > 40)) throw new Error('Choose eight distinct rows between 1 and 40.')
const log = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const originalConsole = { ...console }
const root = '.local/design-posts'
let assetCount = 0
async function asset(rawUrl, kind) {
  if (!rawUrl) return undefined
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:' || !['pbs.twimg.com','video.twimg.com'].includes(url.hostname)) return undefined
  if (kind === 'image' && url.pathname.startsWith('/media/')) url.searchParams.set('name','medium')
  const maxBytes = kind === 'video' ? 24_000_000 : 8_000_000
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(25_000) })
    const mime = response.headers.get('content-type')?.split(';')[0]
    const extension = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4' }[mime]
    if (!response.ok || !extension || Number(response.headers.get('content-length')) > maxBytes) return undefined
    const reader = response.body.getReader(), chunks = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > maxBytes) { await reader.cancel(); return undefined }
      chunks.push(value)
    }
    const bytes = Buffer.concat(chunks)
    const filename = `${createHash('sha256').update(bytes).digest('hex').slice(0,20)}.${extension}`
    await writeFile(`${root}/media/${filename}`,bytes,{mode:0o600})
    await chmod(`${root}/media/${filename}`,0o600)
    assetCount++
    return `/__design/media/${filename}`
  } catch { return undefined }
}
function decode(text) {
  return (text??'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
}
function httpsLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
}
async function main() {
  const history = JSON.parse(await readFile(values.input,'utf8'))
  const selected = new Map()
  const likes = history.posts.filter(p=>p.sources.includes('likes'))
  const bookmarks = history.posts.filter(p=>p.sources.includes('bookmarks'))
  for (let i=0; i<Math.max(likes.length,bookmarks.length) && selected.size<40; i++) {
    for (const post of [likes[i],bookmarks[i]]) if (post && selected.size<40) selected.set(post.id,post)
  }
  const sample = [...selected.values()]
  const ids = rows.map(n=>sample[n-1]?.id)
  if (ids.some(id=>!id)) throw new Error('not_enough_posts')
  for (const key of ['log','warn','error','info']) console[key]=()=>{}
  const client = await openPrivateSession()
  const tweets = await client.tweets.getMany(ids)
  await Emusks.close()
  await mkdir(`${root}/media`,{recursive:true,mode:0o700})
  await chmod(root,0o700)
  await chmod(`${root}/media`,0o700)
  const posts=[]
  for (const id of ids) {
    const tweet=tweets.find(t=>t.id===id)
    if (!tweet?.user?.username || tweet.tombstone || tweet.user.protected) throw new Error('post_not_publicly_available')
    const media=tweet.media??[]
    let text=decode(tweet.text)
    for (const item of media) if (item.url) text=text.replaceAll(item.url,'')
    let url,linkLabel
    for (const link of tweet.urls??[]) {
      const expanded=httpsLink(link.expanded_url??link.expandedUrl)
      if (!expanded) continue
      text=text.replaceAll(link.url,expanded)
      if (!url) { url=expanded;linkLabel=link.display_url??new URL(expanded).hostname }
    }
    const avatarUrl=await asset(tweet.user.profile_picture?.url,'image')
    const photos=[]
    let video
    for (const item of media.slice(0,4)) {
      if (item.type==='photo') {
        const src=await asset(item.media_url_https,'image')
        if (src) photos.push({src,alt:item.ext_alt_text??`Image attached to ${tweet.user.name}'s post`})
      } else if (!video && ['video','animated_gif'].includes(item.type)) {
        const variants=(item.video_info?.variants??[]).filter(v=>v.content_type==='video/mp4').sort((a,b)=>(b.bitrate??0)-(a.bitrate??0))
        let src
        for (const variant of variants) {
          src=await asset(variant.url,'video')
          if (src) break
        }
        const poster=await asset(item.media_url_https,'image')
        if (src) video={src,poster}
        else if (poster) photos.push({src:poster,alt:'Still preview of the attached video'})
      }
    }
    const quote=tweet.quoting?.user ? {name:tweet.quoting.user.name,handle:tweet.quoting.user.username,text:decode(tweet.quoting.text),originalUrl:`https://x.com/${tweet.quoting.user.username}/status/${tweet.quoting.id}`} : undefined
    posts.push({
      id:tweet.id,name:tweet.user.name,handle:tweet.user.username,
      initials:tweet.user.name.split(/\s+/).slice(0,2).map(s=>s[0]).join(''),
      time:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(tweet.created_at)),
      text:text.trim(),originalUrl:`https://x.com/${tweet.user.username}/status/${tweet.id}`,
      url,linkLabel,avatarUrl,photos,video,quote,why:'',
    })
  }
  if (posts.length!==8) throw new Error('incomplete_deck')
  await writeFile(`${root}/posts.json`,JSON.stringify({fetchedAt:new Date().toISOString(),posts},null,2),{mode:0o600})
  await chmod(`${root}/posts.json`,0o600)
  log({status:'complete',posts:posts.length,images:posts.reduce((n,p)=>n+p.photos.length,0),videos:posts.filter(p=>p.video).length,assets:assetCount,output:`${root}/posts.json`})
}
const timer=setTimeout(()=>{log({status:'timeout'});process.exit(1)},180_000)
main().catch(error=>{log({status:'failed',kind:error?.name??'Error',httpStatus:error?.status??null});process.exitCode=1})
  .finally(async()=>{clearTimeout(timer);await Emusks.close().catch(()=>{});Object.assign(console,originalConsole)})
