import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// No StrictMode: the show loop deliberately starts once and keeps running.
createRoot(document.getElementById('root')!).render(<App />)
