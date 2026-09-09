import { Navigate, createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { CompleteProfilePage } from '@/pages/complete-profile'
import { CreateDeckPage } from '@/pages/create-deck'
import { LearningPage } from '@/pages/learning'
import { LearningDeckDetailsPage } from '@/pages/learning-deck-details'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { RegisterPage } from '@/pages/register'
import { AppShell } from '@/widgets/app-shell'
import { AuthRoute } from './auth-route'
import { AuthenticatedRoute } from './authenticated-route'
import { OnboardingRoute } from './onboarding-route'
import { RouterErrorSurface } from './router-error-surface'

export const appRoutes: RouteObject[] = [
    {
        errorElement: <RouterErrorSurface />,
        children: [
            {
                element: <AuthRoute />,
                children: [
                    {
                        path: '/login',
                        element: <LoginPage />,
                    },
                    {
                        path: '/register',
                        element: <RegisterPage />,
                    },
                ],
            },
            {
                element: <OnboardingRoute />,
                children: [
                    {
                        path: '/onboarding/profile',
                        element: <CompleteProfilePage />,
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
                                element: <LearningPage />,
                            },
                            {
                                path: '/learning/:deckId',
                                element: <LearningDeckDetailsPage />,
                            },
                            {
                                path: '/decks/new',
                                element: <CreateDeckPage />,
                            },
                            {
                                path: '*',
                                element: <NotFoundPage />,
                            },
                        ],
                    },
                ],
            },
        ],
    },
]

export const router = createBrowserRouter(appRoutes)
