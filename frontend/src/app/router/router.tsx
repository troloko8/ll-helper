import { createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { CompleteProfilePage } from '@/pages/complete-profile'
import { LoginPage } from '@/pages/login'
import { NotFoundPage } from '@/pages/not-found'
import { RegisterPage } from '@/pages/register'
import { ProtectedRoute } from './protected-route'
import { RouterErrorSurface } from './router-error-surface'

export const appRoutes: RouteObject[] = [
    {
        errorElement: <RouterErrorSurface />,
        children: [
            {
                path: '/',
                element: <ProtectedRoute />,
                children: [
                    {
                        index: true,
                        element: null,
                    },
                ],
            },
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                path: '/register',
                element: <RegisterPage />,
            },
            {
                path: '/onboarding/profile',
                element: <CompleteProfilePage />,
            },
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
]

export const router = createBrowserRouter(appRoutes)
