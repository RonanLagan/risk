let ioImport = require("socket.io");

let events = require("./events");
let cache = require("./cache");

const pickRandomCountry = require("./pickRandomCountry");

let ongoingTurns = [];

let secsPerTurn = 5;
let botSecPerTurn = 0.2;
let attackTurnTime = 0.75;

let maxArmiesStart = {
  3: 105,
  4: 90,
  5: 125,
  6: 120,
};

let continentValues = {
  na: 5,
  sa: 2,
  eu: 5,
  af: 3,
  as: 7,
  au: 2,
};

const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

const compareDice = (attackerDice, defenderDice) => {
  attackerDice = attackerDice.sort((a, b) => {
    if (a > b) {
      return -1;
    } else if (a < b) {
      return 1;
    }
    return 0;
  });

  defenderDice = defenderDice.sort((a, b) => {
    if (a > b) {
      return -1;
    } else if (a < b) {
      return 1;
    }
    return 0;
  });

  let smallestSize = defenderDice.length;
  if (attackerDice.length < defenderDice.length) {
    smallestSize = attackerDice.length;
  }

  let out = [0, 0];

  for (let i = 0; i < smallestSize; i++) {
    if (attackerDice[i] > defenderDice[i]) {
      out[1] += 1;
    } else if (attackerDice[i] < defenderDice[i]) {
      out[0] += 1;
    } else {
      out[0] += 1;
    }
  }

  return out; // [attacker, defender] losses
};

const pickCard = (thisGame) => {
  let deck = thisGame.cardDeck;

  let out = [];
  let picked = deck[Math.floor(Math.random() * deck.length)];

  deck.forEach((d) => {
    if (d.id != picked.id) {
      out.push(d);
    }
  });

  return [picked, out];
};

const getNewArmies = (gameData, playerIndex) => {
  let playerTerritories = [];

  for (let key in gameData.map) {
    let countryName = key;
    let country = gameData.map[key];

    if (country.owner == playerIndex) {
      playerTerritories.push(countryName);
    }
  }

  let territoryCount = playerTerritories.length;

  let newArmies = Math.round(territoryCount / 3);

  if (newArmies < 3) {
    newArmies = 3;
  }

  let continentPlayers = {};

  for (let key in gameData.map) {
    let countryName = key;
    let country = gameData.map[countryName];
    let continent = country.continent;
    let ind = country.owner;

    if (continentPlayers[continent] == undefined) {
      continentPlayers[continent] = [];
    }

    if (!continentPlayers[continent].includes(ind)) {
      continentPlayers[continent].push(ind);
    }
  }

  let continentsControled = [];

  for (let key in continentPlayers) {
    let continent = continentPlayers[key];

    if (continent.length == 1) {
      // One player controls this continent

      if (continent.includes(playerIndex)) {
        // You control this whole continent
        continentsControled.push(key);
      }
    }
  }

  continentsControled.forEach((continent) => {
    let addedVal = continentValues[continent];
    newArmies += addedVal;
  });

  return newArmies;
};

const changeGame = (game) => {
  let newGames = [];

  let games = cache.get("games");

  if (games == undefined) {
    games = [];
  }

  games.forEach((g) => {
    if (g.id != game.id) {
      newGames.push(g);
    }
  });

  newGames.push(game);

  cache.set("games", newGames);
};

const getGame = (gid) => {
  let games = cache.get("games");
  if (games == undefined) {
    games = [];
  }

  let myGame = games.find((g) => g.id == gid);

  return myGame || null;
};

