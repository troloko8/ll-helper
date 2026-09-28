import { Outlet } from 'react-router-dom'
import { useGetCurrentUserQuery } from '@/entities/user'
import { DesktopSidebar } from './desktop-sidebar'
import { MobileNavigation } from './mobile-navigation'
import styles from './app-shell.module.css'

export function AppShell() {
    // Keep the shared profile cache subscribed across authenticated routes.
    useGetCurrentUserQuery()

    return (
        <div className={styles.shell}>
            <DesktopSidebar />
            <MobileNavigation />
            <main className={styles.main}>
                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
