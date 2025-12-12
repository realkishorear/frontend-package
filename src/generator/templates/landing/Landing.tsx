import { Link } from 'react-router-dom'
import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'

function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Brand</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>
      <Hero />
      <Features />
      <Footer />
    </div>
  )
}

export default Landing

