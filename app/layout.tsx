import { Inter, Outfit } from 'next/font/google'
import './globals.css'

// Font configuration 
const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'PlantID - Instant Plant Identification with AI',
  description: 'Upload photos of plants and get instant identification using advanced AI technology',
  keywords: 'plant identification, plant app, plant care, gardening, house plants, AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased`}>
        <div className="flex flex-col min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
