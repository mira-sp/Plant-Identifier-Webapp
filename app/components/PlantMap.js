'use client'

import { useEffect, useRef } from 'react'

export default function PlantMap({ regions = [] }) {
  const mapRef = useRef(null)
  
  // Default regions if none are provided
  const plantRegions = regions.length > 0 ? regions : []
  
  useEffect(() => {
    if (!mapRef.current) return
    
    // Set up map dimensions
    const width = mapRef.current.clientWidth
    const height = Math.max(300, width * 0.5) // Responsive height based on width
    
    // Clear previous map if any
    while (mapRef.current.firstChild) {
      mapRef.current.removeChild(mapRef.current.firstChild)
    }
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', height)
    svg.setAttribute('viewBox', '0 0 1000 500')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    mapRef.current.appendChild(svg)
    
    // Define world regions and their paths
    const worldRegions = {
      'North America': 'M 180 150 L 300 80 L 390 120 L 370 200 L 330 250 L 250 290 L 170 270 L 120 210 Z',
      'South America': 'M 220 300 L 260 290 L 310 330 L 330 420 L 270 470 L 230 400 L 210 350 Z',
      'Europe': 'M 490 120 L 570 100 L 520 150 L 500 190 L 460 170 L 440 140 Z',
      'Africa': 'M 450 190 L 520 190 L 580 230 L 580 340 L 530 390 L 470 370 L 430 310 L 430 220 Z',
      'Asia': 'M 580 100 L 800 100 L 900 170 L 850 280 L 750 300 L 670 270 L 620 300 L 580 230 L 520 180 L 570 130 Z',
      'Australia': 'M 800 320 L 880 320 L 900 380 L 850 410 L 800 380 Z',
    }
    
    // Draw each region
    Object.entries(worldRegions).forEach(([region, path]) => {
      const isHighlighted = plantRegions.includes(region)
      
      const regionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      regionPath.setAttribute('d', path)
      regionPath.setAttribute('fill', isHighlighted ? '#22c55e' : '#e5e7eb')
      regionPath.setAttribute('stroke', '#6b7280')
      regionPath.setAttribute('stroke-width', '1')
      regionPath.setAttribute('data-region', region)
      
      // Add hover effects
      regionPath.onmouseover = () => {
        regionPath.setAttribute('fill', isHighlighted ? '#16a34a' : '#d1d5db')
      }
      regionPath.onmouseout = () => {
        regionPath.setAttribute('fill', isHighlighted ? '#22c55e' : '#e5e7eb')
      }
      
      // Add tooltip with region name
      regionPath.onmouseenter = (e) => {
        const tooltip = document.createElement('div')
        tooltip.textContent = region
        tooltip.className = 'absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded pointer-events-none'
        tooltip.style.left = `${e.clientX}px`
        tooltip.style.top = `${e.clientY - 30}px`
        tooltip.id = 'region-tooltip'
        document.body.appendChild(tooltip)
      }
      
      regionPath.onmousemove = (e) => {
        const tooltip = document.getElementById('region-tooltip')
        if (tooltip) {
          tooltip.style.left = `${e.clientX}px`
          tooltip.style.top = `${e.clientY - 30}px`
        }
      }
      
      regionPath.onmouseleave = () => {
        const tooltip = document.getElementById('region-tooltip')
        if (tooltip) {
          document.body.removeChild(tooltip)
        }
      }
      
      svg.appendChild(regionPath)
    })
    
    // Add seas/oceans
    const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    ocean.setAttribute('x', '0')
    ocean.setAttribute('y', '0')
    ocean.setAttribute('width', '1000')
    ocean.setAttribute('height', '500')
    ocean.setAttribute('fill', '#dbeafe')
    ocean.setAttribute('z-index', '-1')
    svg.insertBefore(ocean, svg.firstChild)
    
  }, [regions, plantRegions])
  
  return (
    <div className="card w-full max-w-2xl mx-auto mt-8">
      <h3 className="text-xl font-semibold mb-4">Native Regions</h3>
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg overflow-hidden relative"
        aria-label="World map showing plant native regions"
      ></div>
      
      <div className="mt-4 flex items-center">
        <div className="w-4 h-4 bg-primary-500 rounded-sm mr-2"></div>
        <span className="text-sm text-gray-600">Regions where this plant is commonly found</span>
      </div>
      
      {plantRegions.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Native to: </span>
            {plantRegions.join(', ')}
          </p>
        </div>
      )}
      
      {plantRegions.length === 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 italic">
            No specific native regions identified for this plant
          </p>
        </div>
      )}
    </div>
  )
}