import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react'
import { BrandMark } from '../../design/brand'
import { Icon, type IconName } from '../../design/icon'
import { StackCard, type Choice, type DeckMovement } from '../../design/card-stack'
import { StageTransition } from '../../design/stage-transition'
import { OfficeScene, type OfficeFeedback } from '../../design/office-scene'
import { TweetStack } from '../../design/tweet-stack'
import { createFlight, FloatingIcons, type FloatingIcon } from '../../design/floating-icons'
import { authClient } from '../lib/auth-client'
import { connectX } from '../lib/live.functions'
import { liveApi } from '../lib/live-api'
import { liveViewSchema, type LiveView, type TasteProfile } from '../lib/live-contract'
import '../../design/styles.css'
import './live-office.css'

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(localStorage.getItem('scroller-theme') === 'dark') }, [])
  function toggle() {
    setDark(previous => {
      localStorage.setItem('scroller-theme', previous ? 'light' : 'dark')
      return !previous
    })
  }
  return { dark, toggle }
}

function OnboardingHeader({ dark, onThemeChange }: { dark: boolean; onThemeChange: () => void }) {
  return <header className="onboarding-header">
    <a className="design-brand" href="/" aria-label="Scroller home"><BrandMark /><span>scroller</span></a>
    <button className="icon-button onboarding-theme" aria-label={dark ? 'Use light mode' : 'Use dark mode'} onClick={onThemeChange}><Icon name={dark ? 'sun' : 'moon'} /></button>
  </header>
}

export function LiveWelcome() {
  const { dark, toggle } = useTheme()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function connectAccount(authToken: string) {
    if (pending) return
    setPending(true)
    setError('')
    try {
      const session = await authClient.getSession()
      if (session.error) throw new Error('Couldn’t check your session')
      if (!session.data) {
        const result = await authClient.signIn.anonymous()
        if (result.error) throw new Error('Couldn’t start your session')
      }
      await connectX({ data: { mode: 'session', authToken } })
      window.location.assign('/office')
    } catch { setError('Couldn’t connect X. Check your auth_token and try again.'); setPending(false) }
  }
  return <div className="playground live-app" data-theme={dark ? 'dark' : 'light'}>
    <OnboardingHeader dark={dark} onThemeChange={toggle} />
    <main className="onboarding-main" aria-label="Connect X">
      <Connection error={error} pending={pending} onConnect={authToken => void connectAccount(authToken)} />
    </main>
  </div>
}

function Connection({ error, pending = false, onConnect }: { error: string | null; pending?: boolean; onConnect: (authToken: string) => void }) {
  const [authToken, setAuthToken] = useState('')
  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onConnect(authToken.trim())
    setAuthToken('')
  }
  return <div className="connection-cards">
    <form className="connection-card" aria-label="Connect X" aria-busy={pending} onSubmit={connect}>
      <div className="connection-heading"><Icon name="twitter" width="25" height="25" /></div>
        <label className="connection-field">auth_token<input name="auth-token" type="password" autoComplete="off" spellCheck={false} value={authToken} onChange={event => setAuthToken(event.target.value)} placeholder="Your X auth_token" required minLength={20} maxLength={500} disabled={pending} /></label>
      <button className="pill primary" type="submit" aria-label="Connect X" disabled={pending}>{pending ? 'Connecting…' : 'Connect'}<Icon name="twitter" width="18" height="18" /></button>
      {error && <p className="live-error" role="alert">{error}</p>}
    </form>
    <button className="connection-soon" disabled><span className="connection-heading"><Icon name="instagram" width="24" height="24" />Instagram</span><span>Coming soon</span></button>
    <button className="connection-soon" disabled><span className="connection-heading"><Icon name="hackerNews" width="24" height="24" />Hacker News</span><span>Coming soon</span></button>
    <button className="connection-soon" disabled><span className="connection-heading"><Icon name="reddit" width="24" height="24" />Reddit</span><span>Coming soon</span></button>
  </div>
}

