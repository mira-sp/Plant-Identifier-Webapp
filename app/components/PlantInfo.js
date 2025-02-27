'use client'

import { useState } from 'react'

export default function PlantInfo({ plantData }) {
  const [activeTab, setActiveTab] = useState('overview')
  
  if (!plantData) return null

  const { name, scientificName, description, careInfo, funFacts , nativeRegions = [] }= plantData
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'care', label: 'Care Info' },
    { id: 'map', label: 'Native Regions' },
    { id: 'facts', label: 'Fun Facts' }
  ]

  return (
    <div className="card w-full max-w-2xl mx-auto bg-white shadow-lg p-6 rounded-lg border ">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
          <p className="text-sm italic text-gray-500">{scientificName}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 -mb-px text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {activeTab === 'care' && (
          <div>
            <ul className="space-y-3">
              {Object.entries(careInfo).map(([key, value]) => (
                <li key={key} className="flex">
                  <span className="font-medium text-gray-700 mr-2">{key}:</span>
                  <span className="text-gray-600">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
         {activeTab === 'map' && (
          <div className="-mx-6">
            <PlantMap regions={nativeRegions} />
          </div>
        )}
        {activeTab === 'facts' && (
          <div>
            <ul className="list-disc list-inside space-y-2">
              {funFacts.map((fact, index) => (
                <li key={index} className="text-gray-700">{fact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}