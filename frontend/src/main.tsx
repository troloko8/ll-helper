import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/app.tsx'
import '@/shared/ui/tokens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
