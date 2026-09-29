import { Navigate, createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AppShell } from '@/widgets/app-shell'
import { AuthRoute } from './auth-route'
import { AuthenticatedRoute } from './authenticated-route'
import { OnboardingRoute } from './onboarding-route'
import { RouterErrorSurface } from './router-error-surface'
import { RouteLoading, RoutePending } from './route-loading'

export const appRoutes: RouteObject[] = [
    {
        element: <RoutePending />,
        hydrateFallbackElement: <RouteLoading />,
        errorElement: <RouterErrorSurface />,
        children: [
            {
                element: <AuthRoute />,
                children: [
                    {
                        path: '/login',
                        lazy: async () => {
                            const { LoginPage } = await import('@/pages/login')
                            return { Component: LoginPage }
                        },
                    },
                    {
                        path: '/register',
                        lazy: async () => {
                            const { RegisterPage } =
                                await import('@/pages/register')
                            return { Component: RegisterPage }
                        },
                    },
                ],
            },
            {
                element: <OnboardingRoute />,
                children: [
                    {
                        path: '/onboarding/profile',
                        lazy: async () => {
                            const { CompleteProfilePage } =
                                await import('@/pages/complete-profile')
                            return { Component: CompleteProfilePage }
                        },
                    },
                ],
            },
            {
                element: <AuthenticatedRoute />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                path: '/',
                                element: <Navigate to="/learning" replace />,
                            },
                            {
                                path: '/learning',
                                lazy: async () => {
                                    const { LearningPage } =
                                        await import('@/pages/learning')
                                    return { Component: LearningPage }
                                },
                            },
                            {
                                path: '/created',
                                lazy: async () => {
                                    const { CreatedPage } =
                                        await import('@/pages/created')
                                    return { Component: CreatedPage }
                                },
                            },
                            {
                                path: '/discover',
                                lazy: async () => {
                                    const { DiscoverPage } =
                                        await import('@/pages/discover')
                                    return { Component: DiscoverPage }
                                },
                            },
                            {
                                path: '/learning/:deckId',
                                lazy: async () => {
                                    const { LearningDeckDetailsPage } =
                                        await import('@/pages/learning-deck-details')
                                    return {
                                        Component: LearningDeckDetailsPage,
                                    }
                                },
                            },
                            {
                                path: '/decks/new',
                                lazy: async () => {
                                    const { CreateDeckPage } =
                                        await import('@/pages/create-deck')
                                    return { Component: CreateDeckPage }
                                },
                            },
                            {
                                path: '/decks/:deckId',
                                lazy: async () => {
                                    const { PublicDeckDetailsPage } =
                                        await import('@/pages/public-deck-details')
                                    return { Component: PublicDeckDetailsPage }
                                },
                            },
                            {
                                path: '/decks/:deckId/manage',
                                lazy: async () => {
                                    const { OwnerDeckDetailsPage } =
                                        await import('@/pages/owner-deck-details')
                                    return { Component: OwnerDeckDetailsPage }
                                },
                            },
                            {
                                path: '/decks/:deckId/cards/new',
                                lazy: async () => {
                                    const { AddCardPage } =
                                        await import('@/pages/add-card')
                                    return { Component: AddCardPage }
                                },
                            },
                            {
                                path: '/study/:deckId',
                                lazy: async () => {
                                    const { StudyPage } =
                                        await import('@/pages/study')
                                    return { Component: StudyPage }
                                },
                            },
                            {
                                path: '*',
                                lazy: async () => {
                                    const { NotFoundPage } =
                                        await import('@/pages/not-found')
                                    return { Component: NotFoundPage }
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },
]

export const router = createBrowserRouter(appRoutes)
