/* eslint-disable */
// @ts-nocheck

import { useState } from 'react'
import algoliasearch from 'algoliasearch/lite'
import { CatalogItem } from './useCatalogTypes'

// Initialize Algolia client
const client = algoliasearch('ALGOLIA_APP_ID', 'ALGOLIA_SEARCH_KEY')
const index = client.initIndex('catalog')

export function useCatalogSearch() {
  const [results, setResults] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Full-text search with relevance ranking
  const searchItems = async (term: string) => {
    if (!term) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const { hits } = await index.search(term, {
        attributesToRetrieve: ['title', 'description', 'tags', 'price', 'discount', 'image', 'category', 'createdAt'],
        hitsPerPage: 20,
      })
      setResults(hits as CatalogItem[])
    } catch (err) {
      console.error(err)
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return {
    results,
    loading,
    error,
    searchItems,
  }
}
