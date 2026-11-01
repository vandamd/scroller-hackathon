import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { boxCorners, fitProjection, iso, sideMatrix } from '../src/components/iso/iso-kit'
import officeArt from '../src/components/iso/office-art.svg?raw'
import { FloatingIcons, type FloatingIcon } from './floating-icons'
import type { Choice } from './card-stack'

export interface OfficeFeedback extends FloatingIcon {
  choice: Exclude<Choice, 'skip'> | 'undo'
}

const reactions = {
  like: { message: 'More like that.', poses: ['rotate(0deg)', 'translateY(1px) rotate(-4deg)', 'rotate(0deg)'] },
  dislike: { message: 'Less of that.', poses: ['rotate(0deg)', 'rotate(-3deg)', 'rotate(3deg)', 'rotate(0deg)'] },
  undo: { message: 'Scratch that.', poses: ['rotate(0deg)', 'rotate(-2deg)', 'rotate(0deg)'] },
}

const projection = fitProjection(boxCorners({ x: 0, y: 0, w: 420, d: 300, r: 4 }, -12, 115), 900, 470, { pad: 24, elevation: 34, azimuth: 48 })
const screens = [
  { id: 'taste', x: 35, y: 29, active: false, duration: 14, delay: -3 },
  { id: 'scout', x: 229, y: 29, active: true, duration: 10, delay: -1 },
  { id: 'editor', x: 154, y: 165, active: false, duration: 16, delay: -7 },
]
const tasteHead = iso([66, 103, 63], projection)

export function OfficeScene({ dark, feedback, onReactionComplete }: {
  dark: boolean
  feedback: OfficeFeedback[]
  onReactionComplete: (id: number) => void
}) {
  const artwork = useRef<SVGGElement>(null)
  const lastHeadReaction = useRef(0)
  const reducedMotion = useReducedMotion()
  const latestFeedback = feedback.at(-1)

  useEffect(() => {
    if (!latestFeedback || latestFeedback.id <= lastHeadReaction.current) return
    lastHeadReaction.current = latestFeedback.id
    if (latestFeedback.instant || reducedMotion) return
    const head = artwork.current?.querySelector<SVGGElement>('.office-taste-head')
    const animation = head?.animate(
      reactions[latestFeedback.choice].poses.map(transform => ({ transform })),
      { duration: 560, easing: 'cubic-bezier(.77, 0, .175, 1)', composite: 'add' },
    )
    return () => animation?.cancel()
  }, [latestFeedback, reducedMotion])

  return (
    <section className="office-scene" aria-label="Your office">
      <div className="sr-only" role="log" aria-live="polite" aria-relevant="additions">
        {feedback.map(reaction => <div key={reaction.id}>Tanner: {reactions[reaction.choice].message}</div>)}
      </div>
      <svg className="office-art iso" data-theme={dark ? 'dark' : 'light'} viewBox="170 87 560 360" role="img" aria-label="Tanner the taste keeper, Felix the finder and Eddie the editor working at their desks">
        <g ref={artwork} aria-hidden="true" dangerouslySetInnerHTML={{ __html: officeArt }} />
        {screens.map(screen => (
          <g key={screen.id} transform={sideMatrix([screen.x + 18, screen.y + 18], 88, projection, 'left')} aria-hidden="true">
            <rect x="3" y="3" width="43" height="25" rx="1.2" fill={screen.active ? '#2457F5' : '#343941'} />
            <path d="M5 5h13M39 5h4" stroke={screen.active ? '#DCE5FF' : '#C2C8D1'} strokeWidth=".8" strokeLinecap="round" />
            <svg x="4" y="7" width="41" height="20" viewBox="0 0 41 20" overflow="hidden">
              <g className="feed-track" style={{ animationDuration: `${screen.duration}s`, animationDelay: `${screen.delay}s` }} fill={screen.active ? '#E1E8FF' : '#C2C8D1'}>
                {Array.from({ length: 8 }, (_, row) => (
                  <g key={row} transform={`translate(0 ${row * 18})`}>
                    <circle cx="3" cy="4" r="1.6" />
                    <rect x="7" y="2.5" width={10 + row % 4 * 3} height="1.4" rx=".7" />
                    <rect x="7" y="6" width={27 - row % 4 * 3} height="1" rx=".5" opacity=".7" />
                    <rect x="7" y="8.5" width={18 + row % 4 % 3 * 3} height="1" rx=".5" opacity=".5" />
                    <rect x="7" y="12" width={row % 2 ? 19 : 27} height="3" rx=".7" opacity=".2" />
                  </g>
                ))}
              </g>
            </svg>
          </g>
        ))}
        <g transform={`translate(${tasteHead[0] - 27} ${tasteHead[1] + 2})`} aria-hidden="true" pointerEvents="none">
          <FloatingIcons items={feedback} onComplete={onReactionComplete} />
        </g>
      </svg>
    </section>
  )
}
