import { StrictMode, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react'
import { Icon } from './icon'
import { OfficeScene, type OfficeFeedback } from './office-scene'
import { BrandMark } from './brand'
import { Onboarding } from './onboarding'
import { StageTransition } from './stage-transition'
import { createFlight } from './floating-icons'
import { getStage, goToStage, StagePicker, subscribeToStage } from './stage-picker'
import { sampleTweets } from './posts'
import { loadPrivateDesignPosts } from './post-source'
import { TweetStack } from './tweet-stack'
import type { Choice, DeckMovement } from './card-stack'
import './styles.css'

const choiceLabels: Record<Choice, string> = { like: 'Liked', dislike: 'Disliked', skip: 'Skipped' }

function Playground() {
  const stage = useSyncExternalStore(subscribeToStage, getStage)
  const [tweets, setTweets] = useState(sampleTweets)
  const [tasteIndex, setTasteIndex] = useState(0)
  const [decisions, setDecisions] = useState<Choice[]>([])
  const [settling, setSettling] = useState(false)
  const [movement, setMovement] = useState<DeckMovement>({ action: 'choose', choice: 'skip', instant: false })
  const [dark, setDark] = useState(false)
  const [officeFeedback, setOfficeFeedback] = useState<OfficeFeedback[]>([])
  const feedbackId = useRef(0)
  const reducedMotion = useReducedMotion()
  const doneHeading = useRef<HTMLHeadingElement>(null)
  const index = decisions.length
  const complete = index === tweets.length
  const counts = { like: decisions.filter(c => c === 'like').length, dislike: decisions.filter(c => c === 'dislike').length, skip: decisions.filter(c => c === 'skip').length }

  useEffect(() => {
    const controller=new AbortController()
    void loadPrivateDesignPosts(controller.signal).then(posts=>{
      if (!posts || controller.signal.aborted) return
      setTweets(posts)
      setDecisions([])
      setSettling(false)
      setMovement({ action:'choose',choice:'skip',instant:true })
    })
    return ()=>controller.abort()
  },[])

  useEffect(() => {
    if (complete && stage === 'office') doneHeading.current?.focus()
  }, [complete, stage])

  useEffect(() => {
    if (stage === 'office') return
    setSettling(false)
    setOfficeFeedback([])
  }, [stage])

  function reactToChoice(choice: OfficeFeedback['choice'], instant: boolean) {
    const reaction: OfficeFeedback = {
      id: ++feedbackId.current,
      choice,
      icon: choice,
      color: choice === 'dislike' ? 'var(--negative)' : choice === 'like' ? 'var(--primary)' : 'var(--muted)',
      instant,
      flight: createFlight(),
    }
    setOfficeFeedback(previous => [...previous, reaction])
  }

  function choose(choice: Choice, animate: boolean) {
    if (settling || complete) return
    const instant = !animate || !!reducedMotion
    setMovement({ action: 'choose', choice, instant })
    setSettling(!instant)
    setDecisions(previous => [...previous, choice])
    if (choice !== 'skip') reactToChoice(choice, instant)
  }

  const visible = tweets.slice(index, index + 3)

  return (
    <div className="playground" data-theme={dark ? 'dark' : 'light'} data-stage={stage}>
      <div className="stage-views">
        <AnimatePresence initial={false}>
          {stage !== 'office' ? (
            <StageTransition key="onboarding" className="stage-view">
              <Onboarding stage={stage} dark={dark} onThemeChange={() => setDark(!dark)} tasteIndex={tasteIndex} onTasteIndexChange={setTasteIndex} />
            </StageTransition>
          ) : (
            <StageTransition key="office" className="stage-view">
              <aside className="design-sidebar" aria-label="Sidebar">
                <button className="sidebar-brand" onClick={() => goToStage('connect')} aria-label="Scroller home"><BrandMark size={27} /></button>
                <nav className="sidebar-navigation" aria-label="Main navigation">
                  <a className="icon-button sidebar-current" href="#office" aria-label="Office" aria-current="page" title="Office"><Icon name="home" /></a>
                </nav>
                <div className="sidebar-tools">
                  <button className="icon-button" aria-label={dark ? 'Use light mode' : 'Use dark mode'} title={dark ? 'Use light mode' : 'Use dark mode'} onClick={() => setDark(!dark)}><Icon name={dark ? 'sun' : 'moon'} /></button>
                </div>
              </aside>
              <main id="office" className="design-main">
                <div className="office-dashboard">
                  <OfficeScene dark={dark} feedback={officeFeedback} onReactionComplete={id => setOfficeFeedback(previous => previous.filter(reaction => reaction.id !== id))} />
                  <section className="post-area" aria-label="Your post stack">
                    <TweetStack posts={visible} movement={{ ...movement, instant: movement.instant || !!reducedMotion }} onSettled={() => setSettling(false)}>
                      <div className="completion-message">
                        <div className="completion-icon"><Icon name="tick" width="22" height="22" /></div>
                        <h1 ref={doneHeading} tabIndex={-1}>All caught up.</h1>
                        <p>Check back later.</p>
                      </div>
                      <ul className="choice-totals" aria-label="Your choices">
                        {(['like', 'dislike', 'skip'] as const).map(choice => <li key={choice}><span className="choice-count">{counts[choice]}</span><span>{choiceLabels[choice]}</span></li>)}
                      </ul>
                    </TweetStack>

                    <div className="decision-actions" aria-label={complete ? undefined : 'Choose what to do with this post'} aria-hidden={complete}>
                      {!complete && (['dislike', 'skip', 'like'] as const).map(choice => <button key={choice} className={`pill${choice === 'like' ? ' primary' : choice === 'dislike' ? ' negative' : ''}`} disabled={settling} onClick={event => choose(choice, event.detail !== 0)}><Icon name={choice} width="17" height="17" />{choice.charAt(0).toUpperCase() + choice.slice(1)}</button>)}
                    </div>
                  </section>
                </div>
              </main>
            </StageTransition>
          )}
        </AnimatePresence>
      </div>
      <StagePicker stage={stage} />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><MotionConfig reducedMotion="user"><Playground /></MotionConfig></StrictMode>)
