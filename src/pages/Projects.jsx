export default function Projects() {
  const projects = [
    { title: '3D Animation Reel', image: '/3d-animation.jpg' },
    { title: 'Logo Motion', image: '/logo-motion.jpg' },
  ]

  return (
    <section>
      <h2>Projects</h2>
      <div className="project-grid">
        {projects.map((proj, i) => (
          <div key={i} className="project-card">
            <img src={proj.image} alt={proj.title} />
            <h3>{proj.title}</h3>
          </div>
        ))}
      </div>
    </section>
  )
}