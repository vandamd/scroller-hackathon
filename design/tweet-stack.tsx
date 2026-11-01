import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import type { SampleTweet } from './posts'
import { TweetCard } from './tweet-card'
import { StackCard, type DeckMovement } from './card-stack'

export function TweetStack({ posts, movement, onSettled, children }: {
  posts: SampleTweet[]
  movement: DeckMovement
  onSettled: () => void
  children: ReactNode
}) {
  return (
    <div className="deck">
      <AnimatePresence initial={false} custom={movement} onExitComplete={onSettled}>
        {posts.map((post, depth) => <StackCard key={post.id} depth={depth} movement={movement}><TweetCard post={post} active={depth === 0} /></StackCard>)}
        {posts.length < 3 && (
          <StackCard key="complete" depth={posts.length} movement={movement}>
            <article className="tweet-card completion-card">{children}</article>
          </StackCard>
        )}
      </AnimatePresence>
    </div>
  )
}
