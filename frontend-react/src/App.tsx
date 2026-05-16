import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SalesAnalytics from './pages/SalesAnalytics'
import CustomerInsights from './pages/CustomerInsights'
import ProductPerformance from './pages/ProductPerformance'
import DeliveryAnalytics from './pages/DeliveryAnalytics'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/sales"     element={<SalesAnalytics />} />
            <Route path="/customers" element={<CustomerInsights />} />
            <Route path="/products"  element={<ProductPerformance />} />
            <Route path="/delivery"  element={<DeliveryAnalytics />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