function Scan({ dark, connecting, workerReady }: { dark: boolean; connecting: boolean; workerReady: boolean }) {
  const [icons, setIcons] = useState<FloatingIcon[]>([])
  const sequence = useRef(0)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion) return
    const choices: IconName[] = ['like', 'heart', 'star', 'bookmark']
    const interval = window.setInterval(() => setIcons(previous => [...previous, { id: ++sequence.current, icon: choices[Math.floor(Math.random() * choices.length)], color: 'var(--primary)', instant: false, flight: createFlight() }]), 900)
    return () => window.clearInterval(interval)
  }, [reducedMotion])
  return <section className="taste-scanning" aria-labelledby="live-scan-heading">
    <svg className="scan-illustration" viewBox="315 80 180 150" width="288" height="240" role="img" aria-label="Tanner working at his desk">
      <image href={dark ? '/tanner-loading-dark.svg' : '/tanner-loading-light.svg'} x="315" y="80" width="180" height="150" />
      <g transform="translate(340 146)" aria-hidden="true"><FloatingIcons items={icons} onComplete={id => setIcons(previous => previous.filter(icon => icon.id !== id))} /></g>
    </svg>
    <div className="onboarding-heading"><h1 id="live-scan-heading">{connecting ? 'Connecting to X.' : 'Getting to know your taste.'}</h1><p role="status">{!workerReady ? 'Waiting for your office to come online.' : connecting ? 'Signing into your account.' : 'Reading your likes and bookmarks.'}</p></div>
    <div className="scan-progress" role="progressbar" aria-label={connecting ? 'Connecting X' : 'Reading posts'}><span /></div>
  </section>
}

function ScanError({ error, pending, onRetry, onReconnect }: { error: string | null; pending: boolean; onRetry: () => void; onReconnect: () => void }) {
  return <section className="live-scan-error" aria-labelledby="live-error-heading">
    <div className="onboarding-heading"><h1 id="live-error-heading">A little snag.</h1><p role="alert">{error || 'Your office couldn’t finish setting up.'}</p></div>
    <button className="pill primary" disabled={pending} onClick={onRetry}>{pending ? 'Trying again…' : 'Try again'}</button>
    <button className="live-text-button" disabled={pending} onClick={onReconnect}>Use different X details</button>
  </section>
}

function TasteReadback({ profile, pending, stackReady, stackError, onAccept, onRetry }: { profile: TasteProfile; pending: boolean; stackReady: boolean; stackError: string | null; onAccept: () => void; onRetry: () => void }) {
  const [index, setIndex] = useState(0)
  const [settling, setSettling] = useState(false)
  const [movement, setMovement] = useState<DeckMovement>({ action: 'choose', choice: 'like', instant: true })
  const reducedMotion = useReducedMotion()
  const preferences = profile.preferences
  function move(direction: number, animate: boolean) {
    const next = index + direction
    if (next < 0 || next >= preferences.length || settling) return
    const instant = !animate || !!reducedMotion
    setMovement({ action: direction > 0 ? 'choose' : 'undo', choice: 'like', instant })
    setSettling(direction > 0 && !instant)
    setIndex(next)
  }
  return <section className="taste-readback" aria-labelledby="live-taste-heading">
    <div className="onboarding-heading"><h1 id="live-taste-heading">Your taste, so far.</h1><p>From your likes and bookmarks</p></div>
    {preferences.length ? <div className="taste-carousel" aria-roledescription="carousel" aria-label="Your taste profile" aria-busy={settling} onKeyDown={event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1, false)
    }}>
      {index > 0 && <button className="icon-button taste-previous" aria-label="Previous observation" onClick={event => move(-1, event.detail !== 0)}><Icon name="arrowLeft" /></button>}
      <div className="taste-deck"><AnimatePresence initial={false} custom={movement} onExitComplete={() => setSettling(false)}>
        {preferences.slice(index, index + 3).map((preference, depth) => <StackCard key={preference.id} depth={depth} movement={movement}>
          <article className="taste-card" aria-roledescription="slide" aria-label={`${index + depth + 1} of ${preferences.length}`}><p>{preference.description}</p><span className="taste-position">{index + depth + 1} of {preferences.length}</span></article>
        </StackCard>)}
      </AnimatePresence></div>
      {index < preferences.length - 1 && <button className="icon-button taste-next" aria-label="Next observation" onClick={event => move(1, event.detail !== 0)}><Icon name="arrowRight" /></button>}
    </div> : <div className="taste-carousel"><div className="taste-deck"><article className="taste-card"><p>Tanner needs a few more signals. He’ll learn from your choices.</p></article></div></div>}
    <button className="pill primary taste-confirm" disabled={pending || !stackReady} onClick={onAccept}>{pending ? 'Opening the office…' : !stackReady ? stackError ? 'Stack not ready yet' : 'Preparing your stack…' : preferences.length ? 'Looks like me!' : 'Continue to the office'}</button>
    {stackError && <><p className="live-error" role="alert">{stackError}</p><button className="live-text-button" disabled={pending} onClick={onRetry}>Try again</button></>}
  </section>
}

