import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import LiveReplay from './LiveReplay'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).get('mode') === 'live-replay' ? <LiveReplay /> : <App />}
  </StrictMode>,
)
