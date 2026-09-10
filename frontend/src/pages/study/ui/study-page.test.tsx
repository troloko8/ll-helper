import { Route, Routes } from 'react-router-dom'
import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type {
    CardReviewResponseDto,
    DeckCardResponseDto,
    LearningDeckResponseDto,
} from '@/entities/learning'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { StudyPage } from './study-page'

const learningDeck: LearningDeckResponseDto = {
    deckId: 12,
    title: 'English B1 Vocabulary',
    sourceLanguage: 'EN',
    targetLanguage: 'RU',
    enrolledAt: '2026-09-01T10:00:00Z',
    lastStudiedAt: null,
    progress: { masteredCount: 0, totalCount: 2 },
}

const cards: DeckCardResponseDto[] = [
    {
        id: 7,
        title: 'blueprint',
        definition: 'A detailed plan or outline used to guide a project.',
        translation: 'чертёж',
        synonyms: ['plan', 'outline'],
        examples: ['The architect presented the blueprint for the building.'],
        progress: {
            status: 'NEW',
            timesSeen: 0,
            timesCorrect: 0,
            timesWrong: 0,
            correctStreak: 0,
        },
    },
    {
        id: 8,
        title: 'fleeting',
        definition: 'Lasting for a very short time.',
        translation: 'мимолётный',
        synonyms: null,
        examples: null,
        progress: {
            status: 'REVIEWING',
            timesSeen: 2,
            timesCorrect: 2,
            timesWrong: 0,
            correctStreak: 2,
        },
    },
]

function renderStudy(route = '/study/12') {
    return renderWithProviders(
        <Routes>
            <Route path="/study/:deckId" element={<StudyPage />} />
        </Routes>,
        { route },
    )
}

describe('StudyPage', () => {
    beforeEach(() => {
        setToken('study-token')
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([learningDeck]),
            ),
        )
    })

    it('shows the canonical loading state', () => {
        server.use(
            http.get(
                'http://localhost/api/v1/decks/12/study/cards',
                async () => {
                    await delay('infinite')
                    return HttpResponse.json([])
                },
            ),
        )

        renderStudy()

        expect(
            screen.getByRole('status', { name: 'Loading study session' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('shows all caught up for an empty backend queue', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12/study/cards', () =>
                HttpResponse.json([]),
            ),
        )

        renderStudy()

        expect(
            await screen.findByRole('heading', {
                name: "You're all caught up",
            }),
        ).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'View deck' })).toHaveAttribute(
            'href',
            '/learning/12',
        )
    })

    it('renders a definition prompt without revealing the answer in context', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12/study/cards', () =>
                HttpResponse.json(cards),
            ),
        )

        renderStudy()

        expect(
            await screen.findByRole('heading', {
                name: 'A detailed plan or outline used to guide a project.',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                /The architect presented the ______ for the building/,
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('progressbar', { name: 'Study session progress' }),
        ).toHaveAttribute('aria-valuenow', '1')
    })

    it('uses backend correctness, advances cards, and summarizes the session', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12/study/cards', () =>
                HttpResponse.json(cards),
            ),
            http.post(
                'http://localhost/api/v1/cards/:cardId/review',
                async ({ params, request }) => {
                    const { userAnswer } = (await request.json()) as {
                        userAnswer: string
                    }
                    const correct = params.cardId === '7'
                    const response: CardReviewResponseDto = {
                        correct,
                        correctAnswer:
                            params.cardId === '7' ? 'blueprint' : 'fleeting',
                        status: correct ? 'LEARNING' : 'REVIEWING',
                        correctStreak: correct ? 1 : 0,
                        totalCorrect: correct ? 1 : 2,
                    }
                    expect(userAnswer).toBe(
                        params.cardId === '7' ? 'something else' : 'fleeting',
                    )
                    return HttpResponse.json(response)
                },
            ),
        )
        const user = userEvent.setup()
        renderStudy()

        await screen.findByRole('heading', {
            name: 'A detailed plan or outline used to guide a project.',
        })
        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'something else',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByRole('heading', { name: 'Correct' }),
        ).toBeInTheDocument()
        expect(screen.getByText('blueprint')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Next card' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Lasting for a very short time.',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('progressbar', { name: 'Study session progress' }),
        ).toHaveAttribute('aria-valuenow', '2')

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'fleeting',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByRole('heading', { name: 'Incorrect' }),
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Finish session' }))

        expect(
            screen.getByRole('heading', { name: 'Session complete' }),
        ).toBeInTheDocument()
        const summary = screen.getByRole('heading', {
            name: 'Session complete',
        }).parentElement
        expect(summary).toHaveTextContent('Reviewed2')
        expect(summary).toHaveTextContent('Correct1')
        expect(summary).toHaveTextContent('Incorrect1')
        expect(summary).toHaveTextContent('50% accuracy')
    })

    it('shows a load error and retries the study queue', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12/study/cards', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Not enrolled' },
                          { status: 409 },
                      )
                    : HttpResponse.json(cards)
            }),
        )
        const user = userEvent.setup()
        renderStudy()

        expect(
            await screen.findByText('Unable to start study session'),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.getByRole('textbox', { name: 'Your answer' }),
            ).toBeInTheDocument()
        })
    })
})
