import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

// ── Layout Component ──────────────────────────────────────────
export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const location = useLocation()

  // Track viewport width for sidebar offset
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mql.matches)

    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const handleMobileToggle = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  const handleMobileClose = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  // Compute sidebar width for margin offset (desktop only)
  const sidebarWidth = isCollapsed ? 72 : 260

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* ── Sidebar ── */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* ── Main wrapper: offset by sidebar on desktop ── */}
      <div
        className="flex min-h-screen flex-col"
        style={{
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Header ── */}
        <Header onMenuToggle={handleMobileToggle} />

        {/* ── Page content ── */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 px-4 py-6 lg:px-8 lg:py-8"
            role="main"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}