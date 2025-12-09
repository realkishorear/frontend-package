function Home() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome Home</h1>
        <p className="text-lg text-gray-600 mb-6">
          This is a React + Vite + TypeScript + TailwindCSS application
        </p>
        <div className="space-x-4">
          <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home

