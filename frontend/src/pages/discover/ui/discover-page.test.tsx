import { HttpResponse, delay, http } from 'msw'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation, useSearchParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { PublicDeckListResponseDto } from '@/entities/deck'
import { baseApi, setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { DiscoverPage } from './discover-page'

const owner = {
    id: 42,
    username: 'polyglot',
    firstName: 'Test',
    lastName: 'Creator',
    nativeLanguage: 'en',
    targetLanguage: 'es',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}

const publicDecks: PublicDeckListResponseDto[] = [
    {
        id: 12,
        title: 'Spanish Core 1000',
        sourceLanguage: 'ES',
        targetLanguage: 'EN',
        owner,
        cardCount: 842,
        isEnrolled: true,
    },
    {
        id: 24,
        title: 'Japanese travel phrases',
        sourceLanguage: 'JA',
        targetLanguage: 'EN',
        owner: { ...owner, username: 'tokyo_vocab' },
        cardCount: 1,
        isEnrolled: false,
    },
]

const publicDeckPage = (items = publicDecks) => ({
    items,
    page: 0,
    size: 12,
    totalElements: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    hasNext: false,
})

function LocationProbe() {
    const location = useLocation()
    return <output aria-label="Current search">{location.search}</output>
}

function SearchParamControl() {
    const [, setSearchParams] = useSearchParams()
    return (
        <button type="button" onClick={() => setSearchParams({ q: 'updated' })}>
            Replace search params
        </button>
    )
}

describe('DiscoverPage', () => {
    let observerCallback: IntersectionObserverCallback

    beforeEach(() => {
        setToken('discover-token')
        vi.stubGlobal(
            'IntersectionObserver',
            class implements IntersectionObserver {
                readonly root = null
                readonly rootMargin = '0px'
                readonly scrollMargin = '0px'
                readonly thresholds = []

                constructor(callback: IntersectionObserverCallback) {
                    observerCallback = callback
                }

                disconnect() {}
                observe() {}
                takeRecords() {
                    return []
                }
                unobserve() {}
            },
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('shows a loading state while public decks are requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks', async () => {
                await delay('infinite')
                return HttpResponse.json(publicDeckPage([]))
            }),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            screen.getByRole('status', { name: 'Loading public decks' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders the DECK-03 data and links each card to public details', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer discover-token',
                )
                return HttpResponse.json(publicDeckPage())
            }),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'Spanish Core 1000',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Japanese travel phrases' }),
        ).toBeInTheDocument()
        expect(screen.getAllByText('Public')).toHaveLength(2)
        expect(screen.getAllByText('Enrolled')).toHaveLength(2)
        expect(screen.getByText('842 cards')).toBeInTheDocument()
        expect(screen.getByText('1 card')).toBeInTheDocument()
        expect(screen.getByText('@polyglot')).toBeInTheDocument()
        expect(screen.getByText('@tokyo_vocab')).toBeInTheDocument()
        expect(screen.getByLabelText('Spanish to English')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Open Spanish Core 1000' }),
        ).toHaveAttribute('href', '/decks/12')
        expect(screen.getByRole('searchbox')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /load more/i }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /bookmark/i }),
        ).not.toBeInTheDocument()
    })

    it('shows an empty state when the backend returns no public decks', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json(publicDeckPage([])),
            ),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'No public decks yet',
            }),
        ).toBeInTheDocument()
    })

    it('shows a page error and retries the request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Public decks unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(publicDeckPage())
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load public decks',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Spanish Core 1000' }),
            ).toBeInTheDocument()
        })
    })

    it('binds supported URL controls to the first-page request', async () => {
        let requestUrl: URL | undefined
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                requestUrl = new URL(request.url)
                return HttpResponse.json(publicDeckPage())
            }),
        )

        renderWithProviders(<DiscoverPage />, {
            route: '/discover?q=travel&sourceLanguage=JA&targetLanguage=EN&enrolled=false&sort=TITLE_ASC',
        })

        await screen.findByRole('heading', { name: 'Spanish Core 1000' })
        expect(requestUrl?.searchParams.get('q')).toBe('travel')
        expect(requestUrl?.searchParams.get('sourceLanguage')).toBe('JA')
        expect(requestUrl?.searchParams.get('targetLanguage')).toBe('EN')
        expect(requestUrl?.searchParams.get('enrolled')).toBe('false')
        expect(requestUrl?.searchParams.get('sort')).toBe('TITLE_ASC')
        expect(requestUrl?.searchParams.get('page')).toBe('0')
        expect(requestUrl?.searchParams.get('size')).toBe('12')
        expect(screen.getByRole('searchbox')).toHaveValue('travel')
        expect(
            screen.getByRole('combobox', { name: 'Source language' }),
        ).toHaveValue('JA')
    })

    it('reacts to an external URL search change without restoring stale input', async () => {
        const requestedQueries: Array<string | null> = []
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                requestedQueries.push(
                    new URL(request.url).searchParams.get('q'),
                )
                return HttpResponse.json(publicDeckPage())
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(
            <>
                <DiscoverPage />
                <SearchParamControl />
            </>,
            { route: '/discover?q=initial' },
        )

        await screen.findByRole('heading', { name: 'Spanish Core 1000' })
        expect(screen.getByRole('searchbox')).toHaveValue('initial')

        await user.click(
            screen.getByRole('button', { name: 'Replace search params' }),
        )

        await waitFor(() => {
            expect(screen.getByRole('searchbox')).toHaveValue('updated')
            expect(requestedQueries).toEqual(['initial', 'updated'])
        })
    })

    it('debounces search, replaces the URL value, and restarts at page zero', async () => {
        const requests: Array<{ url: URL; requestedAt: number }> = []
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                requests.push({
                    url: new URL(request.url),
                    requestedAt: performance.now(),
                })
                return HttpResponse.json(publicDeckPage())
            }),
        )
        renderWithProviders(
            <>
                <DiscoverPage />
                <LocationProbe />
            </>,
            { route: '/discover?q=old' },
        )
        await screen.findByRole('heading', { name: 'Spanish Core 1000' })

        const user = userEvent.setup()
        const search = screen.getByRole('searchbox')
        await user.clear(search)
        await user.type(search, 'travel')

        expect(requests).toHaveLength(1)
        await waitFor(() => expect(requests).toHaveLength(2))
        expect(search).toHaveFocus()
        expect(
            (requests[1]?.requestedAt ?? 0) - (requests[0]?.requestedAt ?? 0),
        ).toBeGreaterThanOrEqual(250)
        expect(requests[1]?.url.searchParams.get('q')).toBe('travel')
        expect(requests[1]?.url.searchParams.get('page')).toBe('0')
        expect(screen.getByLabelText('Current search')).toHaveTextContent(
            '?q=travel',
        )
    })

    it('applies filters immediately and starts their result set at page zero', async () => {
        const requests: URL[] = []
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                requests.push(new URL(request.url))
                return HttpResponse.json(publicDeckPage())
            }),
        )
        const user = userEvent.setup()
        renderWithProviders(<DiscoverPage />, { route: '/discover' })
        await screen.findByRole('heading', { name: 'Spanish Core 1000' })

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Target language' }),
            'RU',
        )

        await waitFor(() => expect(requests).toHaveLength(2))
        expect(requests[1]?.searchParams.get('targetLanguage')).toBe('RU')
        expect(requests[1]?.searchParams.get('page')).toBe('0')
    })

    it('appends pages once, prevents duplicate fetches, and stops at the terminal page', async () => {
        const requestedPages: number[] = []
        server.use(
            http.get('http://localhost/api/v1/decks', async ({ request }) => {
                const page = Number(
                    new URL(request.url).searchParams.get('page'),
                )
                requestedPages.push(page)
                if (page === 1) {
                    await delay(20)
                    return HttpResponse.json({
                        ...publicDeckPage([publicDecks[1]]),
                        page: 1,
                        totalElements: 2,
                        totalPages: 2,
                    })
                }
                return HttpResponse.json({
                    ...publicDeckPage([publicDecks[0]]),
                    totalElements: 2,
                    totalPages: 2,
                    hasNext: true,
                })
            }),
        )
        renderWithProviders(<DiscoverPage />, { route: '/discover' })
        await screen.findByRole('heading', { name: 'Spanish Core 1000' })

        act(() => {
            observerCallback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            )
            observerCallback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            )
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Japanese travel phrases',
            }),
        ).toBeInTheDocument()
        expect(requestedPages).toEqual([0, 1])
        expect(screen.getByText('2 of 2 decks loaded')).toBeInTheDocument()

        act(() => {
            observerCallback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            )
        })
        await waitFor(() => expect(requestedPages).toEqual([0, 1]))
    })

    it('shows no-results copy when active controls return an empty page', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json(publicDeckPage([])),
            ),
        )

        renderWithProviders(<DiscoverPage />, {
            route: '/discover?sourceLanguage=JA',
        })

        expect(
            await screen.findByRole('heading', { name: 'No matching decks' }),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Try changing your search or filters.'),
        ).toBeVisible()
    })

    it('distinguishes a next-page failure and retries that page', async () => {
        let pageOneRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                const page = Number(
                    new URL(request.url).searchParams.get('page'),
                )
                if (page === 0) {
                    return HttpResponse.json({
                        ...publicDeckPage([publicDecks[0]]),
                        totalElements: 2,
                        totalPages: 2,
                        hasNext: true,
                    })
                }
                pageOneRequests += 1
                return pageOneRequests === 1
                    ? HttpResponse.json(
                          { message: 'Next page unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json({
                          ...publicDeckPage([publicDecks[1]]),
                          page: 1,
                          totalElements: 2,
                          totalPages: 2,
                      })
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(<DiscoverPage />, { route: '/discover' })
        await screen.findByRole('heading', { name: 'Spanish Core 1000' })

        act(() => {
            observerCallback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            )
        })

        expect(
            await screen.findByText('Could not load more decks'),
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Could not refresh public decks'),
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Japanese travel phrases',
            }),
        ).toBeInTheDocument()
        expect(pageOneRequests).toBe(2)
    })

    it('distinguishes a cached refresh failure and retries the refresh', async () => {
        const requestedPages: number[] = []
        let shouldFail = false
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                requestedPages.push(
                    Number(new URL(request.url).searchParams.get('page')),
                )
                if (shouldFail) {
                    return HttpResponse.json(
                        { message: 'Refresh unavailable' },
                        { status: 500 },
                    )
                }
                return HttpResponse.json(publicDeckPage())
            }),
        )
        const user = userEvent.setup()
        const { store } = renderWithProviders(<DiscoverPage />, {
            route: '/discover',
        })
        await screen.findByRole('heading', { name: 'Spanish Core 1000' })

        shouldFail = true
        act(() => {
            store.dispatch(
                baseApi.util.invalidateTags([{ type: 'Deck', id: 'LIST' }]),
            )
        })

        expect(
            await screen.findByText('Could not refresh public decks'),
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Could not load more decks'),
        ).not.toBeInTheDocument()

        shouldFail = false
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.queryByText('Could not refresh public decks'),
            ).not.toBeInTheDocument()
        })
        expect(requestedPages).toEqual([0, 0, 0])
    })

    it('shows a retryable error instead of a blank page when refreshing an empty result fails', async () => {
        let shouldFail = false
        server.use(
            http.get('http://localhost/api/v1/decks', () => {
                if (shouldFail) {
                    return HttpResponse.json(
                        { message: 'Refresh unavailable' },
                        { status: 500 },
                    )
                }
                return HttpResponse.json(publicDeckPage([]))
            }),
        )
        const user = userEvent.setup()
        const { store } = renderWithProviders(<DiscoverPage />, {
            route: '/discover',
        })
        await screen.findByRole('heading', { name: 'No public decks yet' })

        shouldFail = true
        act(() => {
            store.dispatch(
                baseApi.util.invalidateTags([{ type: 'Deck', id: 'LIST' }]),
            )
        })

        expect(
            await screen.findByRole('heading', {
                name: 'Could not refresh public decks',
            }),
        ).toBeInTheDocument()

        shouldFail = false
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('heading', { name: 'No public decks yet' }),
        ).toBeInTheDocument()
    })
})