const start = (server) => {
  const io = ioImport(server, {
    cors: {
      origin: "*",
    },
  });

  // Game interval
  setInterval(() => {
    ongoingTurns.forEach((turn) => {
      // Handle every turn;
      let turnIndex = turn.index;
      let turnEnded = Date.now() > turn.end;

      let isBot = false;

      let tg = getGame(turn.gid);
      let theP = tg.players.find((p) => p.index == turn.index);

      isBot = theP.bot;

      if (turn.end < 0) {
        turnEnded = false;
      } else if (isBot) {
        turn.end = turn.start + 1000 * botSecPerTurn;
        tg.turn.end = turn.end;
        changeGame(tg);
      }

      if (turn.metadata == undefined) {
        turn.metadata = {};
      }

      let turnIsBattle = turn.metadata.ongoingBattle != undefined;

      if (turnIsBattle) {
        let lastTurnUpdate = turn.metadata.lastUpdate;
        if (
          lastTurnUpdate == undefined ||
          Date.now() - lastTurnUpdate > attackTurnTime * 1000
        ) {
          // Make move
          let attackerDice = [];
          let defenderDice = [];

          let thisGame = getGame(turn.gid);

          let attackerCountry =
            thisGame.map[turn.metadata.ongoingBattle.attacker];
          let defenderCountry =
            thisGame.map[turn.metadata.ongoingBattle.defender];

          let defenderNumDice = defenderCountry.armies > 1 ? 2 : 1;

          for (let i = 0; i < turn.metadata.ongoingBattle.dice; i++) {
            attackerDice.push(rollDice());
          }

          for (let i = 0; i < defenderNumDice; i++) {
            defenderDice.push(rollDice());
          }

          let comparison = compareDice(attackerDice, defenderDice);

          console.log(comparison);

          let newAttacker =
            thisGame.map[turn.metadata.ongoingBattle.attacker].armies -
            comparison[0];
          let newDefender =
            thisGame.map[turn.metadata.ongoingBattle.defender].armies -
            comparison[1];

          let stopAttack = false;

          if (newAttacker <= 1) {
            newAttacker = 1;
            stopAttack = true;
          }

          if (newDefender <= 0) {
            newDefender = 1;
            newAttacker -= 1;

            thisGame.map[turn.metadata.ongoingBattle.defender].owner =
              thisGame.map[turn.metadata.ongoingBattle.attacker].owner;

            stopAttack = true;
          }

          thisGame.map[turn.metadata.ongoingBattle.attacker].armies =
            newAttacker;
          thisGame.map[turn.metadata.ongoingBattle.defender].armies =
            newDefender;
          thisGame.turn.metadata.lastUpdate = Date.now();

          for (let i = 0; i < ongoingTurns.length; i++) {
            if (ongoingTurns[i].gid == turn.gid) {
              ongoingTurns[i].metadata.lastUpdate =
                thisGame.turn.metadata.lastUpdate;
            }
          }

          if (stopAttack) {
            // Go next step;
            thisGame.turn.start = Date.now();
            thisGame.turn.end = Date.now() + secsPerTurn * 1000;
            thisGame.turn.metadata.ongoingBattle = null;

            for (let i = 0; i < ongoingTurns.length; i++) {
              if (ongoingTurns[i].gid == turn.gid) {
                ongoingTurns[i].start = thisGame.turn.start;
                ongoingTurns[i].end = thisGame.turn.end;
                ongoingTurns[i].metadata.ongoingBattle = null;
              }
            }
          }

          // Remove player if needed

          for (let i = 0; i < thisGame.players.length; i++) {
            let playerIndex = thisGame.players[i].index;

            let thisPlayerCountrieCount = 0;

            for (let key in thisGame.map) {
              let country = thisGame.map[key];
              if (country.owner == playerIndex) {
                thisPlayerCountrieCount += 1;
                break;
              }
            }

            if (thisPlayerCountrieCount == 0) {
              thisGame.players[i].empty = true;
            }
          }

          changeGame(thisGame);

          io.to(turn.gid).emit("gameDataUpdate", thisGame);
        }
      }

      if (turnEnded) {
        // Delete turn
        let turnGid = turn.gid;

        let delTurn = false;

        if (!turn.realTurn) {
          delTurn = true;
        } else if (turn.realTurn) {
          let thisGame = getGame(turnGid);
          if (thisGame.turn.step == 3) {
            delTurn = true;
          }
        }

        if (delTurn) {
          let otherTurns = ongoingTurns.filter((t) => t.gid != turnGid);
          ongoingTurns = otherTurns;
        }

        // Make turn automatically
        if (!turn.pickedCountries) {
          // Pick a country
          let thisGame = getGame(turnGid);

          let randCountry = pickRandomCountry(thisGame.map);
          console.log("RANDOM COUNTRY: ", randCountry);

          thisGame.map[randCountry].owner = turnIndex;

          changeGame(thisGame);

          goNextTurn(turnGid);

          // Went next turn here, need to do other places later
        } else if (!turn.placedAllArmies) {
          // Place an army
          let thisGame = getGame(turnGid);

          let myCountries = [];

          for (let key in thisGame.map) {
            if (thisGame.map[key].owner == turnIndex) {
              myCountries.push(key);
            }
          }

          let countryToPlaceOn =
            myCountries[Math.floor(Math.random() * myCountries.length)];

          thisGame.map[countryToPlaceOn].armies += 1;
          thisGame.armiesPlacedCount += 1;

          changeGame(JSON.parse(JSON.stringify(thisGame)));

          console.log(
            "PLACED 1 ARMY ON: ",
            countryToPlaceOn,
            " ARMIES PLACED: ",
            thisGame.armiesPlacedCount
          );

          goNextTurn(turnGid);
        } else {
          // Do other shiit

          let thisGame = getGame(turnGid);

          if (thisGame.turn.step != 3) {
            if (thisGame.turn.step == 0) {
              // Force place armies

              let placeableArmies = turn.metadata.newArmies;

              let myCountries = [];

              for (let key in thisGame.map) {
                if (thisGame.map[key].owner == thisGame.turn.player) {
                  myCountries.push(key);
                }
              }

              let chosenCountries = [];

              for (let i = 0; i < placeableArmies; i++) {
                chosenCountries.push(
                  myCountries[Math.floor(Math.random() * myCountries.length)]
                );
              }

              chosenCountries.forEach((country) => {
                thisGame.map[country].armies += 1;
              });
              // Place the countries;

              thisGame.turn.metadata.newArmies = 0;
              // Set new armies to 0;

              thisGame.turn.end = Date.now() + 1000 * secsPerTurn;
              thisGame.turn.start = Date.now();
              thisGame.turn.step = 2;

              for (let i = 0; i < ongoingTurns.length; i++) {
                if (ongoingTurns[i].gid == turnGid) {
                  ongoingTurns[i]["turnStep"] = 2;
                  ongoingTurns[i]["end"] = thisGame.turn.end;
                  ongoingTurns[i]["start"] = thisGame.turn.start;
                  ongoingTurns[i].metadata = thisGame.turn.metadata;
                }
              }

              changeGame(thisGame);

              io.to(turnGid).emit("gameDataUpdate", thisGame);
            } else if (thisGame.turn.step == 2) {
              let tIndex = thisGame.turn.player;
              let thePlayer = thisGame.players.find((p) => p.index == tIndex);

              if (thePlayer.bot) {
                try {
                  let chance = Math.floor(Math.random() * 10);

                  if (chance > 3) {
                    // Do stuff then, return
                    console.log("ATTACK");
                    let myCountries = [];

                    for (let key in thisGame.map) {
                      if (thisGame.map[key].owner == tIndex) {
                        let p = thisGame.map[key];
                        p["country"] = key;
                        myCountries.push(p);
                      }
                    }

                    let possibleAttacks = [];

                    myCountries.forEach((c) => {
                      if (c.armies > 1) {
                        c.borders.forEach((b) => {
                          if (
                            thisGame.map[b].armies < c.armies &&
                            thisGame.map[b].owner != tIndex
                          ) {
                            possibleAttacks.push({
                              attacker: c.country,
                              defender: b,
                              attackerArmies: c.armies,
                              defenderArmies: thisGame.map[b].armies,
                            });
                          }
                        });
                      }
                    });

                    let bestAttack = { score: 0 };

                    possibleAttacks = possibleAttacks.sort((a, b) => {
                      a = a.attackerArmies - a.defenderArmies;
                      b = b.attackerArmies - b.defenderArmies;

                      if (a > b) {
                        return 1;
                      } else if (a < b) {
                        return -1;
                      }

                      return 0;
                    });

                    let top = [];

                    let loopCount = 3;
                    if (possibleAttacks.length < 3) {
                      loopCount = possibleAttacks.length;
                    }

                    bestAttack =
                      possibleAttacks[
                        Math.floor(Math.random() * possibleAttacks.length)
                      ];

                    if (bestAttack.score != 0) {
                      // Attack

                      let diceChoice = 1;

                      if (thisGame.map[bestAttack.attacker].armies > 4) {
                        diceChoice = 3;
                      } else if (thisGame.map[bestAttack.attacker].armies > 3) {
                        diceChoice = 2;
                      }

                      thisGame.turn.end = -1;
                      thisGame.turn.metadata = {
                        ongoingBattle: {
                          attacker: bestAttack.attacker,
                          defender: bestAttack.defender,
                          dice: diceChoice,
                        },
                        attacked: true,
                      };

                      changeGame(JSON.parse(JSON.stringify(thisGame)));

                      for (let i = 0; i < ongoingTurns.length; i++) {
                        if (ongoingTurns[i].gid == thisGame.id) {
                          ongoingTurns[i].end = -1;
                          ongoingTurns[i].metadata = thisGame.turn.metadata;
                        }
                      }

                      io.to(thisGame.id).emit("gameDataUpdate", thisGame);

                      return;
                    }
                  }
                } catch {}
              }

              // Skip if not bot

              thisGame.turn.step = 3;
              thisGame.turn.start = Date.now();
              thisGame.turn.end = Date.now() + secsPerTurn * 1000;
              thisGame.turn.metadata = {};

              for (let i = 0; i < ongoingTurns.length; i++) {
                if (ongoingTurns[i].gid == turnGid) {
                  ongoingTurns[i]["turnStep"] = 3;
                  ongoingTurns[i]["end"] = thisGame.turn.end;
                  ongoingTurns[i]["start"] = thisGame.turn.start;
                  ongoingTurns[i].metadata = {};
                }
              }
            }
          }

          if (delTurn) {
            goNextTurn(turnGid);
          }
        }
      }
    });
  }, 10);
  // Game interval above

  const goNextTurn = (gameId) => {
    let thisGame = getGame(gameId);

    let pickedCountries = true;

    for (let key in thisGame.map) {
      if (thisGame.map[key].owner < 0) {
        pickedCountries = false;
        break;
      }
    }

    console.log("PICKED COUNTRIES: ", pickedCountries);

    let currentTurnPlayer = thisGame.turn.player;

    let playerList = thisGame.players.filter((p) => !p.empty);

    let possiblePlayers = [];

    possiblePlayers = playerList.filter((p) => p.index > currentTurnPlayer);

    if (possiblePlayers.length == 0) {
      possiblePlayers = playerList;
    }

    let sortedPlayers = possiblePlayers.sort((a, b) => {
      a = a.index;
      b = b.index;

      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }

      return 0;
    });

    let chosenPlayer = sortedPlayers[0];

    let playerCount = thisGame.players.filter((p) => !p.empty).length;

    let placedAllArmies = true;

    if (thisGame.armiesPlacedCount < maxArmiesStart[playerCount]) {
      placedAllArmies = false;
    }

    let realTurn = false;
    let turnStep = 0;

    let turnMetadata = {};

    if (pickedCountries && placedAllArmies) {
      realTurn = true;

      let newArmies = getNewArmies(thisGame, chosenPlayer.index);

      turnMetadata = { newArmies: newArmies };
    }

    thisGame.turn = {
      player: chosenPlayer.index,
      start: Date.now(),
      end: Date.now() + 1000 * secsPerTurn,
      step: 0,
      realTurn: realTurn,
      metadata: turnMetadata,
    }; // 5 seconds

    changeGame(thisGame);

    let cacheTurn = {
      gid: gameId,
      index: chosenPlayer.index,
      start: thisGame.turn.start,
      end: thisGame.turn.end,
      pickedCountries: pickedCountries,
      placedAllArmies: placedAllArmies,
      madeTurn: false,
      realTurn: realTurn,
      turnStep: turnStep,
      metadata: turnMetadata,
    };

    let newTurnList = ongoingTurns.filter((t) => t.gid != gameId);
    newTurnList = JSON.parse(JSON.stringify(newTurnList));

    ongoingTurns = newTurnList;

    ongoingTurns.push(cacheTurn);

    if (pickedCountries && !thisGame.countriesChosen) {
      thisGame.countriesChosen = pickedCountries;
    }

    io.to(gameId).emit("gameDataUpdate", thisGame);
  };

  io.on("connection", (client) => {
    let thisGameId = null;
    let myPlayerIndex = null;

    client.on("conn", (data) => {
      let { id } = data;
      thisGameId = id;
      console.log("JOINED ", id);
      client.join(id);
    });

    client.on("join", (data) => {
      let { gameId, index } = data;

      let games = cache.get("games");

      let game = games.find((g) => g.id == gameId);

      if (game != undefined) {
        let newGame = JSON.parse(JSON.stringify(game));

        let newPlayerList = [];

        for (let i = 0; i < game.players.length; i++) {
          if (game.players[i].index != index) {
            newPlayerList.push(game.players[i]);
          }
        }

        newPlayerList.push({
          index: index,
          empty: false,
          bot: false,
          name: `Player ${index + 1}`,
          left: false,
          cards: [],
        });

        myPlayerIndex = index;

        newGame.players = newPlayerList;

        changeGame(newGame);

        io.emit("gameDataUpdate", newGame);

        client.emit("joinSucc", { index: index });
      }
    });

    client.on("rejoin", (data) => {
      let { index, gameId } = data;
      if (index != null) {
        let thisGame = getGame(gameId);

        let thisPlayers = thisGame.players;

        for (let i = 0; i < thisPlayers.length; i++) {
          if (thisPlayers[i].index == index) {
            thisPlayers[i].left = false;
          }
        }

        thisGame.players = thisPlayers;

        changeGame(JSON.parse(JSON.stringify(thisGame)));

        io.to(thisGameId).emit("gameDataUpdate", thisGame);

        myPlayerIndex = index;

        client.emit("joinSucc", { index: index });
      }
    });

    client.on("getGameData", (data) => {
      try {
        let gid = data.id;

        if (thisGameId == null) {
          thisGameId = gid;
        }

        let games = cache.get("games");

        let game = games.find((g) => g.id == gid);

        client.emit("gameDataUpdate", game);
      } catch {}
    });

    client.on("gameStart", () => {
      console.log("GAME START");
      let thisGame = getGame(thisGameId);
      thisGame.started = true;

      let pList = thisGame.players.filter((p) => !p.empty);
      pList = pList.sort((a, b) => {
        a = a.index;
        b = b.index;
        if (a > b) {
          return 1;
        }
        if (a < b) {
          return -1;
        }

        return 0;
      });
      thisGame.turn.player = pList[0].index;
      thisGame.turn.end = Date.now() + 1000 * secsPerTurn; // 5 Seconds, make 20 later
      thisGame.turn.start = Date.now();

      let cacheTurn = {
        gid: thisGameId,
        index: pList[0].index,
        start: thisGame.turn.start,
        end: thisGame.turn.end,
        pickedCountries: false,
        madeTurn: false,
      };

      ongoingTurns.push(cacheTurn);

      changeGame(thisGame);

      console.log("EMITTING");

      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("playerNameChange", (data) => {
      let { name, uid } = data;

      if (name == null || name == "") {
        return;
      }

      let thisGame = getGame(thisGameId);

      let pl = thisGame.players;

      for (let i = 0; i < pl.length; i++) {
        let p = pl[i];

        if (p.index == uid) {
          p.name = name;
        }
      }

      thisGame.players = pl;

      changeGame(thisGame);

      let g = getGame(thisGameId);

      console.log("IO to ", thisGameId);
      client.to(thisGameId);
      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("choseCountry", (data) => {
      let thisGame = getGame(thisGameId);
      if (thisGame.turn.player == data.playerId) {
        console.log("DATA: ", data);
        thisGame.map[data.country].owner = data.playerId;
        changeGame(JSON.parse(JSON.stringify(thisGame)));
        goNextTurn(thisGameId);
      }
    });

    client.on("addArmyAtStart", (data) => {
      let { country, playerId } = data;

      let thisGame = getGame(thisGameId);

      if (thisGame.turn.player == data.playerId) {
        thisGame.map[country].armies += 1;
        thisGame.armiesPlacedCount += 1;
        changeGame(JSON.parse(JSON.stringify(thisGame)));
        goNextTurn(thisGameId);
      }
    });

    client.on("turnAddArmy", (data) => {
      let { playerId, country } = data;
      let thisGame = getGame(thisGameId);

      thisGame.turn.metadata.newArmies = thisGame.turn.metadata.newArmies - 1;

      thisGame.map[country].armies += 1;

      if (thisGame.turn.metadata.newArmies <= 0) {
        thisGame.turn.step = 2;
        thisGame.turn.start = Date.now();
        thisGame.turn.end = Date.now() + 1000 * secsPerTurn;
      }

      changeGame(JSON.parse(JSON.stringify(thisGame)));

      for (let i = 0; i < ongoingTurns.length; i++) {
        if (ongoingTurns[i].gid == thisGameId) {
          ongoingTurns[i]["metadata"] = {
            newArmies: thisGame.turn.metadata.newArmies,
          };
          if (thisGame.turn.metadata.newArmies <= 0) {
            // Go next step
            ongoingTurns[i]["turnStep"] = 2;
            ongoingTurns[i]["end"] = thisGame.turn.end;
            ongoingTurns[i]["start"] = thisGame.turn.start;
          }
        }
      }

      console.log(ongoingTurns);

      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("attackCountry", (data) => {
      let { index, fromCountry, attacking, dice } = data;

      let thisGame = getGame(thisGameId);
      thisGame.turn.end = -1;
      thisGame.turn.metadata = {
        ongoingBattle: {
          attacker: fromCountry,
          defender: attacking,
          dice: dice,
        },
        attacked: true,
      };

      changeGame(JSON.parse(JSON.stringify(thisGame)));

      for (let i = 0; i < ongoingTurns.length; i++) {
        if (ongoingTurns[i].gid == thisGameId) {
          ongoingTurns[i].end = -1;
          ongoingTurns[i].metadata = thisGame.turn.metadata;
        }
      }

      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("dontAttack", (data) => {
      console.log("DON'T ATTACK", data);

      let thisGame = getGame(thisGameId);

      console.log(thisGame.turn.metadata.attacked, " ATTACKED");

      if (thisGame.turn.metadata.attacked) {
        let [givenCard, newCards] = pickCard(thisGame);
        thisGame.cardDeck = newCards;

        for (let i = 0; i < thisGame.players.length; i++) {
          if (thisGame.players[i].index == thisGame.turn.player) {
            thisGame.players[i].cards.push(givenCard);
          }
        }
      }

      thisGame.turn.step = 3;
      thisGame.turn.start = Date.now();
      thisGame.turn.end = Date.now() + secsPerTurn * 1000;
      thisGame.turn.metadata = {};

      changeGame(JSON.parse(JSON.stringify(thisGame)));

      for (let i = 0; i < ongoingTurns.length; i++) {
        if (ongoingTurns[i].gid == thisGameId) {
          ongoingTurns[i].start = thisGame.turn.start;
          ongoingTurns[i].end = thisGame.turn.end;
          ongoingTurns[i].turnStep = 3;
          ongoingTurns[i].metadata = {};
        }
      }

      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("moveArmies", (data) => {
      let { from, to } = data;

      let thisGame = getGame(thisGameId);

      if (thisGame.map[from].armies > 1) {
        thisGame.map[from].armies -= 1;
        thisGame.map[to].armies += 1;

        changeGame(JSON.parse(JSON.stringify(thisGame)));

        io.to(thisGameId).emit("gameDataUpdate", thisGame);
      }
    });

    client.on("endTurn", (data) => {
      goNextTurn(thisGameId);
    });

    client.on("redeemCards", (data) => {
      let { index, cardType } = data;

      let thisGame = getGame(thisGameId);

      thisGame.turn.metadata.newArmies += 5;

      for (let i = 0; i < ongoingTurns.length; i++) {
        if (ongoingTurns[i].gid == thisGameId) {
          ongoingTurns[i].metadata.newArmies += 5;
        }
      }

      for (let i = 0; i < thisGame.players.length; i++) {
        if (thisGame.players[i].index == index) {
          // Selected correct players;

          let removeCards = [];
          let stayingCards = [];

          thisGame.players[i].cards.forEach((c) => {
            if (c.value != cardType) {
              stayingCards.push(c);
            } else {
              removeCards.push(c);
            }
          });

          if (stayingCards.length >= 3) {
            thisGame.players[i].cards = stayingCards;
          }
        }
      }

      changeGame(thisGame);

      io.to(thisGameId).emit("gameDataUpdate", thisGame);
    });

    client.on("disconnect", () => {
      if (myPlayerIndex != null) {
        let thisGame = getGame(thisGameId);
        let thisGamePlayers = thisGame.players;
        for (let i = 0; i < thisGamePlayers.length; i++) {
          if (thisGamePlayers[i].index == myPlayerIndex) {
            thisGamePlayers[i]["left"] = true;
          }
        }

        thisGame.players = thisGamePlayers;

        changeGame(JSON.parse(JSON.stringify(thisGame)));

        io.to(thisGameId).emit("gameDataUpdate", thisGame);
      }
    });
  });
};

module.exports.start = start;
