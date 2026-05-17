import { toast } from 'sonner'

import { Switch } from '~@/components/generics/switch-case'
import { Whenever } from '~@/components/generics/whenever'
import { cn } from '~@/utils/cn'
import { useFlowValidator } from '~/modules/flow-builder/hooks/use-flow-validator'

import { SocialButtonLink } from '~/modules/navigation-bar/components/social-button-link'
import { useApplicationState } from '~/stores/application-state'
import { trackSocialLinkClick } from '~/utils/ga4'
import { useEffect, useState } from 'react'

export function NavigationBarModule() {
  const [isMobileView] = useApplicationState(s => [s.view.mobile])

  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )

  const [isValidating, validateFlow] = useFlowValidator((isValid) => {
    if (isValid) {
      toast.success('Flow is valid', {
        description: 'You can now proceed to the next step',
        dismissible: true,
      })
    } else {
      toast.error('Flow is invalid', {
        description: 'Please check if the flow is complete and has no lone nodes',
      })
    }
  })

const toggleDarkMode = () => {
    const newState = !isDark
    document.documentElement.classList.toggle('dark', newState)
    localStorage.setItem('theme', newState ? 'dark' : 'light')
    setIsDark(newState)
  }

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') setIsDark(true)
    if (stored === 'light') setIsDark(false)
  }, [])


  return (
    <div className="relative shrink-0 bg-dark-700 dark:bg-dark-950 px-1.5 py-2 text-light-100 dark:text-light-100">
      <div className="absolute inset-0">
        <div className="absolute h-full w-4/12 from-teal-900/20 to-transparent bg-gradient-to-r dark:from-teal-900/40 <md:(from-teal-900/50)" />
      </div>

      <div className="relative flex items-stretch justify-between gap-x-8">
        <div className="flex items-center py-0.5 pl-2">
          <div className="size-8 overflow-hidden rounded-lg">
            <img
              src="/logo.png"
              alt="Ang Logo"
              className="h-full w-full object-cover rounded-full"
            />
          </div>

          <div className="ml-3 h-full flex flex-col select-none justify-center gap-y-1 leading-none">
            <div className="text-sm font-medium leading-none <md:(text-xs)">
              KhmerAi.Chat - Flow Builder
            </div>
            <div className="text-xs text-light-50/60 dark:text-light-100/60 leading-none">
              By KhmerAutosoft
            </div>
          </div>
        </div>

        <Whenever condition={isMobileView} not>
          <div className="flex items-center justify-end gap-x-2">
            <button
              type="button"
              className={cn(
                'h-full flex items-center justify-center outline-none gap-x-2 border border-dark-300 dark:border-dark-600 rounded-lg bg-dark-300/50 dark:bg-dark-800 px-3 text-sm transition active:(bg-dark-400 dark:bg-dark-700) hover:(bg-dark-200 dark:bg-dark-600)',
                isValidating && 'cursor-not-allowed opacity-50 pointer-events-none',
              )}
              onClick={() => validateFlow()}
            >
              <Switch match={isValidating}>
                <Switch.Case value>
                  <div className="i-svg-spinners:180-ring size-5" />
                </Switch.Case>
                <Switch.Case value={false}>
                  <div className="i-mynaui:check-circle size-5" />
                </Switch.Case>
              </Switch>
              <span className="pr-0.5">
                {isValidating ? 'Validating Flow' : 'Validate Flow'}
              </span>
            </button>

            <div className="h-4 w-px bg-dark-300 dark:bg-dark-600" />

            <div className="flex items-stretch gap-x-0.5">
              <SocialButtonLink
                onClick={() => trackSocialLinkClick('telegram')}
                href="https://t.me/angrotanak"
              >
                <div className="i-mynaui:brand-telegram size-4.5 text-light-100 dark:text-teal-300" />
              </SocialButtonLink>

              <SocialButtonLink
                onClick={() => trackSocialLinkClick('facebook')}
                href="https://www.facebook.com/KhmerAutosoft"
              >
                <div className="i-mynaui:brand-facebook size-4.5 text-light-100 dark:text-teal-300" />
              </SocialButtonLink>

             <button
                type="button"
                onClick={toggleDarkMode}
                className={cn(
                  'h-full flex items-center justify-center outline-none gap-x-2 border border-dark-300 dark:border-dark-600 rounded-lg bg-dark-300/50 dark:bg-dark-800 px-3 text-sm transition active:(bg-dark-400 dark:bg-dark-700) hover:(bg-dark-200 dark:hover:bg-dark-600)',
                )}
              >
                <div
                  className={cn(
                    'size-5',
                    isDark ? 'i-mynaui:sun text-teal-300' : 'i-mynaui:moon text-light-100'
                  )}
                />
                <span className="pr-0.5">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

            </div>
          </div>
        </Whenever>
      </div>
    </div>
  )
}
