import React, {useEffect, useState} from 'react'

import Logo from "../images/riskLogo.png";
import LandingInputs from '../components/LandingInputs';

import axios from "axios";

import { Link } from "react-router-dom";

import {SHA256} from "crypto-js"

export default function Join() {
  const [gameList, setGameList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [joinPw, setJoinPw] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const getSelectedGame = () => {
    let g = gameList.find(g => g.id == selectedGame);
    return g;
  }

  const goToGame = (id) => {
    document.location.href = `/game?id=${id}`;
  }

  useEffect(() => {
    (async () => {
      // 10.142.21.178
      let res = await axios.get("http://localhost:4000/api/getGameList");

      let resData = res.data;

      console.log(resData);

      if (res.status == 200) {
        setGameList(resData);
      };
    })();
  }, []);

  const selectGame = (id) => {
    let game = gameList.find(g => g.id == id);
    setJoinPw("");

    if (game.password == "") {
      goToGame(id);
    } else {
      setSelectedGame(id);
    }
  }

  const joinGameWithPw = () => {
    let hashedPw = SHA256(joinPw).toString();
    let realPw = getSelectedGame().password;

    if (realPw == hashedPw) {
      goToGame(selectedGame);
    } else {
      setErrMsg("Invalid password");
    }
  }

  return (
    <div className="w-[100vw] h-[100vh] p-4 flex flex-col justify-center items-center">
      <div className="flex-1">
        <Link to="/">
          <img src={Logo} className="max-h-24"/>
        </Link>
      </div>
      <div className="w-full sm:w-[540px] md:w-[700px] rounded-lg bg-white p-4 shadow-xl border flex flex-col border-red-500 h-[50vh]">
        <h1 className="text-center font-bold text-neutral-700">Join game</h1>
        {selectedGame == null ? <div className="flex flex-col mt-4 relative flex-1">
          <div className="absolute w-full h-full flex overflow-auto">
            <div className="flex-1">
              <div className="flex flex-row mb-4 border-b border-b-neutral-500 pb-2 px-2">
                <div className="flex flex-1">
                  <div className="flex-1">
                    <p>Game name</p>
                  </div>
                </div>
                <div className="flex flex-1 justify-end">
                  <div className="px-2 flex-1">
                    <p>Players</p>
                  </div>
                  <div className="px-2 flex-1">
                    <p>Bots</p>
                  </div>
                  <div className="px-2 flex-1">
                    <p>Password</p>
                  </div>
                </div>
              </div>
              {gameList.map(gl => <div onClick={() => selectGame(gl.id)} key={gl.id} className="flex flex-row py-2 px-2 bg-white hover:bg-neutral-300 select-none cursor-pointer">
                <div className="flex flex-1">
                  <div className="flex-1">
                    <p>{gl.name}</p>
                  </div>
                </div>
                <div className="flex flex-1 justify-end">
                  <div className="px-2 flex-1">
                    <p>{gl.players.filter(p => !p.empty && !p.bot).length}</p>
                  </div>
                  <div className="px-2 flex-1">
                    <p>{gl.players.filter(p => p.bot).length}</p>
                  </div>
                  <div className="px-2 flex-1">
                    <p>{gl.password == "" ? "No" : "Yes"}</p>
                  </div>
                </div>
              </div>)}
            </div>
          </div>
        </div> : 
        <div className='flex-1 flex flex-col'>
          <p className="text-center text-lg mt-2">A password is required to join "{getSelectedGame().name}"</p>
          <LandingInputs password name="Password" value={joinPw} setValue={setJoinPw}/>
          <button onClick={joinGameWithPw} className="mt-4 bg-red-500 text-white p-2 rounded-lg hover:brightness-90 duration-100">Join</button>
          <p className="text-red-500 mt-4">{errMsg}</p>
          <div className='flex-1 flex flex-col justify-end'>
            <div>
              <button onClick={() => setSelectedGame(null)} className='bg-black text-white px-4 py-1 rounded-lg border-0 hover:scale-110 duration-100'>Back</button>
            </div>
          </div>
        </div>
        }
      </div>
      <div className="flex-1"></div>
    </div>
  )
}
