import { motion, useReducedMotion } from 'motion/react'
import { Icon, type IconName } from './icon'

export function createFlight() {
  return {
    startX: Math.random() * 10 - 5,
    startY: Math.random() * 6 - 3,
    x: -32 - Math.random() * 24,
    y: -38 - Math.random() * 18,
    rotation: Math.random() * 32 - 16,
    scale: .9 + Math.random() * .2,
    duration: 1.9 + Math.random() * .6,
  }
}

export interface FloatingIcon {
  id: number
  icon: IconName
  color: string
  instant: boolean
  flight: ReturnType<typeof createFlight>
}

export function FloatingIcons({ items, onComplete }: { items: FloatingIcon[]; onComplete: (id: number) => void }) {
  const reducedMotion = useReducedMotion()
  return items.map(item => {
    const { flight } = item
    const still = !!reducedMotion || item.instant
    return (
      <motion.g
        key={item.id}
        color={item.color}
        initial={{ opacity: 0, transform: still ? 'none' : `translate3d(${flight.startX}px, ${flight.startY}px, 0) rotate(0deg) scale(.9)` }}
        animate={{ opacity: [0, 1, 1, 0], transform: still ? 'none' : `translate3d(${flight.x}px, ${flight.y}px, 0) rotate(${flight.rotation}deg) scale(${flight.scale})` }}
        transition={{ opacity: { duration: flight.duration, times: [0, .07, .6, 1], ease: [.23, 1, .32, 1] }, transform: { duration: flight.duration, ease: 'linear' } }}
        onAnimationComplete={() => onComplete(item.id)}
      >
        {item.icon === 'undo'
          ? <svg x="-6.5" y="-6.5" width="13" height="13" viewBox="0 0 24 24"><path fill="currentColor" d="M10 3 2 10l8 7v-5h5a4 4 0 0 1 0 8h-3v3h3a7 7 0 0 0 0-14h-5Z" /></svg>
          : <Icon name={item.icon} x="-6.5" y="-6.5" width="13" height="13" fill="currentColor" />}
      </motion.g>
    )
  })
}
