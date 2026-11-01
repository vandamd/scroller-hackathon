import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { BrandMark } from './brand'
import { Icon, type IconName } from './icon'
import { goToStage, type DesignStage } from './stage-picker'
import { StackCard, type DeckMovement } from './card-stack'
import { StageTransition } from './stage-transition'
import { createFlight, FloatingIcons, type FloatingIcon } from './floating-icons'

const observations = [
  'Small tools you can actually use.',
  'Experiments that make you want to build.',
  'Clear explanations of clever ideas.',
  'Thoughtful interfaces and procedural art.',
  'Funny, strange things worth sharing.',
]

function TasteScan({ dark }: { dark: boolean }) {
  const [icons, setIcons] = useState<FloatingIcon[]>([])
  const sequence = useRef(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const choices: IconName[] = ['like', 'heart', 'star', 'bookmark']
    function emit() {
      const icon: FloatingIcon = {
        id: ++sequence.current,
        icon: choices[Math.floor(Math.random() * choices.length)],
        color: Math.random() > .25 ? 'var(--primary)' : 'var(--muted)',
        instant: false,
        flight: createFlight(),
      }
      setIcons(previous => [...previous, icon])
    }
    const interval = window.setInterval(emit, 900)
    return () => window.clearInterval(interval)
  }, [reducedMotion])

  return (
    <section className="taste-scanning" aria-labelledby="scan-heading">
      <svg className="scan-illustration" viewBox="315 80 180 150" width="288" height="240" role="img" aria-label="Tanner working at his desk">
        <image href={dark ? '/tanner-loading-dark.svg' : '/tanner-loading-light.svg'} x="315" y="80" width="180" height="150" />
        <g transform="translate(340 146)" aria-hidden="true" pointerEvents="none">
          <FloatingIcons items={icons} onComplete={id => setIcons(previous => previous.filter(icon => icon.id !== id))} />
        </g>
      </svg>
      <div className="onboarding-heading"><h1 id="scan-heading">Getting to know your taste.</h1><p role="status">Reading your likes and bookmarks.</p></div>
      <div className="scan-progress" role="progressbar" aria-label="Reading posts"><span /></div>
    </section>
  )
}
export function Onboarding({ stage, dark, onThemeChange, tasteIndex, onTasteIndexChange }: {
  stage: Exclude<DesignStage, 'office'>
  dark: boolean
  onThemeChange: () => void
  tasteIndex: number
  onTasteIndexChange: (index: number) => void
}) {
  const main = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const [movement, setMovement] = useState<DeckMovement>({ action: 'choose', choice: 'like', instant: true })
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    if (!document.activeElement?.closest('.stage-picker')) main.current?.focus({ preventScroll: true })
    setSettling(false)
  }, [stage])

  function moveTaste(direction: number, animate: boolean) {
    const next = tasteIndex + direction
    if (next < 0 || next >= observations.length || direction > 0 && settling) return
    const instant = !animate || !!reducedMotion
    setMovement({ action: direction > 0 ? 'choose' : 'undo', choice: 'like', instant })
    setSettling(direction > 0 && !instant)
    onTasteIndexChange(next)
  }

  return (
    <>
      <header className="onboarding-header">
        <button className="design-brand" onClick={() => goToStage('welcome')} aria-label="Scroller welcome"><BrandMark /><span>scroller</span></button>
        <button className="icon-button onboarding-theme" aria-label={dark ? 'Use light mode' : 'Use dark mode'} onClick={onThemeChange}><Icon name={dark ? 'sun' : 'moon'} /></button>
      </header>
      <main ref={main} className="onboarding-main" tabIndex={-1} aria-label={stage === 'welcome' ? 'Welcome' : stage === 'connect' ? 'Connect your account' : stage === 'scanning' ? 'Reading your taste' : 'Review your taste'}>
        <AnimatePresence initial={false}>
          <StageTransition key={stage} className="onboarding-stage">
            {stage === 'welcome' && <button className="pill primary welcome-continue" onClick={() => goToStage('connect')}><img className="google-mark" src="/google-mark.svg" width="24" height="24" alt="" aria-hidden="true" />Continue with Google</button>}

            {stage === 'connect' && (
              <div className="connection-cards">
                <section className="connection-card" aria-label="Connect X">
                  <div className="connection-heading"><Icon name="twitter" width="25" height="25" /></div>
                  <label className="connection-field">auth_token<input type="password" placeholder="Your X auth_token" autoComplete="off" spellCheck={false} /></label>
                  <button className="pill primary" aria-label="Connect X" onClick={() => goToStage('scanning')}>Connect <Icon name="twitter" width="18" height="18" /></button>
                </section>
                <button className="connection-soon" disabled><span className="connection-heading"><Icon name="instagram" width="24" height="24" />Instagram</span><span>Coming soon</span></button>
                <button className="connection-soon" disabled><span className="connection-heading"><Icon name="hackerNews" width="24" height="24" />Hacker News</span><span>Coming soon</span></button>
                <button className="connection-soon" disabled><span className="connection-heading"><Icon name="reddit" width="24" height="24" />Reddit</span><span>Coming soon</span></button>
              </div>
            )}

            {stage === 'scanning' && <TasteScan dark={dark} />}

            {stage === 'taste' && (
              <section className="taste-readback" aria-labelledby="taste-heading">
                <div className="onboarding-heading"><h1 id="taste-heading">Your taste, so far.</h1><p>From your likes and bookmarks</p></div>
                <div className="taste-carousel" aria-roledescription="carousel" aria-label="Your taste profile" aria-busy={settling} onKeyDown={event => {
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                  event.preventDefault()
                  moveTaste(event.key === 'ArrowRight' ? 1 : -1, false)
                }}>
                  {tasteIndex > 0 && <button className="icon-button taste-previous" aria-label="Previous observation" onClick={event => moveTaste(-1, event.detail !== 0)}><Icon name="arrowLeft" /></button>}
                  <div className="taste-deck">
                    <AnimatePresence initial={false} custom={movement} onExitComplete={() => setSettling(false)}>
                      {observations.slice(tasteIndex, tasteIndex + 3).map((observation, depth) => (
                        <StackCard key={tasteIndex + depth} depth={depth} movement={movement}>
                          <article className="taste-card" aria-roledescription="slide" aria-label={`${tasteIndex + depth + 1} of ${observations.length}`}>
                            <p>{observation}</p><span className="taste-position">{tasteIndex + depth + 1} of {observations.length}</span>
                          </article>
                        </StackCard>
                      ))}
                    </AnimatePresence>
                  </div>
                  {tasteIndex < observations.length - 1 && <button className="icon-button taste-next" aria-label="Next observation" onClick={event => moveTaste(1, event.detail !== 0)}><Icon name="arrowRight" /></button>}
                </div>
                <span className="sr-only" role="status" aria-live="polite">Observation {tasteIndex + 1} of {observations.length}</span>
                <button className="pill primary taste-confirm" onClick={() => goToStage('office')}>Looks like me!</button>
              </section>
            )}
          </StageTransition>
        </AnimatePresence>
      </main>
    </>
  )
}
