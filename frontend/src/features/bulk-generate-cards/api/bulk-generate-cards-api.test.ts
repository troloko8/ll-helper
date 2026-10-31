import { HttpResponse, http } from 'msw'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { deckApi } from '@/entities/deck'
import { learningApi } from '@/entities/learning'
import { createApiTestStore, server } from '@/shared/lib/test'
import { bulkGenerateCardsApi } from './bulk-generate-cards-api'

describe('bulkGenerateCardsApi cache invalidation', () => {
    it('refreshes Created cardCount after saved bulk cards', async () => {
        let ownedDeckRequests = 0
        let learningDeckRequests = 0
        let progressRequests = 0
        let cardCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () => {
                ownedDeckRequests += 1
                return HttpResponse.json([
                    {
                        id: 73,
                        title: 'Travel Japanese',
                        sourceLanguage: 'EN',
                        targetLanguage: 'JA',
                        isPublic: true,
                        cardCount,
                    },
                ])
            }),
            http.get('http://localhost/api/v1/learning/decks', () => {
                learningDeckRequests += 1
                return HttpResponse.json([
                    {
                        deckId: 73,
                        title: 'Travel Japanese',
                        sourceLanguage: 'EN',
                        targetLanguage: 'JA',
                        enrolledAt: '2026-09-28T10:00:00Z',
                        lastStudiedAt: null,
                        progress: { masteredCount: 0, totalCount: cardCount },
                    },
                ])
            }),
            http.get('http://localhost/api/v1/learning/progress', () => {
                progressRequests += 1
                return HttpResponse.json([
                    {
                        deckId: 73,
                        title: 'Travel Japanese',
                        sourceLanguage: 'EN',
                        targetLanguage: 'JA',
                        cardsByStatus: {
                            newCount: cardCount,
                            learningCount: 0,
                            reviewingCount: 0,
                            masteredCount: 0,
                        },
                        totalCards: cardCount,
                    },
                ])
            }),
            http.post(
                'http://localhost/api/v1/card-generations/bulk',
                async ({ request }) => {
                    const body = (await request.json()) as { titles: string[] }
                    const created = body.titles.map((title, index) => ({
                        id: index + 1,
                        deckId: 73,
                        title,
                        definition: 'Generated definition.',
                        synonyms: [],
                        examples: [],
                        translation: 'перевод',
                        createdAt: '2026-09-28T10:00:00Z',
                        updatedAt: '2026-09-28T10:00:00Z',
                    }))
                    cardCount = created.length
                    return HttpResponse.json(
                        { created, failed: [] },
                        { status: 201 },
                    )
                },
            ),
        )
        const store = createApiTestStore()
        const ownedDecksSubscription = store.dispatch(
            deckApi.endpoints.getOwnedDecks.initiate(),
        )
        const learningDecksSubscription = store.dispatch(
            learningApi.endpoints.getLearningDecks.initiate(),
        )
        const progressSubscription = store.dispatch(
            learningApi.endpoints.getLearningProgress.initiate(),
        )
        await Promise.all([
            ownedDecksSubscription.unwrap(),
            learningDecksSubscription.unwrap(),
            progressSubscription.unwrap(),
        ])

        await store
            .dispatch(
                bulkGenerateCardsApi.endpoints.generateCardsBulk.initiate({
                    deckId: 73,
                    titles: ['Voyage', 'Trip'],
                }),
            )
            .unwrap()

        await waitFor(() => {
            expect(
                deckApi.endpoints.getOwnedDecks.select()(store.getState())
                    .data?.[0]?.cardCount,
            ).toBe(2)
        })
        expect(ownedDeckRequests).toBe(2)
        expect(learningDeckRequests).toBe(2)
        expect(progressRequests).toBe(2)

        ownedDecksSubscription.unsubscribe()
        learningDecksSubscription.unsubscribe()
        progressSubscription.unsubscribe()
    })
})
