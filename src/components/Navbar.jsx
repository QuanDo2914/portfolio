import React from 'react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-2xl font-bold">Your Name</div>
        <div className="space-x-6">
          <a href="#home"    className="hover:text-blue-600">Home</a>
          <a href="#projects"className="hover:text-blue-600">Projects</a>
          <a href="#about"   className="hover:text-blue-600">About</a>
          <a href="#contact" className="hover:text-blue-600">Contact</a>
        </div>
      </div>
    </nav>
  );
}
