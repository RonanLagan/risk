import React from 'react'

export default function LandingBtns({onClick, name}) {
  return (
    <button onClick={onClick} className='bg-red-500 px-2 py-3 rounded-lg shadow-2xl text-white text-lg font-bold text-center hover:brightness-75 duration-100'>{name}</button>
  )
}
