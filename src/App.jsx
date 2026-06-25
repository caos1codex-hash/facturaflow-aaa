import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoadingScreen from './components/ui/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'

// ── Lazy-loaded pages ────────────────────────────────────────

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clients = lazy(() => import('./pages/Clients'))
const Products = lazy(() => import('./pages/Products'))
const Invoices = lazy(() => import('./pages/Invoices'))
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'))
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'))
const Reports = lazy(() => import('./pages/Reports'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))

// ── App Component ────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="productos" element={<Products />} />
            <Route path="facturas" element={<Invoices />} />
            <Route path="facturas/nueva" element={<CreateInvoice />} />
            <Route path="facturas/:id" element={<InvoiceDetail />} />
            <Route path="facturas/:id/editar" element={<CreateInvoice />} />
            <Route path="reportes" element={<Reports />} />
            <Route path="historial" element={<History />} />
            <Route path="configuracion" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}