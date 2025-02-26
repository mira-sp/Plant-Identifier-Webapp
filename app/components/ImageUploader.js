'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export default function ImageUploader({ onImageUpload, isLoading }) {
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

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

  const handleFileUploadClick = () => {
    fileInputRef.current.click()
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use the back camera on phones if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      setCameraStream(stream)
      setCameraActive(true)
      setCameraPermissionDenied(false)
      
      // Connect the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraPermissionDenied(true)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      // Create a File object from the blob
      const capturedImage = new File([blob], 'captured-plant.jpg', { type: 'image/jpeg' })
      
      // Stop the camera
      stopCamera()
      
      // Handle the file as if it was uploaded
      handleFile(capturedImage)
    }, 'image/jpeg', 0.95) // High quality JPEG
  }

  const resetImage = (e) => {
    if (e) {
      e.stopPropagation()
    }
    setPreview(null)
    onImageUpload(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {cameraActive ? (
        <div className="card p-4">
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-64 object-cover rounded-lg bg-black"
            />
            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                className="btn-primary"
                onClick={capturePhoto}
                disabled={isLoading}
              >
                Capture Photo
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={stopCamera}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : preview ? (
        <div 
          className="card p-4 text-center"
          onClick={handleFileUploadClick}
        >
          <div className="relative">
            <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
              <Image
                src={preview}
                alt="Plant preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="flex justify-center space-x-4">
              <button
                type="button" 
                className="btn-primary"
                onClick={resetImage}
                disabled={isLoading}
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`card border-2 border-dashed p-8 text-center ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
          } transition-colors duration-200 cursor-pointer relative`}
          onClick={handleFileUploadClick}
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
          
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">Upload a plant image</h3>
          <p className="text-sm text-gray-500 mb-4">Drag and drop or choose an option below</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xs mx-auto">
            <button
              type="button"
              className="btn-primary"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation()
                handleFileUploadClick()
              }}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
              </div>
            </button>
            
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                startCamera()
              }}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
          </div>
          
          {cameraPermissionDenied && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded">
              Camera access was denied. Please check your browser settings.
            </div>
          )}
        </div>
      )}
    </div>
  )
}