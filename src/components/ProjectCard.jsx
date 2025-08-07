import Tilt from 'react-parallax-tilt';

export default function ProjectCard({ title, image, description, tech, link }) {
  return (
    <Tilt
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      glareEnable={true}
      glareMaxOpacity={0.2}
      className="rounded-xl"
    >
      <a
        href={link || "#"}
        className="block group relative overflow-hidden rounded-xl shadow-md 
                   bg-white/5 backdrop-blur-md hover:shadow-xl transition-all border border-white/10"
      >
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-xl"
        />
        <div className="p-4 backdrop-blur-sm bg-white/5 rounded-b-xl">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-gray-300">{description}</p>}
          {tech && (
            <ul className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
              {tech.map((tag) => (
                <li key={tag} className="px-2 py-1 bg-gray-800/60 rounded-md">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </a>
    </Tilt>
  );
}
