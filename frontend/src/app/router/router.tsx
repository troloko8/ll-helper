import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'

export const router = createBrowserRouter([
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
])