function OfficeDashboard({ view, dark, onThemeChange, onDisconnect, externalError }: { view: LiveView; dark: boolean; onThemeChange: () => void; onDisconnect: () => Promise<unknown>; externalError: string }) {
  const rate = useMutation(liveApi.rate)
  const [pending, setPending] = useState(false)
  const [settling, setSettling] = useState(false)
  const [movement, setMovement] = useState<DeckMovement>({ action: 'choose', choice: 'skip', instant: true })
  const [feedback, setFeedback] = useState<OfficeFeedback[]>([])
  const [message, setMessage] = useState('')
  const sequence = useRef(0)
  const doneHeading = useRef<HTMLHeadingElement>(null)
  const reducedMotion = useReducedMotion()
  const edition = view.edition
  const index = edition?.cursor ?? 0
  const posts = edition?.posts ?? []
  const complete = index >= posts.length
  const visible = posts.slice(index, index + 3).map(post => ({ ...post, why: '' }))
  const busy = view.activity === 'fetching'
  const preparingFirstStack = busy && !edition

  useEffect(() => { setMovement({ action: 'choose', choice: 'skip', instant: true }); setSettling(false) }, [edition?.id])
  useEffect(() => { if (complete) doneHeading.current?.focus({ preventScroll: true }) }, [complete])
  function react(choice: OfficeFeedback['choice'], instant: boolean) {
    setFeedback(previous => [...previous, { id: ++sequence.current, choice, icon: choice, instant, color: choice === 'dislike' ? 'var(--negative)' : choice === 'like' ? 'var(--primary)' : 'var(--muted)', flight: createFlight() }])
  }
  async function choose(choice: Choice, animate: boolean) {
    const post = posts[index]
    if (!post || pending || settling) return
    const instant = !animate || !!reducedMotion
    setPending(true); setMessage(''); setMovement({ action: 'choose', choice, instant }); setSettling(!instant)
    try {
      await rate({ actionId: crypto.randomUUID(), postId: post.id, choice })
      if (choice !== 'skip') react(choice, instant)
    } catch { setMessage('Couldn’t save that choice. Please try again.'); setSettling(false) }
    finally { setPending(false) }
  }
  async function signOut() {
    setPending(true)
    try {
      if (await onDisconnect() === false) throw new Error('Disconnect failed')
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign out failed')
      window.location.assign('/')
    }
    catch { setMessage('Couldn’t sign out. Please try again.'); setPending(false) }
  }

  return <>
    <aside className="design-sidebar" aria-label="Sidebar">
      <a className="sidebar-brand" href="/office" aria-label="Scroller office"><BrandMark size={27} /></a>
      <nav className="sidebar-navigation" aria-label="Main navigation"><a className="icon-button sidebar-current" href="#office" aria-label="Office" aria-current="page" title="Office"><Icon name="home" /></a></nav>
      <div className="sidebar-tools">
        <button className="icon-button" aria-label={dark ? 'Use light mode' : 'Use dark mode'} onClick={onThemeChange}><Icon name={dark ? 'sun' : 'moon'} /></button>
        <details className="live-account-menu"><summary className="icon-button" aria-label="Account options"><Icon name="more" /></summary><div className="live-account-actions"><span>@{view.account?.username}</span><button disabled={pending} onClick={() => void onDisconnect()}>Disconnect X</button><button disabled={pending} onClick={() => void signOut()}>Sign out</button></div></details>
      </div>
    </aside>
    <main id="office" className="design-main live-main">
      <div className="office-dashboard">
        <OfficeScene dark={dark} feedback={feedback} onReactionComplete={id => setFeedback(previous => previous.filter(item => item.id !== id))} />
        <section className="post-area" aria-label="Your post stack" aria-busy={pending}>
          <TweetStack key={edition?.id ?? 'waiting'} posts={visible} movement={{ ...movement, instant: movement.instant || !!reducedMotion }} onSettled={() => setSettling(false)}>
            <div className="completion-message"><div className="completion-icon"><Icon name={preparingFirstStack ? 'stack' : 'tick'} width="22" height="22" /></div><h1 ref={doneHeading} tabIndex={-1}>{preparingFirstStack ? 'Finding the good bits.' : 'All caught up.'}</h1><p>{preparingFirstStack ? 'Your office is preparing your stack.' : 'Check back later.'}</p></div>
            {preparingFirstStack && <div className="scan-progress" role="progressbar" aria-label="Finding posts"><span /></div>}
          </TweetStack>
          <div className="decision-actions" aria-hidden={complete}>{!complete && (['dislike', 'skip', 'like'] as const).map(choice => <button key={choice} className={`pill${choice === 'like' ? ' primary' : choice === 'dislike' ? ' negative' : ''}`} disabled={pending || settling} onClick={event => void choose(choice, event.detail !== 0)}><Icon name={choice} width="17" height="17" />{choice[0].toUpperCase() + choice.slice(1)}</button>)}</div>
          {(message || view.error || externalError) && <p className="live-error live-office-error" role="alert">{message || view.error || externalError}</p>}
          <span className="sr-only" role="status">{busy ? 'Felix is checking your feed.' : 'Your office is ready.'}</span>
        </section>
      </div>
    </main>
  </>
}

