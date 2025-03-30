import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthWrapper } from './components/AuthWrapper'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthWrapper>
        <App />
        <Toaster position="bottom-right" />
      </AuthWrapper>
    </BrowserRouter>
  </React.StrictMode>,
)