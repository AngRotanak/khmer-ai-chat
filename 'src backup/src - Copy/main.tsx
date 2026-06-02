import { RouterProvider } from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { setAutoFreeze } from 'immer'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactGA from 'react-ga4'
import { router } from '~@/router'

import { ApplicationStateProvider } from '~/stores/application-state'

import 'virtual:uno.css'
import '~/assets/styles/global.scss'

function setViewportHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

setViewportHeight()
window.addEventListener('resize', setViewportHeight)


ReactGA.initialize('G-CJM5ZGWSKN')
OverlayScrollbars.plugin(ClickScrollPlugin)
setAutoFreeze(false)

// ✅ Restore dark mode preference on app load
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApplicationStateProvider>
      <RouterProvider router={router} />
      <Analytics />
    </ApplicationStateProvider>
  </React.StrictMode>,
)
