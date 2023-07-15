import React from "react";
import LoadingBar from "./LoadingBar";
import BattleBar from "./BattleBar";

import "../scrollbar.css";

const getPNameById = (id, players) => {
  let p = players.find((i) => i.index == id);

  return p.name;
};

const getAttackedPlayer = (gameData) => {
  let attackedCountry = gameData.turn.metadata.ongoingBattle.defender

  let countryOwner = gameData.map[attackedCountry].owner;

  let player = gameData.players.find(p => p.index == countryOwner);
  return player.name;
}

let maxArmiesStart = {
  3: 105,
  4: 90,
  5: 125,
  6: 120,
};

const placingStartArmies = (gameData) => {
  let playerCount = gameData.players.filter((p) => !p.empty).length;
  let maxArmies = maxArmiesStart[playerCount];

  if (gameData.armiesPlacedCount < maxArmies) {
    return true;
  } else {
    return false;
  }
};

const cardClick = (card, cards, gameData, myUid, socket) => {
  if (gameData.turn.step == 0 && gameData.turn.player == myUid) {
    let cardType = card.value;
    let count = 0;

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].value == cardType) {
        count += 1;
      }
    }

    if (count >= 3) {
      // Redeem
      socket.emit("redeemCards", { index: myUid, cardType: cardType });
    }
  }
};

const getStartedBattle = (gameData, myUid) => {
  let currentBattle = gameData.turn.metadata || {};
  currentBattle = currentBattle.ongoingBattle;

  if (currentBattle != undefined) {
    let attacker = currentBattle.attacker;
    let owner = gameData.map[attacker].owner;
    return owner == myUid;
  }

  return false;
};

const getPByUid = (players, uid) => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].index == uid) {
      return players[i];
    }
  }
};

const isMyTurn = (gameData, myUid) => {
  return gameData.turn.player == myUid;
};

