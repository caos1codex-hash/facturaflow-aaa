import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ============================================================
// Contexto del tema (Claro / Oscuro)
// ============================================================

const STORAGE_KEY = 'facturaflow_theme'

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
})

/**
 * Detecta la preferencia del sistema o del almacenamiento local.
 */
function getInitialTheme() {
  // 1. Preferencia guardada
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored

  // 2. Preferencia del sistema
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return 'light'
}

/**
 * Aplica la clase 'dark' al elemento raíz del documento.
 */
function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * Proveedor del tema con soporte para modo claro/oscuro.
 * Persiste la preferencia en localStorage.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  const isDark = theme === 'dark'

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  // Aplicar tema al montar y escuchar cambios del sistema
  useEffect(() => {
    applyTheme(theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Solo seguir al sistema si no hay preferencia guardada
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, setTheme])

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook para acceder al contexto del tema.
 * @returns {{ theme: string, isDark: boolean, toggleTheme: () => void, setTheme: (theme: string) => void }}
 */
export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext debe usarse dentro de un ThemeProvider')
  }
  return context
}

export default ThemeContext