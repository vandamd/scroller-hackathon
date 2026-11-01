import { makeFunctionReference } from 'convex/server'
import type { LiveView } from './live-contract'

export const liveApi = {
  view: makeFunctionReference<'query', Record<string, never>, LiveView>('live:view'),
  acceptTaste: makeFunctionReference<'mutation', Record<string, never>, null>('live:acceptTaste'),
  heartbeat: makeFunctionReference<'mutation', Record<string, never>, null>('live:heartbeat'),
  openOffice: makeFunctionReference<'mutation', Record<string, never>, null>('live:openOffice'),
  rate: makeFunctionReference<'mutation', { actionId: string; postId: string; choice: 'like' | 'dislike' | 'skip' }, null>('live:rate'),
  undo: makeFunctionReference<'mutation', Record<string, never>, null>('live:undo'),
  disconnect: makeFunctionReference<'mutation', Record<string, never>, null>('live:disconnect'),
  retry: makeFunctionReference<'mutation', Record<string, never>, null>('live:retry'),
}
