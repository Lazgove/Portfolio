// src/components/ProjectGrid.jsx
import ProjectCard from "./ProjectCard";
import { projects } from "../data/projects.js";

export default function ProjectGrid() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {projects.map((project, index) => (
        <ProjectCard key={index} {...project} />
      ))}
    </section>
  );
}
