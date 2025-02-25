'use client'

import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ImageUploader from './components/ImageUploader'
import PlantInfo from './components/PlantInfo'
import LoadingState from './components/LoadingState'

export default function Home() {
  const [plantData, setPlantData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleImageUpload = async (file) => {
    if (!file) {
      setPlantData(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Create form data
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to identify plant')
      }

      const data = await response.json()
      setPlantData(data)
    } catch (err) {
      console.error('Error identifying plant:', err)
      setError('Sorry, we couldn\'t identify your plant. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="flex-grow">
        <section className="py-12 px-6">
          <div className="container mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Identify Any Plant Instantly</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload a photo and our AI will identify your plant and provide care information.
            </p>
          </div>

          <div className="container mx-auto max-w-4xl">
            <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />
            
            <div className="mt-12">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-red-600">{error}</p>
                  <button
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    onClick={() => setError(null)}
                  >
                    Try Again
                  </button>
                </div>
              ) : plantData ? (
                <PlantInfo plantData={plantData} />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500">Upload a plant image to get started</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="about" className="py-12 px-6 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Take a Photo</h3>
                <p className="text-gray-600">Upload a clear image of the plant you want to identify.</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-600">Our advanced AI analyzes the image to identify the plant species.</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Information</h3>
                <p className="text-gray-600">Receive detailed information about the plant and how to care for it.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}