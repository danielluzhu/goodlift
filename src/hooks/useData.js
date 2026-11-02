import { useState, useEffect, useMemo } from 'react'
import { dataService } from '../services/dataService.js'

// Custom hook for managing data state
export const useData = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const allData = await dataService.getAllData()
        setData(allData)
      } catch (err) {
        setError(err)
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return { data, loading, error }
}

// Hook for specific data queries
export const useQuery = (queryFn, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const executeQuery = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await queryFn()
        setData(result)
      } catch (err) {
        setError(err)
        console.error('Query error:', err)
      } finally {
        setLoading(false)
      }
    }

    executeQuery()
  }, dependencies)

  return { data, loading, error }
}

// Hook for search functionality
export const useSearch = (query, searchFn) => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const performSearch = async () => {
      setLoading(true)
      try {
        const searchResults = await searchFn(query)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [query, searchFn])

  return { results, loading }
}
