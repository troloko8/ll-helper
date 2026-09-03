import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createAppStore } from '../store'

interface RenderWithProvidersOptions {
    route?: string
}

export function renderWithProviders(
    ui: ReactElement,
    options: RenderWithProvidersOptions = {},
) {
    const { route = '/' } = options
    const store = createAppStore()

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider store={store}>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </Provider>
        )
    }

    return { store, ...render(ui, { wrapper: Wrapper }) }
}
