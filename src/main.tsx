import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/homemade-apple/latin-400.css'
import '@fontsource/zen-antique-soft/latin-400.css'
import '@fontsource/klee-one/latin-400.css'
import '@fontsource/klee-one/latin-600.css'
import '@fontsource/yomogi/latin-400.css'
import './index.css'
import App from './App.tsx'
import { paintPhase, readPhase } from './lib/air'

// Past seven in the evening the world is at night, and the page with it. Set
// before the first paint so the paper never flashes the wrong colour.
paintPhase(readPhase())

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
