import React, { useState } from 'react'

type CatalogItem = {
  id: string
  title: string
  description: string
  image_url: string
  price?: string
}

export const ECatalogPanel: React.FC = () => {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')

  const addItem = () => {
    const newItem: CatalogItem = {
      id: Date.now().toString(),
      title,
      description,
      image_url: imageUrl,
      price,
    }
    setItems([...items, newItem])
    setTitle('')
    setDescription('')
    setImageUrl('')
    setPrice('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const generateLink = () => {
    // TODO: implement backend logic to persist catalog and return shareable link
    alert('Catalog link generated: https://khmerai.chat/catalog/abc123')
  }

  return (
    <div className="p-4 bg-dark-800 rounded-lg">
      <h3 className="text-sm font-semibold mb-3 text-light-100">E-Catalog Builder</h3>

      {/* Form to add item */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Product Title"
          className="h-8 px-2 rounded bg-dark-600 text-light-100 text-xs"
        />
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          className="h-8 px-2 rounded bg-dark-600 text-light-100 text-xs"
        />
        <input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Image URL"
          className="h-8 px-2 rounded bg-dark-600 text-light-100 text-xs"
        />
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Price"
          className="h-8 px-2 rounded bg-dark-600 text-light-100 text-xs"
        />
        <button
          onClick={addItem}
          className="bg-teal-500 text-white text-xs px-3 py-1 rounded"
        >
          Add Item
        </button>
      </div>

      {/* Catalog Items */}
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.id} className="border border-dark-600 rounded p-2">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-24 object-cover rounded" />}
            <div className="mt-2 text-xs font-semibold">{item.title}</div>
            <div className="text-xs">{item.description}</div>
            {item.price && <div className="text-xs text-teal-400">{item.price}</div>}
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-400 text-xs mt-1"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Generate Link */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={generateLink}
          className="bg-teal-600 text-white text-xs px-3 py-1 rounded"
        >
          Generate Catalog Link
        </button>
      </div>
    </div>
  )
}
