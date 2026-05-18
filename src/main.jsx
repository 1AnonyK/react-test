import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Import the router
import LesediEdge from './LesediEdge.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. Wrap your component inside it */}
      <LesediEdge />
    </BrowserRouter>
  </React.StrictMode>,
)