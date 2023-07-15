import React, { useState } from "react";

import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";

let colors = ["red", "purple", "yellow", "green", "orange", "blue"];

export default function PlayerListPlayer({
  player,
  joinFunc,
  myUid,
  myName,
  setMyName,
  socket,
  thisTurn,
  rejoinFunc,
}) {
  if (player.left) {
    return (
      <div className="flex justify-center items-center mb-4">
        <div
          className={`w-16 h-16 rounded-full flex justify-center items-center cursor-pointer duration-75 relative group`}
        >
          <div
            className={`bg-${
              colors[player.index]
            }-500 w-full h-full left-0 top-0 rounded-full absolute flex justify-center items-center group-hover:brightness-75 ${
              player.index == myUid && myUid != null
                ? "border-[3px] border-dashed border-black"
                : ""
            } ${
              thisTurn
                ? `outline outline-4 outline-${
                    colors[player.index]
                  }-800 shadow-2xl scale-110`
                : ""
            }`}
          >
            <PersonIcon
              className={`${
                thisTurn ? `text-${colors[player.index]}-800` : "text-white"
              } text-lg`}
            />
          </div>
          <div className="absolute right-full pr-4 hidden group-hover:flex">
            <div className="bg-white p-3 shadow-2xl rounded w-60">
              <div className="flex flex-col">
                <p className="text-lg font-bold text-neutral-800">Name</p>
                <p className="font-light text-neutral-500">{player.name}</p>
                {myUid == null ? (
                  <button
                    onClick={() => rejoinFunc(player.index)}
                    className="bg-green-600 text-white mt-2 py-[2px] rounded-md hover:brightness-90 duration-100"
                  >
                    Join
                  </button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (!player.empty) {
    return (
      <div className="flex justify-center items-center mb-4">
        <div
          className={`w-16 h-16 rounded-full flex justify-center items-center cursor-pointer duration-75 relative group`}
        >
          <div
            className={`bg-${
              colors[player.index]
            }-500 w-full h-full left-0 top-0 rounded-full absolute flex justify-center items-center group-hover:brightness-75 ${
              player.index == myUid && myUid != null
                ? "border-[3px] border-dashed border-black"
                : ""
            } ${
              thisTurn
                ? `outline outline-4 outline-${
                    colors[player.index]
                  }-800 shadow-2xl scale-110`
                : ""
            }`}
          >
            <PersonIcon
              className={`${
                thisTurn ? `text-${colors[player.index]}-800` : "text-white"
              } text-lg`}
            />
          </div>
          <div className="absolute right-full pr-4 hidden group-hover:flex">
            <div className="bg-white p-3 shadow-2xl rounded w-60">
              {(() => {
                if (player.index == myUid && myUid != null) {
                  // Allow name change
                  return (
                    <div className="flex flex-col">
                      <p>Name</p>
                      <input
                        className="outline-none border border-neutral-500 focus:border-neutral-800 py-1 px-2 mt-2 rounded-lg"
                        placeholder="Change name"
                        value={myName || ""}
                        onChange={(e) => setMyName(e.target.value)}
                      />
                      <button
                        onClick={() =>
                          socket.emit("playerNameChange", {
                            name: myName,
                            uid: myUid,
                          })
                        }
                        className="text-white bg-green-600 outline-none rounded mt-2 py-1 hover:brightness-90 duration-100"
                      >
                        Change
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col">
                      <p className="text-lg font-bold text-neutral-800">Name</p>
                      <p className="font-light text-neutral-500">
                        {player.name}
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex justify-center items-center mb-4">
        <div
          className={`w-16 h-16 rounded-full flex justify-center items-center cursor-pointer duration-75 relative group`}
        >
          <div
            onClick={() => {
              if (myUid == null) {
                joinFunc(player.index);
              }
            }}
            className={`bg-gray-400 w-full h-full left-0 top-0 rounded-full absolute flex justify-center items-center group-hover:brightness-75`}
          >
            <AddIcon className="text-white text-lg scale-125" />
          </div>
          <div className="absolute right-full pr-1 scale-0 group group-hover:scale-100 duration-75">
            {myUid == null ? (
              <div className="bg-neutral-700 p-1 shadow-2xl rounded">
                <p className="text-white select-none">Join</p>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    );
  }
}
