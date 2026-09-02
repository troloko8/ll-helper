import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import App from '@/app/app.tsx'
import '@/shared/ui/tokens.css'
import '@/shared/ui/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
