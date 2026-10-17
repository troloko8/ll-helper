export type NavigationDestination =
    | 'learning'
    | 'created'
    | 'discover'
    | 'progress'

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
        /^\/decks\/[^/]+\/(manage|cards\/(new|bulk))$/.test(normalizedPathname)
    ) {
        return 'created'
    }

    if (
        normalizedPathname === '/discover' ||
        /^\/decks\/[^/]+$/.test(normalizedPathname)
    ) {
        return 'discover'
    }

    if (normalizedPathname === '/progress') {
        return 'progress'
    }

    return undefined
}
