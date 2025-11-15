import React from "react";
import { projects } from "../lib/utils";

interface Props {
  title?: string;
}

export default function ProjectGrid({
  title = "Index of /pybash/everything",
}: Props) {
  return (
    <div className="min-w-screen flex min-h-screen flex-col gap-6 bg-background px-6 py-6 font-['JetBrains_Mono'] text-foreground sm:gap-3 sm:px-4 sm:py-0 md:px-6">
      <h1 className="pt-2 text-4xl font-bold leading-tight sm:pt-4 sm:text-3xl md:text-4xl">
        {title}
      </h1>
      <hr className="border-border" />

      {/* Mobile Layout - Stacked Cards */}
      <div className="block space-y-8 sm:hidden">
        {projects.map((project, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-background-light p-6 shadow-lg"
          >
            <div className="mb-4 text-2xl font-bold leading-tight">
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo underline transition duration-500 ease-in-out visited:text-accent-fuchsia hover:text-accent"
                >
                  {project.name}
                </a>
              ) : (
                <span className="text-foreground">{project.name}</span>
              )}
            </div>
            <div className="mb-4 text-lg leading-relaxed text-foreground-muted">
              {project.description}
            </div>
            <div className="inline-block rounded-lg bg-background-light px-3 py-2 text-base font-medium text-foreground-muted">
              {project.status}
            </div>
          </div>
        ))}
      </div>

      {/* Tablet and Desktop Layout - Grid */}
      <div className="hidden w-fit grid-cols-3 gap-x-4 text-base sm:grid md:gap-x-6">
        <div className="font-bold">Name</div>
        <div className="font-bold">Description</div>
        <div className="font-bold">Status</div>
        {projects.map((project, index) => (
          <React.Fragment key={index}>
            <div className="py-1">
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo transition duration-500 ease-in-out visited:text-accent-fuchsia hover:text-accent"
                >
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </div>
            <div className="py-1">
              {project.description}
            </div>
            <div className="py-1">
              {project.status}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
