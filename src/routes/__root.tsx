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
// import { useLoadGoogleMaps } from '~/lib/useLoadGoogleMaps'

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

  // const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
  // const mapsLoaded = useLoadGoogleMaps(apiKey!)

  return (
    <>
      <Outlet />

      {/* {!mapsLoaded && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="animate-spin h-5 w-5 text-teal-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Loading Google Maps…
          </div>
        </div>
      )} */}

      <Whenever condition={isProduction}>
        <Suspense>
          <TanStackRouterDevtools />
        </Suspense>
      </Whenever>
    </>
  )
}
