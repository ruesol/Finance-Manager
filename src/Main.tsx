/// <reference types="vite/client" />

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ServiceProvider } from './Context/ServiceContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </React.StrictMode>,
)