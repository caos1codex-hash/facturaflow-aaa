import { useState, useCallback, useMemo } from 'react'
import { dataService } from '../services/supabase'

// ============================================================
// Hook de búsqueda global
// ============================================================

/**
 * Búsqueda en tiempo real a través de múltiples colecciones.
 * Busca en facturas, clientes y productos simultáneamente.
 *
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   results: { invoices: Array, clients: Array, products: Array },
 *   isSearching: boolean,
 *   totalResults: number,
 *   search: (q?: string) => Promise<void>,
 *   clear: () => void,
 * }}
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({
    invoices: [],
    clients: [],
    products: [],
  })
  const [isSearching, setIsSearching] = useState(false)

  const totalResults = useMemo(() => {
    return results.invoices.length + results.clients.length + results.products.length
  }, [results])

  const search = useCallback(async (searchQuery) => {
    const q = searchQuery ?? query
    if (!q || q.trim().length < 2) {
      setResults({ invoices: [], clients: [], products: [] })
      return
    }

    setIsSearching(true)
    const trimmed = q.trim()

    try {
      // Ejecutar búsquedas en paralelo
      const [invoices, clients, products] = await Promise.all([
        dataService.query('invoices', {
          _search: trimmed,
          _searchFields: ['numero', 'cliente_nombre', 'cliente_email', 'notas'],
          _limit: 5,
        }).catch(() => []),

        dataService.query('clients', {
          _search: trimmed,
          _searchFields: ['nombre', 'email', 'rfc', 'telefono'],
          _limit: 5,
        }).catch(() => []),

        dataService.query('products', {
          _search: trimmed,
          _searchFields: ['nombre', 'descripcion', 'codigo', 'sku'],
          _limit: 5,
        }).catch(() => []),
      ])

      setResults({
        invoices: invoices ?? [],
        clients: clients ?? [],
        products: products ?? [],
      })
    } catch (error) {
      console.error('Error en búsqueda global:', error)
      setResults({ invoices: [], clients: [], products: [] })
    } finally {
      setIsSearching(false)
    }
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResults({ invoices: [], clients: [], products: [] })
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching,
    totalResults,
    search,
    clear,
  }
}

export default useSearch