import React from 'react';
import Navbar   from './components/Navbar';
import Hero     from './components/Hero';
import Projects from './components/Projects';
import Contact  from './components/Contact';
import StockPredictor from './components/StockPredictor';



export default function App() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
        <StockPredictor />
        <Projects />
        <Contact />
        {/* About and Contact will go below */}
      </main>
    </>
  );
}
