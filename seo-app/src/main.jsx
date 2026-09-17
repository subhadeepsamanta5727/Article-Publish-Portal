import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import favicon from './assets/rmp-logo.png'

const faviconLink = document.querySelector('link[rel="icon"]')
if (faviconLink) {
  faviconLink.href = favicon
  faviconLink.type = 'image/png'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
