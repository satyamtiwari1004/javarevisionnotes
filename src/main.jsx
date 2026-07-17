import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SearchProvider } from './contexts/SearchContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SearchProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SearchProvider>
    </ThemeProvider>
  </StrictMode>,
)

