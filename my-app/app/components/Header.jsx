import React from 'react'

const Header = () => {
  return (
    <div className='flex justify-between p-5'>
        <div>
            <h1 className='text-2xl font-bold'>Velociti</h1>
        </div>
        <div className='flex gap-5'>
            <button className='border border-white p-2 px-4 rounded-[10px] hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300'>Sign in</button>
            <button className='border border-white p-2 px-4 rounded-[10px] hover:bg-white hover:text-black hover:shadow-lg hover:transition duration-300'>Generate</button>
        </div>
    </div>
  )
}

export default Header