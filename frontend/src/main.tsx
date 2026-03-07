import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const migrateToHashRouteIfNeeded = () => {
  if (typeof window === 'undefined') return

  const { origin, pathname, search, hash } = window.location
  const hasAppHashRoute = hash.startsWith('#/')

  // If user opens a non-hash route directly, convert it to hash-based routing.
  if (!hasAppHashRoute && pathname !== '/') {
    window.location.replace(`${origin}/#${pathname}${search}`)
  }
}

migrateToHashRouteIfNeeded()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
