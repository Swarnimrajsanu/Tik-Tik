import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Make hljs available globally
window.hljs = hljs;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
