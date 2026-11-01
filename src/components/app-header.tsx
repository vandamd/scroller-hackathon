import { Link } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { useEffect, useState } from 'react'

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Scroller home">
      <svg aria-hidden="true" width="25" height="25" viewBox="0 0 32 32" fill="currentColor">
        <rect x="11" y="4" width="16" height="6" rx="2" />
        <rect x="5" y="13" width="16" height="6" rx="2" />
        <rect x="11" y="22" width="16" height="6" rx="2" />
      </svg>
      <span>scroller</span>
    </Link>
  )
}

export function AppHeader({ signedIn = false, centred = false }: { signedIn?: boolean; centred?: boolean }) {
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('scroller-theme') === 'dark'
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    setDark(isDark)
  }, [])

  async function signOut() {
    setError(false)
    setPending(true)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign out failed')
      window.location.assign('/')
    } catch {
      setError(true)
      setPending(false)
    }
  }

  return (
    <header className={`app-header${centred ? ' app-header-centred' : ''}`}>
      <Brand />
      <div className="header-actions">
        {signedIn && (
          <>
            {error && <span role="alert">Couldn’t sign out. Try again.</span>}
            <button className="text-button" onClick={signOut} disabled={pending}>{pending ? 'Signing out…' : 'Sign out'}</button>
          </>
        )}
      </div>
    </header>
  )
}
