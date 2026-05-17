// import { Outlet } from '@tanstack/react-router'
// import { lazy, Suspense, useEffect } from 'react'
// import { useMedia } from 'react-use'
// import { isProduction } from 'std-env'

// import { Whenever } from '~@/components/generics/whenever'
// import { useApplicationState } from '~/stores/application-state'
// import { createRootRoute } from '@tanstack/react-router'

// const TanStackRouterDevtools = import.meta.env.PROD ? () => null : lazy(() => import('@tanstack/router-devtools').then(res => ({ default: res.TanStackRouterDevtools })))


// export const Route = createRootRoute({
//   component: RootLayout,
//   errorComponent: () => <div>Something went wrong.</div>,
// })

// function RootLayout() {
//   const [setMobileView] = useApplicationState(s => [s.actions.view.setMobileView])

//   const isMobile = useMedia('(max-width: 580px)')
//   useEffect(() => {
//     setMobileView(isMobile)
//   }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

//   return (
//     <>
//       <Outlet />

//       <Whenever condition={isProduction}>
//         <Suspense>
//           <TanStackRouterDevtools />
//         </Suspense>
//       </Whenever>
//     </>
//   )
// }

import { Outlet } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { useMedia } from 'react-use'
import { isProduction } from 'std-env'

import { Whenever } from '~@/components/generics/whenever'
import { useApplicationState } from '~/stores/application-state'
import { createRootRoute } from '@tanstack/react-router'
import { useLoadGoogleMaps } from '~/lib/useLoadGoogleMaps'

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/router-devtools').then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    )

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: () => <div>Something went wrong.</div>,
})

function RootLayout() {
  const [setMobileView] = useApplicationState(s => [s.actions.view.setMobileView])
  const isMobile = useMedia('(max-width: 580px)')
  useEffect(() => {
    setMobileView(isMobile)
  }, [isMobile])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
  const mapsLoaded = useLoadGoogleMaps(apiKey!)

  if (!mapsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading Google Maps…</p>
      </div>
    )
  }

return (
    <>
      <Outlet />   {/* ✅ This will render $tracking_id.tsx when you visit /track/:tracking_id */}
      <Whenever condition={isProduction}>
        <Suspense>
          <TanStackRouterDevtools />
        </Suspense>
      </Whenever>
    </>
  )
}
