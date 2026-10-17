import { HttpResponse, http } from 'msw'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { deckApi } from '@/entities/deck'
import { createApiTestStore, server } from '@/shared/lib/test'
import { bulkGenerateCardsApi } from './bulk-generate-cards-api'

describe('bulkGenerateCardsApi cache invalidation', () => {
    it('refreshes Created cardCount after saved bulk cards', async () => {
        let ownedDeckRequests = 0
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
        await ownedDecksSubscription.unwrap()

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

        ownedDecksSubscription.unsubscribe()
    })
})
