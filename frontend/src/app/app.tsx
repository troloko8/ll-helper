import { RouterProvider } from 'react-router-dom'
import { ReduxProvider } from './providers/redux-provider'
import { router } from './router'

function App() {
  return (
    <ReduxProvider>
      <RouterProvider router={router} />
    </ReduxProvider>
  )
}

export default App
