import type { ReactNode } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'

export function StageTransition({ children, className }: { children: ReactNode; className: string }) {
  const present = useIsPresent()
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: reducedMotion ? 'blur(0px)' : 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      exit={{ opacity: 0, filter: reducedMotion ? 'blur(0px)' : 'blur(6px)' }}
      transition={{ duration: reducedMotion ? .12 : .24, ease: [.23, 1, .32, 1] }}
      inert={!present}
      aria-hidden={!present}
    >
      {children}
    </motion.div>
  )
}
