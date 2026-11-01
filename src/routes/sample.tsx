import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { AppHeader } from '../components/app-header'
import { OfficeIllustration } from '../components/office-illustration'
import { samplePosts, sampleProfile } from '../lib/sample'

export const Route = createFileRoute('/sample')({ component: SampleOffice })

const finds = [samplePosts[2], samplePosts[0], samplePosts[9], samplePosts[1], samplePosts[3]]

function SampleOffice() {
  const [index, setIndex] = useState(0)
  const post = finds[index]

  return (
    <>
      <AppHeader />
      <main className="office-layout">
        <section className="office-stage">
          <div className="eyebrow">SAMPLE OFFICE · ILLUSTRATIVE FINDS</div>
          <h1>A good day to be offline.</h1>
          <p className="intro">Meet your little team of professional internet lurkers.</p>
          <OfficeIllustration />
          <p className="small-copy">{sampleProfile.summary}</p>
        </section>
        <aside className="office-sidebar sample-sidebar">
          <div className="stack-heading"><h2>The good bits</h2><span>{index + 1} / {finds.length}</span></div>
          <p>Example posts to show how an edition could feel. This office isn’t connected to a social account.</p>
          <article className="sample-card">
            <div className="eyebrow">EXAMPLE POST</div>
            <h3>{post.text.split('\n')[0]}</h3>
            <p>{post.text.split('\n\n')[1]}</p>
            <a href={post.url} target="_blank" rel="noreferrer">Visit the original resource ↗</a>
          </article>
          <div className="sample-navigation"><button className="text-button" onClick={() => setIndex(index - 1)} disabled={index === 0}>← Previous</button><button className="text-button" onClick={() => setIndex(index + 1)} disabled={index === finds.length - 1}>Next →</button></div>
          <Link to="/" className="sample-link">Start your own office ↗</Link>
        </aside>
      </main>
    </>
  )
}
