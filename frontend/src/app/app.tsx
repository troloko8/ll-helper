import { RouterProvider } from 'react-router-dom'
import { ApplicationErrorBoundary } from './error-boundary/application-error-boundary'
import { ReduxProvider } from './providers/redux-provider'
import { router } from './router'

function App() {
    return (
        <ApplicationErrorBoundary>
            <ReduxProvider>
                <RouterProvider router={router} />
            </ReduxProvider>
        </ApplicationErrorBoundary>
    )
}

export default App
