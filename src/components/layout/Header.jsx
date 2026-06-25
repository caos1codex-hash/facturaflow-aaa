import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Search,
  FileText,
  Users,
  Package,
  Bell,
  Sun,
  Moon,
  Loader2,
  X,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useSearch } from '../../hooks/useSearch'
import { ROUTES } from '../../utils/constants'

// ── Route-to-title mapping ────────────────────────────────────
const PAGE_TITLES = {
  [ROUTES.DASHBOARD]:     'Dashboard',
  [ROUTES.FACTURAS]:      'Facturas',
  [ROUTES.FACTURA_NUEVA]: 'Nueva Factura',
  [ROUTES.CLIENTES]:      'Clientes',
  [ROUTES.PRODUCTOS]:     'Productos',
  [ROUTES.REPORTES]:      'Reportes',
  [ROUTES.CONFIGURACION]: 'Configuración',
  '/historial':           'Historial',
}

function getPageTitle(pathname) {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  // Pattern match for dynamic routes
  if (/\/facturas\/\w{1,36}\/editar/.test(pathname)) return 'Editar Factura'
  if (/\/facturas\/\w{1,36}$/.test(pathname)) return 'Detalle de Factura'
  if (/\/clientes\/nuevo/.test(pathname)) return 'Nuevo Cliente'
  if (/\/clientes\/\w{1,36}\/editar/.test(pathname)) return 'Editar Cliente'
  if (/\/productos\/nuevo/.test(pathname)) return 'Nuevo Producto'
  if (/\/productos\/\w{1,36}\/editar/.test(pathname)) return 'Editar Producto'

  return 'FacturaFlow'
}

// ── Category config for search results ────────────────────────
const SEARCH_CATEGORIES = [
  { key: 'invoices',  label: 'Facturas',  icon: FileText, routeBase: '/facturas/' },
  { key: 'clients',   label: 'Clientes',  icon: Users,    routeBase: '/clientes/' },
  { key: 'products',  label: 'Productos', icon: Package,  routeBase: '/productos/' },
]

