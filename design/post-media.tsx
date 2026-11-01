import { useEffect, useRef, useState } from 'react'
import { useIsPresent, useReducedMotion } from 'motion/react'
import { Icon } from './icon'
import type { SampleTweet } from './posts'

type Attachment = { kind: 'image'; src: string; alt: string } | { kind: 'video'; src: string; poster?: string; alt: string }

function MutedVideo({ item, active, className, controls = false }: {
  item: Extract<Attachment, { kind: 'video' }>
  active: boolean
  className: string
  controls?: boolean
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    const element = video.current
    if (!element) return
    element.muted = true
    if (active && !paused && !reducedMotion) void element.play().catch(() => {})
    else element.pause()
    return () => element.pause()
  }, [active, paused, reducedMotion])

  return (
    <>
      <video ref={video} className={className} src={item.src} poster={item.poster}
        autoPlay={active && !reducedMotion} muted loop playsInline controls={controls}
        preload={active ? 'metadata' : 'none'} aria-label={item.alt}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      {!controls && <button type="button" className="media-play-toggle" aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => {
        const element = video.current
        if (!element) return
        if (element.paused) { setPaused(false); void element.play().catch(() => {}) }
        else { setPaused(true); element.pause() }
      }}><Icon name={playing ? 'pause' : 'play'} width="16" height="16" /></button>}
    </>
  )
}

function MediaViewer({ items, index, onIndexChange, onDismiss }: {
  items: Attachment[]; index: number; onIndexChange: (index: number) => void; onDismiss: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const current = items[index]
  useEffect(() => {
    const element = dialog.current!
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog ref={dialog} className="media-viewer" aria-label="Post media viewer"
      onClose={event => { if (!event.currentTarget.open) onDismiss() }}
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close() }}
      onKeyDown={event => {
        if (event.target instanceof HTMLVideoElement) return
        if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); onIndexChange(index - 1) }
        if (event.key === 'ArrowRight' && index < items.length - 1) { event.preventDefault(); onIndexChange(index + 1) }
      }}>
      <button type="button" className="pill media-dismiss" aria-label="Dismiss media viewer" autoFocus onClick={() => dialog.current?.close()}><Icon name="arrowLeft" width="17" height="17" />Dismiss</button>
      <div className="media-viewer-content">
        {current.kind === 'image'
          ? <img key={current.src} src={current.src} alt={current.alt} />
          : <MutedVideo key={current.src} item={current} active className="media-viewer-video" controls />}
      </div>
      {index > 0 && <button type="button" className="icon-button media-viewer-previous" aria-label="Previous attachment" onClick={() => onIndexChange(index - 1)}><Icon name="arrowLeft" /></button>}
      {index < items.length - 1 && <button type="button" className="icon-button media-viewer-next" aria-label="Next attachment" onClick={() => onIndexChange(index + 1)}><Icon name="arrowRight" /></button>}
      {items.length > 1 && <span className="media-viewer-count" role="status">{index + 1} / {items.length}</span>}
    </dialog>
  )
}

export function PostMedia({ post, active }: { post: SampleTweet; active: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const present = useIsPresent()
  const items: Attachment[] = (post.photos ?? []).map(photo => ({ kind: 'image', ...photo }))
  if (post.video) items.push({ kind: 'video', ...post.video, alt: `Video attached to ${post.name}'s post` })
  const first = items[0]
  if (!first) return null
  const playing = active && present && openIndex === null

  return (
    <>
      {items.length > 1 ? (
        <div className="media-grid" data-count={items.length}>
          {items.map((item, index) => <div key={item.src} className="media-grid-item">
            {item.kind === 'image'
              ? <button type="button" className="media-preview" aria-label={`Enlarge image ${index + 1} of ${items.length}`} onClick={() => setOpenIndex(index)}><img className="media-preview-image" src={item.src} alt={item.alt} loading="lazy" /></button>
              : <><MutedVideo item={item} active={playing} className="media-preview-video" /><button type="button" className="media-video-open" aria-label={`Enlarge video ${index + 1} of ${items.length}`} onClick={() => setOpenIndex(index)} /></>}
          </div>)}
        </div>
      ) : (
        <div className="media-single">
          {first.kind === 'image'
            ? <button type="button" className="media-preview" aria-label="Enlarge image" onClick={() => setOpenIndex(0)}><img className="media-preview-image" src={first.src} alt={first.alt} loading="lazy" /></button>
            : <><MutedVideo item={first} active={playing} className="media-preview-video" /><button type="button" className="media-video-open" aria-label="Enlarge video" onClick={() => setOpenIndex(0)} /></>}
        </div>
      )}
      {openIndex !== null && <MediaViewer items={items} index={openIndex} onIndexChange={setOpenIndex} onDismiss={() => setOpenIndex(null)} />}
    </>
  )
}
