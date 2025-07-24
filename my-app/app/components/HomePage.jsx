'use client'
import React from 'react'
import Header from './Header'
import Hero from './Hero'
import Image from 'next/image'

const HomePage = () => {
  return (
    <div className=" h-screen w-full overflow-hidden bg-gradient-to-b text-white from-green-700 via-green-500 to-green-300">
        <Header />
        <Hero />
    </div>
  )
}

export default HomePage
