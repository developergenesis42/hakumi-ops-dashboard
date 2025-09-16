import ReactDOM from 'react-dom/client'
import App from '@/App.tsx'
import './output.css'

// Simple test - just render the App directly
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)