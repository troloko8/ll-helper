import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { CardReviewResponseDto } from '@/entities/learning'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { ReviewCardForm } from './review-card-form'

const reviewResponse: CardReviewResponseDto = {
    correct: true,
    correctAnswer: 'blueprint',
    status: 'LEARNING',
    correctStreak: 1,
    totalCorrect: 1,
}

describe('ReviewCardForm', () => {
    beforeEach(() => {
        setToken('study-token')
    })

    it('requires a non-empty answer', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <ReviewCardForm cardId={7} deckId={12} onReviewed={vi.fn()} />,
        )

        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByText('Enter an answer before checking it'),
        ).toBeInTheDocument()
    })

    it('submits the answer and returns only the backend result', async () => {
        const onReviewed = vi.fn()
        server.use(
            http.post(
                'http://localhost/api/v1/cards/7/review',
                async ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer study-token',
                    )
                    expect(await request.json()).toEqual({
                        userAnswer: 'blueprint',
                    })
                    return HttpResponse.json(reviewResponse)
                },
            ),
        )
        const user = userEvent.setup()
        renderWithProviders(
            <ReviewCardForm cardId={7} deckId={12} onReviewed={onReviewed} />,
        )

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            ' blueprint ',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        await waitFor(() => {
            expect(onReviewed).toHaveBeenCalledWith({
                response: reviewResponse,
                userAnswer: 'blueprint',
            })
        })
    })

    it('disables the form while checking', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards/7/review', async () => {
                await delay('infinite')
                return HttpResponse.json(reviewResponse)
            }),
        )
        const user = userEvent.setup()
        renderWithProviders(
            <ReviewCardForm cardId={7} deckId={12} onReviewed={vi.fn()} />,
        )

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'blueprint',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByRole('button', { name: 'Checking answer' }),
        ).toBeDisabled()
        expect(
            screen.getByRole('textbox', { name: 'Your answer' }),
        ).toBeDisabled()
    })

    it('maps backend validation errors to the answer field', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards/7/review', () =>
                HttpResponse.json(
                    { errors: { userAnswer: 'Answer cannot be reviewed' } },
                    { status: 400 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderWithProviders(
            <ReviewCardForm cardId={7} deckId={12} onReviewed={vi.fn()} />,
        )

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'blueprint',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByText('Answer cannot be reviewed'),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Your answer' }),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows a retryable API error without inventing correctness', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards/7/review', () =>
                HttpResponse.json(
                    { message: 'Review unavailable' },
                    { status: 500 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderWithProviders(
            <ReviewCardForm cardId={7} deckId={12} onReviewed={vi.fn()} />,
        )

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'blueprint',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByText('Unable to check answer'),
        ).toBeInTheDocument()
        expect(screen.queryByText('Correct')).not.toBeInTheDocument()
    })
})