export default function GameBottomBar({
  gameStarted,
  isOwner,
  totalPlayers,
  startGame,
  gameData,
  selectAttackCountry,
  selectedAttackFrom,
  socket,
  myUid,
  setSelectAttackCountry,
  setSelectedAttackFrom,
}) {
  if (!gameStarted) {
    return (
      <div className="py-2 flex flex-1 flex-row h-24 justify-center items-center">
        {isOwner ? (
          <div className="flex flex-col h-full">
            <div className="h-6">
              {totalPlayers >= 3 ? null : (
                <p className="text-center">
                  Need {3 - totalPlayers} more player
                  {3 - totalPlayers != 1 ? "s" : ""} to start
                </p>
              )}
            </div>
            <button
              onClick={totalPlayers >= 3 ? startGame : () => {}}
              className={`${
                totalPlayers >= 3
                  ? "bg-green-600 hover:brightness-90"
                  : "bg-gray-400 cursor-default"
              } flex-1 px-16 rounded-lg shadow text-white text-lg`}
            >
              Start game
            </button>
          </div>
        ) : (
          <div>
            <p className="text-lg text-neutral-500">
              Waiting for game to start
            </p>
          </div>
        )}
      </div>
    );
  } else if (gameData != undefined) {
    if (!gameData.countriesChosen || placingStartArmies(gameData)) {
      return (
        <div className="py-2 flex flex-1 flex-col h-24">
          {gameData.countriesChosen ? (
            <>
              <p className="text-center text-lg">
                {getPNameById(gameData.turn.player, gameData.players)}'s turn to
                place an army
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-lg">
                {getPNameById(gameData.turn.player, gameData.players)}'s turn to
                pick a country
              </p>
            </>
          )}
          <div className="flex-1 flex items-center">
            <LoadingBar turn={gameData.turn} />
          </div>
        </div>
      );
    } else if (gameData.turn.realTurn) {
      return (
        <div className="py-2 flex flex-1 flex-row h-24">
          <div className="h-full flex items-center py-2 me-4 group">
            {myUid != null ? (
              <>
                <div className="relative w-40 h-full flex">
                  <div className="flex flex-1 items-center cursor-pointer justify-center rounded-lg bg-gray-800 bg-white-500 text-white hover:brightness-90">
                    <p className="text-lg select-none">Cards</p>
                  </div>
                  <div className="absolute bottom-full w-72 flex group-hover:scale-100 scale-0 duration-100">
                    <div className="bg-white w-full mb-2 border border-gray-800 rounded-lg p-2 h-36 relative flex flex-col custom-scrollbar  overflow-x-scroll">
                      <div className="flex flex-1 flex-col absolute min-w-full w-auto h-full top-0 left-0">
                        {myUid != undefined ? (
                          <>
                            {getPByUid(gameData.players, myUid).cards.length ==
                            0 ? (
                              <>
                                <div className="flex-1 items-center justify-center flex">
                                  <p className="text-lg font-light text-neutral-800">
                                    You don't have any cards
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-row flex-1">
                                  {getPByUid(gameData.players, myUid).cards.map(
                                    (card) => {
                                      return (
                                        <div
                                          className="w-24 flex flex-col shadow-black shadow rounded-lg overflow-hidden mx-2 my-2 select-none cursor-pointer"
                                          onClick={() =>
                                            cardClick(
                                              card,
                                              getPByUid(gameData.players, myUid)
                                                .cards,
                                              gameData,
                                              myUid,
                                              socket
                                            )
                                          }
                                        >
                                          <div className="flex flex-1 p-2 items-center justify-center">
                                            <p>
                                              {(() => {
                                                let vals = {
                                                  a: "Soldier",
                                                  c: "Canon",
                                                  h: "Horse",
                                                };

                                                return vals[card.value];
                                              })()}
                                            </p>
                                          </div>
                                          <div className="flex items-center justify-center p-2 bg-neutral-700 text-white">
                                            <p>{card.name}</p>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
          <div className="flex flex-1 flex-col jutsify-center items-center">
            {gameData.turn.player == myUid ? (
              <>
                {gameData.turn.step == 0 ? (
                  <>
                    <div>
                      <p className="text-lg mb-[2px] text-neutral-800">
                        You can place {gameData.turn.metadata.newArmies} new
                        armies on your territories
                      </p>
                    </div>
                  </>
                ) : gameData.turn.step == 1 ? (
                  <></>
                ) : gameData.turn.step == 2 &&
                  gameData.turn.metadata.ongoingBattle == undefined ? (
                  <>
                    <div>
                      <p className="text-lg mb-[2px] text-neutral-800">
                        You can choose to attack any neighboring countries
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-[28px]">
                      {(() => {
                        if (gameData.turn.step == 3) {
                          return (
                            <p className="text-lg mb-[2px] text-neutral-800">
                              You can move your armies from one territory to
                              another
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <>
                  {gameData.turn.step == 0 ? (
                    <>
                      <div>
                        <p className="text-lg mb-[2px] text-neutral-800">
                          {getPNameById(gameData.turn.player, gameData.players)}{" "}
                          can place {gameData.turn.metadata.newArmies} new
                          armies on his territories
                        </p>
                      </div>
                    </>
                  ) : gameData.turn.step == 1 ? (
                    <></>
                  ) : gameData.turn.step == 2 &&
                    gameData.turn.metadata.ongoingBattle == undefined ? (
                    <>
                      <div>
                        <p className="text-lg mb-[2px] text-neutral-800">
                          {getPNameById(gameData.turn.player, gameData.players)}
                          's turn to choose to attack a country
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-[28px]">
                        {(() => {
                          if (gameData.turn.step == 3) {
                            return (
                              <p className="text-lg mb-[2px] text-neutral-800">
                                {getPNameById(
                                  gameData.turn.player,
                                  gameData.players
                                )}
                                's turn to move his armies
                              </p>
                            );
                          } else if (
                            gameData.turn.step == 2 &&
                            gameData.turn.metadata.ongoingBattle != undefined
                          ) {
                            return (
                              <p className="text-lg mb-[2px] text-neutral-800">
                                {getPNameById(gameData.turn.player, gameData.players)} is attacking {getAttackedPlayer(gameData)}
                              </p>
                            );
                          }
                        })()}
                      </div>
                    </>
                  )}
                </>
              </>
            )}
            {gameData.turn.metadata.ongoingBattle == undefined ? (
              <>
                <LoadingBar turn={gameData.turn} />
              </>
            ) : (
              <>
                <BattleBar gameData={gameData} />
              </>
            )}
          </div>
          <div className="items-center flex">
            {selectAttackCountry != "" ? (
              <>
                <div className="p-2">
                  <p className="text-neutral-500 mb-2">
                    How many dice do you want to roll to attack?
                  </p>
                  <div className="flex flex-row items-center justify-around">
                    <div
                      onClick={() => {
                        socket.emit("attackCountry", {
                          fromCountry: selectedAttackFrom,
                          attacking: selectAttackCountry,
                          dice: 1,
                          index: myUid,
                        });

                        setSelectAttackCountry("");
                        setSelectedAttackFrom("");
                      }}
                      className="bg-neutral-700 rounded-lg text-white w-8 h-8 flex items-center justify-center select-none hover:brightness-125 duration-100 cursor-pointer"
                    >
                      1
                    </div>
                    {gameData.map[selectedAttackFrom].armies > 2 ? (
                      <>
                        <div
                          onClick={() => {
                            socket.emit("attackCountry", {
                              fromCountry: selectedAttackFrom,
                              attacking: selectAttackCountry,
                              dice: 2,
                              index: myUid,
                            });
                            setSelectAttackCountry("");
                            setSelectedAttackFrom("");
                          }}
                          className="bg-neutral-700 rounded-lg text-white w-8 h-8 flex items-center justify-center select-none hover:brightness-125 duration-100 cursor-pointer"
                        >
                          2
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                    {gameData.map[selectedAttackFrom].armies > 3 ? (
                      <>
                        <div
                          onClick={() => {
                            socket.emit("attackCountry", {
                              fromCountry: selectedAttackFrom,
                              attacking: selectAttackCountry,
                              dice: 3,
                              index: myUid,
                            });
                            setSelectAttackCountry("");
                            setSelectedAttackFrom("");
                          }}
                          className="bg-neutral-700 rounded-lg text-white w-8 h-8 flex items-center justify-center select-none hover:brightness-125 duration-100 cursor-pointer"
                        >
                          3
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}
            {gameData.turn.step == 3 && isMyTurn(gameData, myUid) ? (
              <>
                <div className="flex-1 mx-2">
                  <div className="h-[14px]"></div>
                  <button
                    onClick={() => socket.emit("endTurn", { index: myUid })}
                    className="text-white bg-neutral-800 p-2 rounded-lg hover:brightness-125"
                  >
                    End turn
                  </button>
                </div>
              </>
            ) : (
              <></>
            )}
            {getStartedBattle(gameData, myUid) ? (
              <>
                {gameData.turn.step == 2 &&
                isMyTurn(gameData, myUid) &&
                selectAttackCountry == "" &&
                gameData.turn.metadata.ongoingBattle == undefined ? (
                  <div className="flex-1 mx-2">
                    <div className="h-[14px]"></div>
                    <button
                      onClick={() =>
                        socket.emit("dontAttack", { index: myUid })
                      }
                      className="text-white bg-neutral-800 p-2 rounded-lg hover:brightness-125"
                    >
                      Don't attack
                    </button>
                  </div>
                ) : (
                  <></>
                )}
                {gameData.turn.step == 2 &&
                gameData.turn.metadata.ongoingBattle != undefined ? (
                  <>
                    <div className="flex-1 mx-2">
                      <div className="h-[14px]"></div>
                      <button
                        onClick={() =>
                          socket.emit("dontAttack", { index: myUid })
                        }
                        className="text-white bg-neutral-800 p-2 rounded-lg hover:brightness-125"
                      >
                        Stop attack
                      </button>
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <>
                {selectAttackCountry == "" &&
                isMyTurn(gameData, myUid) &&
                gameData.turn.step == 2 ? (
                  <>
                    <div className="flex-1 mx-2">
                      <div className="h-[14px]"></div>
                      <button
                        onClick={() =>
                          socket.emit("dontAttack", { index: myUid })
                        }
                        className="text-white bg-neutral-800 p-2 rounded-lg hover:brightness-125"
                      >
                        Don't attack
                      </button>
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
  }
}
