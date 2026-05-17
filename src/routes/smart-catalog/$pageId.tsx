/* eslint-disable */
// @ts-nocheck

import { createFileRoute, useParams } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import { QRCodeCanvas } from 'qrcode.react'

export const Route = createFileRoute('/smart-catalog/$pageId')({
  component: PublicCatalogPage,
})

function PublicCatalogPage() {
  const { pageId } = useParams({ from: '/smart-catalog/$pageId' })
  const [catalog, setCatalog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const catalogRef = ref(db, `khmer-ai-chat/pages/${pageId}/catalogs/default`)
    const unsubscribe = onValue(catalogRef, (snapshot) => {
      setCatalog(snapshot.val() || null)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [pageId])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading catalog...</div>
  }
  if (!catalog) {
    return <div className="flex items-center justify-center h-screen">Catalog not found</div>
  }

  const pageTitle = catalog?.title ? catalog.title : 'Smart e‑Catalog'
  const catalogUrl = `${window.location.origin}/smart-catalog/${pageId}`

  // ✅ Download QR as PNG
  const downloadQR = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `catalog-${pageId}-qr.png`
    link.click()
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div className="min-h-screen bg-light-100 dark:bg-dark-900 text-dark-900 dark:text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">{catalog.title}</h1>
        {catalog.description && (
          <p className="mb-8 text-gray-600 dark:text-gray-300">{catalog.description}</p>
        )}

        {/* ✅ QR Code toggle + download */}
        <div className="mb-8">
          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
          >
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
          {showQR && (
            <div className="mt-4 flex flex-col items-center">
              <QRCodeCanvas value={catalogUrl} size={180} />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Scan to open: {catalogUrl}
              </p>
              <button
                onClick={downloadQR}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Download QR
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.products &&
            Object.entries(catalog.products).map(([id, product]: any) => (
              <div
                key={id}
                className="p-4 rounded-lg shadow bg-white dark:bg-dark-700 flex flex-col"
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
                <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-2">${product.price}</p>
                {product.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {product.description}
                  </p>
                )}
                <button className="mt-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded">
                  Chat with Agent
                </button>
              </div>
            ))}
        </div>
      </div>
    </HelmetProvider>
  )
}

export default PublicCatalogPage
