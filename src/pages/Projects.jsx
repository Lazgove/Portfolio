// src/components/Projects.jsx
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";

export default function Projects() {
  return (
    <section className="p-6">
      <h2 className="text-3xl font-semibold mb-6 text-white">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj, i) => (
          <ProjectCard key={i} {...proj} />
        ))}
      </div>
    </section>
  );
}
