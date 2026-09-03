import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'
import { RouterErrorSurface } from './router-error-surface'

export const router = createBrowserRouter([
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
                element: null,
            },
        ],
    },
])
