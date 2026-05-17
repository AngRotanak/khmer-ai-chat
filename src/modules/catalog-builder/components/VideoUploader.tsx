/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react'

export default function VideoUploader({ value = [], onChange, uploadVideo }) {
  const [videos, setVideos] = useState(
    (value || []).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      thumbnail: null,
      metadata: null,
      progress: 0,
      isUploading: false,
    }))
  )
  const [isDragging, setIsDragging] = useState(false)

  const generateThumbnailAndMetadata = (videoFile, callback) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(videoFile)
    video.crossOrigin = 'anonymous'
    video.currentTime = 1

    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnailUrl = canvas.toDataURL('image/png')

      const metadata = {
        duration: video.duration.toFixed(1) + 's',
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        size: (videoFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      }

      callback({ thumbnailUrl, metadata })
    })
  }

  const handleFiles = async (files) => {
    const newVideos = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      thumbnail: null,
      metadata: null,
      progress: 0,
      isUploading: false,
    }))

    newVideos.forEach((video) => {
      generateThumbnailAndMetadata(video.file, ({ thumbnailUrl, metadata }) => {
        video.thumbnail = thumbnailUrl
        video.metadata = metadata
        setVideos((prev) => [...prev])
      })
    })

    const updated = [...(videos || []), ...newVideos]
    setVideos(updated)
    if (onChange) onChange(updated.map((v) => v.file))

    if (uploadVideo) {
      newVideos.forEach(async (video) => {
        video.isUploading = true
        setVideos([...updated])
        try {
          await uploadVideo(
            video.file,
            (p) => {
              video.progress = p
              setVideos([...updated])
            },
            {
              thumbnail: video.thumbnail,
              metadata: video.metadata,
            }
          )
        } finally {
          video.isUploading = false
          setVideos([...updated])
        }
      })
    }
  }

  const handleFileChange = (e) => handleFiles(e.target.files)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeVideo = (index) => {
    const updated = (videos || []).filter((_, i) => i !== index)
    setVideos(updated)
    if (onChange) onChange(updated.map((v) => v.file))
  }

  return (
    <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
      <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
        Upload Videos
      </label>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
          isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          Drag & drop videos here, or click to select
        </p>
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="video-input"
        />
        <label
          htmlFor="video-input"
          className="bg-teal-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-teal-700 dark:hover:bg-teal-500"
        >
          Choose Files
        </label>
      </div>

      {/* Video Previews */}
      <div className="mt-4 space-y-4">
        {(videos || []).map((video, idx) => (
          <div
            key={idx}
            className="border rounded p-2 flex gap-4 items-start bg-gray-50 dark:bg-gray-800"
          >
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt="thumbnail"
                className="w-32 h-20 object-cover rounded shadow"
              />
            ) : (
              <div className="w-32 h-20 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
                Generating...
              </div>
            )}

            <div className="flex-1">
              <video
                src={video.previewUrl}
                controls
                className="w-full rounded shadow mb-2"
              />

              {video.metadata && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <p>Duration: {video.metadata.duration}</p>
                  <p>Resolution: {video.metadata.resolution}</p>
                  <p>Size: {video.metadata.size}</p>
                </div>
              )}

              {video.isUploading && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded mb-2">
                  <div
                    className="bg-teal-600 text-white text-xs leading-none py-1 rounded"
                    style={{ width: `${video.progress}%` }}
                  >
                    {video.progress}%
                  </div>
                </div>
              )}

              <button
                onClick={() => removeVideo(idx)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 dark:hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
