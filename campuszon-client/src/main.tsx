import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './index.css'
import './config/axios' // Configure axios before anything else

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </RecoilRoot>
  </React.StrictMode>
)
