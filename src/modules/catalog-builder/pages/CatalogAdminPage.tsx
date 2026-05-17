/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import DualPreviewLayout from '../components/DualPreviewLayout'
import ProductForm from '../components/ProductForm'
import ProductPreview from '../components/ProductPreview'
import CategorySidebar from '../components/CategorySidebar'
import BulkActionsToolbar from '../components/BulkActionsToolbar'

import { db_firestore } from '~/lib/firebase'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

export default function CatalogAdminPage() {
  // --- State ---
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [product, setProduct] = useState({
    id: 'new',
    pageId: '123',
    title: '',
    description: '',
    price: 0,
    discount: null,
    images: [],
    video: null,
    category: '',
    tags: [],
  })
  const [selectedProducts, setSelectedProducts] = useState([])

  // --- Firestore References ---
  const categoriesRef = collection(db_firestore, 'categories')
  const productsRef = collection(db_firestore, 'products')

  // --- Real-time listeners ---
  useEffect(() => {
    const unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    return () => {
      unsubCategories()
      unsubProducts()
    }
  }, [])

  // --- Handlers ---
  const handleSelectCategory = (id) => {
    setProduct({ ...product, category: id })
  }

  const handleAddCategory = async () => {
    await addDoc(categoriesRef, { name: 'New Category', children: [] })
  }

  const handleMoveCategory = (dragId, dropId) => {
    console.log(`Move category ${dragId} into ${dropId}`)
    // implement reordering logic here
  }

  const handleSaveProduct = async () => {
    if (product.id === 'new') {
      await addDoc(productsRef, product)
    } else {
      const docRef = doc(db_firestore, 'products', product.id)
      await updateDoc(docRef, product)
    }
  }

  const handleDeleteProducts = async () => {
    for (const id of selectedProducts) {
      const docRef = doc(db_firestore, 'products', id)
      await deleteDoc(docRef)
    }
    setSelectedProducts([])
  }

  const handleMoveProducts = () => {
    console.log('Moving products:', selectedProducts)
    // implement move logic here
  }

  const handleApplyDiscount = () => {
    console.log('Applying discount to products:', selectedProducts)
    // implement bulk discount logic here
  }

  // --- Render ---
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <CategorySidebar
        categories={categories}
        onSelect={handleSelectCategory}
        onAddCategory={handleAddCategory}
        onMoveCategory={handleMoveCategory}
      />

      {/* Main Content: Dual Preview */}
      <DualPreviewLayout
        children={
          <div>
            <ProductForm product={product} onChange={setProduct} />
            <button
              onClick={handleSaveProduct}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
            >
              Save Product
            </button>
          </div>
        }
        preview={<ProductPreview product={product} />}
      />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedProducts.length}
        onDelete={handleDeleteProducts}
        onMoveCategory={handleMoveProducts}
        onApplyDiscount={handleApplyDiscount}
      />
    </div>
  )
}
