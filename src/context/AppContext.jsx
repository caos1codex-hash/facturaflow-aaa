import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { DEFAULT_COMPANY } from '../utils/constants'
import { dataService } from '../services/supabase'

// ============================================================
// Contexto global de la aplicación
// ============================================================

const AppContext = createContext({
  // Estado de la empresa
  company: { ...DEFAULT_COMPANY },
  updateCompany: async () => {},
  saveCompany: async () => {},

  // Notificaciones
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},

  // Usuario actual
  currentUser: null,
  setCurrentUser: () => {},

  // Estado de carga de la app
  appLoading: true,
  setAppLoading: () => {},
})

const COMPANY_STORAGE_KEY = 'facturaflow_company_settings'

/**
 * Proveedor del contexto global de la aplicación.
 * Maneja la configuración de la empresa, notificaciones y estado de carga.
 */
export function AppProvider({ children }) {
  const [company, setCompany] = useState({ ...DEFAULT_COMPANY })
  const [notifications, setNotifications] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [appLoading, setAppLoading] = useState(true)

  // ==========================================================
  // Cargar configuración de la empresa al iniciar
  // ==========================================================
  useEffect(() => {
    async function loadCompanySettings() {
      try {
        // Intentar cargar de Supabase/localStorage
        const settings = await dataService.getById('settings', 'company')
        if (settings?.data) {
          setCompany((prev) => ({ ...prev, ...settings.data }))
        } else {
          // Fallback: intentar localStorage directo
          const stored = localStorage.getItem(COMPANY_STORAGE_KEY)
          if (stored) {
            setCompany((prev) => ({ ...prev, ...JSON.parse(stored) }))
          }
        }
      } catch {
        // Usar valores predeterminados
        const stored = localStorage.getItem(COMPANY_STORAGE_KEY)
        if (stored) {
          try {
            setCompany((prev) => ({ ...prev, ...JSON.parse(stored) }))
          } catch {
            // Ignorar error, usar valores predeterminados
          }
        }
      } finally {
        setAppLoading(false)
      }
    }

    loadCompanySettings()
  }, [])

  // ==========================================================
  // Actualizar configuración de la empresa
  // ==========================================================
  const updateCompany = useCallback((updates) => {
    setCompany((prev) => ({ ...prev, ...updates }))
  }, [])

  const saveCompany = useCallback(async (newSettings) => {
    try {
      const settingsToSave = newSettings ?? company

      // Guardar en Supabase/localStorage via DataService
      await dataService.update('settings', 'company', {
        id: 'company',
        data: settingsToSave,
        updated_at: new Date().toISOString(),
      })

      // También guardar en localStorage como respaldo directo
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(settingsToSave))
      setCompany(settingsToSave)

      return { success: true }
    } catch (error) {
      console.error('Error al guardar configuración de la empresa:', error)
      return { success: false, error: error.message }
    }
  }, [company])

  // ==========================================================
  // Sistema de notificaciones
  // ==========================================================
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    const newNotification = {
      id,
      type: 'info', // info | success | warning | error
      title: 'Notificación',
      message: '',
      duration: 5000,
      ...notification,
      createdAt: new Date().toISOString(),
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Auto-eliminar después de la duración
    if (newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // ==========================================================
  // Valor del contexto
  // ==========================================================
  const value = {
    company,
    updateCompany,
    saveCompany,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    currentUser,
    setCurrentUser,
    appLoading,
    setAppLoading,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

/**
 * Hook para acceder al contexto global de la aplicación.
 */
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider')
  }
  return context
}

export default AppContext