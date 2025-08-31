// HeroPage.jsx
import React from 'react'

export default function HeroPage() {
  return (
    <div className="w-[2550px] h-[1322px] bg-white flex flex-col items-center justify-center text-center p-10">
      <h1 className="text-4xl font-bold mb-4">Welcome to My Portfolio</h1>
      <p className="text-lg text-gray-600 mb-6">
        I'm Guillaume, a creative developer exploring 3D and interactive web design.
      </p>
      <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
        View My Work
      </button>
    </div>
  )
}
