import { NavLink, Outlet } from 'react-router-dom'
import styles from './app-shell.module.css'

function BrandMark() {
    return (
        <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M240-80v-172q-57-52-88.5-121.5T120-520q0-150 105-255t255-105q125 0 221.5 73.5T827-615l52 205q5 19-7 34.5T840-360h-80v120q0 33-23.5 56.5T680-160h-80v80h-80v-160h160v-200h108l-38-155q-23-91-98-148t-172-57q-116 0-198 81t-82 197q0 60 24.5 114t69.5 96l26 24v208h-80Zm200-280h80l6-50q8-3 14.5-7t11.5-9l46 20 40-68-40-30q2-8 2-16t-2-16l40-30-40-68-46 20q-5-5-11.5-9t-14.5-7l-6-50h-80l-6 50q-8 3-14.5 7t-11.5 9l-46-20-40 68 40 30q-2 8-2 16t2 16l-40 30 40 68 46-20q5 5 11.5 9t14.5 7l6 50Zm40-100q-25 0-42.5-17.5T420-520q0-25 17.5-42.5T480-580q25 0 42.5 17.5T540-520q0 25-17.5 42.5T480-460Z" />
        </svg>
    )
}

function LearningIcon() {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 4.75A2.75 2.75 0 0 1 6.75 2H11v17H6.75A2.75 2.75 0 0 0 4 21.75v-17Zm16 0A2.75 2.75 0 0 0 17.25 2H13v17h4.25A2.75 2.75 0 0 1 20 21.75v-17Z" />
        </svg>
    )
}

function Brand() {
    return (
        <div className={styles.brand} aria-label="LLHelper">
            <span className={styles.brandMark}>
                <BrandMark />
            </span>
            <span className={styles.wordmark}>LLHelper</span>
        </div>
    )
}

function LearningLink({ mobile = false }: { mobile?: boolean }) {
    return (
        <NavLink
            className={({ isActive }) =>
                [
                    styles.navLink,
                    mobile && styles.mobileNavLink,
                    isActive && styles.active,
                ]
                    .filter(Boolean)
                    .join(' ')
            }
            to="/learning"
        >
            <span className={styles.navIcon}>
                <LearningIcon />
            </span>
            <span>Learning</span>
        </NavLink>
    )
}

function DesktopSidebar() {
    return (
        <aside className={styles.sidebar} aria-label="Application sidebar">
            <Brand />
            <nav
                className={styles.desktopNavigation}
                aria-label="Primary navigation"
            >
                <p className={styles.navGroupLabel}>My Decks</p>
                <LearningLink />
            </nav>
        </aside>
    )
}

function MobileHeader() {
    return (
        <header className={styles.mobileHeader}>
            <Brand />
        </header>
    )
}

function MobileBottomNavigation() {
    return (
        <nav className={styles.mobileNavigation} aria-label="Mobile navigation">
            <LearningLink mobile />
        </nav>
    )
}

export function AppShell() {
    return (
        <div className={styles.shell}>
            <DesktopSidebar />
            <MobileHeader />
            <main className={styles.main}>
                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
            <MobileBottomNavigation />
        </div>
    )
}
