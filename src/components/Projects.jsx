import React from 'react';
import ProjectCard from './ProjectCard';

const projectList = [
  {
    title: 'Stock Price Predictor',
    description: 'A simple ML model (linear regression) wrapped in a Flask API that predicts next‑day stock prices. Frontend integration coming soon.',
    link: 'https://github.com/QuanDo2914/stock-predictor',
  },
  // Add more projects here:
  // { title: 'Project 2', description: '...', link: '...' },
];

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center">Projects</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {projectList.map((proj) => (
            <ProjectCard
              key={proj.title}
              title={proj.title}
              description={proj.description}
              link={proj.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
