import { createClient } from '@supabase/supabase-js'

// ============================================================
// Inicialización del cliente Supabase
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * Cliente de Supabase. Solo se crea si las variables de entorno están configuradas.
 */
export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null

// ============================================================
// Servicio de datos unificado con fallback a localStorage
// ============================================================

/**
 * Genera un ID único.
 * Combina timestamp aleatorio con caracteres aleatorios.
 */
function generateId() {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${randomPart}`
}

/**
 * Servicio de datos que abstrae la fuente de datos.
 * Si Supabase está configurado, usa Supabase.
 * Si no, usa localStorage como respaldo local.
 */
class DataService {
  constructor() {
    this._source = isSupabaseConfigured ? 'supabase' : 'local'
  }

  /**
   * Retorna la fuente de datos activa.
   */
  get source() {
    return this._source
  }

  // ==========================================================
  // Métodos de localStorage (fallback)
  // ==========================================================

  /**
   * Obtiene todos los registros de una colección en localStorage.
   */
  _localGetAll(collection) {
    try {
      const raw = localStorage.getItem(`facturaflow_${collection}`)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      console.error(`Error leyendo colección "${collection}" de localStorage`)
      return []
    }
  }

  /**
   * Guarda todos los registros de una colección en localStorage.
   */
  _localSaveAll(collection, data) {
    try {
      localStorage.setItem(`facturaflow_${collection}`, JSON.stringify(data))
    } catch (error) {
      console.error(`Error guardando colección "${collection}" en localStorage:`, error)
    }
  }

  // ==========================================================
  // API Pública
  // ==========================================================

  /**
   * Obtiene todos los registros de una colección.
   * @param {string} collection — Nombre de la colección/tabla
   * @returns {Promise<Array>} Lista de registros
   */
  async getAll(collection) {
    if (this._source === 'supabase') {
      const { data, error } = await supabaseClient
        .from(collection)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Error al obtener datos de "${collection}": ${error.message}`)
      return data ?? []
    }

    // Fallback: localStorage
    return this._localGetAll(collection)
  }

  /**
   * Obtiene un registro por su ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(collection, id) {
    if (this._source === 'supabase') {
      const { data, error } = await supabaseClient
        .from(collection)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No encontrado
        throw new Error(`Error al obtener registro de "${collection}": ${error.message}`)
      }
      return data
    }

    // Fallback: localStorage
    const items = this._localGetAll(collection)
    return items.find((item) => item.id === id) ?? null
  }

  /**
   * Crea un nuevo registro.
   * @param {string} collection
   * @param {Object} data — Datos del registro (sin id ni timestamps)
   * @returns {Promise<Object>} Registro creado con id y timestamps
   */
  async create(collection, data) {
    const now = new Date().toISOString()
    const record = {
      ...data,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }

    if (this._source === 'supabase') {
      const { data: created, error } = await supabaseClient
        .from(collection)
        .insert(record)
        .select()
        .single()

      if (error) throw new Error(`Error al crear registro en "${collection}": ${error.message}`)
      return created
    }

    // Fallback: localStorage
    const items = this._localGetAll(collection)
    items.unshift(record)
    this._localSaveAll(collection, items)
    return record
  }

  /**
   * Actualiza un registro existente.
   * @param {string} collection
   * @param {string} id
   * @param {Object} data — Campos a actualizar
   * @returns {Promise<Object>} Registro actualizado
   */
  async update(collection, id, data) {
    const updates = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    if (this._source === 'supabase') {
      const { data: updated, error } = await supabaseClient
        .from(collection)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`Error al actualizar registro en "${collection}": ${error.message}`)
      return updated
    }

    // Fallback: localStorage
    const items = this._localGetAll(collection)
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Registro con id "${id}" no encontrado en "${collection}"`)
    }

    items[index] = { ...items[index], ...updates }
    this._localSaveAll(collection, items)
    return items[index]
  }

  /**
   * Elimina un registro por su ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(collection, id) {
    if (this._source === 'supabase') {
      const { error } = await supabaseClient
        .from(collection)
        .delete()
        .eq('id', id)

      if (error) throw new Error(`Error al eliminar registro de "${collection}": ${error.message}`)
      return true
    }

    // Fallback: localStorage
    const items = this._localGetAll(collection)
    const filtered = items.filter((item) => item.id !== id)

    if (filtered.length === items.length) {
      throw new Error(`Registro con id "${id}" no encontrado en "${collection}"`)
    }

    this._localSaveAll(collection, filtered)
    return true
  }

  /**
   * Realiza una consulta con filtros.
   * Los filtros se aplican como coincidencias exactas (eq).
   * Para ordenar, incluir { _order: 'campo', _direction: 'asc' | 'desc' }.
   * Para paginar, incluir { _limit: number, _offset: number }.
   *
   * @param {string} collection
   * @param {Object} filters — Pares campo-valor para filtrar
   * @returns {Promise<Array>}
   */
  async query(collection, filters = {}) {
    // Extraer metadatos de la consulta
    const { _order, _direction, _limit, _offset, _search, _searchFields, ...fieldFilters } = filters

    if (this._source === 'supabase') {
      let query = supabaseClient.from(collection).select('*')

      // Aplicar filtros de campo
      for (const [field, value] of Object.entries(fieldFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(field, value)
        }
      }

      // Búsqueda de texto
      if (_search && _searchFields?.length) {
        for (const field of _searchFields) {
          query = query.or(`${field}.ilike.%${_search}%`)
        }
      }

      // Ordenamiento
      if (_order) {
        query = query.order(_order, { ascending: _direction !== 'desc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Paginación
      if (_limit) {
        query = query.limit(_limit)
      }
      if (_offset) {
        query = query.range(_offset, _offset + (_limit ?? 100) - 1)
      }

      const { data, error } = await query

      if (error) throw new Error(`Error en consulta de "${collection}": ${error.message}`)
      return data ?? []
    }

    // Fallback: localStorage
    let items = this._localGetAll(collection)

    // Aplicar filtros de campo
    for (const [field, value] of Object.entries(fieldFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter((item) => item[field] === value)
      }
    }

    // Búsqueda de texto
    if (_search && _searchFields?.length) {
      const searchLower = _search.toLowerCase()
      items = items.filter((item) =>
        _searchFields.some((field) => {
          const fieldValue = item[field]
          if (!fieldValue) return false
          return String(fieldValue).toLowerCase().includes(searchLower)
        }),
      )
    }

    // Ordenamiento
    if (_order) {
      const dir = _direction === 'desc' ? -1 : 1
      items.sort((a, b) => {
        const aVal = a[_order] ?? ''
        const bVal = b[_order] ?? ''
        if (aVal < bVal) return -1 * dir
        if (aVal > bVal) return 1 * dir
        return 0
      })
    } else {
      // Ordenar por created_at descendente
      items.sort((a, b) => {
        const aTime = a.created_at ?? ''
        const bTime = b.created_at ?? ''
        return bTime.localeCompare(aTime)
      })
    }

    // Paginación
    const offset = _offset ?? 0
    const limit = _limit ?? items.length
    return items.slice(offset, offset + limit)
  }

  /**
   * Cuenta los registros de una colección que coincidan con los filtros.
   * @param {string} collection
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  async count(collection, filters = {}) {
    const { _order, _direction, _limit, _offset, ...fieldFilters } = filters

    if (this._source === 'supabase') {
      let query = supabaseClient.from(collection).select('*', { count: 'exact', head: true })

      for (const [field, value] of Object.entries(fieldFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(field, value)
        }
      }

      const { count, error } = await query
      if (error) throw new Error(`Error al contar registros en "${collection}": ${error.message}`)
      return count ?? 0
    }

    // Fallback: localStorage
    let items = this._localGetAll(collection)

    for (const [field, value] of Object.entries(fieldFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter((item) => item[field] === value)
      }
    }

    return items.length
  }
}

// Instancia singleton del servicio de datos
export const dataService = new DataService()

export default dataService