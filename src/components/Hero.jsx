import React from 'react';

export default function Hero() {
  return (
    <section id="home" className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-5xl font-extrabold mb-4">
          Hi, I’m Your Name
        </h1>
        <p className="text-xl mb-6">
          Aspiring AI Engineer & Software Developer.
        </p>
        <a href="#projects" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          View My Work
        </a>
      </div>
    </section>
  );
}
