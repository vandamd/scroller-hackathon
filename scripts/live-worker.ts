import { randomUUID, createHash } from 'node:crypto'
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { workerJobSchema, type WorkerJob } from '../src/lib/live-contract'
import { openCredentials, sealCredentials } from '../src/server/credential-box'
import { buildTasteProfile, fetchRecommendations, modelUsage } from '../src/server/taste-pipeline'
import { closeX, connectX, getXAccount, safeXError, sessionCredentials } from '../src/server/x-client'
import { z } from 'zod'

const serviceArgs = { workerSecret: process.env.WORKER_SECRET ?? '' }
const workerId = randomUUID()
const log = (value: Record<string, unknown>) => process.stdout.write(`${JSON.stringify(value)}\n`)
// The unofficial X client may log response bodies; worker logs expose safe statuses only.
console.log = console.warn = console.error = console.info = () => {}

const claim = makeFunctionReference<'action', { workerSecret: string; workerId: string }, unknown>('liveWorker:claim')
const complete = makeFunctionReference<'action', { workerSecret: string; jobId: string; lease: string; resultJson: string }, unknown>('liveWorker:complete')
const fail = makeFunctionReference<'action', { workerSecret: string; jobId: string; lease: string; message: string }, unknown>('liveWorker:fail')
const payloadSchema = z.object({ postId: z.string().optional(), seenPostIds: z.array(z.string()).optional(), feedback: z.array(z.unknown()).optional() })
let stopping = false
process.on('SIGINT', () => { stopping = true })
process.on('SIGTERM', () => { stopping = true })

export async function performJob(job: WorkerJob) {
  const client = await connectX(openCredentials(job.sealedCredentials))
  const payload = payloadSchema.parse(JSON.parse(job.payload || '{}'))
  if (job.kind === 'connect') {
    return { kind: 'connect' as const, sealedCredentials: sealCredentials(sessionCredentials(client)), account: await getXAccount(client) }
  }
  if (job.kind === 'profile') return buildTasteProfile(client)
  if (job.kind === 'feed') {
    if (!job.profile) throw new Error('Accept a taste profile before collecting a stack.')
    return fetchRecommendations(client, job.profile, job.authors, {
      ...payload, cacheScope: createHash('sha256').update(job.sealedCredentials).digest('hex'),
    })
  }
  if (!payload.postId) throw new Error('The post is unavailable.')
  const tweet = await client.tweets.get(payload.postId)
  if (!('engagement' in tweet)) throw new Error('The post is unavailable.')
  const alreadyLiked = Boolean(tweet.engagement.liked)
  if (job.kind === 'like') {
    if (!alreadyLiked) await client.tweets.like(payload.postId)
    return { kind: 'like' as const, alreadyLiked, changed: !alreadyLiked }
  }
  if (alreadyLiked) await client.tweets.unlike(payload.postId)
  return { kind: 'unlike' as const, changed: alreadyLiked }
}

async function main() {
  const url = process.env.VITE_CONVEX_URL
  if (!url || !serviceArgs.workerSecret || !process.env.X_SESSION_ENCRYPTION_KEY || !process.env.OPENAI_API_KEY) {
    throw new Error('Configure VITE_CONVEX_URL, WORKER_SECRET, X_SESSION_ENCRYPTION_KEY and OPENAI_API_KEY.')
  }
  const convex = new ConvexHttpClient(url, { logger: false })
  log({ status: 'worker_ready' })
  while (!stopping) {
    let job: WorkerJob | null = null
    try {
      const raw = await convex.action(claim, { ...serviceArgs, workerId })
      if (raw !== null) job = workerJobSchema.parse(raw)
      if (!job) { await new Promise(resolve => setTimeout(resolve, 2000)); continue }
      log({ status: 'job_started', kind: job.kind })
      const startedAt = Date.now()
      const before = modelUsage()
      try {
        const result = await performJob(job)
        await convex.action(complete, { ...serviceArgs, jobId: job.id, lease: job.lease, resultJson: JSON.stringify(result) })
        const after = modelUsage()
        log({ status: 'job_completed', kind: job.kind, elapsedMs: Date.now() - startedAt, ...(after.requests > before.requests ? {
          model: after.model, serviceTier: after.serviceTier, requests: after.requests - before.requests,
          inputTokens: after.inputTokens - before.inputTokens, cachedInputTokens: after.cachedInputTokens - before.cachedInputTokens,
          outputTokens: after.outputTokens - before.outputTokens,
        } : {}) })
      } catch (error) {
        const message = job.kind === 'connect' ? safeXError(error)
          : job.kind === 'profile' ? 'We couldn’t finish your taste scan. Please reconnect and try again.'
            : job.kind === 'feed' ? 'The next stack is taking longer than expected. We’ll try again shortly.' : 'X could not sync this choice.'
        await convex.action(fail, { ...serviceArgs, jobId: job.id, lease: job.lease, message })
        log({ status: 'job_failed', kind: job.kind })
      } finally { await closeX().catch(() => {}) }
    } catch {
      log({ status: 'worker_waiting_for_backend' })
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  await closeX().catch(() => {})
}

if (import.meta.main) main().catch(() => { log({ status: 'worker_configuration_failed' }); process.exitCode = 1 })
