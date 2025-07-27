'use client'
import React from 'react'
import Header from './Header'
import Hero from './Hero'

const HomePage = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-white">

      {/* Top Arc Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1400px] h-[300px] bg-white/20 rounded-b-[100%] blur-3xl pointer-events-none z-0 " />
      {/* Main Content */}
      <div className="relative h-full w-full z-10">
        <Header />
        <Hero />
      </div>

    </div>
  )
}

export default HomePage
