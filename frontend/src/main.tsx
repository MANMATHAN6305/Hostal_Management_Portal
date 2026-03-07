import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const REDIRECT_PARAM = '__redirect'

const restoreRedirectedPath = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const redirectTarget = url.searchParams.get(REDIRECT_PARAM)
  if (!redirectTarget) return

  const targetUrl = new URL(redirectTarget, window.location.origin)
  window.history.replaceState({}, '', `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
}

restoreRedirectedPath()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
