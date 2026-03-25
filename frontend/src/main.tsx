import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const REDIRECT_PARAM = '__redirect'

const initializeTheme = () => {
  if (typeof window === 'undefined') return

  const storedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme = storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : (prefersDark ? 'dark' : 'light')

  document.documentElement.setAttribute('data-theme', resolvedTheme)
  localStorage.setItem('theme', resolvedTheme)
}

const restoreRedirectedPath = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const redirectTarget = url.searchParams.get(REDIRECT_PARAM)
  if (!redirectTarget) return

  const targetUrl = new URL(redirectTarget, window.location.origin)
  window.history.replaceState({}, '', `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
}

restoreRedirectedPath()
initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
