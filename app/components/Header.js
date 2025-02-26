'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-lg m-2 rounded-md ${
      isScrolled ? 'py-2 glassmorphism shadow-sm' : 'py-4 bg-transparent'
    }`}>
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-20">
            <div className={`relative w-10 h-10 transition-all duration-300 ${isScrolled ? 'scale-90' : ''}`}>
              <svg 
                viewBox="0 0 40 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full"
              >
                <path 
                  d="M20 5C21.8713 10.1683 25.8992 13.75 30 15C25.8992 16.25 21.8713 19.8317 20 25C18.1287 19.8317 14.1008 16.25 10 15C14.1008 13.75 18.1287 10.1683 20 5Z" 
                  fill="hsl(var(--primary))" 
                  className="animate-float"
                />
                <path 
                  d="M20 25C21.0949 28.3367 23.566 30.5 26 31.25C23.566 32 21.0949 34.1633 20 37.5C18.9051 34.1633 16.434 32 14 31.25C16.434 30.5 18.9051 28.3367 20 25Z" 
                  fill="hsl(var(--primary))" 
                  className="animate-float animation-delay-300"
                  opacity="0.6"
                />
              </svg>
            </div>
            <span className={`font-outfit text-xl font-bold transition-all duration-300 ${
              isScrolled ? 'text-foreground' : 'text-foreground'
            }`}>
              PlantID
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {['Home', 'About', 'Features', 'Pricing'].map((item, i) => (
                <li key={item}>
                  <Link 
                    href={`/#${item.toLowerCase()}`} 
                    className={`text-sm font-medium transition-all duration-300 hover:text-primary ${
                      isScrolled ? 'text-foreground' : 'text-foreground'
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/#upload" className="btn-primary">
              Identify Plant
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden z-20 focus:outline-none" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-5">
              <span 
                className={`absolute h-0.5 w-6 bg-foreground transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''
                }`}
                style={{ top: '0' }}
              />
              <span 
                className={`absolute h-0.5 w-6 bg-foreground transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`} 
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
              <span 
                className={`absolute h-0.5 w-6 bg-foreground transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''
                }`}
                style={{ bottom: '0' }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`fixed inset-0 z-10 bg-background flex flex-col items-center justify-center transition-all duration-500 ${
          mobileMenuOpen 
            ? 'opacity-100 visible' 
            : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col items-center">
          <ul className="space-y-8 text-center">
            {['Home', 'About', 'Features', 'Pricing'].map((item, i) => (
              <li key={item} className={`transform transition-all duration-300 delay-${i * 100}`}>
                <Link 
                  href={`/#${item.toLowerCase()}`} 
                  className="text-2xl font-medium text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link 
                href="/#upload" 
                className="btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Identify Plant
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}