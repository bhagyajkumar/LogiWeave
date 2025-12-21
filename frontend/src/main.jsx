import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import { ReactFlowProvider } from 'reactflow';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </React.StrictMode>
)
