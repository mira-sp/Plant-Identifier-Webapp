'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export default function ImageUploader({ onImageUpload, isLoading }) {
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    setIsVisible(true)
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      })
    }, { threshold: 0.1 })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

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
    <div 
      ref={containerRef}
      className={`w-full max-w-md mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
        } cursor-pointer`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        aria-label="Drop zone for plant images"
      >
        {/* Decorative background elements */}
        <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
        />
        
        {!preview ? (
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative h-16 w-16 animate-float">
                <svg className="w-full h-full text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 18V15M12 18V12M17 18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500">Drag & drop an image here</p>
        </div>
      ) : (
        <div className="relative z-10">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}
    </div>
  </div>
)}