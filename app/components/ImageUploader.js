'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

export default function ImageUploader({ onImageUpload, isLoading }) {
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    
    // Create URL for preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    
    // Send to parent component
    onImageUpload(file)
    
    // Clean up
    return () => URL.revokeObjectURL(objectUrl)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    handleFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`card border-2 border-dashed p-8 text-center ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        } transition-colors duration-200 cursor-pointer relative`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        aria-label="Drop zone for plant images"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
        />
        
        {!preview ? (
          <>
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Upload a plant image</h3>
            <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
            <button
              type="button"
              className="btn-primary w-full max-w-xs mx-auto"
              disabled={isLoading}
            >
              Select Image
            </button>
          </>
        ) : (
          <div className="relative">
            <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
              <Image
                src={preview}
                alt="Plant preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <button
              type="button" 
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                onImageUpload(null)
              }}
              disabled={isLoading}
            >
              Change Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}