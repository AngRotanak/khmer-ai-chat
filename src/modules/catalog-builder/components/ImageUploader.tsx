/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

export default function ImageUploader({ value = [], onChange, uploadImage }) {
  const [images, setImages] = useState(
    (value || []).map((file, idx) => ({
      id: idx.toString(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      isUploading: false,
      isCover: idx === 0,
    }))
  )

  const handleFiles = async (files) => {
    const newImages = Array.from(files).map((file, idx) => ({
      id: (images.length + idx).toString(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      isUploading: false,
      isCover: false,
    }))

    const updated = [...(images || []), ...newImages]
    setImages(updated)
    if (onChange) onChange(updated)

    if (uploadImage) {
      newImages.forEach(async (img) => {
        img.isUploading = true
        setImages([...updated])
        try {
          await uploadImage(img.file, (p) => {
            img.progress = p
            setImages([...updated])
          })
        } finally {
          img.isUploading = false
          setImages([...updated])
        }
      })
    }
  }

  const handleFileChange = (e) => handleFiles(e.target.files)

  const removeImage = (index) => {
    const updated = (images || []).filter((_, i) => i !== index)
    setImages(updated)
    if (onChange) onChange(updated)
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    const reordered = Array.from(images || [])
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setImages(reordered)
    if (onChange) onChange(reordered)
  }

  const setCoverImage = (index) => {
    const updated = (images || []).map((img, i) => ({
      ...img,
      isCover: i === index,
    }))
    setImages(updated)
    if (onChange) onChange(updated)
  }

  return (
    <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="mb-4 text-gray-700 dark:text-gray-300"
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div
              className="flex gap-4 overflow-x-auto"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {(images || []).map((img, idx) => (
                <Draggable key={img.id} draggableId={img.id} index={idx}>
                  {(provided) => (
                    <div
                      className="relative bg-gray-50 dark:bg-gray-800 rounded shadow"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <img
                        src={img.previewUrl}
                        alt="preview"
                        className={`w-32 h-32 object-cover rounded ${
                          img.isCover ? 'ring-4 ring-teal-500' : ''
                        }`}
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          onClick={() => setCoverImage(idx)}
                          className={`px-2 py-1 rounded text-xs ${
                            img.isCover
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500'
                          }`}
                        >
                          {img.isCover ? 'Cover' : 'Set Cover'}
                        </button>
                        <button
                          onClick={() => removeImage(idx)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 dark:hover:bg-red-500"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
