import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  PlusCircle,
  BarChart3,
  Clock,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { ROUTES } from '../../utils/constants'

// ── Navigation items ──────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',       icon: LayoutDashboard, to: ROUTES.DASHBOARD },
  { label: 'Clientes',        icon: Users,           to: ROUTES.CLIENTES },
  { label: 'Productos',       icon: Package,         to: ROUTES.PRODUCTOS },
  { label: 'Facturas',        icon: FileText,        to: ROUTES.FACTURAS },
  { label: 'Nueva Factura',   icon: PlusCircle,      to: ROUTES.FACTURA_NUEVA },
  { label: 'Reportes',        icon: BarChart3,       to: ROUTES.REPORTES },
  { label: 'Historial',       icon: Clock,           to: '/historial' },
  { label: 'Configuración',   icon: Settings,        to: ROUTES.CONFIGURACION },
]

// ── Sidebar Component ─────────────────────────────────────────
export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) {
  const { isDark, toggleTheme } = useTheme()

  const sidebarWidth = isCollapsed ? 72 : 260

  // ── Shared nav link renderer ──
  const renderNavLink = (item, idx) => {
    const Icon = item.icon

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={onMobileClose}
        className={({ isActive }) =>
          [
            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
            'transition-all duration-150 ease-out',
            isActive
              ? 'bg-brand-600/15 text-brand-500'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-inverse)]',
          ].join(' ')
        }
        style={({ isActive }) =>
          isActive
            ? {
                borderLeft: '3px solid var(--brand-500)',
                marginLeft: '-3px',
              }
            : { borderLeft: '3px solid transparent', marginLeft: '-3px' }
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex-shrink-0 transition-colors duration-150 ${
                isActive
                  ? 'text-brand-500'
                  : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-inverse)]'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            </span>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    )
  }

  // ── Mobile overlay sidebar ──
  const mobileSidebar = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col sidebar-bg border-r border-[var(--border-default)] lg:hidden"
            role="navigation"
            aria-label="Navegación principal"
          >
            {/* Logo */}
            <div className="flex h-16 items-center gap-2.5 px-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Receipt size={18} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                FacturaFlow
              </span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {NAV_ITEMS.map((item) => renderNavLink(item))}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-[var(--border-default)] p-3 space-y-1">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-tertiary)] transition-all duration-150 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-inverse)]"
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
                <span>Cambiar tema</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )

  // ── Desktop sidebar ──
  const desktopSidebar = (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col sidebar-bg border-r border-[var(--border-default)]"
      role="navigation"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-4 overflow-hidden">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-all duration-200 ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          <Receipt size={18} strokeWidth={2.2} />
        </span>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
            >
              FacturaFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden py-2 transition-all duration-200 ${
          isCollapsed ? 'px-2.5' : 'px-3'
        } space-y-0.5`}
      >
        {NAV_ITEMS.map((item) => renderNavLink(item))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--border-default)] p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-tertiary)] transition-all duration-150 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-inverse)] focus-ring ${
            isCollapsed ? 'justify-center' : ''
          }`}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="whitespace-nowrap overflow-hidden"
              >
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-tertiary)] transition-all duration-150 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-inverse)] focus-ring ${
            isCollapsed ? 'justify-center' : ''
          }`}
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="whitespace-nowrap overflow-hidden"
              >
                Colapsar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )

  return (
    <>
      {mobileSidebar}
      {desktopSidebar}
    </>
  )
}