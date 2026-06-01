// src/main.tsx
import { RouterProvider } from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { setAutoFreeze } from 'immer'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import React from 'react'
import ReactGA from 'react-ga4'
import { router } from '~@/router'
import 'virtual:uno.css'
import '~/assets/styles/global.scss'
import './lib/chartSetup'
import { ApplicationStateProvider } from '~/stores/application-state'

function setViewportHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}
setViewportHeight()
window.addEventListener('resize', setViewportHeight)

ReactGA.initialize('G-CJM5ZGWSKN')
OverlayScrollbars.plugin(ClickScrollPlugin)
setAutoFreeze(false)

const storedTheme = localStorage.getItem('theme')
if (storedTheme === 'dark' || !storedTheme) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

export default function App() {
  return (
    <React.StrictMode>
      <ApplicationStateProvider>
        <RouterProvider router={router} />
        <Analytics />
      </ApplicationStateProvider>
    </React.StrictMode>
  )
}
