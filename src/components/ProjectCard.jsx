// src/components/ProjectCard.jsx
import { motion } from "framer-motion";

export default function ProjectCard({ title, description, image, link, tech }) {
  return (
    <motion.a
      href={link}
      className="group relative rounded-xl overflow-hidden shadow-md bg-neutral-900 hover:shadow-xl transition-all"
      whileHover={{ scale: 1.03 }}
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
        <ul className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
          {tech.map((tag) => (
            <li key={tag} className="px-2 py-1 bg-gray-800 rounded-md">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </motion.a>
  );
}
