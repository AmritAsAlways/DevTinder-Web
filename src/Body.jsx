import React from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'

const Body = () => {
  return (
    <div>
      <Navbar/>
      <Outlet/> {/* this is the place where the children elements will get rendered of the body component  */}
      <Footer/>
    </div>
  )
}

export default Body
