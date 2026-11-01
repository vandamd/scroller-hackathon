import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()
crons.interval('prepare due X feeds', { minutes: 1 }, internal.liveWorker.queueDue, {})
export default crons
