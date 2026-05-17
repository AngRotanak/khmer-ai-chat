import { Link } from '@tanstack/react-router'
import { Whenever } from '~@/components/generics/whenever'
import { cn } from '~@/utils/cn'
import { SocialButtonLink } from '~/modules/navigation-bar/components/social-button-link'
import { useApplicationState } from '~/stores/application-state'
import { trackSocialLinkClick } from '~/utils/ga4'
import { useEffect, useState } from 'react'
import { useAuthStore } from '~/stores/auth-store'   // ✅ import auth store

export function NavigationBarModule() {
  const [isMobileView] = useApplicationState(s => [s.view.mobile])
  const { language, setLanguage } = useApplicationState(s => ({
    language: s.settings.language,
    setLanguage: s.actions.settings.setLanguage,
  }))
  const { user } = useAuthStore()   // ✅ get current user

  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )

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
        {/* Logo + Title */}
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
              KhmerAi.Chat
            </div>
            <div className="text-xs text-light-50/60 dark:text-light-100/60 leading-none">
              By KhmerAutosoft
            </div>
          </div>
        </div>

        {/* Navigation + Controls */}
        <Whenever condition={isMobileView} not>
          <div className="flex items-center justify-end gap-x-4">
            {/* ✅ Navigation Links */}
            <nav className="flex gap-x-3 text-sm">
              <Link
                to="/dashboard/flow"
                className="text-light-200 hover:text-teal-300"
                activeProps={{ className: "underline text-teal-400" }}
                activeOptions={{ exact: true }} // ensures only exact /dashboard matches
              >
                Flow Builder
              </Link>

              <Link
                to="/dashboard/agents"
                className="text-light-200 hover:text-teal-300"
                activeProps={{ className: "underline text-teal-400" }}
              >
                Agent Dashboard
              </Link>

              {/* ✅ Show admin link only if user is admin */}
              {user?.role === "admin" && (
                <Link
                  to="/dashboard/admin/reply-helpers"
                  className="text-light-200 hover:text-teal-300"
                  activeProps={{ className: "underline text-teal-400 font-semibold" }}
                >
                  Manage Reply Helpers
                </Link>
              )}

                <Link
                to="/smart-catalog"
                className="text-light-200 hover:text-teal-300"
                activeProps={{ className: "underline text-teal-400" }}
              >
               Smart e‑Catalog
              </Link>
            </nav>
   


        {/* Social Links */}
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
        </div>

        {/* Language Selector */}
        <select
          value={language}
          onChange={e => setLanguage(e.target.value as 'en' | 'km')}
          className="rounded-md bg-dark-100/30 dark:bg-dark-900 px-2 py-1 text-sm text-light-100 dark:text-light-100 border-none outline-none"
          title="Select language"
        >
          <option value="en">English</option>
          <option value="km">ភាសាខ្មែរ</option>
        </select>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition outline-none',
            'bg-dark-100/30 dark:bg-teal-900/40',
            'hover:bg-dark-200/40 dark:hover:bg-teal-800/60',
            'active:bg-dark-300/50 dark:active:bg-teal-700/50',
            'text-dark-700 dark:text-teal-200'
          )}
        >
          <div
            className={cn(
              'size-5',
              isDark ? 'i-mynaui:sun text-teal-300' : 'i-mynaui:moon text-light-100'
            )}
          />
        </button>
      </div>
    </Whenever>
      </div >
    </div >
  )
}
