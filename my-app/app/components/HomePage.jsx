'use client';
import React from 'react';
import Header from './Header';
import Hero from './Hero';

const HomePage = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-white">

      {/* Left Glow Circle */}
      <div className="absolute left-[-200px] top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* Right Glow Circle */}
      <div className="absolute right-[-200px] top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/20 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* Main Content */}
      <div className="relative h-full w-full z-10">
        <Header />
        <Hero />
      </div>
      
    </div>
  );
};

export default HomePage;
