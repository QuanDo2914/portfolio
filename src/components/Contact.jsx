import React from 'react';

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
        <p className="mb-6">
          I’m based in Amherst, MA — feel free to drop me a line or connect on LinkedIn.
        </p>
        <div className="space-x-4">
          <a
            href="mailto:qmdo@umass.edu"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Email Me
          </a>
          <a
            href="https://www.linkedin.com/in/quan-m-do/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
);
}
