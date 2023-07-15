import React, { useState, useEffect } from "react";
import PlayerListPlayer from "./PlayerListPlayer";

const playersParse = (players) => {
  let out = players.sort((a, b) => {
    a = a.index;
    b = b.index;

    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    }

    return 0;
  });

  return out;
};

const getMyPlayer = (players, myUid) => {
  let myPlayer = players.find((p) => p.index == myUid);

  return myPlayer || {};
};

export default function PlayersSidebar({
  players,
  joinFunc,
  myUid,
  socket,
  turn,
  gameStarted,
  rejoinFunc,
}) {
  const [myName, setMyName] = useState(null);

  useEffect(() => {
    if (myName == null) {
      setMyName(getMyPlayer(players, myUid).name || null);
    }
  });

  return (
    <div className="flex flex-col px-2">
      <div className="hidden outline-red-800 outline-purple-800 outline-green-800 outline-yellow-800 outline-orange-800 outline-blue-800 text-red-800 text-purple-800 text-green-800 text-yellow-800 text-orange-800 text-blue-800  bg-red-500 bg-purple-500 bg-green-500 bg-yellow-500 bg-orange-500 bg-blue-500"></div>
      <h3 className="text-3xl px-4 mt-2 font-light">Players</h3>
      <div className="mt-4 flex-1">
        {playersParse(players).map((player) => {
          if ((gameStarted && !player.empty) || !gameStarted) {
            return (
              <PlayerListPlayer
                rejoinFunc={rejoinFunc}
                thisTurn={player.index == turn}
                socket={socket}
                myName={myName}
                setMyName={setMyName}
                myUid={myUid}
                key={player.index}
                player={player}
                joinFunc={joinFunc}
              />
            );
          }
        })}
      </div>
    </div>
  );
}
