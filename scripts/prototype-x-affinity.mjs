import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import Emusks from 'emusks'
import { openPrivateSession } from './lib/x-private-session.mjs'

const { values } = parseArgs({ options: {
  history: { type: 'string' },
} })
const log = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const originalConsole = { ...console }
async function main() {
  if (!values.history) throw new Error('history_path_required')
  const history = JSON.parse(await readFile(values.history, 'utf8'))
  const posts = new Map(history.posts.map(post => [post.root_id ?? post.id, post]))
  const accounts = new Map()
  for (const post of posts.values()) {
    if (!post.author_id) continue
    let account = accounts.get(post.author_id)
    if (!account) {
      account = { userId: post.author_id, username: post.author_username ?? null, liked: new Set(), bookmarked: new Set(), posts: new Set() }
      accounts.set(post.author_id, account)
    }
    for (const source of post.sources) {
      if (source === 'likes') account.liked.add(post.id)
      if (source === 'bookmarks') account.bookmarked.add(post.id)
    }
    account.posts.add(post.id)
  }
  const ordered = [...accounts.values()].sort((a,b) => b.posts.size-a.posts.size || b.bookmarked.size-a.bookmarked.size)
  for (const key of ['log', 'warn', 'error', 'info']) console[key] = () => {}
  const client = await openPrivateSession()
  const profiles = await client.users.getMany(ordered.slice(0,20).map(account => account.userId))
  const byId = new Map(profiles.filter(p => p?.id).map(p => [p.id,p]))
  const ranking = ordered.map(account => {
    return {
      userId: account.userId, username: byId.get(account.userId)?.username ?? account.username,
      likedPosts: account.liked.size, bookmarkedPosts: account.bookmarked.size,
      distinctSavedPosts: account.posts.size,
      supportingPostIds: [...account.posts],
    }
  })
  const runDir = `.local/x-affinity/${new Date().toISOString().replace(/[:.]/g, '-')}`
  await mkdir(runDir, { recursive: true, mode: 0o700 })
  await chmod(runDir, 0o700)
  const result = {
    createdAt: new Date().toISOString(), historySource: values.history,
    dateBasis: history.dateBasis ?? 'publication_date', cutoff: history.cutoff, asOf: history.asOf,
    posts: posts.size, distinctAuthors: ranking.length,
    method: 'Rank authors by distinct liked/bookmarked source posts, then bookmarks. A post both liked and bookmarked counts once in distinctSavedPosts. Replies and mentions are not used. No sentiment inference.',
    limitations: ['Bounded retrieved history, not complete activity.', 'Counts show repeated interactions, not endorsement or friendship.', 'The publication-date window is not a like/bookmark-date window.', 'Only top 20 current usernames resolved; stable account IDs remain the grouping key.'],
    ranking,
  }
  await writeFile(`${runDir}/authors.json`, JSON.stringify(result,null,2), { mode: 0o600 })
  const table = ranking.slice(0,15).map(a => `| ${a.username ? `@${a.username}` : '(unresolved)'} | ${a.likedPosts} | ${a.bookmarkedPosts} | ${a.distinctSavedPosts} |`).join('\n')
  await writeFile(`${runDir}/REPORT.md`, `# Private frequently liked/bookmarked authors\n\n${posts.size} posts in the four-month publication-date subset, ${ranking.length} distinct authors.\n\n| Account | Liked posts | Bookmarked posts | Unique posts |\n| --- | --- | --- | --- |\n${table}\n\n${result.method}\n\n${result.limitations.map(l => `- ${l}`).join('\n')}\n\nNo model calls or OpenAI charges.\n`, { mode: 0o600 })
  log({ status: 'complete', runDir, posts: posts.size, distinctAuthors: ranking.length, repeatedAuthors: ranking.filter(a => a.distinctSavedPosts>=2).length })
}
const timer = setTimeout(() => { log({ status: 'timeout' }); process.exit(1) },90_000)
main().catch(error => { log({ status:'failed', kind:error?.name??'Error', httpStatus:error?.status??null });process.exitCode=1 })
  .finally(async () => { clearTimeout(timer);await Emusks.close().catch(()=>{});Object.assign(console,originalConsole) })
