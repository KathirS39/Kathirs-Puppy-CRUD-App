import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AsgardeoProvider } from '@asgardeo/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AsgardeoProvider
      clientId="RKiwf5Uj5pSjcRcHQ_a0B75Q6pUa"
      baseUrl="https://api.asgardeo.io/t/fullstack39"
    >
      <App />
    </AsgardeoProvider>
  </StrictMode>
)