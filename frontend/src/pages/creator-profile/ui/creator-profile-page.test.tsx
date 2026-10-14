import { HttpResponse, delay, http } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/app/test'
import { server } from '@/shared/lib/test'
import { CreatorProfilePage } from './creator-profile-page'

const creator = {
    id: 42,
    username: 'polyglot',
    firstName: 'Test',
    lastName: 'Creator',
    nativeLanguage: 'EN',
    targetLanguage: 'ES',
    avatarUrl: null,
    uiLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}

const decks = [
    {
        id: 12,
        title: 'Spanish Core 1000',
        sourceLanguage: 'ES',
        targetLanguage: 'EN',
        owner: creator,
        cardCount: 842,
        isEnrolled: false,
    },
]

afterEach(() => server.resetHandlers())

function renderCreatorProfile(route: string) {
    return renderWithProviders(
        <Routes>
            <Route
                path="/creators/:username"
                element={<CreatorProfilePage />}
            />
        </Routes>,
        { route },
    )
}

describe('CreatorProfilePage', () => {
    it('shows profile data and only the creator public decks', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/username/polyglot', () =>
                HttpResponse.json(creator),
            ),
            http.get('http://localhost/api/v1/decks/creator/polyglot', () =>
                HttpResponse.json(decks),
            ),
        )

        renderCreatorProfile('/creators/polyglot')

        expect(
            await screen.findByRole('heading', { name: 'Test Creator' }),
        ).toBeInTheDocument()
        expect(screen.getByText('@polyglot')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Open Spanish Core 1000' }),
        ).toHaveAttribute('href', '/decks/12')
        expect(screen.getByText('842 cards')).toBeInTheDocument()
        expect(screen.queryByText('Enrolled')).not.toBeInTheDocument()
        expect(screen.queryByText(/follow/i)).not.toBeInTheDocument()
    })

    it('marks a public deck when the current user is enrolled', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/username/polyglot', () =>
                HttpResponse.json(creator),
            ),
            http.get('http://localhost/api/v1/decks/creator/polyglot', () =>
                HttpResponse.json([{ ...decks[0], isEnrolled: true }]),
            ),
        )

        renderCreatorProfile('/creators/polyglot')

        expect(await screen.findByText('Enrolled')).toBeInTheDocument()
    })

    it('shows loading feedback while profile data is requested', () => {
        server.use(
            http.get(
                'http://localhost/api/v1/users/username/polyglot',
                async () => {
                    await delay('infinite')
                    return HttpResponse.json(creator)
                },
            ),
            http.get(
                'http://localhost/api/v1/decks/creator/polyglot',
                async () => {
                    await delay('infinite')
                    return HttpResponse.json([])
                },
            ),
        )

        renderCreatorProfile('/creators/polyglot')

        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    })

    it('shows a profile error when the creator does not exist', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/username/missing', () =>
                HttpResponse.json(
                    { message: 'Creator not found' },
                    { status: 404 },
                ),
            ),
            http.get('http://localhost/api/v1/decks/creator/missing', () =>
                HttpResponse.json([]),
            ),
        )

        renderCreatorProfile('/creators/missing')

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load creator profile',
            }),
        ).toBeInTheDocument()
    })

    it('shows an empty state when the creator has no public decks', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/username/polyglot', () =>
                HttpResponse.json(creator),
            ),
            http.get('http://localhost/api/v1/decks/creator/polyglot', () =>
                HttpResponse.json([]),
            ),
        )

        renderCreatorProfile('/creators/polyglot')

        expect(
            await screen.findByRole('heading', { name: 'No public decks yet' }),
        ).toBeInTheDocument()
    })

    it('retries a failed public deck request without showing a false zero count', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/users/username/polyglot', () =>
                HttpResponse.json(creator),
            ),
            http.get('http://localhost/api/v1/decks/creator/polyglot', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Failed to load decks' },
                          { status: 500 },
                      )
                    : HttpResponse.json(decks)
            }),
        )
        const user = userEvent.setup()

        renderCreatorProfile('/creators/polyglot')

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load public decks',
            }),
        ).toBeInTheDocument()
        expect(screen.queryByText('0 decks')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('link', { name: 'Open Spanish Core 1000' }),
        ).toHaveAttribute('href', '/decks/12')
        expect(screen.getByText('1 decks')).toBeInTheDocument()
    })
})
