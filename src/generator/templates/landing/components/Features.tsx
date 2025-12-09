function Features() {
  const features = [
    {
      title: 'Fast Performance',
      description: 'Lightning fast loading times and smooth interactions',
      icon: '⚡'
    },
    {
      title: 'Secure',
      description: 'Enterprise-grade security for your data',
      icon: '🔒'
    },
    {
      title: 'Scalable',
      description: 'Grows with your business needs',
      icon: '📈'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

