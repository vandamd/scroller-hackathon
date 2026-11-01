import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icon'
import type { SampleTweet } from './posts'
import { PostMedia } from './post-media'

function ScrollBody({ children }: { children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  useLayoutEffect(() => {
    const element = body.current!
    const update = () => {
      const top = element.scrollTop > 1
      const bottom = element.scrollHeight - element.clientHeight - element.scrollTop > 1
      setEdges(previous => previous.top === top && previous.bottom === bottom ? previous : { top, bottom })
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    for (const child of element.children) observer.observe(child)
    element.addEventListener('scroll', update, { passive: true })
    element.addEventListener('load', update, true)
    element.addEventListener('loadedmetadata', update, true)
    update()
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', update)
      element.removeEventListener('load', update, true)
      element.removeEventListener('loadedmetadata', update, true)
    }
  }, [])

  return <div ref={body} className="tweet-body" data-scroll-top={edges.top || undefined} data-scroll-bottom={edges.bottom || undefined}>{children}</div>
}

function TweetMedia({ kind, id }: { kind: NonNullable<SampleTweet['media']>; id: string }) {
  if (kind === 'database') {
    return (
      <div className="tweet-media database-media" aria-label="Illustration of a tiny in-browser database">
        <div className="media-bar">playground.ts</div>
        <code><span>import</span> {'{ PGlite }'} from '@electric-sql/pglite'<br /><br />const db = new PGlite()<br />await db.query('SELECT 1')</code>
      </div>
    )
  }

  if (kind === 'spring') {
    return (
      <div className="tweet-media spring-media">
        <svg viewBox="0 0 360 180" role="img" aria-label="A blue spring and its quiet resting position">
          <path d="M26 92h27l9-26 15 53 15-53 15 53 15-53 15 53 15-53 15 53 10-27h34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="210" y="64" width="56" height="56" rx="15" fill="currentColor" />
          <path d="M292 42v98" stroke="currentColor" strokeOpacity=".2" strokeDasharray="4 5" />
          <circle cx="238" cy="92" r="3" fill="white" />
        </svg>
      </div>
    )
  }

  if (kind === 'light') {
    return (
      <div className="tweet-media light-media">
        <svg viewBox="0 0 360 180" role="img" aria-label="An original cyanotype-style leaf print">
          <defs><pattern id={`paper-${id}`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="white" opacity=".12" /></pattern></defs>
          <path d="M178 175 185 10M182 136c-61-1-83-40-77-57 48-1 78 27 77 57Zm2-42c-50-2-64-33-60-47 42 0 61 26 60 47Zm-2 61c66-5 90-39 83-59-51-1-81 29-83 59Zm4-49c49-3 65-32 59-48-37 1-60 26-59 48Zm0-41c-34-3-46-25-42-38 29 0 42 19 42 38Z" fill="#EAF0FF" />
          <rect width="360" height="180" fill={`url(#paper-${id})`} />
        </svg>
      </div>
    )
  }

  return (
    <div className="tweet-media grid-media">
      <svg viewBox="0 0 360 180" role="img" aria-label="An original composition of four blue geometric shapes">
        <circle cx="111" cy="54" r="29" fill="currentColor" />
        <path d="M205 25h58v58h-58zM82 100h58v58H82z" fill="currentColor" />
        <path d="M205 158v-58h58a58 58 0 0 1-58 58Z" fill="currentColor" />
      </svg>
    </div>
  )
}

function QuotedTweet({ quote }: { quote: NonNullable<SampleTweet['quote']> }) {
  const content = <blockquote className="quoted-tweet">
    <div>{quote.name}<span className="tweet-meta"> @{quote.handle}</span></div>
    <p>{quote.text}</p>
  </blockquote>
  return quote.originalUrl
    ? <a className="quoted-tweet-link" href={quote.originalUrl} target="_blank" rel="noreferrer" aria-label={`Open quoted post by @${quote.handle} on X`}>{content}</a>
    : content
}

export function TweetCard({ post, active = true }: { post: SampleTweet; active?: boolean }) {
  const hasMedia = post.media || post.photos?.length || post.video
  return (
    <article className={`tweet-card${!hasMedia && !post.quote ? ' tweet-card-text' : ''}`}>
      <header className="tweet-author">
        <div className="avatar">{post.initials}{post.avatarUrl && <img src={post.avatarUrl} alt="" onError={event=>{event.currentTarget.style.display='none'}} />}</div>
        <div className="author-name"><span>{post.name}</span><span className="tweet-meta">@{post.handle} · {post.time}</span></div>
        {post.originalUrl ? <a className="tweet-original" href={post.originalUrl} target="_blank" rel="noreferrer" aria-label="Open original post on X"><Icon name="twitter" className="x-mark" width="17" height="17" /></a> : <Icon name="twitter" className="x-mark" width="17" height="17" />}
      </header>
      <ScrollBody>
        {post.text && <p>{post.text}</p>}
        {post.url && <a className="tweet-link" href={post.url} target="_blank" rel="noreferrer">{post.linkLabel}<Icon name="external" width="14" height="14" /></a>}
        {post.media && <TweetMedia kind={post.media} id={post.id} />}
        <PostMedia post={post} active={active} />
        {post.quote && <QuotedTweet quote={post.quote} />}
      </ScrollBody>
    </article>
  )
}
