import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { isCurrentUserStale, useGetCurrentUserQuery } from '@/entities/user'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileBottomNavigation, MobileHeader } from './mobile-navigation'
import styles from './app-shell.module.css'

export function AppShell() {
    const location = useLocation()
    const mainRef = useRef<HTMLElement>(null)
    const previousPathname = useRef(location.pathname)
    const isCurrentUserRevalidationPending = useRef(false)

    const { fulfilledTimeStamp, refetch } = useGetCurrentUserQuery()

    useEffect(() => {
        const refetchStaleCurrentUser = () => {
            if (
                !isCurrentUserRevalidationPending.current &&
                document.visibilityState === 'visible' &&
                isCurrentUserStale(fulfilledTimeStamp)
            ) {
                isCurrentUserRevalidationPending.current = true

                void refetch().finally(() => {
                    isCurrentUserRevalidationPending.current = false
                })
            }
        }

        window.addEventListener('focus', refetchStaleCurrentUser)
        document.addEventListener('visibilitychange', refetchStaleCurrentUser)

        return () => {
            window.removeEventListener('focus', refetchStaleCurrentUser)
            document.removeEventListener(
                'visibilitychange',
                refetchStaleCurrentUser,
            )
        }
    }, [fulfilledTimeStamp, refetch])

    useEffect(() => {
        if (previousPathname.current === location.pathname) {
            return
        }

        previousPathname.current = location.pathname
        mainRef.current?.focus()
    }, [location.pathname])

    return (
        <div className={styles.shell}>
            <a className={styles.skipLink} href="#main-content">
                Skip to main content
            </a>
            <DesktopSidebar />
            <MobileHeader />
            <main
                id="main-content"
                className={styles.main}
                ref={mainRef}
                tabIndex={-1}
            >
                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
            <MobileBottomNavigation />
        </div>
    )
}
