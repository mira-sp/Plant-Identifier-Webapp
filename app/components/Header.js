'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'py-3 bg-white bg-opacity-80 backdrop-blur-md shadow-subtle' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className={`relative w-10 h-10 transition-transform duration-300 ${scrolled ? 'scale-90' : 'scale-100'} group-hover:rotate-3`}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M20 4C28.8366 4 36 11.1634 36 20C36 28.8366 28.8366 36 20 36C11.1634 36 4 28.8366 4 20C4 11.1634 11.1634 4 20 4Z" fill="#DCFCE7" />
                <path d="M20 4C24.4183 4 28 11.1634 28 20C28 28.8366 24.4183 36 20 36C15.5817 36 12 28.8366 12 20C12 11.1634 15.5817 4 20 4Z" fill="#22C55E" fillOpacity="0.7" />
                <path d="M25.6757 10.8954C25.875 11.2399 25.75 11.6736 25.4055 11.8729L21.383 14.209C21.0385 14.4082 20.6048 14.2832 20.4055 13.9387C20.2063 13.5942 20.3313 13.1605 20.6757 12.9613L24.6983 10.6251C25.0428 10.4259 25.4765 10.5509 25.6757 10.8954Z" fill="#15803D" />
                <path d="M15.0328 22.8954C15.232 23.2399 15.107 23.6736 14.7625 23.8729L10.74 26.209C10.3955 26.4082 9.9618 26.2832 9.7626 25.9387C9.5633 25.5942 9.6883 25.1605 10.0328 24.9613L14.0553 22.6251C14.3998 22.4259 14.8335 22.5509 15.0328 22.8954Z" fill="#15803D" />
              </svg>
            </div>
            <span className={`text-xl font-bold transition-all duration-300 ${
              scrolled ? 'text-dark-700' : 'text-dark-800'
            } group-hover:text-primary-600`}>PlantID</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-10">
              <li>
                <Link href="/" className="navbar-link">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#features" className="navbar-link">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="navbar-link">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#testimonials" className="navbar-link">
                  Testimonials
                </Link>
              </li>
            </ul>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/#identify" className="btn-primary">
              Identify Plant
              <svg className="ml-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex items-center p-2 rounded-md text-dark-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white shadow-md transition-all duration-300 overflow-hidden ${
        mobileMenuOpen ? 'max-h-96' : 'max-h-0'
      }`}>
        <nav className="container mx-auto px-4 py-4">
          <ul className="space-y-3">
            <li>
              <Link 
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-4 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-4 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Features
              </Link>
            </li>
            <li>
              <Link 
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-4 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link 
                href="/#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-4 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Testimonials
              </Link>
            </li>
            <li className="pt-2">
              <Link 
                href="/#identify"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Identify Plant
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}