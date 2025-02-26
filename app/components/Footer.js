'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      })
    }, { threshold: 0.1 })

    const footerElement = document.getElementById('footer')
    if (footerElement) {
      observer.observe(footerElement)
    }

    return () => {
      if (footerElement) {
        observer.unobserve(footerElement)
      }
    }
  }, [])

  return (
    <footer 
      id="footer" 
      className={`py-12 px-6 bg-gradient-to-b from-background to-secondary border-t border-border transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M20 5C21.8713 10.1683 25.8992 13.75 30 15C25.8992 16.25 21.8713 19.8317 20 25C18.1287 19.8317 14.1008 16.25 10 15C14.1008 13.75 18.1287 10.1683 20 5Z" fill="hsl(var(--primary))" />
                  <path d="M20 25C21.0949 28.3367 23.566 30.5 26 31.25C23.566 32 21.0949 34.1633 20 37.5C18.9051 34.1633 16.434 32 14 31.25C16.434 30.5 18.9051 28.3367 20 25Z" fill="hsl(var(--primary))" opacity="0.6" />
                </svg>
              </div>
              <span className="text-lg font-bold">PlantID</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Instantly identify plants and get detailed care instructions with our powerful AI technology.
            </p>
            <div className="flex space-x-4">
              {['twitter', 'instagram', 'facebook', 'github'].map((social) => (
                <a 
                  key={social} 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`${social} link`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Products</h3>
            <ul className="space-y-3">
              {['Plant Identification', 'Care Guides', 'Disease Detection', 'Community Forums'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {['Documentation', 'Blog', 'FAQ', 'Plant Encyclopedia'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © {currentYear} PlantID. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}