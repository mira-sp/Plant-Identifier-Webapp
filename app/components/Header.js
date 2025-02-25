import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="py-4 px-6 bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary-600">
              <path d="M12 2L14.8 8.8L22 10L17 15.4L18.2 23L12 19.4L5.8 23L7 15.4L2 10L9.2 8.8L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl font-bold text-primary-700">PlantID</span>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="#about" className="text-gray-600 hover:text-primary-600 transition-colors">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}