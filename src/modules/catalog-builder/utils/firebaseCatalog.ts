/* eslint-disable */
// @ts-nocheck

import { db, db_firestore } from '~/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import {
  ref,
  set,
  get,
  remove,
} from 'firebase/database'

// --- Firestore Collections ---
const productsRef = collection(db_firestore, 'products')
const categoriesRef = collection(db_firestore, 'categories')

// --- Firestore Product CRUD ---
export async function fetchProducts() {
  const snapshot = await getDocs(productsRef)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export async function fetchProduct(id: string) {
  const docRef = doc(db_firestore, 'products', id)
  const snapshot = await getDoc(docRef)
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function addProduct(product: any) {
  const docRef = await addDoc(productsRef, product)
  return { id: docRef.id, ...product }
}

export async function updateProduct(id: string, product: any) {
  const docRef = doc(db_firestore, 'products', id)
  await updateDoc(docRef, product)
  return { id, ...product }
}

export async function deleteProduct(id: string) {
  const docRef = doc(db_firestore, 'products', id)
  await deleteDoc(docRef)
  return id
}

// --- Firestore Category CRUD ---
export async function fetchCategories() {
  const snapshot = await getDocs(categoriesRef)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export async function addCategory(category: any) {
  const docRef = await addDoc(categoriesRef, category)
  return { id: docRef.id, ...category }
}

export async function updateCategory(id: string, category: any) {
  const docRef = doc(db_firestore, 'categories', id)
  await updateDoc(docRef, category)
  return { id, ...category }
}

export async function deleteCategory(id: string) {
  const docRef = doc(db_firestore, 'categories', id)
  await deleteDoc(docRef)
  return id
}

// --- Realtime Database (optional for live sync) ---
export async function setRealtimeProduct(productId: string, product: any) {
  const productRef = ref(db, `products/${productId}`)
  await set(productRef, product)
}

export async function getRealtimeProduct(productId: string) {
  const productRef = ref(db, `products/${productId}`)
  const snapshot = await get(productRef)
  return snapshot.exists() ? snapshot.val() : null
}

export async function deleteRealtimeProduct(productId: string) {
  const productRef = ref(db, `products/${productId}`)
  await remove(productRef)
}
