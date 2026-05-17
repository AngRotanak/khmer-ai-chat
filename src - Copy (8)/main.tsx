import { RouterProvider } from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { setAutoFreeze } from 'immer'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactGA from 'react-ga4'
import { router } from '~@/router'
import 'virtual:uno.css'; // ✅ UnoCSS runtime styles
import '~/assets/styles/global.scss'; // ✅ Your custom SCSS
import './lib/chartSetup'  // ensures ChartJS.register runs before any charts


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

// ✅ Default to dark mode unless user explicitly chose light
const storedTheme = localStorage.getItem('theme')
if (storedTheme === 'dark' || !storedTheme) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApplicationStateProvider>
      <RouterProvider router={router} />
      <Analytics />
    </ApplicationStateProvider>
  </React.StrictMode>,
)
