import React from 'react'
import LandingBtns from '../components/LandingBtns'

import { Link } from "react-router-dom";

import Logo from "../images/riskLogo.png";

export default function Landing() {
  return (
    <div className="bg-white text-black h-[100vh] w-[100vw] flex justify-center flex-col items-center p-4">
      <div className="flex-1">
        <Link to="/">
          <img src={Logo} className="max-h-24"/>
        </Link>
      </div>
      <div className="w-full sm:w-[540px] flex flex-col">
        <Link to="/create" className="flex flex-col">
          <LandingBtns name="Create game" onClick={() => {}}/>
        </Link>
        <br/>
        <Link to="/join" className="flex flex-col">
          <LandingBtns name="Join game" onClick={() => {}}/>
        </Link>
      </div>
      <div className="flex-1"></div>
    </div>
  )
}
