function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <form className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea className="w-full p-2 border rounded" rows={4}></textarea>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}

export default Contact

