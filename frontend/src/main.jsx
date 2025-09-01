import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// ✅ Load Tailwind first so it wins
import './styles/tailwind.css'

// ✅ Then load minimal custom styles
import './index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
