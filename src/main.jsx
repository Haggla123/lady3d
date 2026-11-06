import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './store.jsx'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(<AppProvider><App /></AppProvider>)

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