export function LiveOffice() {
  const { data } = useSuspenseQuery(convexQuery(liveApi.view, {}))
  const view = liveViewSchema.parse(data)
  const { dark, toggle } = useTheme()
  const acceptTaste = useMutation(liveApi.acceptTaste)
  const heartbeat = useMutation(liveApi.heartbeat)
  const openOffice = useMutation(liveApi.openOffice)
  const disconnect = useMutation(liveApi.disconnect)
  const retry = useMutation(liveApi.retry)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const main = useRef<HTMLElement>(null)
  const stage = connecting && view.stage === 'connect' ? 'scanning' : view.stage

  useEffect(() => {
    main.current?.focus({ preventScroll: true })
  }, [stage])
  useEffect(() => { if (view.stage !== 'connect') setConnecting(false) }, [view.stage])
  useEffect(() => {
    if (stage !== 'office') return
    const open = () => { if (document.visibilityState === 'visible') void openOffice({}).catch(() => {}) }
    open()
    document.addEventListener('visibilitychange', open)
    return () => document.removeEventListener('visibilitychange', open)
  }, [openOffice, stage])
  useEffect(() => {
    if (stage !== 'office') return
    const ping = () => { if (document.visibilityState === 'visible') void heartbeat({}).catch(() => {}) }
    ping()
    const timer = window.setInterval(ping, 60_000)
    document.addEventListener('visibilitychange', ping)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', ping) }
  }, [heartbeat, stage])
  async function connectAccount(authToken: string) {
    if (connecting) return
    setConnecting(true); setError('')
    try { await connectX({ data: { mode: 'session', authToken } }) }
    catch { setConnecting(false); setError('Couldn’t connect X. Check your auth_token and try again.') }
  }
  async function accept() {
    setPending(true); setError('')
    try { await acceptTaste({}) } catch { setError('Couldn’t save your taste profile. Please try again.') }
    finally { setPending(false) }
  }
  async function leaveX() {
    setPending(true); setError('')
    try { await disconnect({}); return true } catch { setError('Couldn’t disconnect X. Please try again.'); return false }
    finally { setPending(false) }
  }
  async function retryScan() {
    setPending(true); setError('')
    try { await retry({}) } catch { setError('Couldn’t restart the scan. Please try again.') }
    finally { setPending(false) }
  }

  return <MotionConfig reducedMotion="user"><div className="playground live-app" data-theme={dark ? 'dark' : 'light'} data-stage={stage} data-working={connecting || view.activity !== 'idle'}>
    <div className="stage-views"><AnimatePresence initial={false}>
      {stage === 'office' ? <StageTransition key="office" className="stage-view"><OfficeDashboard view={view} dark={dark} onThemeChange={toggle} onDisconnect={leaveX} externalError={error} /></StageTransition>
        : <StageTransition key="onboarding" className="stage-view"><OnboardingHeader dark={dark} onThemeChange={toggle} /><main ref={main} className="onboarding-main" tabIndex={-1} aria-label={stage === 'connect' ? 'Connect X' : stage === 'scanning' ? 'Reading your taste' : 'Your taste profile'}><AnimatePresence initial={false}><StageTransition key={stage} className="onboarding-stage">
          {stage === 'connect' && <Connection error={view.error} onConnect={authToken => void connectAccount(authToken)} />}
          {stage === 'scanning' && <Scan dark={dark} connecting={connecting || view.activity === 'connecting'} workerReady={view.workerHeartbeatAt !== null} />}
          {stage === 'error' && <ScanError error={view.error} pending={pending} onRetry={() => void retryScan()} onReconnect={() => void leaveX()} />}
          {stage === 'taste' && view.profile && <TasteReadback profile={view.profile} pending={pending} stackReady={view.lastCheckedAt !== null} stackError={view.error} onAccept={() => void accept()} onRetry={() => void retryScan()} />}
        </StageTransition></AnimatePresence>{error && <p className="live-error" role="alert">{error}</p>}</main></StageTransition>}
    </AnimatePresence></div>
  </div></MotionConfig>
}
