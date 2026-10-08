import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useGetCurrentUserQuery } from '@/entities/user'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileBottomNavigation, MobileHeader } from './mobile-navigation'
import styles from './app-shell.module.css'

export function AppShell() {
    const location = useLocation()
    const mainRef = useRef<HTMLElement>(null)
    const previousPathname = useRef(location.pathname)

    // Keep the shared profile cache subscribed across authenticated routes.
    useGetCurrentUserQuery()

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
