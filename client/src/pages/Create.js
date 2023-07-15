import React, {useState} from 'react'

import Logo from "../images/riskLogo.png";
import LandingInputs from '../components/LandingInputs';

import { Link } from "react-router-dom";

import axios from "axios";

export default function Create() {
  const [gameName, setGameName] = useState("");
  const [password, setPassword] = useState("");
  const [botCount, setBotCount] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    try {
      setErrMsg("");

      if (!loading) {
        setLoading(true);

        let postData = {
          name: gameName,
          password: password,
          botCount: botCount
        }

        // 10.142.21.178
        let res = await axios.post("http://localhost:4000/api/createGame", postData);

        let resData = res.data;

        if (res.status == 200) {
          // Do this later;
          document.location = `/game?id=${resData.id}&owner`;
          console.log(resData);
        };

        setLoading(false);
      }
    } catch (e) {
      let eMsg = e.message;
      if (eMsg == "" || eMsg == undefined) {
        eMsg = "An error has occured";
      }

      setErrMsg(eMsg);
      setLoading(false);
    }
  }

  return (
    <div className="w-[100vw] h-[100vh] p-4 flex flex-col justify-center items-center">
      <div className="flex-1">
        <Link to="/">
          <img src={Logo} className="max-h-24"/>
       </Link>
      </div>
      <div className="w-full sm:w-[540px] md:w-[700px] rounded-lg bg-white p-4 shadow-xl border border-red-500">
        <h1 className="text-center font-bold text-neutral-700">Create game</h1>
        <div className="flex flex-col mt-4">
          <LandingInputs name="Game name" value={gameName} setValue={setGameName}/>
          <br/>
          <LandingInputs password name="Password (optional)" value={password} setValue={setPassword}/>
          <br/>
          <p className="text-neutral-700">Number of bots</p>
          <input className="mt-1" type="range" value={botCount} min={0} max={5} onChange={e => setBotCount(Number(e.target.value))}/>
          <p className="text-neutral-800">{botCount == 0 ? "No bots" : `${botCount} bot${botCount > 1 ? "s" : ""}`}</p>
          <br/>
          <button onClick={() => createGame()} className="mt-2 bg-blue-500 py-2 rounded text-white hover:brightness-90 duration-75">Create game</button>
        </div>
      </div>
      <div className="flex-1"></div>
    </div>
  )
}
