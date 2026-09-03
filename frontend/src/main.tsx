import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import App from '@/app/app.tsx'
import '@/shared/ui/styles/tokens.css'
import '@/shared/ui/styles/global.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