// ── Header Component ──────────────────────────────────────────
export default function Header({ onMenuToggle }) {
  const { isDark, toggleTheme } = useTheme()
  const { query, setQuery, results, isSearching, totalResults, search, clear } = useSearch()

  const location = useLocation()
  const navigate = useNavigate()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const pageTitle = getPageTitle(location.pathname)

  // ── Close search on outside click ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Reset search on route change ──
  useEffect(() => {
    setIsSearchOpen(false)
    setHighlightedIndex(-1)
    clear()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced search ──
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value
      setQuery(value)

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (value.trim().length < 2) {
        setIsSearchOpen(false)
        return
      }

      debounceRef.current = setTimeout(() => {
        search(value)
        setIsSearchOpen(true)
        setHighlightedIndex(-1)
      }, 200)
    },
    [setQuery, search]
  )

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e) => {
      if (!isSearchOpen || totalResults === 0) {
        if (e.key === 'Enter' && query.trim().length >= 2) {
          search(query)
          setIsSearchOpen(true)
        }
        return
      }

      const flatItems = []
      for (const cat of SEARCH_CATEGORIES) {
        for (const item of results[cat.key] || []) {
          flatItems.push({ ...item, _category: cat })
        }
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < flatItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : flatItems.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && flatItems[highlightedIndex]) {
            const selectedItem = flatItems[highlightedIndex]
            navigate(`${selectedItem._category.routeBase}${selectedItem.id}`)
            setIsSearchOpen(false)
            inputRef.current?.blur()
          }
          break
        case 'Escape':
          setIsSearchOpen(false)
          setHighlightedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [isSearchOpen, totalResults, highlightedIndex, results, query, search, navigate]
  )

  // ── Navigate to search result ──
  const handleResultClick = useCallback(
    (category, item) => {
      navigate(`${category.routeBase}${item.id}`)
      setIsSearchOpen(false)
      inputRef.current?.blur()
    },
    [navigate]
  )

  // ── Clear search ──
  const handleClear = useCallback(() => {
    clear()
    setIsSearchOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }, [clear])

  // Build flat index tracker for keyboard nav
  let flatIdx = -1

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md px-4 lg:px-6"
      role="banner"
    >
      {/* ── Left: Hamburger (mobile) + Title ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden focus-ring"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
          {pageTitle}
        </h1>
      </div>

      {/* ── Center: Search ── */}
      <div className="flex-1 flex justify-center px-2 lg:px-8 max-w-2xl mx-auto">
        <div ref={searchRef} className="relative w-full">
          {/* Search input */}
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim().length >= 2 && totalResults > 0) {
                  setIsSearchOpen(true)
                }
              }}
              placeholder="Buscar facturas, clientes, productos..."
              className="input-base w-full pl-9 pr-9 py-2 text-sm"
              aria-label="Búsqueda global"
              aria-expanded={isSearchOpen}
              aria-haspopup="listbox"
              role="combobox"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-100"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── Search results dropdown ── */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-full left-0 right-0 mt-1.5 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-lg z-50"
                role="listbox"
                aria-label="Resultados de búsqueda"
              >
                {/* Loading */}
                {isSearching && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-tertiary)]">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Buscando...</span>
                  </div>
                )}

                {/* No results */}
                {!isSearching && query.trim().length >= 2 && totalResults === 0 && (
                  <div className="flex flex-col items-center py-8 text-[var(--text-tertiary)]">
                    <Search size={32} strokeWidth={1.2} className="mb-2 opacity-40" />
                    <p className="text-sm">Sin resultados para &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {/* Results by category */}
                {!isSearching &&
                  SEARCH_CATEGORIES.map((cat) => {
                    const items = results[cat.key] || []
                    if (items.length === 0) return null

                    const CatIcon = cat.icon
                    return (
                      <div key={cat.key} className="not-first:border-t not-first:border-[var(--border-default)]">
                        {/* Category header */}
                        <div className="flex items-center gap-2 px-4 py-2">
                          <CatIcon size={14} className="text-[var(--text-tertiary)]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            {cat.label}
                          </span>
                          <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                            {items.length}
                          </span>
                        </div>

                        {/* Items */}
                        {items.map((item) => {
                          flatIdx++
                          const currentIdx = flatIdx
                          const isHighlighted = currentIdx === highlightedIndex

                          // Determine subtitle
                          let subtitle = ''
                          if (cat.key === 'invoices') {
                            subtitle = item.cliente_nombre || item.numero || ''
                          } else if (cat.key === 'clients') {
                            subtitle = item.email || item.rfc || ''
                          } else if (cat.key === 'products') {
                            subtitle = item.codigo || item.sku || item.descripcion || ''
                          }

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleResultClick(cat, item)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100 ${
                                isHighlighted
                                  ? 'bg-[var(--bg-tertiary)]'
                                  : 'hover:bg-[var(--bg-tertiary)]'
                              }`}
                              role="option"
                              aria-selected={isHighlighted}
                            >
                              <CatIcon
                                size={16}
                                className={`flex-shrink-0 ${
                                  isHighlighted
                                    ? 'text-brand-500'
                                    : 'text-[var(--text-tertiary)]'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className={`truncate font-medium ${isHighlighted ? 'text-brand-500' : 'text-[var(--text-primary)]'}`}>
                                  {item.nombre || item.numero || item.cliente_nombre || 'Sin nombre'}
                                </p>
                                {subtitle && (
                                  <p className="truncate text-xs text-[var(--text-tertiary)]">
                                    {subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5">
        {/* Notifications (cosmetic) */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus-ring"
          aria-label="Notificaciones"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus-ring"
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar */}
        <button
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white select-none transition-transform duration-150 hover:scale-105 focus-ring"
          aria-label="Perfil de usuario"
        >
          FF
        </button>
      </div>
    </header>
  )
}