function About() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-4xl font-bold text-primary mb-4">About</h1>
        <p className="text-lg text-gray-600 mb-4">
          This project was created using the jgd-fe-cli tool.
        </p>
        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">Tech Stack</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>React 18</li>
            <li>Vite</li>
            <li>TypeScript</li>
            <li>TailwindCSS</li>
            <li>React Router</li>
          </ul>
        </div>
        <div className="mt-6">
          <p className="text-secondary font-medium">
            Custom colors are configured: primary (#1E40AF) and secondary (#14B8A6)
          </p>
        </div>
      </div>
    </div>
  )
}

export default About

