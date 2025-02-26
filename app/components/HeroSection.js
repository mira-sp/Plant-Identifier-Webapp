'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { staggerAnimation } from '../lib/animations';

export default function HeroSection() {
  const elementsRef = useRef([]);
  
  useEffect(() => {
    const elements = elementsRef.current;
    if (elements.length > 0) {
      staggerAnimation(elements, { delay: 0.15, initialDelay: 0.3 });
    }
  }, []);
  
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-60 -z-10"></div>
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="animate-in slide-up-in" ref={el => elementsRef.current[0] = el}>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></span>
                Powered by Google Gemini AI
              </span>
            </div>
            </div>
            </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-in slide-up-in" ref={el => elementsRef.current[1] = el}>
              Identify <span className="text-gradient">Any Plant</span> In Seconds
            </h1>
            
            <p className="text-xl text-dark-600 animate-in slide-up-in" ref={el => elementsRef.current[2] = el}>
              Take a photo, get instant identification and care tips for any plant you encounter. Powered by advanced AI to provide accurate results.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-in slide-up-in" ref={el => elementsRef.current[3] = el}>
              <Link href="/#identify" className="btn-primary">
                Start Identifying
                <svg className="ml-2 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link> </div>
              </section>)}