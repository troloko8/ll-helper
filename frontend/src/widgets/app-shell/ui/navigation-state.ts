export type NavigationDestination = 'learning' | 'created' | 'discover'

export function getActiveNavigationDestination(
    pathname: string,
): NavigationDestination | undefined {
    const normalizedPathname =
        pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

    if (
        /^\/learning(?:\/[^/]+)?$/.test(normalizedPathname) ||
        /^\/study\/[^/]+$/.test(normalizedPathname)
    ) {
        return 'learning'
    }

    if (
        normalizedPathname === '/created' ||
        normalizedPathname === '/decks/new' ||
        /^\/decks\/[^/]+\/(manage|cards\/new)$/.test(normalizedPathname)
    ) {
        return 'created'
    }

    if (
        normalizedPathname === '/discover' ||
        /^\/decks\/[^/]+$/.test(normalizedPathname)
    ) {
        return 'discover'
    }

    return undefined
}
