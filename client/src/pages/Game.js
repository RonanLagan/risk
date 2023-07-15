import React, { useEffect, useState } from "react";

import socket from "../utils/socket";
import PlayersSidebar from "../components/PlayersSidebar";
import GameBottomBar from "../components/GameBottomBar";
import GameBoard from "../components/GameBoard";
import { Link } from "react-router-dom";

export default function Game() {
  const [gameId, setGameId] = useState(null);
  const [isConnected, setConnected] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [myUid, setMyUid] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAttackFrom, setSelectedAttackFrom] = useState("");
  const [selectAttackCountry, setSelectAttackCountry] = useState("");

  useEffect(() => {
    let search = document.location.search;
    search = search.split("?")[1];
    search = search.split("&");

    let thisGid;

    search.forEach((s) => {
      s = s.split("=");

      if (s.length == 2) {
        if (s[0] == "id") {
          thisGid = s[1];
          setGameId(s[1]);
        }
      } else if (s[0] == "owner") {
        setIsOwner(true);
      }
    }, []);

    socket.connect();

    socket.on("connect", (c) => {
      socket.emit("conn", { id: thisGid });

      setConnected(true);
      socket.emit("getGameData", { id: thisGid });
    });

    // After join succ

    socket.on("gameDataUpdate", (data) => {
      console.log(data);
      setGameData(data);
    });

    socket.on("joinSucc", (c) => {
      let { index } = c;
      setMyUid(index);
    });
  }, []);

  const joinFunc = (index) => {
    socket.emit("join", { gameId: gameId, index: index });
  };

  const rejoinFunc = (index) => {
    socket.emit("rejoin", { gameId: gameId, index: index });
  };

  const startGame = () => {
    socket.emit("gameStart");
  };

  if (isConnected && gameData != null) {
    return (
      <div className="w-[100vw] h-[100vh] flex flex-col p-2">
        <div>
          <Link to="/">
            <button className="bg-red-500 text-white p-2 rounded-lg hover:brightness-90 my-2">
              Leave
            </button>
          </Link>
        </div>
        <div className="flex-1 mt-1 flex flex-row">
          <div className="flex-1 flex">
            <GameBoard
              setSelectAttackCountry={setSelectAttackCountry}
              setSelectedAttackFrom={setSelectedAttackFrom}
              selectAttackCountry={selectAttackCountry}
              selectedAttackFrom={selectedAttackFrom}
              socket={socket}
              gameData={gameData}
              myUid={myUid}
            />
          </div>
          <PlayersSidebar
            gameStarted={gameData.started}
            socket={socket}
            players={gameData.players}
            joinFunc={joinFunc}
            rejoinFunc={rejoinFunc}
            myUid={myUid}
            turn={(gameData.turn || {}).player}
          />
        </div>
        <div className="flex flex-row">
          <GameBottomBar
            myUid={myUid}
            socket={socket}
            selectAttackCountry={selectAttackCountry}
            selectedAttackFrom={selectedAttackFrom}
            setSelectAttackCountry={setSelectAttackCountry}
            setSelectedAttackFrom={setSelectedAttackFrom}
            gameData={gameData}
            startGame={startGame}
            gameStarted={(gameData || {}).started}
            isOwner={isOwner}
            totalPlayers={
              gameData.players.filter((p) => p.empty == false || p.bot).length
            }
          />
        </div>
      </div>
    );
  }
}
