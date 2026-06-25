import { useState, useCallback, useRef, useEffect } from 'react'
import { dataService } from '../services/supabase'

// ============================================================
// Hook genérico de operaciones CRUD
// ============================================================

/**
 * Hook para realizar operaciones CRUD sobre una colección.
 * Usa automáticamente Supabase o localStorage según la configuración.
 *
 * @param {string} collection — Nombre de la colección/tabla
 * @returns {{
 *   items: Array,
 *   loading: boolean,
 *   error: string | null,
 *   fetchAll: (filters?: Object) => Promise<Array>,
 *   create: (data: Object) => Promise<Object>,
 *   update: (id: string, data: Object) => Promise<Object>,
 *   remove: (id: string) => Promise<boolean>,
 *   getById: (id: string) => Promise<Object | null>,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useData(collection) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastFiltersRef = useRef(null)

  // ==========================================================
  // Obtener todos los registros
  // ==========================================================
  const fetchAll = useCallback(async (filters) => {
    setLoading(true)
    setError(null)
    lastFiltersRef.current = filters ?? null

    try {
      let data
      if (filters && Object.keys(filters).length > 0) {
        data = await dataService.query(collection, filters)
      } else {
        data = await dataService.getAll(collection)
      }
      setItems(data)
      return data
    } catch (err) {
      const message = err?.message ?? `Error al cargar datos de "${collection}"`
      setError(message)
      console.error(message, err)
      return []
    } finally {
      setLoading(false)
    }
  }, [collection])

  // ==========================================================
  // Obtener un registro por ID
  // ==========================================================
  const getById = useCallback(async (id) => {
    setError(null)

    try {
      const record = await dataService.getById(collection, id)
      if (!record) {
        setError(`Registro con id "${id}" no encontrado`)
      }
      return record
    } catch (err) {
      const message = err?.message ?? `Error al obtener registro de "${collection}"`
      setError(message)
      console.error(message, err)
      return null
    }
  }, [collection])

  // ==========================================================
  // Crear un nuevo registro
  // ==========================================================
  const create = useCallback(async (data) => {
    setLoading(true)
    setError(null)

    try {
      const record = await dataService.create(collection, data)
      setItems((prev) => [record, ...prev])
      return record
    } catch (err) {
      const message = err?.message ?? `Error al crear registro en "${collection}"`
      setError(message)
      console.error(message, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collection])

  // ==========================================================
  // Actualizar un registro
  // ==========================================================
  const update = useCallback(async (id, data) => {
    setLoading(true)
    setError(null)

    try {
      const updated = await dataService.update(collection, id, data)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
      return updated
    } catch (err) {
      const message = err?.message ?? `Error al actualizar registro en "${collection}"`
      setError(message)
      console.error(message, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collection])

  // ==========================================================
  // Eliminar un registro
  // ==========================================================
  const remove = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      await dataService.delete(collection, id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      return true
    } catch (err) {
      const message = err?.message ?? `Error al eliminar registro de "${collection}"`
      setError(message)
      console.error(message, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collection])

  // ==========================================================
  // Refrescar datos (re-ejecutar última consulta)
  // ==========================================================
  const refresh = useCallback(async () => {
    await fetchAll(lastFiltersRef.current)
  }, [fetchAll])

  // ==========================================================
  // Cargar datos al montar el hook
  // ==========================================================
  useEffect(() => {
    fetchAll()
    // Solo ejecutar al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection])

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    getById,
    refresh,
  }
}

export default useData