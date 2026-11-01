import { z } from 'zod'

export const platformSchema = z.enum(['x', 'instagram'])
export const roleSchema = z.enum(['profile', 'scout', 'editor'])
export const profileSchema = z.object({
  summary: z.string(),
  interests: z.array(z.string()),
  avoid: z.array(z.string()),
})
export const postSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  author: z.string(),
  handle: z.string(),
  text: z.string(),
  url: z.string(),
  images: z.array(z.string()),
})
export const findingSchema = z.object({
  post: postSchema,
  title: z.string(),
  why: z.string(),
  category: z.enum(['useful', 'inspiring', 'fun']),
})
export const feedbackSchema = z.enum(['more', 'less', 'seen'])
export const stateSchema = z.object({
  mode: z.enum(['sample', 'live']),
  connected: z.array(platformSchema),
  profile: profileSchema.nullable(),
  profileSource: z.string(),
  stage: z.enum(['idle', 'profiling', 'ready', 'fetching', 'scouting', 'editing', 'done', 'error']),
  activeRole: roleSchema.nullable(),
  inspected: z.number(),
  total: z.number(),
  shortlisted: z.number(),
  findings: z.array(findingSchema),
  events: z.array(z.object({ id: z.string(), role: roleSchema, text: z.string(), time: z.number() })),
  feedback: z.array(z.object({ postId: z.string(), value: feedbackSchema, text: z.string() })),
  error: z.string().nullable(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  runId: z.string().nullable(),
})

export type Platform = z.infer<typeof platformSchema>
export type Role = z.infer<typeof roleSchema>
export type Profile = z.infer<typeof profileSchema>
export type Post = z.infer<typeof postSchema>
export type Finding = z.infer<typeof findingSchema>
export type Feedback = z.infer<typeof feedbackSchema>
export type OfficeState = z.infer<typeof stateSchema>

export function initialState(): OfficeState {
  return {
    mode: 'sample', connected: [], profile: null, profileSource: '', stage: 'idle',
    activeRole: null, inspected: 0, total: 0, shortlisted: 0, findings: [], events: [],
    feedback: [], error: null, startedAt: null, finishedAt: null, runId: null,
  }
}

export const roleNames: Record<Role, string> = { profile: 'Tanner', scout: 'Felix', editor: 'Eddie' }
export const roleJobs: Record<Role, string> = { profile: 'Taste keeper', scout: 'Finder', editor: 'Editor' }
export const busyStages: OfficeState['stage'][] = ['profiling', 'fetching', 'scouting', 'editing']
