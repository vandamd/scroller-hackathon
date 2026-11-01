import { motion, useIsPresent, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

export type Choice = 'like' | 'dislike' | 'skip'
export interface DeckMovement {
  action: 'choose' | 'undo'
  choice: Choice
  instant: boolean
}

const easeOut = [.23, 1, .32, 1] as const
const easeInOut = [.77, 0, .175, 1] as const
const poses = [
  'translate3d(-1px, 0px, 0) rotate(-0.6deg) scale(1)',
  'translate3d(6px, -5px, 0) rotate(2.3deg) scale(0.985)',
  'translate3d(-3px, 7px, 0) rotate(-3.5deg) scale(0.97)',
]
const departures: Record<Choice, string> = {
  like: 'translate3d(115%, -5%, 0) rotate(12deg) scale(0.98)',
  dislike: 'translate3d(-115%, 5%, 0) rotate(-12deg) scale(0.98)',
  skip: 'translate3d(0, -10%, 0) rotate(-0.6deg) scale(0.94)',
}
const variants: Variants = {
  exit: (movement: DeckMovement) => ({
    opacity: 0,
    ...(movement.action === 'choose' && !movement.instant ? { transform: departures[movement.choice] } : {}),
    transition: movement.instant ? { duration: 0 } : {
      transform: { type: 'tween', duration: .42, ease: easeInOut },
      opacity: { duration: .2, delay: movement.action === 'choose' ? .22 : 0, ease: easeOut },
    },
  }),
}

export function StackCard({ depth, movement, children }: { depth: number; movement: DeckMovement; children: ReactNode }) {
  const present = useIsPresent()
  const front = depth === 0
  const returning = movement.action === 'undo' && front

  return (
    <motion.div
      className={`card-layer${front ? ' front-card' : ''}`}
      style={{ zIndex: present ? 3 - depth : front ? 10 : 0 }}
      initial={movement.instant ? false : {
        opacity: 0,
        transform: returning ? departures[movement.choice] : 'translate3d(-3px, 18px, 0) rotate(-4deg) scale(0.94)',
      }}
      animate={{ transform: poses[depth], opacity: 1 }}
      variants={variants}
      exit="exit"
      transition={movement.instant ? { duration: 0 } : {
        transform: movement.action === 'undo'
          ? { type: 'tween', duration: .42, ease: easeOut }
          : { type: 'spring', mass: 1, stiffness: 100, damping: 10, delay: .08 },
        opacity: { duration: .24, ease: easeOut },
      }}
      aria-hidden={!front || !present}
      inert={!front || !present}
    >
      {children}
    </motion.div>
  )
}

