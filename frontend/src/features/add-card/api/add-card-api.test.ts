import { HttpResponse, http } from 'msw'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { deckApi } from '@/entities/deck'
import { learningApi } from '@/entities/learning'
import { createApiTestStore, server } from '@/shared/lib/test'
import { addCardApi } from './add-card-api'

describe('addCardApi cache invalidation', () => {
    it('refreshes Created cardCount after manual and single AI card creation', async () => {
        let cardCount = 0
        let ownedDeckRequests = 0
        let learningDeckRequests = 0
        let progressRequests = 0
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
                'http://localhost/api/v1/decks/73/cards',
                async ({ request }) => {
                    const body = (await request.json()) as { title: string }
                    cardCount += 1
                    return HttpResponse.json(
                        {
                            id: cardCount,
                            deckId: 73,
                            title: body.title,
                            definition: null,
                            synonyms: null,
                            examples: null,
                            translation: 'путешествие',
                            createdAt: '2026-09-28T10:00:00Z',
                            updatedAt: '2026-09-28T10:00:00Z',
                        },
                        { status: 201 },
                    )
                },
            ),
            http.post(
                'http://localhost/api/v1/card-generations',
                async ({ request }) => {
                    const body = (await request.json()) as { title: string }
                    cardCount += 1
                    return HttpResponse.json(
                        {
                            id: cardCount,
                            deckId: 73,
                            title: body.title,
                            definition: 'A trip from one place to another.',
                            synonyms: ['trip'],
                            examples: ['The journey took three hours.'],
                            translation: 'путешествие',
                            createdAt: '2026-09-28T10:00:00Z',
                            updatedAt: '2026-09-28T10:00:00Z',
                        },
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
                addCardApi.endpoints.addCard.initiate({
                    deckId: 73,
                    body: {
                        title: 'Journey',
                        definition: null,
                        synonyms: null,
                        examples: null,
                        translation: 'путешествие',
                    },
                }),
            )
            .unwrap()

        await waitFor(() => {
            expect(
                deckApi.endpoints.getOwnedDecks.select()(store.getState())
                    .data?.[0]?.cardCount,
            ).toBe(1)
        })

        await store
            .dispatch(
                addCardApi.endpoints.generateCard.initiate({
                    deckId: 73,
                    title: 'Journey',
                }),
            )
            .unwrap()

        await waitFor(() => {
            expect(
                deckApi.endpoints.getOwnedDecks.select()(store.getState())
                    .data?.[0]?.cardCount,
            ).toBe(2)
        })

        expect(ownedDeckRequests).toBe(3)
        expect(learningDeckRequests).toBe(3)
        expect(progressRequests).toBe(3)

        ownedDecksSubscription.unsubscribe()
        learningDecksSubscription.unsubscribe()
        progressSubscription.unsubscribe()
    })

    it('keeps related caches valid when card creation fails', async () => {
        const requests = {
            ownedDecks: 0,
            learningDecks: 0,
            progress: 0,
        }
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () => {
                requests.ownedDecks += 1
                return HttpResponse.json([])
            }),
            http.get('http://localhost/api/v1/learning/decks', () => {
                requests.learningDecks += 1
                return HttpResponse.json([])
            }),
            http.get('http://localhost/api/v1/learning/progress', () => {
                requests.progress += 1
                return HttpResponse.json([])
            }),
            http.post('http://localhost/api/v1/decks/73/cards', () =>
                HttpResponse.json(
                    { message: 'Card could not be saved' },
                    { status: 500 },
                ),
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

        await expect(
            store
                .dispatch(
                    addCardApi.endpoints.addCard.initiate({
                        deckId: 73,
                        body: {
                            title: 'Journey',
                            definition: null,
                            synonyms: null,
                            examples: null,
                            translation: 'путешествие',
                        },
                    }),
                )
                .unwrap(),
        ).rejects.toMatchObject({ status: 500 })
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(requests).toEqual({
            ownedDecks: 1,
            learningDecks: 1,
            progress: 1,
        })

        ownedDecksSubscription.unsubscribe()
        learningDecksSubscription.unsubscribe()
        progressSubscription.unsubscribe()
    })
})
