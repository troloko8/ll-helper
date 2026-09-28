import { HttpResponse, http } from 'msw'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { deckApi } from '@/entities/deck'
import { createApiTestStore, server } from '@/shared/lib/test'
import { addCardApi } from './add-card-api'

describe('addCardApi cache invalidation', () => {
    it('refreshes Created cardCount after manual and AI card creation', async () => {
        let cardCount = 0
        let ownedDeckRequests = 0
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
        await ownedDecksSubscription.unwrap()

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

        ownedDecksSubscription.unsubscribe()
    })
})
