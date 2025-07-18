import React from 'react';

export default function ProjectCard({ title, description, link }) {
  return (
    <div className="border rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-700 mb-4">{description}</p>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View Project →
        </a>
      )}
    </div>
  );
}
