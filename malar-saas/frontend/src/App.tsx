import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CustomerPage from './pages/CustomerPage'
import CallDetail from './pages/CallDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kund/:customerId" element={<CustomerPage />} />
        <Route path="/kund/:customerId/samtal/:callId" element={<CallDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
