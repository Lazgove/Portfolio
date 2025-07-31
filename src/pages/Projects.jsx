export default function Projects() {
  const projects = [
    { title: '3D Animation Reel', image: '/3d-animation.jpg' },
    { title: 'Logo Motion', image: '/logo-motion.jpg' },
  ]

  return (
    <section>
      <h2 className="text-3xl font-semibold mb-6">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj, i) => (
          <div key={i} className="border rounded-xl shadow hover:shadow-lg transition p-4">
            <img src={proj.image} alt={proj.title} className="rounded mb-2" />
            <h3 className="font-medium text-xl">{proj.title}</h3>
          </div>
        ))}
      </div>
    </section>
  )
}