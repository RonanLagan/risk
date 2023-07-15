import React, { useEffect, useState } from "react";

import getNumber from "./NumberMap";

let maxArmiesStart = {
  3: 105,
  4: 90,
  5: 125,
  6: 120,
};

const indexMapColors = {
  default: {
    0: "#CC6761",
    1: "#BB59BD",
    2: "#E1E460",
    3: "#A8E2AA",
    4: "#EDA461",
    5: "#79D0E3",
  },
};

const indexCircleColors = {
  0: "#3A100D",
  1: "#1A0526",
  2: "#818321",
  3: "#0A2E18",
  4: "#834421",
  5: "#2F5C86",
};

const indexCircleStroke = {
  0: "#955252",
  1: "#845295",
  2: "#9EA034",
  3: "#415E37",
  4: "#D9883D",
  5: "#526D95",
};

const continentColors = {
  na: "#E1E460",
  sa: "#CC6761",
  eu: "#79D0E3",
  af: "#EDA461",
  as: "#A8E2AA",
  au: "#BB59BD",
};

export default function Map({
  map,
  gameStarted = false,
  gameData,
  myUid,
  socket,
  selectedAttackFrom,
  selectAttackCountry,
  setSelectedAttackFrom,
  setSelectAttackCountry,
}) {
  const [continentView, setContinentView] = useState(false);
  const [turn3Selection, setTurn3Selection] = useState("");

  const getFill = (countryName) => {
    let countryOnMap = map[countryName];

    let viewMode = "default";

    if (continentView) {
      let countryContinent = countryOnMap.continent;
      let color = continentColors[countryContinent];
      return color;
    }

    if (countryOnMap.owner < 0) {
      return "#aaa";
    } else {
      let col = indexMapColors[viewMode][countryOnMap.owner];
      return col;
    }
  };

  const getCircleFill = (countryName) => {
    if (continentView) {
      return "";
    }

    let countryOnMap = map[countryName];

    if (countryOnMap.owner < 0) {
      return "";
    }

    return indexCircleColors[countryOnMap.owner];
  };

  const getCircleStroke = (countryName) => {
    if (continentView) {
      return "";
    }

    let countryOnMap = map[countryName];

    if (countryOnMap.owner < 0) {
      return "";
    }

    return indexCircleStroke[countryOnMap.owner];
  };

  const getArmyNum = (countryName, x, y) => {
    if (continentView) {
      return "";
    }

    let countryOnMap = map[countryName];

    if (countryOnMap.owner < 0) {
      return "";
    }

    let armyNum = String(countryOnMap.armies);

    y = String(Number(y) + 2.5);

    let xOffset = 2.5;

    if (armyNum.length > 1) {
      xOffset = 5;
    }

    return (
      <text
        className="select-none pointer-events-none"
        style={{ fontSize: 8, fontWeight: "bold" }}
        fill="white"
        x={x - xOffset}
        y={y}
      >
        {armyNum}
      </text>
    );
  };

  const loadMap = () => {
    for (let key in map) {
      let country = map[key];
      if (country.owner == -1) {
      } else {
      }
    }
  };

  const countryClick = (e) => {
    let parentEle = e.target.parentElement;
    let clickedCountry = parentEle.id;

    let countryOnMap = gameData.map[clickedCountry];

    let clickedOnMyCountry = countryOnMap.owner == myUid;

    let playerCount = gameData.players.filter((p) => !p.empty).length;
    let countryStartMax = maxArmiesStart[playerCount];

    let placeCountryStartTurn = false;
    if (gameData.armiesPlacedCount < countryStartMax) {
      placeCountryStartTurn = true;
    }

    let isMyTurn = gameData.turn.player == myUid;

    if (gameData.started && !gameData.countriesChosen) {
      // Try to chose country
      let mapCountry = map[clickedCountry];
      if (mapCountry.owner < 0) {
        // Can select country
        console.log(myUid, gameData.turn);
        if (myUid == gameData.turn.player) {
          console.log("EMIT");
          socket.emit("choseCountry", {
            playerId: myUid,
            country: clickedCountry,
          });
        }
      }
    } else if (
      gameData.started &&
      placeCountryStartTurn &&
      clickedOnMyCountry &&
      isMyTurn
    ) {
      // Add army to country at start of game
      socket.emit("addArmyAtStart", {
        country: clickedCountry,
        playerId: myUid,
      });
    } else if (
      gameData.started &&
      isMyTurn &&
      clickedOnMyCountry &&
      gameData.turn.realTurn &&
      gameData.turn.step == 0
    ) {
      console.log("ADDED ARMY TO: ", clickedCountry);
      socket.emit("turnAddArmy", { playerId: myUid, country: clickedCountry });
    }

    //

    if (
      gameData.turn.step == 2 &&
      gameData.started &&
      isMyTurn &&
      gameData.turn.realTurn
    ) {
      if (
        clickedOnMyCountry &&
        selectedAttackFrom == "" &&
        selectAttackCountry == ""
      ) {
        if (countryOnMap.armies > 1) {
          setSelectedAttackFrom(clickedCountry);
        } else {
          return "";
        }
      }

      if (selectedAttackFrom != "" && selectAttackCountry == "") {
        let borderingAttack = map[selectedAttackFrom].borders;
        let newBordering = [];
        borderingAttack.forEach((b) => {
          if (map[b].owner != myUid) {
            newBordering.push(b);
          }
        });
        borderingAttack = newBordering;

        if (!borderingAttack.includes(clickedCountry)) {
          setSelectedAttackFrom("");
        } else {
          setSelectAttackCountry(clickedCountry);
        }
      } else if (selectedAttackFrom != "" && selectAttackCountry != "") {
        setSelectAttackCountry("");
        setSelectedAttackFrom("");
      }
    }

    if (
      gameData.turn.step == 3 &&
      clickedOnMyCountry &&
      turn3Selection == "" &&
      gameData.map[clickedCountry].armies > 1
    ) {
      setTurn3Selection(clickedCountry);
    } else if (
      gameData.turn.step == 3 &&
      clickedOnMyCountry &&
      turn3Selection != "" &&
      gameData.map[turn3Selection].armies <= 1
    ) {
      setTurn3Selection("");
    } else if (
      gameData.turn.step == 3 &&
      clickedOnMyCountry &&
      turn3Selection != "" &&
      clickedCountry != turn3Selection
    ) {
      socket.emit("moveArmies", { from: turn3Selection, to: clickedCountry });
    } else if (
      gameData.turn.step == 3 &&
      (turn3Selection == clickedCountry || !clickedOnMyCountry)
    ) {
      setTurn3Selection("");
    }
  };

  const getCountryClass = (countryName) => {
    if (continentView) {
      return "";
    }

    let playerCount = gameData.players.filter((p) => !p.empty).length;
    let countryStartMax = maxArmiesStart[playerCount];

    let placeCountryStartTurn = false;
    if (gameData.armiesPlacedCount < countryStartMax) {
      placeCountryStartTurn = true;
    }

    let mapCountry = map[countryName];

    let isMyTurn = false;

    if (gameData.turn == null) {
      gameData.turn = {};
    }

    if (gameData.turn.metadata == undefined) {
      gameData.turn.metadata = {};
    }

    if (gameData.turn.player == myUid) {
      isMyTurn = true;
    }

    let isMyCountry = false;

    if (mapCountry.owner == myUid) {
      isMyCountry = true;
    }

    if (gameData.started && !gameData.countriesChosen) {
      // Still in country selection
      if (mapCountry.owner < 0) {
        return "cursor-pointer hover:brightness-75";
      }
    } else if (
      (gameData.started && placeCountryStartTurn && isMyTurn && isMyCountry) ||
      (gameData.started &&
        gameData.turn.realTurn &&
        isMyTurn &&
        isMyCountry &&
        gameData.turn.step == 0)
    ) {
      return "cursor-pointer hover:brightness-75";
    } else if (gameData.turn.metadata.ongoingBattle != undefined) {
      let attacker = gameData.turn.metadata.ongoingBattle.attacker;
      let defender = gameData.turn.metadata.ongoingBattle.defender;

      if (countryName == attacker || countryName == defender) {
        return "brightness-110 animate-pulse";
      } else {
        return "brightness-[40%]";
      }

    } else if (
      gameData.turn.step == 2 &&
      gameData.started &&
      isMyTurn &&
      gameData.turn.realTurn
    ) {
      // Check if its one of my neightboring countries

      let myNeightbouringCountries = [];
      let myCountries = [];

      for (let key in gameData.map) {
        if (gameData.map[key].owner == myUid) {
          myCountries.push(key);
        }
      }

      myCountries.forEach((c) => {
        let count = gameData.map[c];
        let countBorders = count.borders;
        countBorders.forEach((b) => {
          if (
            !myNeightbouringCountries.includes(b) &&
            !myCountries.includes(b)
          ) {
            myNeightbouringCountries.push(b);
          }
        });
      });

      if (
        selectAttackCountry == "" &&
        selectedAttackFrom == "" &&
        isMyCountry
      ) {
        if (mapCountry.armies > 1) {
          return "cursor-pointer hover:brightness-75";
        }
      }

      if (selectedAttackFrom != "") {
        let borderingAttack = map[selectedAttackFrom].borders;
        let newBordering = [];
        borderingAttack.forEach((b) => {
          if (map[b].owner != myUid) {
            newBordering.push(b);
          }
        });

        borderingAttack = newBordering;

        if (selectAttackCountry != "") {
          if (
            countryName == selectAttackCountry ||
            countryName == selectedAttackFrom
          ) {
            return "animate-pulse";
          } else {
            return "brightness-[40%]";
          }
        }

        if (
          countryName != selectedAttackFrom &&
          !borderingAttack.includes(countryName)
        ) {
          return "brightness-[40%]";
        }

        if (countryName == selectedAttackFrom) {
          return "brightness-[175%]";
        }

        if (
          countryName != selectedAttackFrom &&
          borderingAttack.includes(countryName)
        ) {
          return "cursor-pointer hover:brightness-110";
        }
      }
    }

    if (
      gameData.turn.step == 3 &&
      isMyCountry &&
      mapCountry.armies > 1 &&
      turn3Selection == ""
    ) {
      return "hover:brightness-75 cursor-pointer";
    } else if (
      gameData.turn.step == 3 &&
      !isMyCountry &&
      turn3Selection != ""
    ) {
      return "brightness-[40%]";
    } else if (
      gameData.turn.step == 3 &&
      isMyCountry &&
      turn3Selection != "" &&
      countryName != turn3Selection
    ) {
      return "cursor-pointer hover:brightness-110";
    } else if (countryName == turn3Selection && gameData.turn.step == 3) {
      return "animate-pulse";
    }
  };

  useEffect(() => {
    loadMap();
  });

  return (
    <div className="flex flex-1 justify-center items-center relative">
      <div className="absolute z-30 right-0 top-0 m-2 flex flex-row items-center">
        <p className="text-lg">Continent view: </p>
        <input
          type="checkbox"
          checked={continentView}
          onClick={() => setContinentView(!continentView)}
          className="ms-2 cursor-pointer accent-red-600 w-4 h-4"
        />
      </div>
      {continentView ? (
        <div className="absolute left-0 z-30 bg-white p-2 rounded-lg shadow-2xl">
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#E1E460] rounded-lg"></div>
            <p className="ms-2 text-neutral-800">North america</p>
            <p className="text-neutral-500 ms-2">5 points</p>
          </div>
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#CC6761] rounded-lg"></div>
            <p className="ms-2">South america</p>
            <p className="text-neutral-500 ms-2">2 points</p>
          </div>
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#79D0E3] rounded-lg"></div>
            <p className="ms-2 text-neutral-800">Europe</p>
            <p className="text-neutral-500 ms-2">5 points</p>
          </div>
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#EDA461] rounded-lg"></div>
            <p className="ms-2 text-neutral-800">Africa</p>
            <p className="text-neutral-500 ms-2">3 points</p>
          </div>
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#A8E2AA] rounded-lg"></div>
            <p className="ms-2 text-neutral-800">Asia</p>
            <p className="text-neutral-500 ms-2">7 points</p>
          </div>
          <div className="flex flex-row mb-4">
            <div className="w-6 h-6 bg-[#BB59BD] rounded-lg"></div>
            <p className="ms-2 text-neutral-800">Oceania</p>
            <p className="text-neutral-500 ms-2">2 points</p>
          </div>
        </div>
      ) : (
        <></>
      )}
      <svg
        className="h-[100%] max-w-[100%] absolute"
        viewBox="0 0 750 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="svg2">
          <g id="layer3">
            <g id="path2900" filter="url(#filter0_f_1_2)">
              <path
                d="M318.754 134.445C318.754 134.843 318.595 135.224 318.314 135.506C318.033 135.787 317.651 135.945 317.254 135.945C316.856 135.945 316.474 135.787 316.193 135.506C315.912 135.224 315.754 134.843 315.754 134.445C315.754 134.047 315.912 133.666 316.193 133.384C316.474 133.103 316.856 132.945 317.254 132.945C317.651 132.945 318.033 133.103 318.314 133.384C318.595 133.666 318.754 134.047 318.754 134.445Z"
                fill="black"
              ></path>
            </g>
            <g id="path2902" filter="url(#filter1_f_1_2)">
              <path
                d="M317.504 134.445L330.504 115.445"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path2904" filter="url(#filter2_f_1_2)">
              <path
                d="M332.004 115.445C332.004 115.843 331.845 116.224 331.564 116.506C331.283 116.787 330.901 116.945 330.504 116.945C330.106 116.945 329.724 116.787 329.443 116.506C329.162 116.224 329.004 115.843 329.004 115.445C329.004 115.047 329.162 114.666 329.443 114.384C329.724 114.103 330.106 113.945 330.504 113.945C330.901 113.945 331.283 114.103 331.564 114.384C331.845 114.666 332.004 115.047 332.004 115.445Z"
                fill="black"
              ></path>
            </g>
            <g id="path2906" filter="url(#filter3_f_1_2)">
              <path
                d="M330.504 115.445L353.754 128.945"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path2908" filter="url(#filter4_f_1_2)">
              <path
                d="M355.254 128.945C355.254 129.343 355.095 129.724 354.814 130.006C354.533 130.287 354.151 130.445 353.754 130.445C353.356 130.445 352.974 130.287 352.693 130.006C352.412 129.724 352.254 129.343 352.254 128.945C352.254 128.547 352.412 128.166 352.693 127.884C352.974 127.603 353.356 127.445 353.754 127.445C354.151 127.445 354.533 127.603 354.814 127.884C355.095 128.166 355.254 128.547 355.254 128.945Z"
                fill="black"
              ></path>
            </g>
            <g id="path2910" filter="url(#filter5_f_1_2)">
              <path
                d="M353.754 128.945L353.504 163.195"
                stroke="black"
                strokeWidth="1.2"
                strokeDasharray="4.8 1.2"
              ></path>
            </g>
            <g id="path2912" filter="url(#filter6_f_1_2)">
              <path
                d="M355.004 163.195C355.004 163.593 354.845 163.974 354.564 164.256C354.283 164.537 353.901 164.695 353.504 164.695C353.106 164.695 352.724 164.537 352.443 164.256C352.162 163.974 352.004 163.593 352.004 163.195C352.004 162.797 352.162 162.416 352.443 162.134C352.724 161.853 353.106 161.695 353.504 161.695C353.901 161.695 354.283 161.853 354.564 162.134C354.845 162.416 355.004 162.797 355.004 163.195Z"
                fill="black"
              ></path>
            </g>
            <g id="path2914" filter="url(#filter7_f_1_2)">
              <path
                d="M353.504 163.195L317.254 134.445"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path2918" filter="url(#filter8_f_1_2)">
              <path
                d="M317.504 134.445L353.754 129.195"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4638" filter="url(#filter9_f_1_2)">
              <path
                d="M323.754 196.57C323.754 196.968 323.595 197.349 323.314 197.631C323.033 197.912 322.651 198.07 322.254 198.07C321.856 198.07 321.474 197.912 321.193 197.631C320.912 197.349 320.754 196.968 320.754 196.57C320.754 196.172 320.912 195.791 321.193 195.509C321.474 195.228 321.856 195.07 322.254 195.07C322.651 195.07 323.033 195.228 323.314 195.509C323.595 195.791 323.754 196.172 323.754 196.57Z"
                fill="black"
              ></path>
            </g>
            <g id="path4640" filter="url(#filter10_f_1_2)">
              <path
                d="M322.254 196.57L314.754 184.07"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4642" filter="url(#filter11_f_1_2)">
              <path
                d="M316.379 184.07C316.379 184.468 316.22 184.849 315.939 185.131C315.658 185.412 315.276 185.57 314.879 185.57C314.481 185.57 314.099 185.412 313.818 185.131C313.537 184.849 313.379 184.468 313.379 184.07C313.379 183.672 313.537 183.291 313.818 183.009C314.099 182.728 314.481 182.57 314.879 182.57C315.276 182.57 315.658 182.728 315.939 183.009C316.22 183.291 316.379 183.672 316.379 184.07Z"
                fill="black"
              ></path>
            </g>
            <g id="path4644" filter="url(#filter12_f_1_2)">
              <path
                d="M396.361 252.758C396.361 253.156 396.202 253.537 395.921 253.819C395.64 254.1 395.258 254.258 394.861 254.258C394.463 254.258 394.081 254.1 393.8 253.819C393.519 253.537 393.361 253.156 393.361 252.758C393.361 252.36 393.519 251.979 393.8 251.697C394.081 251.416 394.463 251.258 394.861 251.258C395.258 251.258 395.64 251.416 395.921 251.697C396.202 251.979 396.361 252.36 396.361 252.758Z"
                fill="black"
              ></path>
            </g>
            <g id="path4646" filter="url(#filter13_f_1_2)">
              <path
                d="M394.861 252.758L396.275 270.966"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4648" filter="url(#filter14_f_1_2)">
              <path
                d="M397.952 270.966C397.952 271.364 397.793 271.745 397.512 272.027C397.231 272.308 396.849 272.466 396.452 272.466C396.054 272.466 395.672 272.308 395.391 272.027C395.11 271.745 394.952 271.364 394.952 270.966C394.952 270.568 395.11 270.187 395.391 269.905C395.672 269.624 396.054 269.466 396.452 269.466C396.849 269.466 397.231 269.624 397.512 269.905C397.793 270.187 397.952 270.568 397.952 270.966Z"
                fill="black"
              ></path>
            </g>
            <g id="path4650" filter="url(#filter15_f_1_2)">
              <path
                d="M461.061 313.392C461.061 313.79 460.903 314.172 460.621 314.453C460.34 314.734 459.959 314.892 459.561 314.892C459.163 314.892 458.781 314.734 458.5 314.453C458.219 314.172 458.061 313.79 458.061 313.392C458.061 312.995 458.219 312.613 458.5 312.332C458.781 312.05 459.163 311.892 459.561 311.892C459.959 311.892 460.34 312.05 460.621 312.332C460.903 312.613 461.061 312.995 461.061 313.392Z"
                fill="black"
              ></path>
            </g>
            <g id="path4652" filter="url(#filter16_f_1_2)">
              <path
                d="M459.561 313.039L451.429 325.59"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4654" filter="url(#filter17_f_1_2)">
              <path
                d="M452.929 325.59C452.929 325.988 452.771 326.369 452.49 326.651C452.208 326.932 451.827 327.09 451.429 327.09C451.031 327.09 450.65 326.932 450.368 326.651C450.087 326.369 449.929 325.988 449.929 325.59C449.929 325.192 450.087 324.811 450.368 324.529C450.65 324.248 451.031 324.09 451.429 324.09C451.827 324.09 452.208 324.248 452.49 324.529C452.771 324.811 452.929 325.192 452.929 325.59Z"
                fill="black"
              ></path>
            </g>
            <g id="path4656" filter="url(#filter18_f_1_2)">
              <path
                d="M625.817 313.216C625.817 313.613 625.659 313.995 625.377 314.276C625.096 314.558 624.715 314.716 624.317 314.716C623.919 314.716 623.537 314.558 623.256 314.276C622.975 313.995 622.817 313.613 622.817 313.216C622.817 312.818 622.975 312.436 623.256 312.155C623.537 311.874 623.919 311.716 624.317 311.716C624.715 311.716 625.096 311.874 625.377 312.155C625.659 312.436 625.817 312.818 625.817 313.216Z"
                fill="black"
              ></path>
            </g>
            <g id="path4658" filter="url(#filter19_f_1_2)">
              <path
                d="M624.493 313.216L631.918 338.141"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4660" filter="url(#filter20_f_1_2)">
              <path
                d="M633.418 338.141C633.418 338.539 633.26 338.921 632.979 339.202C632.697 339.483 632.316 339.641 631.918 339.641C631.52 339.641 631.139 339.483 630.857 339.202C630.576 338.921 630.418 338.539 630.418 338.141C630.418 337.743 630.576 337.362 630.857 337.08C631.139 336.799 631.52 336.641 631.918 336.641C632.316 336.641 632.697 336.799 632.979 337.08C633.26 337.362 633.418 337.743 633.418 338.141Z"
                fill="black"
              ></path>
            </g>
            <g id="path4662" filter="url(#filter21_f_1_2)">
              <path
                d="M631.918 338.495L650.656 342.561"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4664" filter="url(#filter22_f_1_2)">
              <path
                d="M309.033 311.978C309.033 312.376 308.875 312.758 308.593 313.039C308.312 313.32 307.931 313.478 307.533 313.478C307.135 313.478 306.753 313.32 306.472 313.039C306.191 312.758 306.033 312.376 306.033 311.978C306.033 311.58 306.191 311.199 306.472 310.918C306.753 310.636 307.135 310.478 307.533 310.478C307.931 310.478 308.312 310.636 308.593 310.918C308.875 311.199 309.033 311.58 309.033 311.978Z"
                fill="black"
              ></path>
            </g>
            <g id="path4666" filter="url(#filter23_f_1_2)">
              <path
                d="M307.533 311.978L281.723 319.403"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4668" filter="url(#filter24_f_1_2)">
              <path
                d="M283.223 319.403C283.223 319.801 283.065 320.182 282.784 320.464C282.503 320.745 282.121 320.903 281.723 320.903C281.326 320.903 280.944 320.745 280.663 320.464C280.381 320.182 280.223 319.801 280.223 319.403C280.223 319.005 280.381 318.623 280.663 318.342C280.944 318.061 281.326 317.903 281.723 317.903C282.121 317.903 282.503 318.061 282.784 318.342C283.065 318.623 283.223 319.005 283.223 319.403Z"
                fill="black"
              ></path>
            </g>
            <g id="path4670" filter="url(#filter25_f_1_2)">
              <path
                d="M233.753 61.1949C233.753 61.5928 233.595 61.9743 233.314 62.2556C233.033 62.5369 232.651 62.6949 232.253 62.6949C231.856 62.6949 231.474 62.5369 231.193 62.2556C230.912 61.9743 230.753 61.5928 230.753 61.1949C230.753 60.7971 230.912 60.4156 231.193 60.1343C231.474 59.853 231.856 59.6949 232.253 59.6949C232.651 59.6949 233.033 59.853 233.314 60.1343C233.595 60.4156 233.753 60.7971 233.753 61.1949Z"
                fill="black"
              ></path>
            </g>
            <g id="path4672" filter="url(#filter26_f_1_2)">
              <path
                d="M232.253 61.1949L216.753 98.6949"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4674" filter="url(#filter27_f_1_2)">
              <path
                d="M218.253 98.6949C218.253 99.0928 218.095 99.4743 217.814 99.7556C217.533 100.037 217.151 100.195 216.753 100.195C216.356 100.195 215.974 100.037 215.693 99.7556C215.412 99.4743 215.253 99.0928 215.253 98.6949C215.253 98.2971 215.412 97.9156 215.693 97.6343C215.974 97.353 216.356 97.1949 216.753 97.1949C217.151 97.1949 217.533 97.353 217.814 97.6343C218.095 97.9156 218.253 98.2971 218.253 98.6949Z"
                fill="black"
              ></path>
            </g>
            <g id="path4676" filter="url(#filter28_f_1_2)">
              <path
                d="M232.253 60.9449L164.253 111.195"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4678" filter="url(#filter29_f_1_2)">
              <path
                d="M165.753 111.195C165.753 111.593 165.595 111.974 165.314 112.256C165.033 112.537 164.651 112.695 164.253 112.695C163.856 112.695 163.474 112.537 163.193 112.256C162.912 111.974 162.753 111.593 162.753 111.195C162.753 110.797 162.912 110.416 163.193 110.134C163.474 109.853 163.856 109.695 164.253 109.695C164.651 109.695 165.033 109.853 165.314 110.134C165.595 110.416 165.753 110.797 165.753 111.195Z"
                fill="black"
              ></path>
            </g>
            <g id="path4680" filter="url(#filter30_f_1_2)">
              <path
                d="M232.253 60.9449L195.503 69.1949"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4682" filter="url(#filter31_f_1_2)">
              <path
                d="M197.003 69.1949C197.003 69.5928 196.845 69.9743 196.564 70.2556C196.283 70.5369 195.901 70.6949 195.503 70.6949C195.106 70.6949 194.724 70.5369 194.443 70.2556C194.162 69.9743 194.003 69.5928 194.003 69.1949C194.003 68.7971 194.162 68.4156 194.443 68.1343C194.724 67.853 195.106 67.6949 195.503 67.6949C195.901 67.6949 196.283 67.853 196.564 68.1343C196.845 68.4156 197.003 68.7971 197.003 69.1949Z"
                fill="black"
              ></path>
            </g>
            <g id="path4684" filter="url(#filter32_f_1_2)">
              <path
                d="M305.504 95.9449C305.504 96.3428 305.345 96.7243 305.064 97.0056C304.783 97.2869 304.401 97.4449 304.004 97.4449C303.606 97.4449 303.224 97.2869 302.943 97.0056C302.662 96.7243 302.504 96.3428 302.504 95.9449C302.504 95.5471 302.662 95.1656 302.943 94.8843C303.224 94.603 303.606 94.4449 304.004 94.4449C304.401 94.4449 304.783 94.603 305.064 94.8843C305.345 95.1656 305.504 95.5471 305.504 95.9449Z"
                fill="black"
              ></path>
            </g>
            <g id="path4686" filter="url(#filter33_f_1_2)">
              <path
                d="M304.004 95.9449L283.504 78.1949"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4688" filter="url(#filter34_f_1_2)">
              <path
                d="M285.004 78.4449C285.004 78.8428 284.845 79.2243 284.564 79.5056C284.283 79.7869 283.901 79.9449 283.504 79.9449C283.106 79.9449 282.724 79.7869 282.443 79.5056C282.162 79.2243 282.004 78.8428 282.004 78.4449C282.004 78.0471 282.162 77.6656 282.443 77.3843C282.724 77.103 283.106 76.9449 283.504 76.9449C283.901 76.9449 284.283 77.103 284.564 77.3843C284.845 77.6656 285.004 78.0471 285.004 78.4449Z"
                fill="black"
              ></path>
            </g>
            <g id="path4690" filter="url(#filter35_f_1_2)">
              <path
                d="M656.929 157.299C656.929 157.696 656.771 158.078 656.49 158.359C656.209 158.641 655.827 158.799 655.429 158.799C655.032 158.799 654.65 158.641 654.369 158.359C654.087 158.078 653.929 157.696 653.929 157.299C653.929 156.901 654.087 156.519 654.369 156.238C654.65 155.957 655.032 155.799 655.429 155.799C655.827 155.799 656.209 155.957 656.49 156.238C656.771 156.519 656.929 156.901 656.929 157.299Z"
                fill="black"
              ></path>
            </g>
            <g id="path4692" filter="url(#filter36_f_1_2)">
              <path
                d="M655.429 157.299L678.057 176.037"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4694" filter="url(#filter37_f_1_2)">
              <path
                d="M679.557 176.037C679.557 176.435 679.399 176.816 679.117 177.098C678.836 177.379 678.455 177.537 678.057 177.537C677.659 177.537 677.277 177.379 676.996 177.098C676.715 176.816 676.557 176.435 676.557 176.037C676.557 175.639 676.715 175.258 676.996 174.976C677.277 174.695 677.659 174.537 678.057 174.537C678.455 174.537 678.836 174.695 679.117 174.976C679.399 175.258 679.557 175.639 679.557 176.037Z"
                fill="black"
              ></path>
            </g>
            <g id="path4696" filter="url(#filter38_f_1_2)">
              <path
                d="M678.057 176.037L645.883 181.34"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4698" filter="url(#filter39_f_1_2)">
              <path
                d="M647.383 181.34C647.383 181.738 647.225 182.12 646.944 182.401C646.663 182.682 646.281 182.84 645.883 182.84C645.486 182.84 645.104 182.682 644.823 182.401C644.541 182.12 644.383 181.738 644.383 181.34C644.383 180.942 644.541 180.561 644.823 180.28C645.104 179.998 645.486 179.84 645.883 179.84C646.281 179.84 646.663 179.998 646.944 180.28C647.225 180.561 647.383 180.942 647.383 181.34Z"
                fill="black"
              ></path>
            </g>
            <g id="path4700" filter="url(#filter40_f_1_2)">
              <path
                d="M656.576 344.328C656.576 344.726 656.418 345.108 656.136 345.389C655.855 345.67 655.474 345.828 655.076 345.828C654.678 345.828 654.296 345.67 654.015 345.389C653.734 345.108 653.576 344.726 653.576 344.328C653.576 343.931 653.734 343.549 654.015 343.268C654.296 342.986 654.678 342.828 655.076 342.828C655.474 342.828 655.855 342.986 656.136 343.268C656.418 343.549 656.576 343.931 656.576 344.328Z"
                fill="black"
              ></path>
            </g>
            <g id="path4702" filter="url(#filter41_f_1_2)">
              <path
                d="M655.076 344.328L654.369 392.058"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4704" filter="url(#filter42_f_1_2)">
              <path
                d="M655.869 392.058C655.869 392.456 655.711 392.837 655.429 393.119C655.148 393.4 654.767 393.558 654.369 393.558C653.971 393.558 653.589 393.4 653.308 393.119C653.027 392.837 652.869 392.456 652.869 392.058C652.869 391.66 653.027 391.279 653.308 390.997C653.589 390.716 653.971 390.558 654.369 390.558C654.767 390.558 655.148 390.716 655.429 390.997C655.711 391.279 655.869 391.66 655.869 392.058Z"
                fill="black"
              ></path>
            </g>
            <g id="path4706" filter="url(#filter43_f_1_2)">
              <path
                d="M654.369 392.058L643.055 383.573"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4708" filter="url(#filter44_f_1_2)">
              <path
                d="M644.504 383.695C644.504 384.093 644.345 384.474 644.064 384.756C643.783 385.037 643.401 385.195 643.004 385.195C642.606 385.195 642.224 385.037 641.943 384.756C641.662 384.474 641.504 384.093 641.504 383.695C641.504 383.297 641.662 382.916 641.943 382.634C642.224 382.353 642.606 382.195 643.004 382.195C643.401 382.195 643.783 382.353 644.064 382.634C644.345 382.916 644.504 383.297 644.504 383.695Z"
                fill="black"
              ></path>
            </g>
            <g id="path4710" filter="url(#filter45_f_1_2)">
              <path
                d="M670.254 380.07C670.254 380.468 670.095 380.849 669.814 381.131C669.533 381.412 669.151 381.57 668.754 381.57C668.356 381.57 667.974 381.412 667.693 381.131C667.412 380.849 667.254 380.468 667.254 380.07C667.254 379.672 667.412 379.291 667.693 379.009C667.974 378.728 668.356 378.57 668.754 378.57C669.151 378.57 669.533 378.728 669.814 379.009C670.095 379.291 670.254 379.672 670.254 380.07Z"
                fill="black"
              ></path>
            </g>
            <g id="path4712" filter="url(#filter46_f_1_2)">
              <path
                d="M668.754 380.07L655.004 344.32"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4714" filter="url(#filter47_f_1_2)">
              <path
                d="M457.525 380.391C457.525 380.789 457.367 381.17 457.086 381.451C456.805 381.733 456.423 381.891 456.025 381.891C455.627 381.891 455.246 381.733 454.965 381.451C454.683 381.17 454.525 380.789 454.525 380.391C454.525 379.993 454.683 379.611 454.965 379.33C455.246 379.049 455.627 378.891 456.025 378.891C456.423 378.891 456.805 379.049 457.086 379.33C457.367 379.611 457.525 379.993 457.525 380.391Z"
                fill="black"
              ></path>
            </g>
            <g id="path4716" filter="url(#filter48_f_1_2)">
              <path
                d="M456.004 380.445L464.254 426.195"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4718" filter="url(#filter49_f_1_2)">
              <path
                d="M465.754 426.195C465.754 426.593 465.595 426.974 465.314 427.256C465.033 427.537 464.651 427.695 464.254 427.695C463.856 427.695 463.474 427.537 463.193 427.256C462.912 426.974 462.754 426.593 462.754 426.195C462.754 425.797 462.912 425.416 463.193 425.134C463.474 424.853 463.856 424.695 464.254 424.695C464.651 424.695 465.033 424.853 465.314 425.134C465.595 425.416 465.754 425.797 465.754 426.195Z"
                fill="black"
              ></path>
            </g>
            <g id="path4720" filter="url(#filter50_f_1_2)">
              <path
                d="M464.254 426.195L442.004 441.695"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4722" filter="url(#filter51_f_1_2)">
              <path
                d="M443.504 441.695C443.504 442.093 443.345 442.474 443.064 442.756C442.783 443.037 442.401 443.195 442.004 443.195C441.606 443.195 441.224 443.037 440.943 442.756C440.662 442.474 440.504 442.093 440.504 441.695C440.504 441.297 440.662 440.916 440.943 440.634C441.224 440.353 441.606 440.195 442.004 440.195C442.401 440.195 442.783 440.353 443.064 440.634C443.345 440.916 443.504 441.297 443.504 441.695Z"
                fill="black"
              ></path>
            </g>
            <g id="path4724" filter="url(#filter52_f_1_2)">
              <path
                d="M28.2256 97.7249H9.84085"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
            <g id="path4726" filter="url(#filter53_f_1_2)">
              <path
                d="M678.41 100.377L722.251 100.73"
                stroke="black"
                strokeDasharray="4 1"
              ></path>
            </g>
          </g>
          <g id="layer4">
            <g id="alaska">
              <path
                id="alaska_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M84.1026 127.099C83.4776 125.849 83.6026 127.224 83.2276 125.099C82.8526 122.974 82.1026 123.224 81.4776 122.599C80.8526 121.974 79.9776 121.849 80.3526 120.724C80.7276 119.599 80.9776 119.599 80.6026 118.474C80.2276 117.349 78.6026 116.724 78.1026 115.599C77.6026 114.474 77.6026 115.349 77.6026 113.599C77.6026 111.849 78.1026 111.599 76.6026 111.099C75.1026 110.599 74.1026 111.849 73.3526 110.224C72.6026 108.599 72.7276 109.474 71.2276 109.224C69.7276 108.974 69.1026 109.099 68.6026 108.099C68.1026 107.099 67.8526 106.224 66.8526 106.224C65.8526 106.224 64.6026 105.849 64.3526 105.224C64.1026 104.599 62.7276 102.849 61.8526 102.849C60.9776 102.849 61.2276 103.474 59.8526 104.099C58.4776 104.724 62.3526 105.349 59.3526 106.099C56.3526 106.849 54.9776 107.099 54.3526 106.599C53.7276 106.099 51.4776 107.724 51.8526 105.849C52.2276 103.974 52.3526 104.224 52.9776 103.724C53.6026 103.224 55.3526 103.099 54.6026 102.599C53.8526 102.099 54.2276 101.224 51.6026 101.849C48.9776 102.474 48.2276 102.724 47.3526 103.349C46.4776 103.974 46.4776 105.224 46.1026 105.974C45.7276 106.724 47.2276 106.474 44.3526 107.724C41.4776 108.974 42.9776 107.099 39.9776 109.724C36.9776 112.349 37.9776 112.599 35.7276 112.974C33.4776 113.349 34.8526 112.974 33.1026 114.849C31.3526 116.724 31.6026 117.599 29.8526 117.599C28.1026 117.599 28.7276 120.724 27.1026 118.599C25.4776 116.474 24.3526 117.349 25.6026 116.349C26.8526 115.349 27.1026 115.599 28.1026 115.349C29.1026 115.099 28.6026 115.724 29.7276 114.099C30.8526 112.474 30.6026 111.849 32.3526 111.724C34.1026 111.599 33.8526 113.224 34.6026 110.849C35.3526 108.474 34.6026 108.599 35.9776 107.349C37.3526 106.099 38.8526 104.849 37.1026 104.724C35.3526 104.599 35.2276 104.224 33.6026 104.974C31.9776 105.724 31.8526 106.099 30.3526 105.849C28.8526 105.599 28.4776 105.474 28.4776 104.849C28.4776 104.224 27.8526 102.224 27.8526 102.224C27.8526 102.224 29.1026 101.599 26.9776 101.099C24.8526 100.599 24.7276 102.224 24.8526 100.599C24.9776 98.9743 25.9776 99.2243 25.1026 98.4743C24.2276 97.7243 23.9776 97.2243 22.8526 97.7243C21.7276 98.2243 20.4776 99.4743 21.2276 97.5993C21.9776 95.7243 23.4776 94.9743 23.9776 94.2243C24.4776 93.4743 25.2276 91.3493 25.4776 90.2243C25.7276 89.0993 24.4776 89.7243 25.9776 88.5993C27.4776 87.4743 26.8526 87.2243 28.7276 87.3493C30.6026 87.4743 30.1026 87.3493 31.3526 87.9743C32.6026 88.5993 32.9776 88.9743 33.7276 88.5993C34.4776 88.2243 35.2276 87.3493 35.7276 86.7243C36.2276 86.0993 36.8526 85.7243 36.9776 84.9743C37.1026 84.2243 37.7276 83.4743 36.3526 83.9743C34.9776 84.4743 35.4776 84.4743 33.6026 84.8493C31.7276 85.2243 31.9776 86.5993 31.2276 84.9743C30.4776 83.3493 30.3526 82.5993 30.3526 82.5993C30.3526 82.5993 29.6026 82.5993 29.7276 80.8493C29.8526 79.0993 28.6026 76.2243 31.9776 75.3493C35.3526 74.4743 37.4776 75.2243 37.6026 75.7243C37.7276 76.2243 36.6026 76.7243 38.1026 76.8493C39.6026 76.9743 39.7276 77.3493 40.6026 76.0993C41.4776 74.8493 42.4776 74.9743 41.4776 74.4743C40.4776 73.9743 39.6026 74.0993 39.1026 73.0993C38.6026 72.0993 39.1026 71.8493 38.6026 70.4743C38.1026 69.0993 38.1026 68.8493 37.3526 67.8493C36.6026 66.8493 34.6026 65.3493 37.1026 64.7243C39.6026 64.0993 42.2276 63.4743 41.7346 63.8293C41.7346 63.8293 44.563 60.6474 46.3308 61.0009C48.0986 61.3545 50.2199 61.0009 51.9877 59.5867C53.7554 58.1725 56.5839 58.8796 56.5839 58.8796L58.7052 60.6473C58.7052 60.6473 61.5336 63.4758 63.3014 62.4151C65.0691 61.3545 65.0691 64.1829 68.2511 64.5364C71.4331 64.89 72.8473 65.5971 76.0293 66.6578C76.0293 66.6578 76.9132 66.3042 76.7364 67.5416C76.5596 68.7791 74.7919 98.124 75.3222 98.4776L75.4741 98.7222L82.9741 99.5972C82.9741 99.5972 83.0991 99.7222 83.5991 101.222C84.0991 102.722 84.4741 103.722 85.5991 105.722C86.7241 107.722 85.7241 113.722 85.7241 113.722L87.7241 116.472C87.7241 116.472 89.3491 117.222 89.9741 117.347C90.5991 117.472 90.3491 120.597 90.2241 121.847C90.0991 123.097 88.5991 122.472 87.7241 122.722C86.8491 122.972 86.5991 125.097 86.4741 126.347C86.3491 127.597 84.1026 127.099 84.1026 127.099Z"
                className={getCountryClass("alaska")}
                fill={getFill("alaska")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info">
                <path
                  id="Alaska"
                  d="M50.1587 81H49.1701L50.6765 76.6364H51.8654L53.3697 81H52.381L51.288 77.6335H51.2539L50.1587 81ZM50.0969 79.2848H52.4322V80.005H50.0969V79.2848ZM54.7855 76.6364V81H53.8778V76.6364H54.7855ZM56.4458 81.0618C56.237 81.0618 56.051 81.0256 55.8876 80.9531C55.7243 80.8793 55.595 80.7706 55.4998 80.6271C55.4061 80.4822 55.3592 80.3018 55.3592 80.0859C55.3592 79.9041 55.3926 79.7514 55.4593 79.6278C55.5261 79.5043 55.617 79.4048 55.7321 79.3295C55.8471 79.2543 55.9778 79.1974 56.1241 79.1591C56.2718 79.1207 56.4267 79.0938 56.5886 79.0781C56.7789 79.0582 56.9324 79.0398 57.0488 79.0227C57.1653 79.0043 57.2498 78.9773 57.3024 78.9418C57.3549 78.9062 57.3812 78.8537 57.3812 78.7841V78.7713C57.3812 78.6364 57.3386 78.532 57.2534 78.4581C57.1696 78.3842 57.0502 78.3473 56.8954 78.3473C56.7321 78.3473 56.6021 78.3835 56.5055 78.456C56.4089 78.527 56.345 78.6165 56.3137 78.7244L55.4743 78.6562C55.5169 78.4574 55.6007 78.2855 55.7257 78.1406C55.8507 77.9943 56.0119 77.8821 56.2093 77.804C56.4082 77.7244 56.6383 77.6847 56.8997 77.6847C57.0815 77.6847 57.2555 77.706 57.4217 77.7486C57.5893 77.7912 57.7377 77.8572 57.867 77.9467C57.9977 78.0362 58.1007 78.1513 58.176 78.2919C58.2512 78.4311 58.2889 78.598 58.2889 78.7926V81H57.4281V80.5462H57.4025C57.35 80.6484 57.2797 80.7386 57.1916 80.8168C57.1035 80.8935 56.9977 80.9538 56.8741 80.9979C56.7505 81.0405 56.6078 81.0618 56.4458 81.0618ZM56.7058 80.4354C56.8393 80.4354 56.9572 80.4091 57.0595 80.3565C57.1618 80.3026 57.242 80.2301 57.3002 80.1392C57.3585 80.0483 57.3876 79.9453 57.3876 79.8303V79.483C57.3592 79.5014 57.3201 79.5185 57.2704 79.5341C57.2221 79.5483 57.1674 79.5618 57.1064 79.5746C57.0453 79.5859 56.9842 79.5966 56.9231 79.6065C56.862 79.6151 56.8066 79.6229 56.7569 79.63C56.6504 79.6456 56.5574 79.6705 56.4778 79.7045C56.3983 79.7386 56.3365 79.7848 56.2924 79.843C56.2484 79.8999 56.2264 79.9709 56.2264 80.0561C56.2264 80.1797 56.2711 80.2741 56.3606 80.3395C56.4515 80.4034 56.5666 80.4354 56.7058 80.4354ZM61.7161 78.6605L60.8851 78.7116C60.8709 78.6406 60.8404 78.5767 60.7935 78.5199C60.7466 78.4616 60.6848 78.4155 60.6081 78.3814C60.5328 78.3459 60.4426 78.3281 60.3375 78.3281C60.1969 78.3281 60.0783 78.358 59.9817 78.4176C59.8851 78.4759 59.8368 78.554 59.8368 78.652C59.8368 78.7301 59.8681 78.7962 59.9306 78.8501C59.9931 78.9041 60.1003 78.9474 60.2523 78.9801L60.8446 79.0994C61.1628 79.1648 61.4 79.2699 61.5563 79.4148C61.7125 79.5597 61.7907 79.75 61.7907 79.9858C61.7907 80.2003 61.7275 80.3885 61.601 80.5504C61.476 80.7124 61.3042 80.8388 61.0854 80.9297C60.8681 81.0192 60.6174 81.0639 60.3333 81.0639C59.9 81.0639 59.5549 80.9737 59.2978 80.7933C59.0421 80.6115 58.8922 80.3643 58.8482 80.0518L59.7409 80.005C59.7679 80.1371 59.8333 80.2379 59.937 80.3075C60.0407 80.3757 60.1735 80.4098 60.3354 80.4098C60.4945 80.4098 60.6223 80.3793 60.7189 80.3182C60.8169 80.2557 60.8667 80.1754 60.8681 80.0774C60.8667 79.995 60.8319 79.9276 60.7637 79.875C60.6955 79.821 60.5904 79.7798 60.4483 79.7514L59.8816 79.6385C59.562 79.5746 59.324 79.4638 59.1678 79.3061C59.013 79.1484 58.9355 78.9474 58.9355 78.7031C58.9355 78.4929 58.9924 78.3118 59.106 78.1598C59.2211 78.0078 59.3823 77.8906 59.5897 77.8082C59.7985 77.7259 60.0428 77.6847 60.3226 77.6847C60.736 77.6847 61.0613 77.772 61.2985 77.9467C61.5371 78.1214 61.6763 78.3594 61.7161 78.6605ZM63.1847 80.0582L63.1868 78.9695H63.3189L64.3672 77.7273H65.4091L64.0007 79.3722H63.7855L63.1847 80.0582ZM62.3622 81V76.6364H63.2699V81H62.3622ZM64.4077 81L63.4446 79.5746L64.0497 78.9332L65.4709 81H64.4077ZM66.7876 81.0618C66.5788 81.0618 66.3928 81.0256 66.2294 80.9531C66.0661 80.8793 65.9368 80.7706 65.8416 80.6271C65.7479 80.4822 65.701 80.3018 65.701 80.0859C65.701 79.9041 65.7344 79.7514 65.8011 79.6278C65.8679 79.5043 65.9588 79.4048 66.0739 79.3295C66.1889 79.2543 66.3196 79.1974 66.4659 79.1591C66.6136 79.1207 66.7685 79.0938 66.9304 79.0781C67.1207 79.0582 67.2741 79.0398 67.3906 79.0227C67.5071 79.0043 67.5916 78.9773 67.6442 78.9418C67.6967 78.9062 67.723 78.8537 67.723 78.7841V78.7713C67.723 78.6364 67.6804 78.532 67.5952 78.4581C67.5114 78.3842 67.392 78.3473 67.2372 78.3473C67.0739 78.3473 66.9439 78.3835 66.8473 78.456C66.7507 78.527 66.6868 78.6165 66.6555 78.7244L65.8161 78.6562C65.8587 78.4574 65.9425 78.2855 66.0675 78.1406C66.1925 77.9943 66.3537 77.8821 66.5511 77.804C66.75 77.7244 66.9801 77.6847 67.2415 77.6847C67.4233 77.6847 67.5973 77.706 67.7635 77.7486C67.9311 77.7912 68.0795 77.8572 68.2088 77.9467C68.3395 78.0362 68.4425 78.1513 68.5178 78.2919C68.593 78.4311 68.6307 78.598 68.6307 78.7926V81H67.7699V80.5462H67.7443C67.6918 80.6484 67.6214 80.7386 67.5334 80.8168C67.4453 80.8935 67.3395 80.9538 67.2159 80.9979C67.0923 81.0405 66.9496 81.0618 66.7876 81.0618ZM67.0476 80.4354C67.1811 80.4354 67.299 80.4091 67.4013 80.3565C67.5036 80.3026 67.5838 80.2301 67.642 80.1392C67.7003 80.0483 67.7294 79.9453 67.7294 79.8303V79.483C67.701 79.5014 67.6619 79.5185 67.6122 79.5341C67.5639 79.5483 67.5092 79.5618 67.4482 79.5746C67.3871 79.5859 67.326 79.5966 67.2649 79.6065C67.2038 79.6151 67.1484 79.6229 67.0987 79.63C66.9922 79.6456 66.8991 79.6705 66.8196 79.7045C66.7401 79.7386 66.6783 79.7848 66.6342 79.843C66.5902 79.8999 66.5682 79.9709 66.5682 80.0561C66.5682 80.1797 66.6129 80.2741 66.7024 80.3395C66.7933 80.4034 66.9084 80.4354 67.0476 80.4354Z"
                  fill="black"
                ></path>
                <g id="Army">
                  <circle
                    id="armycircle"
                    cx="59"
                    cy="90"
                    r="5.5"
                    fill={getCircleFill("alaska")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("alaska")}
                  ></circle>
                  {getArmyNum("alaska", "59", "90")}
                </g>
              </g>
            </g>
            <g id="nw-territories">
              <path
                id="northwest_territory"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M164.439 101.919C165.146 99.4437 173.256 91.76 173.256 91.76C173.256 91.76 176.438 91.4065 177.853 90.3458C179.267 89.2852 176.085 86.1032 176.085 86.1032L176.792 83.9819L178.913 85.7496C178.913 85.7496 179.62 87.1639 181.742 87.1639C183.863 87.1639 183.156 85.0425 184.57 84.689C185.984 84.3354 187.399 80.7999 187.399 80.7999C187.399 80.7999 190.227 81.8605 193.055 79.0321C195.884 76.2037 193.763 77.6179 193.055 76.2037C192.348 74.7895 193.763 73.7288 193.763 73.7288L191.641 73.0217C191.641 73.0217 193.055 71.9611 191.641 69.8397C190.227 67.7184 189.873 70.9004 188.459 71.9611C187.045 73.0217 187.399 74.0824 183.51 73.3753C179.62 72.6682 183.509 71.254 183.156 69.8397C182.802 68.4255 178.913 70.5468 178.206 68.4255C177.499 66.3042 176.438 69.4862 176.792 67.3649C177.146 65.2435 176.438 62.0616 175.024 61.3545C173.61 60.6473 177.853 53.9298 177.853 53.9298C177.853 53.9298 180.681 55.344 181.035 52.8692C181.388 50.3943 182.802 50.7479 182.802 49.3336C182.802 47.9194 179.267 48.9801 179.267 48.9801L178.56 51.8085C178.56 51.8085 174.317 48.6265 174.317 51.8085C174.317 54.9905 172.903 54.9905 170.782 59.2331C168.66 63.4758 170.428 65.9506 170.428 65.9506C170.428 65.9506 172.549 66.6578 171.842 68.7791C171.135 70.9004 166.892 70.5469 166.892 70.5469L166.539 66.6578H163.711C163.711 66.6578 163.357 70.5469 163.711 71.9611C164.064 73.3753 155.932 72.3146 153.811 70.5469C151.69 68.7791 149.215 71.9611 147.093 73.0217C144.972 74.0824 143.204 73.3753 141.083 72.6682C138.962 71.9611 140.022 75.4966 135.426 75.143C130.83 74.7895 133.305 68.7791 132.244 70.9004C131.184 73.0217 126.587 69.1326 124.113 67.0113C121.638 64.89 117.041 65.5971 117.041 65.5971L116.688 63.1222H114.213L111.031 63.8293C111.031 63.8293 108.556 64.89 106.435 64.5364C104.314 64.1829 104.667 66.3042 104.667 66.3042C104.667 66.3042 102.192 67.3649 99.0102 67.0113C95.8283 66.6578 96.1818 68.072 94.7676 69.1326C93.3534 70.1933 88.4036 67.7184 85.2217 66.3042C82.0397 64.89 79.9613 67.8434 76.7793 66.7828C76.7793 66.7828 75.1026 98.0993 75.3526 98.8493C75.6026 99.5993 157.978 101.849 162.103 101.724C166.228 101.599 164.439 101.919 164.439 101.919Z"
                className={getCountryClass("nw-territories")}
                fill={getFill("nw-territories")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_2">
                <path
                  id="Northwest Territories"
                  d="M103.409 73.6364V78H102.612L100.714 75.2536H100.682V78H99.7591V73.6364H100.569L102.452 76.3807H102.491V73.6364H103.409ZM105.633 78.0639C105.302 78.0639 105.016 77.9936 104.774 77.853C104.534 77.7109 104.349 77.5135 104.218 77.2607C104.087 77.0064 104.022 76.7116 104.022 76.3764C104.022 76.0384 104.087 75.7429 104.218 75.4901C104.349 75.2358 104.534 75.0384 104.774 74.8977C105.016 74.7557 105.302 74.6847 105.633 74.6847C105.964 74.6847 106.249 74.7557 106.489 74.8977C106.731 75.0384 106.917 75.2358 107.048 75.4901C107.178 75.7429 107.244 76.0384 107.244 76.3764C107.244 76.7116 107.178 77.0064 107.048 77.2607C106.917 77.5135 106.731 77.7109 106.489 77.853C106.249 77.9936 105.964 78.0639 105.633 78.0639ZM105.637 77.3608C105.788 77.3608 105.913 77.3182 106.014 77.233C106.115 77.1463 106.191 77.0284 106.242 76.8793C106.295 76.7301 106.321 76.5604 106.321 76.37C106.321 76.1797 106.295 76.0099 106.242 75.8608C106.191 75.7116 106.115 75.5937 106.014 75.5071C105.913 75.4205 105.788 75.3771 105.637 75.3771C105.485 75.3771 105.357 75.4205 105.254 75.5071C105.151 75.5937 105.074 75.7116 105.021 75.8608C104.97 76.0099 104.945 76.1797 104.945 76.37C104.945 76.5604 104.97 76.7301 105.021 76.8793C105.074 77.0284 105.151 77.1463 105.254 77.233C105.357 77.3182 105.485 77.3608 105.637 77.3608ZM107.834 78V74.7273H108.714V75.2983H108.748C108.808 75.0952 108.908 74.9418 109.048 74.8381C109.189 74.733 109.351 74.6804 109.534 74.6804C109.58 74.6804 109.629 74.6832 109.681 74.6889C109.734 74.6946 109.78 74.7024 109.82 74.7124V75.5178C109.777 75.505 109.718 75.4936 109.643 75.4837C109.568 75.4737 109.499 75.4688 109.436 75.4688C109.303 75.4688 109.183 75.4979 109.078 75.5561C108.975 75.6129 108.892 75.6925 108.831 75.7947C108.771 75.897 108.742 76.0149 108.742 76.1484V78H107.834ZM112.194 74.7273V75.4091H110.223V74.7273H112.194ZM110.67 73.9432H111.578V76.9943C111.578 77.0781 111.591 77.1435 111.616 77.1903C111.642 77.2358 111.677 77.2678 111.723 77.2862C111.77 77.3047 111.824 77.3139 111.885 77.3139C111.927 77.3139 111.97 77.3104 112.013 77.3033C112.055 77.2947 112.088 77.2884 112.111 77.2841L112.253 77.9595C112.208 77.9737 112.144 77.9901 112.062 78.0085C111.979 78.0284 111.879 78.0405 111.761 78.0447C111.543 78.0533 111.351 78.0241 111.186 77.9574C111.023 77.8906 110.896 77.7869 110.805 77.6463C110.714 77.5057 110.669 77.3281 110.67 77.1136V73.9432ZM113.763 76.108V78H112.855V73.6364H113.737V75.3047H113.776C113.85 75.1115 113.969 74.9602 114.134 74.8509C114.299 74.7401 114.505 74.6847 114.754 74.6847C114.981 74.6847 115.179 74.7344 115.348 74.8338C115.519 74.9318 115.651 75.0732 115.745 75.2578C115.84 75.4411 115.887 75.6605 115.885 75.9162V78H114.978V76.0781C114.979 75.8764 114.928 75.7195 114.824 75.6072C114.722 75.495 114.578 75.4389 114.394 75.4389C114.27 75.4389 114.161 75.4652 114.066 75.5178C113.972 75.5703 113.898 75.647 113.844 75.7479C113.791 75.8473 113.764 75.9673 113.763 76.108ZM117.245 78L116.354 74.7273H117.273L117.78 76.9261H117.81L118.338 74.7273H119.239L119.776 76.9134H119.804L120.303 74.7273H121.219L120.33 78H119.369L118.807 75.9418H118.766L118.204 78H117.245ZM123.112 78.0639C122.776 78.0639 122.486 77.9957 122.243 77.8594C122.002 77.7216 121.816 77.527 121.685 77.2756C121.554 77.0227 121.489 76.7237 121.489 76.3786C121.489 76.0419 121.554 75.7464 121.685 75.4922C121.816 75.2379 122 75.0398 122.237 74.8977C122.475 74.7557 122.755 74.6847 123.076 74.6847C123.292 74.6847 123.493 74.7195 123.679 74.7891C123.867 74.8572 124.03 74.9602 124.169 75.098C124.31 75.2358 124.419 75.4091 124.497 75.6179C124.576 75.8253 124.615 76.0682 124.615 76.3466V76.5959H121.851V76.0334H123.76C123.76 75.9027 123.732 75.7869 123.675 75.6861C123.618 75.5852 123.539 75.5064 123.438 75.4496C123.339 75.3913 123.223 75.3622 123.091 75.3622C122.953 75.3622 122.831 75.3942 122.725 75.4581C122.62 75.5206 122.537 75.6051 122.478 75.7116C122.418 75.8168 122.387 75.9339 122.386 76.0632V76.598C122.386 76.7599 122.416 76.8999 122.475 77.0178C122.536 77.1357 122.622 77.2266 122.733 77.2905C122.844 77.3544 122.975 77.3864 123.127 77.3864C123.228 77.3864 123.321 77.3722 123.404 77.3438C123.488 77.3153 123.56 77.2727 123.62 77.2159C123.679 77.1591 123.725 77.0895 123.756 77.0071L124.595 77.0625C124.553 77.2642 124.465 77.4403 124.333 77.5909C124.203 77.7401 124.034 77.8565 123.826 77.9403C123.62 78.0227 123.382 78.0639 123.112 78.0639ZM127.93 75.6605L127.099 75.7116C127.085 75.6406 127.054 75.5767 127.007 75.5199C126.96 75.4616 126.899 75.4155 126.822 75.3814C126.747 75.3459 126.657 75.3281 126.551 75.3281C126.411 75.3281 126.292 75.358 126.196 75.4176C126.099 75.4759 126.051 75.554 126.051 75.652C126.051 75.7301 126.082 75.7962 126.144 75.8501C126.207 75.9041 126.314 75.9474 126.466 75.9801L127.059 76.0994C127.377 76.1648 127.614 76.2699 127.77 76.4148C127.926 76.5597 128.005 76.75 128.005 76.9858C128.005 77.2003 127.941 77.3885 127.815 77.5504C127.69 77.7124 127.518 77.8388 127.299 77.9297C127.082 78.0192 126.831 78.0639 126.547 78.0639C126.114 78.0639 125.769 77.9737 125.512 77.7933C125.256 77.6115 125.106 77.3643 125.062 77.0518L125.955 77.005C125.982 77.1371 126.047 77.2379 126.151 77.3075C126.255 77.3757 126.387 77.4098 126.549 77.4098C126.708 77.4098 126.836 77.3793 126.933 77.3182C127.031 77.2557 127.081 77.1754 127.082 77.0774C127.081 76.995 127.046 76.9276 126.978 76.875C126.909 76.821 126.804 76.7798 126.662 76.7514L126.095 76.6385C125.776 76.5746 125.538 76.4638 125.382 76.3061C125.227 76.1484 125.149 75.9474 125.149 75.7031C125.149 75.4929 125.206 75.3118 125.32 75.1598C125.435 75.0078 125.596 74.8906 125.804 74.8082C126.012 74.7259 126.257 74.6847 126.536 74.6847C126.95 74.6847 127.275 74.772 127.512 74.9467C127.751 75.1214 127.89 75.3594 127.93 75.6605ZM130.317 74.7273V75.4091H128.346V74.7273H130.317ZM128.793 73.9432H129.701V76.9943C129.701 77.0781 129.714 77.1435 129.739 77.1903C129.765 77.2358 129.801 77.2678 129.846 77.2862C129.893 77.3047 129.947 77.3139 130.008 77.3139C130.051 77.3139 130.093 77.3104 130.136 77.3033C130.178 77.2947 130.211 77.2884 130.234 77.2841L130.377 77.9595C130.331 77.9737 130.267 77.9901 130.185 78.0085C130.102 78.0284 130.002 78.0405 129.884 78.0447C129.666 78.0533 129.474 78.0241 129.309 77.9574C129.146 77.8906 129.019 77.7869 128.928 77.6463C128.837 77.5057 128.792 77.3281 128.793 77.1136V73.9432ZM132.148 74.397V73.6364H135.731V74.397H134.396V78H133.484V74.397H132.148ZM137.321 78.0639C136.985 78.0639 136.695 77.9957 136.452 77.8594C136.211 77.7216 136.025 77.527 135.894 77.2756C135.763 77.0227 135.698 76.7237 135.698 76.3786C135.698 76.0419 135.763 75.7464 135.894 75.4922C136.025 75.2379 136.209 75.0398 136.446 74.8977C136.684 74.7557 136.964 74.6847 137.285 74.6847C137.501 74.6847 137.702 74.7195 137.888 74.7891C138.076 74.8572 138.239 74.9602 138.378 75.098C138.519 75.2358 138.628 75.4091 138.706 75.6179C138.785 75.8253 138.824 76.0682 138.824 76.3466V76.5959H136.06V76.0334H137.969C137.969 75.9027 137.941 75.7869 137.884 75.6861C137.827 75.5852 137.748 75.5064 137.647 75.4496C137.548 75.3913 137.432 75.3622 137.3 75.3622C137.162 75.3622 137.04 75.3942 136.934 75.4581C136.829 75.5206 136.746 75.6051 136.687 75.7116C136.627 75.8168 136.596 75.9339 136.595 76.0632V76.598C136.595 76.7599 136.625 76.8999 136.684 77.0178C136.745 77.1357 136.831 77.2266 136.942 77.2905C137.053 77.3544 137.184 77.3864 137.336 77.3864C137.437 77.3864 137.53 77.3722 137.613 77.3438C137.697 77.3153 137.769 77.2727 137.829 77.2159C137.888 77.1591 137.934 77.0895 137.965 77.0071L138.804 77.0625C138.762 77.2642 138.674 77.4403 138.542 77.5909C138.412 77.7401 138.243 77.8565 138.035 77.9403C137.829 78.0227 137.591 78.0639 137.321 78.0639ZM139.416 78V74.7273H140.296V75.2983H140.33C140.39 75.0952 140.49 74.9418 140.63 74.8381C140.771 74.733 140.933 74.6804 141.116 74.6804C141.162 74.6804 141.211 74.6832 141.263 74.6889C141.316 74.6946 141.362 74.7024 141.402 74.7124V75.5178C141.359 75.505 141.3 75.4936 141.225 75.4837C141.15 75.4737 141.081 75.4688 141.018 75.4688C140.885 75.4688 140.765 75.4979 140.66 75.5561C140.557 75.6129 140.474 75.6925 140.413 75.7947C140.353 75.897 140.324 76.0149 140.324 76.1484V78H139.416ZM141.871 78V74.7273H142.751V75.2983H142.785C142.845 75.0952 142.945 74.9418 143.085 74.8381C143.226 74.733 143.388 74.6804 143.571 74.6804C143.617 74.6804 143.666 74.6832 143.718 74.6889C143.771 74.6946 143.817 74.7024 143.857 74.7124V75.5178C143.814 75.505 143.755 75.4936 143.68 75.4837C143.605 75.4737 143.536 75.4688 143.473 75.4688C143.34 75.4688 143.22 75.4979 143.115 75.5561C143.012 75.6129 142.929 75.6925 142.868 75.7947C142.809 75.897 142.779 76.0149 142.779 76.1484V78H141.871ZM144.326 78V74.7273H145.234V78H144.326ZM144.782 74.3054C144.647 74.3054 144.531 74.2607 144.435 74.1712C144.34 74.0803 144.292 73.9716 144.292 73.8452C144.292 73.7202 144.34 73.6129 144.435 73.5234C144.531 73.4325 144.647 73.3871 144.782 73.3871C144.917 73.3871 145.032 73.4325 145.127 73.5234C145.224 73.6129 145.272 73.7202 145.272 73.8452C145.272 73.9716 145.224 74.0803 145.127 74.1712C145.032 74.2607 144.917 74.3054 144.782 74.3054ZM147.702 74.7273V75.4091H145.731V74.7273H147.702ZM146.178 73.9432H147.086V76.9943C147.086 77.0781 147.099 77.1435 147.124 77.1903C147.15 77.2358 147.185 77.2678 147.231 77.2862C147.278 77.3047 147.332 77.3139 147.393 77.3139C147.435 77.3139 147.478 77.3104 147.521 77.3033C147.563 77.2947 147.596 77.2884 147.619 77.2841L147.761 77.9595C147.716 77.9737 147.652 77.9901 147.57 78.0085C147.487 78.0284 147.387 78.0405 147.269 78.0447C147.05 78.0533 146.859 78.0241 146.694 77.9574C146.53 77.8906 146.403 77.7869 146.312 77.6463C146.222 77.5057 146.177 77.3281 146.178 77.1136V73.9432ZM149.736 78.0639C149.405 78.0639 149.119 77.9936 148.878 77.853C148.638 77.7109 148.452 77.5135 148.322 77.2607C148.191 77.0064 148.126 76.7116 148.126 76.3764C148.126 76.0384 148.191 75.7429 148.322 75.4901C148.452 75.2358 148.638 75.0384 148.878 74.8977C149.119 74.7557 149.405 74.6847 149.736 74.6847C150.067 74.6847 150.353 74.7557 150.593 74.8977C150.834 75.0384 151.021 75.2358 151.151 75.4901C151.282 75.7429 151.347 76.0384 151.347 76.3764C151.347 76.7116 151.282 77.0064 151.151 77.2607C151.021 77.5135 150.834 77.7109 150.593 77.853C150.353 77.9936 150.067 78.0639 149.736 78.0639ZM149.741 77.3608C149.891 77.3608 150.017 77.3182 150.118 77.233C150.219 77.1463 150.295 77.0284 150.346 76.8793C150.398 76.7301 150.425 76.5604 150.425 76.37C150.425 76.1797 150.398 76.0099 150.346 75.8608C150.295 75.7116 150.219 75.5937 150.118 75.5071C150.017 75.4205 149.891 75.3771 149.741 75.3771C149.589 75.3771 149.461 75.4205 149.357 75.5071C149.255 75.5937 149.177 75.7116 149.125 75.8608C149.074 76.0099 149.048 76.1797 149.048 76.37C149.048 76.5604 149.074 76.7301 149.125 76.8793C149.177 77.0284 149.255 77.1463 149.357 77.233C149.461 77.3182 149.589 77.3608 149.741 77.3608ZM151.937 78V74.7273H152.817V75.2983H152.851C152.911 75.0952 153.011 74.9418 153.152 74.8381C153.293 74.733 153.454 74.6804 153.638 74.6804C153.683 74.6804 153.732 74.6832 153.785 74.6889C153.837 74.6946 153.883 74.7024 153.923 74.7124V75.5178C153.881 75.505 153.822 75.4936 153.746 75.4837C153.671 75.4737 153.602 75.4688 153.54 75.4688C153.406 75.4688 153.287 75.4979 153.182 75.5561C153.078 75.6129 152.996 75.6925 152.935 75.7947C152.875 75.897 152.845 76.0149 152.845 76.1484V78H151.937ZM154.392 78V74.7273H155.3V78H154.392ZM154.848 74.3054C154.714 74.3054 154.598 74.2607 154.501 74.1712C154.406 74.0803 154.358 73.9716 154.358 73.8452C154.358 73.7202 154.406 73.6129 154.501 73.5234C154.598 73.4325 154.714 73.3871 154.848 73.3871C154.983 73.3871 155.098 73.4325 155.194 73.5234C155.29 73.6129 155.339 73.7202 155.339 73.8452C155.339 73.9716 155.29 74.0803 155.194 74.1712C155.098 74.2607 154.983 74.3054 154.848 74.3054ZM157.519 78.0639C157.182 78.0639 156.892 77.9957 156.649 77.8594C156.408 77.7216 156.222 77.527 156.091 77.2756C155.96 77.0227 155.895 76.7237 155.895 76.3786C155.895 76.0419 155.96 75.7464 156.091 75.4922C156.222 75.2379 156.406 75.0398 156.643 74.8977C156.882 74.7557 157.161 74.6847 157.483 74.6847C157.698 74.6847 157.899 74.7195 158.085 74.7891C158.273 74.8572 158.436 74.9602 158.576 75.098C158.716 75.2358 158.826 75.4091 158.904 75.6179C158.982 75.8253 159.021 76.0682 159.021 76.3466V76.5959H156.257V76.0334H158.166C158.166 75.9027 158.138 75.7869 158.081 75.6861C158.024 75.5852 157.946 75.5064 157.845 75.4496C157.745 75.3913 157.63 75.3622 157.497 75.3622C157.36 75.3622 157.237 75.3942 157.131 75.4581C157.026 75.5206 156.943 75.6051 156.884 75.7116C156.824 75.8168 156.794 75.9339 156.792 76.0632V76.598C156.792 76.7599 156.822 76.8999 156.882 77.0178C156.943 77.1357 157.029 77.2266 157.139 77.2905C157.25 77.3544 157.382 77.3864 157.534 77.3864C157.634 77.3864 157.727 77.3722 157.811 77.3438C157.894 77.3153 157.966 77.2727 158.026 77.2159C158.085 77.1591 158.131 77.0895 158.162 77.0071L159.002 77.0625C158.959 77.2642 158.872 77.4403 158.74 77.5909C158.609 77.7401 158.44 77.8565 158.233 77.9403C158.027 78.0227 157.789 78.0639 157.519 78.0639ZM162.336 75.6605L161.505 75.7116C161.491 75.6406 161.46 75.5767 161.414 75.5199C161.367 75.4616 161.305 75.4155 161.228 75.3814C161.153 75.3459 161.063 75.3281 160.958 75.3281C160.817 75.3281 160.698 75.358 160.602 75.4176C160.505 75.4759 160.457 75.554 160.457 75.652C160.457 75.7301 160.488 75.7962 160.551 75.8501C160.613 75.9041 160.72 75.9474 160.872 75.9801L161.465 76.0994C161.783 76.1648 162.02 76.2699 162.176 76.4148C162.333 76.5597 162.411 76.75 162.411 76.9858C162.411 77.2003 162.348 77.3885 162.221 77.5504C162.096 77.7124 161.924 77.8388 161.706 77.9297C161.488 78.0192 161.237 78.0639 160.953 78.0639C160.52 78.0639 160.175 77.9737 159.918 77.7933C159.662 77.6115 159.512 77.3643 159.468 77.0518L160.361 77.005C160.388 77.1371 160.453 77.2379 160.557 77.3075C160.661 77.3757 160.794 77.4098 160.956 77.4098C161.115 77.4098 161.242 77.3793 161.339 77.3182C161.437 77.2557 161.487 77.1754 161.488 77.0774C161.487 76.995 161.452 76.9276 161.384 76.875C161.316 76.821 161.21 76.7798 161.068 76.7514L160.502 76.6385C160.182 76.5746 159.944 76.4638 159.788 76.3061C159.633 76.1484 159.556 75.9474 159.556 75.7031C159.556 75.4929 159.612 75.3118 159.726 75.1598C159.841 75.0078 160.002 74.8906 160.21 74.8082C160.419 74.7259 160.663 74.6847 160.943 74.6847C161.356 74.6847 161.681 74.772 161.919 74.9467C162.157 75.1214 162.296 75.3594 162.336 75.6605Z"
                  fill="black"
                ></path>
                <g id="Army_2">
                  <circle
                    id="armycircle_2"
                    cx="131"
                    cy="87"
                    r="5.5"
                    fill={getCircleFill("nw-territories")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("nw-territories")}
                  ></circle>
                  {getArmyNum("nw-territories", "131", "87")}
                </g>
              </g>
            </g>
            <g id="greenland">
              <path
                id="greenland_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M258.728 94.7243C258.728 94.7243 259.353 98.5993 258.478 100.224C257.603 101.849 257.478 100.974 256.978 103.349C256.478 105.724 256.853 106.599 255.978 107.974C255.103 109.349 255.353 107.099 254.978 110.724C254.603 114.349 254.853 115.224 253.978 115.599C253.103 115.974 254.228 117.349 252.728 117.349C251.228 117.349 250.728 118.349 250.353 116.974C249.978 115.599 250.603 114.974 249.103 114.849C247.603 114.724 246.728 116.474 246.478 114.724C246.228 112.974 246.853 112.349 245.603 111.849C244.353 111.349 246.853 115.474 242.728 110.599C238.603 105.724 239.353 102.349 239.353 102.349C239.353 102.349 238.103 100.974 238.103 100.099C238.103 99.2243 238.978 96.4743 237.853 94.9743C236.728 93.4743 235.603 90.4743 236.978 89.5993C238.353 88.7243 239.728 88.9743 240.103 86.9743C240.478 84.9743 240.353 85.2243 240.603 84.2243C240.853 83.2243 241.353 82.8493 240.353 82.7243C239.353 82.5993 240.353 83.0993 238.478 82.5993C236.603 82.0993 236.853 81.3493 236.353 81.2243C235.853 81.0993 236.728 81.9743 235.103 81.3493C233.478 80.7243 232.228 80.2243 233.978 79.5993C235.728 78.9743 236.853 78.7243 237.603 78.9743C238.353 79.2243 238.728 80.5993 238.478 78.7243C238.228 76.8493 234.103 75.8493 234.103 74.5993C234.103 73.3493 234.103 73.5993 234.103 72.3493C234.103 71.0993 233.853 70.4743 232.853 69.4743C231.853 68.4743 232.103 68.4743 231.853 66.8493C231.603 65.2243 231.603 65.3493 230.728 64.3493C229.853 63.3493 229.728 64.7243 229.103 62.9743C228.478 61.2243 228.478 60.8493 227.228 60.8493C225.978 60.8493 226.103 61.5993 225.103 60.2243C224.103 58.8493 224.353 58.5993 222.728 58.7243C221.103 58.8493 219.853 59.5993 219.603 60.0993C219.353 60.5993 219.978 61.0993 218.353 61.2243C216.728 61.3493 216.353 61.3493 215.478 61.3493C214.603 61.3493 213.728 61.7243 213.728 61.2243C213.728 61.2243 212.728 59.7243 211.103 60.0993C209.478 60.4743 209.103 61.5993 208.603 60.3493C208.103 59.0993 207.103 59.2243 206.978 58.5993C206.853 57.9743 205.353 58.7243 206.853 57.0993C208.353 55.4743 207.353 55.0993 209.228 55.2243C211.103 55.3493 210.728 55.4743 211.728 54.9743C212.728 54.4743 214.103 54.3493 212.728 54.2243C212.728 54.2243 213.228 53.4743 211.853 53.2243C210.478 52.9743 208.978 53.7243 208.978 52.7243C208.978 51.7243 207.728 50.5993 209.478 50.5993C211.228 50.5993 212.228 51.0993 213.103 50.2243C213.978 49.3493 213.978 49.5993 215.228 49.7243C216.478 49.8493 217.728 50.4743 218.103 49.4743C218.478 48.4743 220.478 48.3493 218.853 47.8493C217.228 47.3493 216.353 47.4743 216.728 46.7243C217.103 45.9743 218.103 45.8493 217.728 44.9743C217.353 44.0993 215.603 43.3493 218.103 43.2243C220.603 43.0993 221.853 44.2243 222.228 42.8493C222.603 41.4743 221.228 40.3493 223.478 40.3493C225.728 40.3493 228.103 39.2243 228.228 38.4743C228.353 37.7243 227.728 36.8493 229.853 37.3493C231.978 37.8493 231.603 38.9743 232.728 37.5993C233.853 36.2243 232.603 35.8493 234.853 36.3493C237.103 36.8493 237.353 37.0993 238.228 36.4743C239.103 35.8493 237.478 35.5993 239.603 35.8493C241.728 36.0993 241.353 36.8493 241.728 34.9743C242.103 33.0993 240.353 33.3493 242.478 32.8493C244.603 32.3493 244.728 32.8493 245.728 31.4743C246.728 30.0993 245.853 30.4743 247.728 30.0993C249.603 29.7243 249.853 30.0993 248.978 28.7243C248.103 27.3493 246.478 26.5993 248.978 26.3493C251.478 26.0993 252.853 25.8493 253.103 25.0993C253.103 25.0993 252.978 26.0993 254.478 25.7243C255.978 25.3493 255.728 24.8493 256.603 23.7243C257.478 22.5993 257.228 22.3493 258.103 22.9743C258.978 23.5993 257.978 24.0993 260.228 22.9743C262.478 21.8493 260.728 21.8493 262.978 22.2243C265.228 22.5993 265.103 22.3493 267.728 22.4743C270.353 22.5993 268.978 22.9743 270.478 23.3493C271.978 23.7243 271.603 23.5993 273.478 23.5993C275.353 23.5993 274.978 23.2243 276.103 23.9743C277.228 24.7243 276.728 24.8493 278.978 24.8493C281.228 24.8493 281.853 24.2243 282.228 25.5993C282.603 26.9743 281.603 27.0993 284.353 27.4743C287.103 27.8493 287.978 27.3493 286.478 28.4743C284.978 29.5993 281.853 29.7243 282.728 30.4743C283.603 31.2243 283.478 30.9743 281.103 31.4743C278.728 31.9743 275.228 32.4743 278.103 32.8493C280.978 33.2243 282.978 31.9743 283.728 33.2243C284.478 34.4743 282.728 34.5993 285.978 34.2243C289.228 33.8493 287.853 33.0993 290.478 33.5993C293.103 34.0993 292.603 34.8493 293.478 33.2243C294.353 31.5993 291.978 30.7243 294.853 31.3493C297.728 31.9743 297.103 31.9743 298.853 30.9743C300.603 29.9743 300.853 27.9743 301.603 30.3493C302.353 32.7243 302.228 33.2243 300.603 33.9743C298.978 34.7243 299.103 33.5993 298.603 35.3493C298.103 37.0993 298.228 37.5993 296.978 38.5993C295.728 39.5993 295.103 38.7243 295.353 40.4743C295.603 42.2243 295.603 41.9743 295.228 43.7243C294.853 45.4743 293.978 45.9743 295.103 46.9743C296.228 47.9743 296.228 46.9743 296.978 48.4743C297.728 49.9743 298.103 49.9743 297.353 51.7243C296.603 53.4743 296.478 52.5993 296.228 54.7243C295.978 56.8493 295.728 58.0993 296.603 57.4743C297.478 56.8493 297.603 55.0993 297.728 56.8493C297.853 58.5993 298.353 59.7243 296.853 60.3493C295.353 60.9743 295.478 60.0993 295.228 61.3493C294.978 62.5993 295.853 62.9743 294.728 63.9743C293.603 64.9743 294.603 65.9743 293.353 64.8493C292.103 63.7243 291.353 61.9743 290.353 63.0993C289.353 64.2243 287.978 63.2243 289.103 64.5993C290.228 65.9743 290.978 65.5993 291.228 66.0993C291.478 66.5993 291.353 67.0993 291.728 67.8493C292.103 68.5993 291.853 68.9743 292.853 68.8493C293.853 68.7243 294.228 69.2243 293.978 70.0993C293.728 70.9743 293.603 71.4743 294.353 72.3493C295.103 73.2243 295.353 73.2243 294.728 73.5993C294.103 73.9743 293.978 74.0993 293.103 74.5993C292.228 75.0993 292.353 75.8493 291.853 75.9743C291.353 76.0993 290.353 76.7243 290.228 75.4743C290.103 74.2243 289.978 72.5993 289.228 71.9743C288.478 71.3493 287.353 69.7243 287.103 71.2243C286.853 72.7243 287.103 73.2243 286.728 73.9743C286.353 74.7243 284.853 73.7243 286.353 74.9743C287.853 76.2243 288.478 76.5993 288.478 76.5993C288.478 76.5993 289.853 77.3493 289.228 77.9743C288.603 78.5993 289.353 78.8493 287.478 79.0993C285.603 79.3493 286.478 77.4743 284.728 79.4743C282.978 81.4743 281.728 81.9743 281.728 81.9743L280.853 80.9743C280.853 80.9743 280.103 78.8493 279.853 80.2243C279.603 81.5993 279.853 81.4743 278.853 83.5993C277.853 85.7243 278.353 86.2243 277.228 86.3493C276.103 86.4743 275.228 85.5993 274.603 86.4743C273.978 87.3493 274.853 87.0993 273.728 87.9743C272.603 88.8493 272.228 88.9743 271.478 88.9743C270.728 88.9743 271.853 86.8493 270.353 89.0993C268.853 91.3493 269.728 91.5993 268.478 91.8493C267.228 92.0993 266.978 92.0993 265.853 92.0993C264.728 92.0993 264.103 92.2243 262.978 92.2243C261.853 92.2243 260.978 92.3493 260.228 92.7243C259.478 93.0993 258.728 93.9743 258.728 93.9743V94.7243Z"
                className={getCountryClass("greenland")}
                fill={getFill("greenland")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_3">
                <path
                  id="Greenland"
                  d="M252.556 49.0469C252.526 48.9432 252.484 48.8516 252.43 48.772C252.376 48.6911 252.31 48.6229 252.232 48.5675C252.155 48.5107 252.067 48.4673 251.968 48.4375C251.87 48.4077 251.761 48.3928 251.642 48.3928C251.419 48.3928 251.223 48.4482 251.054 48.5589C250.886 48.6697 250.756 48.831 250.662 49.0426C250.568 49.2528 250.521 49.5099 250.521 49.8139C250.521 50.1179 250.567 50.3764 250.66 50.5895C250.752 50.8026 250.883 50.9652 251.052 51.0774C251.221 51.1882 251.42 51.2436 251.65 51.2436C251.859 51.2436 252.037 51.2067 252.185 51.1328C252.334 51.0575 252.448 50.9517 252.526 50.8153C252.606 50.679 252.645 50.5178 252.645 50.3317L252.833 50.3594H251.708V49.6648H253.534V50.2145C253.534 50.598 253.453 50.9276 253.291 51.2031C253.129 51.4773 252.906 51.6889 252.622 51.8381C252.338 51.9858 252.013 52.0597 251.646 52.0597C251.237 52.0597 250.878 51.9695 250.568 51.7891C250.258 51.6072 250.017 51.3494 249.844 51.0156C249.672 50.6804 249.586 50.2827 249.586 49.8224C249.586 49.4687 249.637 49.1534 249.739 48.8764C249.843 48.598 249.988 48.3622 250.174 48.169C250.36 47.9759 250.577 47.8288 250.824 47.728C251.071 47.6271 251.339 47.5767 251.627 47.5767C251.874 47.5767 252.104 47.6129 252.317 47.6854C252.53 47.7564 252.719 47.8572 252.884 47.9879C253.05 48.1186 253.186 48.2741 253.291 48.4545C253.396 48.6335 253.464 48.831 253.493 49.0469H252.556ZM254.21 52V48.7273H255.09V49.2983H255.124C255.184 49.0952 255.284 48.9418 255.424 48.8381C255.565 48.733 255.727 48.6804 255.91 48.6804C255.956 48.6804 256.005 48.6832 256.057 48.6889C256.11 48.6946 256.156 48.7024 256.196 48.7124V49.5178C256.153 49.505 256.094 49.4936 256.019 49.4837C255.944 49.4737 255.875 49.4688 255.812 49.4688C255.679 49.4688 255.559 49.4979 255.454 49.5561C255.35 49.6129 255.268 49.6925 255.207 49.7947C255.147 49.897 255.118 50.0149 255.118 50.1484V52H254.21ZM258.004 52.0639C257.667 52.0639 257.378 51.9957 257.135 51.8594C256.893 51.7216 256.707 51.527 256.577 51.2756C256.446 51.0227 256.381 50.7237 256.381 50.3786C256.381 50.0419 256.446 49.7464 256.577 49.4922C256.707 49.2379 256.891 49.0398 257.128 48.8977C257.367 48.7557 257.647 48.6847 257.968 48.6847C258.184 48.6847 258.385 48.7195 258.571 48.7891C258.758 48.8572 258.922 48.9602 259.061 49.098C259.202 49.2358 259.311 49.4091 259.389 49.6179C259.467 49.8253 259.506 50.0682 259.506 50.3466V50.5959H256.743V50.0334H258.652C258.652 49.9027 258.623 49.7869 258.567 49.6861C258.51 49.5852 258.431 49.5064 258.33 49.4496C258.231 49.3913 258.115 49.3622 257.983 49.3622C257.845 49.3622 257.723 49.3942 257.616 49.4581C257.511 49.5206 257.429 49.6051 257.369 49.7116C257.309 49.8168 257.279 49.9339 257.278 50.0632V50.598C257.278 50.7599 257.307 50.8999 257.367 51.0178C257.428 51.1357 257.514 51.2266 257.625 51.2905C257.736 51.3544 257.867 51.3864 258.019 51.3864C258.12 51.3864 258.212 51.3722 258.296 51.3438C258.38 51.3153 258.452 51.2727 258.511 51.2159C258.571 51.1591 258.616 51.0895 258.648 51.0071L259.487 51.0625C259.444 51.2642 259.357 51.4403 259.225 51.5909C259.094 51.7401 258.925 51.8565 258.718 51.9403C258.512 52.0227 258.274 52.0639 258.004 52.0639ZM261.59 52.0639C261.253 52.0639 260.964 51.9957 260.721 51.8594C260.479 51.7216 260.293 51.527 260.162 51.2756C260.032 51.0227 259.966 50.7237 259.966 50.3786C259.966 50.0419 260.032 49.7464 260.162 49.4922C260.293 49.2379 260.477 49.0398 260.714 48.8977C260.953 48.7557 261.233 48.6847 261.554 48.6847C261.77 48.6847 261.971 48.7195 262.157 48.7891C262.344 48.8572 262.508 48.9602 262.647 49.098C262.787 49.2358 262.897 49.4091 262.975 49.6179C263.053 49.8253 263.092 50.0682 263.092 50.3466V50.5959H260.329V50.0334H262.238C262.238 49.9027 262.209 49.7869 262.153 49.6861C262.096 49.5852 262.017 49.5064 261.916 49.4496C261.817 49.3913 261.701 49.3622 261.569 49.3622C261.431 49.3622 261.309 49.3942 261.202 49.4581C261.097 49.5206 261.015 49.6051 260.955 49.7116C260.895 49.8168 260.865 49.9339 260.863 50.0632V50.598C260.863 50.7599 260.893 50.8999 260.953 51.0178C261.014 51.1357 261.1 51.2266 261.211 51.2905C261.322 51.3544 261.453 51.3864 261.605 51.3864C261.706 51.3864 261.798 51.3722 261.882 51.3438C261.966 51.3153 262.037 51.2727 262.097 51.2159C262.157 51.1591 262.202 51.0895 262.233 51.0071L263.073 51.0625C263.03 51.2642 262.943 51.4403 262.811 51.5909C262.68 51.7401 262.511 51.8565 262.304 51.9403C262.098 52.0227 261.86 52.0639 261.59 52.0639ZM264.592 50.108V52H263.684V48.7273H264.55V49.3047H264.588C264.66 49.1143 264.782 48.9638 264.952 48.853C265.123 48.7408 265.329 48.6847 265.572 48.6847C265.8 48.6847 265.998 48.7344 266.167 48.8338C266.336 48.9332 266.467 49.0753 266.561 49.2599C266.655 49.4432 266.702 49.6619 266.702 49.9162V52H265.794V50.0781C265.795 49.8778 265.744 49.7216 265.64 49.6094C265.537 49.4957 265.394 49.4389 265.212 49.4389C265.09 49.4389 264.982 49.4652 264.888 49.5178C264.796 49.5703 264.724 49.647 264.671 49.7479C264.62 49.8473 264.594 49.9673 264.592 50.108ZM268.325 47.6364V52H267.417V47.6364H268.325ZM269.985 52.0618C269.776 52.0618 269.59 52.0256 269.427 51.9531C269.263 51.8793 269.134 51.7706 269.039 51.6271C268.945 51.4822 268.898 51.3018 268.898 51.0859C268.898 50.9041 268.932 50.7514 268.998 50.6278C269.065 50.5043 269.156 50.4048 269.271 50.3295C269.386 50.2543 269.517 50.1974 269.663 50.1591C269.811 50.1207 269.966 50.0938 270.128 50.0781C270.318 50.0582 270.471 50.0398 270.588 50.0227C270.704 50.0043 270.789 49.9773 270.841 49.9418C270.894 49.9062 270.92 49.8537 270.92 49.7841V49.7713C270.92 49.6364 270.878 49.532 270.792 49.4581C270.709 49.3842 270.589 49.3473 270.434 49.3473C270.271 49.3473 270.141 49.3835 270.045 49.456C269.948 49.527 269.884 49.6165 269.853 49.7244L269.013 49.6562C269.056 49.4574 269.14 49.2855 269.265 49.1406C269.39 48.9943 269.551 48.8821 269.748 48.804C269.947 48.7244 270.177 48.6847 270.439 48.6847C270.621 48.6847 270.795 48.706 270.961 48.7486C271.128 48.7912 271.277 48.8572 271.406 48.9467C271.537 49.0362 271.64 49.1513 271.715 49.2919C271.79 49.4311 271.828 49.598 271.828 49.7926V52H270.967V51.5462H270.942C270.889 51.6484 270.819 51.7386 270.731 51.8168C270.643 51.8935 270.537 51.9538 270.413 51.9979C270.29 52.0405 270.147 52.0618 269.985 52.0618ZM270.245 51.4354C270.378 51.4354 270.496 51.4091 270.599 51.3565C270.701 51.3026 270.781 51.2301 270.839 51.1392C270.898 51.0483 270.927 50.9453 270.927 50.8303V50.483C270.898 50.5014 270.859 50.5185 270.809 50.5341C270.761 50.5483 270.706 50.5618 270.645 50.5746C270.584 50.5859 270.523 50.5966 270.462 50.6065C270.401 50.6151 270.346 50.6229 270.296 50.63C270.189 50.6456 270.096 50.6705 270.017 50.7045C269.937 50.7386 269.876 50.7848 269.831 50.843C269.787 50.8999 269.765 50.9709 269.765 51.0561C269.765 51.1797 269.81 51.2741 269.9 51.3395C269.991 51.4034 270.106 51.4354 270.245 51.4354ZM273.44 50.108V52H272.532V48.7273H273.397V49.3047H273.436C273.508 49.1143 273.629 48.9638 273.8 48.853C273.97 48.7408 274.177 48.6847 274.42 48.6847C274.647 48.6847 274.845 48.7344 275.014 48.8338C275.183 48.9332 275.315 49.0753 275.409 49.2599C275.502 49.4432 275.549 49.6619 275.549 49.9162V52H274.642V50.0781C274.643 49.8778 274.592 49.7216 274.488 49.6094C274.384 49.4957 274.242 49.4389 274.06 49.4389C273.938 49.4389 273.83 49.4652 273.736 49.5178C273.644 49.5703 273.571 49.647 273.519 49.7479C273.468 49.8473 273.441 49.9673 273.44 50.108ZM277.471 52.0533C277.222 52.0533 276.997 51.9893 276.795 51.8615C276.595 51.7322 276.436 51.5426 276.318 51.2926C276.201 51.0412 276.143 50.733 276.143 50.3679C276.143 49.9929 276.203 49.6811 276.324 49.4325C276.445 49.1825 276.605 48.9957 276.806 48.8722C277.007 48.7472 277.228 48.6847 277.468 48.6847C277.652 48.6847 277.804 48.7159 277.926 48.7784C278.05 48.8395 278.15 48.9162 278.225 49.0085C278.301 49.0994 278.36 49.1889 278.4 49.277H278.427V47.6364H279.333V52H278.438V51.4759H278.4C278.357 51.5668 278.297 51.657 278.218 51.7464C278.142 51.8345 278.042 51.9077 277.918 51.9659C277.796 52.0241 277.647 52.0533 277.471 52.0533ZM277.758 51.331C277.904 51.331 278.028 51.2912 278.129 51.2116C278.231 51.1307 278.309 51.0178 278.363 50.8729C278.419 50.728 278.446 50.5582 278.446 50.3636C278.446 50.169 278.419 50 278.365 49.8565C278.311 49.7131 278.233 49.6023 278.131 49.5241C278.029 49.446 277.904 49.407 277.758 49.407C277.609 49.407 277.483 49.4474 277.381 49.5284C277.279 49.6094 277.201 49.7216 277.149 49.8651C277.096 50.0085 277.07 50.1747 277.07 50.3636C277.07 50.554 277.096 50.7223 277.149 50.8686C277.203 51.0135 277.28 51.1271 277.381 51.2095C277.483 51.2905 277.609 51.331 277.758 51.331Z"
                  fill="black"
                ></path>
                <g id="Army_3">
                  <circle
                    id="armycircle_3"
                    cx="264"
                    cy="61"
                    r="5.5"
                    fill={getCircleFill("greenland")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("greenland")}
                  ></circle>
                  {getArmyNum("greenland", "264", "61")}
                </g>
              </g>
            </g>
            <g id="scandinavia">
              <path
                id="scandinavia_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M408.728 121.849C408.103 121.724 407.228 121.349 406.853 120.599C406.478 119.849 405.603 118.974 404.978 119.224C404.353 119.474 404.603 119.599 403.353 119.599C402.103 119.599 401.478 117.849 400.478 118.474C399.478 119.099 400.228 119.474 398.978 119.724C397.728 119.974 396.353 120.099 395.103 120.099C393.853 120.099 394.103 119.849 392.728 120.099C391.353 120.349 390.353 121.099 389.853 119.849C389.353 118.599 389.228 118.974 389.228 117.724C389.228 116.474 389.978 115.599 390.228 114.474C390.478 113.349 389.728 112.224 390.603 111.099C391.478 109.974 392.103 109.724 392.478 109.099C392.853 108.474 393.228 107.724 393.353 106.849C393.478 105.974 393.478 106.224 393.478 105.349C393.478 104.474 393.103 103.724 392.603 103.349C392.103 102.974 392.228 102.974 391.103 102.849C389.978 102.724 390.353 101.974 389.228 103.224C388.103 104.474 387.103 104.599 386.978 105.599C386.853 106.599 387.478 106.974 386.853 108.224C386.228 109.474 386.103 109.349 385.853 109.849C385.603 110.349 386.103 111.099 385.603 111.599C385.103 112.099 384.728 112.099 383.853 112.599C382.978 113.099 382.353 112.724 382.228 114.224C382.103 115.724 381.853 115.349 382.228 116.349C382.603 117.349 382.853 117.474 383.103 118.224C383.353 118.974 383.853 119.349 383.853 120.849C383.853 122.349 384.228 122.849 384.228 122.849C384.228 122.849 384.728 124.599 384.603 125.474C384.478 126.349 384.103 127.849 383.728 128.724C383.353 129.599 382.978 130.099 382.353 130.724C381.728 131.349 381.978 131.474 381.228 132.224C380.478 132.974 379.603 133.224 378.978 133.599C378.353 133.974 378.228 135.224 378.228 135.224V137.599C378.228 137.599 378.853 139.224 377.728 139.724C376.603 140.224 376.353 140.349 375.603 141.474C374.853 142.599 375.603 143.474 374.728 144.224C373.853 144.974 374.103 145.099 372.603 144.974C371.103 144.849 370.853 144.849 370.353 144.224C369.853 143.599 369.228 142.474 368.478 142.349C367.728 142.224 367.853 142.474 367.353 142.224C366.853 141.974 367.228 141.474 366.478 141.474C365.728 141.474 365.353 141.974 365.353 141.474C365.353 140.974 365.353 141.224 365.353 140.099C365.353 138.974 365.353 135.474 365.353 135.474L363.478 132.599L364.103 130.974L363.353 129.724L362.478 129.224C362.478 129.224 361.103 129.724 360.978 130.224C360.853 130.724 360.853 131.099 360.603 131.599C360.353 132.099 359.228 133.599 358.353 133.724C357.478 133.849 356.353 133.974 356.353 133.974C356.353 133.974 355.978 134.974 355.228 134.599C354.478 134.224 354.728 134.349 353.853 133.349C352.978 132.349 352.728 131.224 352.728 130.724C352.728 130.224 352.978 130.099 352.353 129.599C351.728 129.099 351.728 129.099 351.103 128.474C350.478 127.849 349.603 127.349 349.728 126.224C349.853 125.099 350.103 123.974 350.353 122.849C350.603 121.724 349.978 120.599 349.978 120.599L349.503 119.691C348.973 118.63 349.503 118.807 348.619 117.923C347.735 117.039 347.028 116.686 347.558 115.271C348.089 113.857 347.205 112.973 348.619 112.62C350.033 112.266 349.856 114.211 350.21 111.736C350.564 109.261 349.503 109.968 350.917 108.377C352.331 106.786 352.508 106.433 352.508 106.433C352.508 106.433 353.392 106.432 353.745 107.67C354.099 108.907 354.099 109.968 354.806 109.084C355.513 108.2 355.69 107.14 356.22 106.433C356.751 105.725 357.635 104.842 357.635 104.842C357.635 104.842 356.044 102.19 357.988 102.367C359.933 102.543 359.933 102.897 360.463 102.19C360.993 101.483 360.817 101.483 362.054 101.129C363.291 100.776 363.468 100.952 363.645 99.8918C363.822 98.8311 364.352 98.8311 365.059 98.124C365.766 97.4169 365.766 97.0634 365.943 95.6491C366.12 94.2349 365.766 94.4117 367.357 92.2904C368.948 90.1691 368.948 90.3458 369.479 88.9316C370.009 87.5174 370.009 87.6942 370.539 86.8103C371.07 85.9264 371.777 86.28 372.307 85.5729C372.837 84.8658 373.014 83.9819 373.014 83.9819L373.898 82.3909C373.898 82.3909 372.13 81.6838 373.721 80.9767C375.312 80.2696 375.489 80.0928 376.726 79.7392C377.964 79.3857 378.848 79.3857 378.848 79.3857C378.848 79.3857 379.997 81.065 380.174 79.8276C380.35 78.5902 379.643 78.4134 380.704 77.6179C381.765 76.8224 382.383 76.9108 382.737 77.176C383.09 77.4411 382.914 77.7063 383.709 77.5295C384.505 77.3527 385.389 78.4134 385.654 77.176C385.919 75.9385 384.505 74.9663 386.184 74.2592C387.863 73.552 388.747 74.1708 389.278 73.6404C389.808 73.1101 389.012 72.8449 390.073 72.3146C391.134 71.7843 391.487 72.0494 392.548 71.6959C393.609 71.3423 393.697 70.1933 394.227 70.1049C394.758 70.0165 395.465 70.1049 395.995 70.6352C396.525 71.1656 395.023 71.6075 397.144 71.2539C399.265 70.9004 402.094 69.5746 402.889 70.1933C403.685 70.812 402.978 71.8727 404.038 71.8727C405.099 71.8727 406.16 71.4307 406.69 71.7843C407.22 72.1378 407.132 72.403 407.928 72.7565C407.928 72.7565 408.853 76.7243 408.228 77.2243C407.603 77.7243 408.978 80.8493 408.228 81.3493C407.478 81.8493 407.103 87.5993 407.103 90.2243C407.103 92.8493 408.478 96.9743 408.103 99.0993C407.728 101.224 408.728 104.224 408.728 104.224C408.728 104.224 409.353 104.849 409.353 106.474C409.353 108.099 410.228 108.974 410.228 108.974C410.228 108.974 410.665 109.099 410.728 109.662C410.79 110.224 410.79 111.099 410.54 111.349C410.29 111.599 409.728 112.037 409.728 112.974C409.728 113.912 409.978 114.287 409.665 114.724C409.353 115.162 409.103 115.287 408.978 116.349C408.853 117.412 408.665 118.849 408.915 119.412C409.165 119.974 409.603 122.099 408.728 121.849Z"
                className={getCountryClass("scandinavia")}
                fill={getFill("scandinavia")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_4">
                <path
                  id="Scandinavia"
                  d="M355.326 106.891C355.309 106.719 355.235 106.586 355.106 106.491C354.977 106.396 354.801 106.348 354.58 106.348C354.429 106.348 354.302 106.369 354.198 106.412C354.095 106.453 354.015 106.511 353.96 106.585C353.906 106.658 353.879 106.742 353.879 106.836C353.876 106.914 353.892 106.982 353.928 107.04C353.965 107.099 354.015 107.149 354.079 107.192C354.143 107.233 354.217 107.269 354.301 107.3C354.384 107.33 354.474 107.356 354.569 107.377L354.961 107.471C355.152 107.513 355.326 107.57 355.485 107.641C355.644 107.712 355.782 107.8 355.899 107.903C356.015 108.007 356.105 108.129 356.169 108.27C356.235 108.411 356.268 108.572 356.269 108.754C356.268 109.021 356.2 109.252 356.065 109.448C355.931 109.643 355.738 109.794 355.485 109.902C355.234 110.009 354.931 110.062 354.576 110.062C354.223 110.062 353.916 110.008 353.655 109.9C353.395 109.792 353.192 109.632 353.046 109.42C352.901 109.207 352.825 108.944 352.818 108.63H353.71C353.72 108.776 353.762 108.898 353.836 108.996C353.911 109.093 354.012 109.166 354.137 109.216C354.263 109.264 354.406 109.288 354.565 109.288C354.721 109.288 354.857 109.266 354.972 109.22C355.088 109.175 355.179 109.112 355.242 109.031C355.306 108.95 355.338 108.857 355.338 108.751C355.338 108.653 355.309 108.571 355.251 108.504C355.194 108.437 355.11 108.381 355 108.334C354.89 108.287 354.756 108.244 354.597 108.206L354.122 108.087C353.754 107.997 353.463 107.857 353.25 107.667C353.037 107.477 352.931 107.22 352.933 106.898C352.931 106.634 353.002 106.403 353.144 106.205C353.287 106.008 353.484 105.854 353.734 105.743C353.984 105.632 354.268 105.577 354.586 105.577C354.91 105.577 355.193 105.632 355.434 105.743C355.677 105.854 355.866 106.008 356.001 106.205C356.136 106.403 356.206 106.631 356.21 106.891H355.326ZM358.352 110.064C358.016 110.064 357.728 109.993 357.487 109.851C357.247 109.707 357.062 109.509 356.933 109.254C356.805 109 356.741 108.707 356.741 108.376C356.741 108.041 356.805 107.747 356.935 107.494C357.065 107.24 357.251 107.042 357.491 106.9C357.731 106.756 358.016 106.685 358.347 106.685C358.633 106.685 358.883 106.737 359.097 106.84C359.312 106.944 359.482 107.089 359.607 107.277C359.732 107.464 359.801 107.685 359.813 107.938H358.957C358.933 107.774 358.869 107.643 358.765 107.543C358.663 107.442 358.528 107.392 358.362 107.392C358.222 107.392 358.099 107.43 357.994 107.507C357.89 107.582 357.809 107.692 357.751 107.837C357.693 107.982 357.663 108.158 357.663 108.364C357.663 108.572 357.692 108.75 357.749 108.896C357.807 109.043 357.889 109.154 357.994 109.231C358.099 109.308 358.222 109.346 358.362 109.346C358.466 109.346 358.559 109.325 358.641 109.282C358.725 109.239 358.794 109.178 358.848 109.097C358.903 109.014 358.94 108.915 358.957 108.8H359.813C359.799 109.05 359.731 109.271 359.609 109.461C359.488 109.65 359.321 109.798 359.108 109.904C358.895 110.011 358.643 110.064 358.352 110.064ZM361.328 110.062C361.119 110.062 360.933 110.026 360.769 109.953C360.606 109.879 360.477 109.771 360.382 109.627C360.288 109.482 360.241 109.302 360.241 109.086C360.241 108.904 360.274 108.751 360.341 108.628C360.408 108.504 360.499 108.405 360.614 108.33C360.729 108.254 360.86 108.197 361.006 108.159C361.154 108.121 361.309 108.094 361.47 108.078C361.661 108.058 361.814 108.04 361.931 108.023C362.047 108.004 362.132 107.977 362.184 107.942C362.237 107.906 362.263 107.854 362.263 107.784V107.771C362.263 107.636 362.22 107.532 362.135 107.458C362.051 107.384 361.932 107.347 361.777 107.347C361.614 107.347 361.484 107.384 361.387 107.456C361.291 107.527 361.227 107.616 361.196 107.724L360.356 107.656C360.399 107.457 360.483 107.286 360.608 107.141C360.733 106.994 360.894 106.882 361.091 106.804C361.29 106.724 361.52 106.685 361.782 106.685C361.963 106.685 362.137 106.706 362.304 106.749C362.471 106.791 362.62 106.857 362.749 106.947C362.88 107.036 362.983 107.151 363.058 107.292C363.133 107.431 363.171 107.598 363.171 107.793V110H362.31V109.546H362.284C362.232 109.648 362.161 109.739 362.073 109.817C361.985 109.893 361.88 109.954 361.756 109.998C361.632 110.04 361.49 110.062 361.328 110.062ZM361.588 109.435C361.721 109.435 361.839 109.409 361.941 109.357C362.044 109.303 362.124 109.23 362.182 109.139C362.24 109.048 362.269 108.945 362.269 108.83V108.483C362.241 108.501 362.202 108.518 362.152 108.534C362.104 108.548 362.049 108.562 361.988 108.575C361.927 108.586 361.866 108.597 361.805 108.607C361.744 108.615 361.688 108.623 361.639 108.63C361.532 108.646 361.439 108.67 361.36 108.705C361.28 108.739 361.218 108.785 361.174 108.843C361.13 108.9 361.108 108.971 361.108 109.056C361.108 109.18 361.153 109.274 361.242 109.339C361.333 109.403 361.448 109.435 361.588 109.435ZM364.783 108.108V110H363.875V106.727H364.74V107.305H364.778C364.851 107.114 364.972 106.964 365.143 106.853C365.313 106.741 365.52 106.685 365.763 106.685C365.99 106.685 366.188 106.734 366.357 106.834C366.526 106.933 366.658 107.075 366.751 107.26C366.845 107.443 366.892 107.662 366.892 107.916V110H365.984V108.078C365.986 107.878 365.935 107.722 365.831 107.609C365.727 107.496 365.584 107.439 365.403 107.439C365.28 107.439 365.172 107.465 365.079 107.518C364.986 107.57 364.914 107.647 364.861 107.748C364.81 107.847 364.784 107.967 364.783 108.108ZM368.813 110.053C368.565 110.053 368.34 109.989 368.138 109.862C367.938 109.732 367.778 109.543 367.661 109.293C367.544 109.041 367.486 108.733 367.486 108.368C367.486 107.993 367.546 107.681 367.667 107.433C367.788 107.183 367.948 106.996 368.149 106.872C368.35 106.747 368.571 106.685 368.811 106.685C368.994 106.685 369.147 106.716 369.269 106.778C369.393 106.839 369.492 106.916 369.568 107.009C369.644 107.099 369.703 107.189 369.742 107.277H369.77V105.636H370.676V110H369.781V109.476H369.742C369.7 109.567 369.639 109.657 369.561 109.746C369.484 109.835 369.384 109.908 369.261 109.966C369.139 110.024 368.989 110.053 368.813 110.053ZM369.101 109.331C369.247 109.331 369.371 109.291 369.472 109.212C369.574 109.131 369.652 109.018 369.706 108.873C369.761 108.728 369.789 108.558 369.789 108.364C369.789 108.169 369.762 108 369.708 107.857C369.654 107.713 369.576 107.602 369.474 107.524C369.372 107.446 369.247 107.407 369.101 107.407C368.952 107.407 368.826 107.447 368.724 107.528C368.622 107.609 368.544 107.722 368.492 107.865C368.439 108.009 368.413 108.175 368.413 108.364C368.413 108.554 368.439 108.722 368.492 108.869C368.546 109.013 368.623 109.127 368.724 109.21C368.826 109.29 368.952 109.331 369.101 109.331ZM371.422 110V106.727H372.329V110H371.422ZM371.878 106.305C371.743 106.305 371.627 106.261 371.53 106.171C371.435 106.08 371.388 105.972 371.388 105.845C371.388 105.72 371.435 105.613 371.53 105.523C371.627 105.433 371.743 105.387 371.878 105.387C372.013 105.387 372.128 105.433 372.223 105.523C372.32 105.613 372.368 105.72 372.368 105.845C372.368 105.972 372.32 106.08 372.223 106.171C372.128 106.261 372.013 106.305 371.878 106.305ZM373.964 108.108V110H373.057V106.727H373.922V107.305H373.96C374.032 107.114 374.154 106.964 374.324 106.853C374.495 106.741 374.701 106.685 374.944 106.685C375.172 106.685 375.37 106.734 375.539 106.834C375.708 106.933 375.839 107.075 375.933 107.26C376.027 107.443 376.074 107.662 376.074 107.916V110H375.166V108.078C375.167 107.878 375.116 107.722 375.013 107.609C374.909 107.496 374.766 107.439 374.584 107.439C374.462 107.439 374.354 107.465 374.26 107.518C374.168 107.57 374.096 107.647 374.043 107.748C373.992 107.847 373.966 107.967 373.964 108.108ZM377.722 110.062C377.513 110.062 377.327 110.026 377.164 109.953C377.001 109.879 376.871 109.771 376.776 109.627C376.682 109.482 376.636 109.302 376.636 109.086C376.636 108.904 376.669 108.751 376.736 108.628C376.802 108.504 376.893 108.405 377.008 108.33C377.123 108.254 377.254 108.197 377.4 108.159C377.548 108.121 377.703 108.094 377.865 108.078C378.055 108.058 378.209 108.04 378.325 108.023C378.442 108.004 378.526 107.977 378.579 107.942C378.631 107.906 378.658 107.854 378.658 107.784V107.771C378.658 107.636 378.615 107.532 378.53 107.458C378.446 107.384 378.327 107.347 378.172 107.347C378.008 107.347 377.878 107.384 377.782 107.456C377.685 107.527 377.621 107.616 377.59 107.724L376.751 107.656C376.793 107.457 376.877 107.286 377.002 107.141C377.127 106.994 377.288 106.882 377.486 106.804C377.685 106.724 377.915 106.685 378.176 106.685C378.358 106.685 378.532 106.706 378.698 106.749C378.866 106.791 379.014 106.857 379.143 106.947C379.274 107.036 379.377 107.151 379.452 107.292C379.528 107.431 379.565 107.598 379.565 107.793V110H378.704V109.546H378.679C378.626 109.648 378.556 109.739 378.468 109.817C378.38 109.893 378.274 109.954 378.15 109.998C378.027 110.04 377.884 110.062 377.722 110.062ZM377.982 109.435C378.116 109.435 378.234 109.409 378.336 109.357C378.438 109.303 378.518 109.23 378.577 109.139C378.635 109.048 378.664 108.945 378.664 108.83V108.483C378.636 108.501 378.597 108.518 378.547 108.534C378.498 108.548 378.444 108.562 378.383 108.575C378.322 108.586 378.261 108.597 378.199 108.607C378.138 108.615 378.083 108.623 378.033 108.63C377.927 108.646 377.834 108.67 377.754 108.705C377.675 108.739 377.613 108.785 377.569 108.843C377.525 108.9 377.503 108.971 377.503 109.056C377.503 109.18 377.547 109.274 377.637 109.339C377.728 109.403 377.843 109.435 377.982 109.435ZM383.203 106.727L382.059 110H381.036L379.892 106.727H380.851L381.531 109.069H381.565L382.242 106.727H383.203ZM383.668 110V106.727H384.576V110H383.668ZM384.124 106.305C383.989 106.305 383.873 106.261 383.777 106.171C383.681 106.08 383.634 105.972 383.634 105.845C383.634 105.72 383.681 105.613 383.777 105.523C383.873 105.433 383.989 105.387 384.124 105.387C384.259 105.387 384.374 105.433 384.469 105.523C384.566 105.613 384.614 105.72 384.614 105.845C384.614 105.972 384.566 106.08 384.469 106.171C384.374 106.261 384.259 106.305 384.124 106.305ZM386.236 110.062C386.027 110.062 385.841 110.026 385.678 109.953C385.514 109.879 385.385 109.771 385.29 109.627C385.196 109.482 385.149 109.302 385.149 109.086C385.149 108.904 385.183 108.751 385.249 108.628C385.316 108.504 385.407 108.405 385.522 108.33C385.637 108.254 385.768 108.197 385.914 108.159C386.062 108.121 386.217 108.094 386.379 108.078C386.569 108.058 386.722 108.04 386.839 108.023C386.955 108.004 387.04 107.977 387.092 107.942C387.145 107.906 387.171 107.854 387.171 107.784V107.771C387.171 107.636 387.129 107.532 387.043 107.458C386.96 107.384 386.84 107.347 386.685 107.347C386.522 107.347 386.392 107.384 386.296 107.456C386.199 107.527 386.135 107.616 386.104 107.724L385.264 107.656C385.307 107.457 385.391 107.286 385.516 107.141C385.641 106.994 385.802 106.882 385.999 106.804C386.198 106.724 386.428 106.685 386.69 106.685C386.872 106.685 387.046 106.706 387.212 106.749C387.379 106.791 387.528 106.857 387.657 106.947C387.788 107.036 387.891 107.151 387.966 107.292C388.041 107.431 388.079 107.598 388.079 107.793V110H387.218V109.546H387.193C387.14 109.648 387.07 109.739 386.982 109.817C386.894 109.893 386.788 109.954 386.664 109.998C386.541 110.04 386.398 110.062 386.236 110.062ZM386.496 109.435C386.629 109.435 386.747 109.409 386.85 109.357C386.952 109.303 387.032 109.23 387.09 109.139C387.149 109.048 387.178 108.945 387.178 108.83V108.483C387.149 108.501 387.11 108.518 387.06 108.534C387.012 108.548 386.957 108.562 386.896 108.575C386.835 108.586 386.774 108.597 386.713 108.607C386.652 108.615 386.597 108.623 386.547 108.63C386.44 108.646 386.347 108.67 386.268 108.705C386.188 108.739 386.127 108.785 386.082 108.843C386.038 108.9 386.016 108.971 386.016 109.056C386.016 109.18 386.061 109.274 386.151 109.339C386.242 109.403 386.357 109.435 386.496 109.435Z"
                  fill="black"
                ></path>
                <g id="Army_4">
                  <circle
                    id="armycircle_4"
                    cx="371"
                    cy="119"
                    r="5.5"
                    fill={getCircleFill("scandinavia")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("scandinavia")}
                  ></circle>
                  {getArmyNum("scandinavia", "371", "119")}
                </g>
              </g>
            </g>
            <g id="ukraine">
              <path
                id="ukraine_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M410.049 73.1101C408.811 73.0217 407.928 72.7565 407.928 72.7565C407.928 72.7565 408.853 76.7243 408.228 77.2243C407.603 77.7243 408.978 80.8493 408.228 81.3493C407.478 81.8493 407.103 87.5993 407.103 90.2243C407.103 92.8493 408.478 96.9743 408.103 99.0993C407.728 101.224 408.728 104.224 408.728 104.224C408.728 104.224 409.353 104.849 409.353 106.474C409.353 108.099 410.228 108.974 410.228 108.974C410.228 108.974 410.665 109.099 410.728 109.662C410.79 110.224 410.79 111.099 410.54 111.349C410.29 111.599 409.728 112.037 409.728 112.974C409.728 113.912 409.978 114.287 409.665 114.724C409.353 115.162 409.103 115.287 408.978 116.349C408.853 117.412 408.665 118.849 408.915 119.412C409.165 119.974 409.603 122.099 408.728 121.849C407.853 121.599 409.728 122.224 410.228 122.599C410.728 122.974 409.103 123.724 408.228 123.974C407.353 124.224 406.603 124.224 405.353 124.099C404.103 123.974 404.478 123.724 403.478 123.849C402.478 123.974 400.353 124.599 399.228 124.349C398.103 124.099 397.478 124.224 396.728 124.724C395.978 125.224 396.478 126.224 396.478 127.349C396.478 128.474 397.228 127.724 397.353 128.974C397.478 130.224 397.728 129.974 398.103 130.724C398.478 131.474 399.103 130.849 399.103 130.849C399.103 130.849 401.228 132.599 400.978 133.724C400.728 134.849 401.478 135.599 401.478 136.599C401.478 137.599 400.353 136.849 398.728 136.724C397.103 136.599 398.103 135.849 397.478 134.099C396.853 132.349 396.978 133.474 395.978 133.099C394.978 132.724 394.978 133.349 394.728 134.474C394.478 135.599 394.353 135.724 393.478 136.474C392.603 137.224 393.353 137.849 393.103 138.974C392.853 140.099 392.478 139.974 391.728 140.849C390.978 141.724 391.978 142.224 392.353 143.474C392.728 144.724 393.228 145.224 393.228 145.224C393.728 145.724 393.603 146.224 393.603 146.974C393.603 147.724 393.103 148.099 392.603 148.474L393.853 148.599C393.853 148.599 394.915 149.537 394.978 149.849C395.04 150.162 396.165 151.099 396.165 151.099C396.165 151.099 398.665 152.474 399.54 152.474C400.415 152.474 401.415 151.912 401.915 151.849C402.415 151.787 401.853 152.724 401.853 153.037C401.853 153.349 402.54 156.287 402.853 156.912C403.165 157.537 403.228 164.974 403.29 166.349C403.353 167.724 404.665 169.099 405.04 169.412C405.415 169.724 405.665 170.474 405.665 170.787C405.665 171.099 404.853 172.162 404.79 172.599C404.728 173.037 404.915 173.787 404.853 174.349C404.79 174.912 404.353 175.162 403.853 175.599C403.353 176.037 403.478 177.037 403.165 177.662C402.853 178.287 402.353 178.287 401.728 178.537C401.103 178.787 399.415 182.162 399.228 182.537C399.04 182.912 397.29 183.537 396.728 183.537C396.165 183.537 394.665 183.974 394.478 184.474C394.29 184.974 394.29 185.974 394.29 185.974L396.603 188.162C396.853 188.099 397.103 187.349 397.353 186.974C397.603 186.599 398.54 186.537 398.54 186.537C398.54 186.537 400.165 186.474 400.853 186.912C401.54 187.349 401.103 187.662 401.165 188.974C401.228 190.287 401.228 190.037 401.415 190.662C401.603 191.287 401.915 191.037 403.04 191.349C404.165 191.662 403.79 191.537 404.665 191.662C405.54 191.787 405.353 192.412 405.79 193.349C406.228 194.287 406.29 194.974 406.728 195.787C407.165 196.599 407.165 197.099 407.165 197.349C407.165 197.599 406.853 198.849 406.79 199.537C406.728 200.224 406.415 200.349 406.29 200.662C406.165 200.974 406.228 201.849 406.228 202.162C406.228 202.474 406.665 202.912 407.04 203.349C407.415 203.787 407.415 204.162 407.415 204.849C407.415 205.537 406.853 206.599 406.853 207.224C406.853 207.849 407.79 208.287 407.665 208.849C407.54 209.412 409.853 211.099 409.853 211.099L410.853 210.349C410.853 210.349 411.853 210.224 412.603 209.474C413.353 208.724 413.103 208.349 413.103 208.349C413.103 208.349 413.353 205.974 413.728 205.474C414.103 204.974 414.603 205.224 416.228 204.849C417.853 204.474 417.228 204.849 417.978 204.849C418.728 204.849 419.228 205.349 419.978 205.599C420.728 205.849 420.603 206.349 420.853 207.349C421.103 208.349 421.353 208.974 421.478 209.849C421.603 210.724 421.603 210.849 421.978 211.724C422.353 212.599 422.728 212.474 423.728 213.099C424.728 213.724 424.103 213.599 425.603 214.349C427.103 215.099 426.353 213.224 426.853 212.349C427.353 211.474 427.603 211.474 428.103 211.224C428.603 210.974 428.978 210.724 429.603 210.224C430.228 209.724 429.978 209.724 430.353 208.849C430.728 207.974 430.228 207.599 429.978 207.099C429.728 206.599 429.228 207.224 428.603 207.224C427.978 207.224 427.228 206.474 426.603 205.724C425.978 204.974 426.478 204.724 426.478 204.724C426.478 204.724 427.353 203.724 428.228 203.099C429.103 202.474 428.978 202.599 429.728 202.349C430.478 202.099 430.978 202.099 431.603 201.849C432.228 201.599 432.728 201.474 433.978 201.224C435.228 200.974 434.728 201.224 436.103 201.224C437.478 201.224 437.728 200.974 437.728 200.974C437.728 200.974 438.103 200.474 438.728 200.099C439.353 199.724 439.603 199.974 439.978 200.474C440.353 200.974 439.728 201.724 439.728 201.724C439.728 201.724 439.103 202.349 438.228 203.224C437.353 204.099 437.228 203.599 435.603 203.849C433.978 204.099 435.103 204.099 434.978 204.974C434.853 205.849 434.228 206.599 434.228 206.599L433.728 207.849L434.603 208.349C434.603 208.349 434.978 209.099 435.228 210.099C435.478 211.099 435.978 210.474 436.603 210.724C437.228 210.974 436.478 211.724 436.478 212.474C436.478 213.224 437.603 213.849 438.228 214.474C438.853 215.099 438.603 215.349 439.228 216.474C439.853 217.599 439.728 216.099 440.228 215.849C440.728 215.599 440.978 215.599 442.103 215.474C443.228 215.349 443.353 215.599 443.353 215.599L442.728 217.099C442.728 217.099 443.478 217.599 444.353 218.474C445.228 219.349 444.603 220.099 445.728 220.099C446.853 220.099 446.478 220.599 446.978 220.974C447.478 221.349 447.978 221.974 448.853 222.724C449.728 223.474 449.603 223.224 450.353 223.349C451.103 223.474 450.728 223.474 451.103 226.349C451.478 229.224 451.853 226.599 451.853 226.599C451.853 226.599 451.603 227.349 451.228 227.849C450.853 228.349 450.353 228.599 449.853 229.099C449.353 229.599 448.728 230.099 448.728 230.599C448.728 231.099 449.353 231.099 450.728 232.099C452.103 233.099 452.103 231.599 452.103 231.599C452.103 231.599 452.728 231.224 454.353 231.349C455.978 231.474 455.728 230.974 455.728 230.974C455.728 230.974 456.478 230.099 457.478 229.974C458.478 229.849 458.353 229.974 459.228 229.849C460.103 229.724 460.103 229.349 460.728 228.849C461.353 228.349 461.978 228.724 462.603 228.599C463.228 228.474 464.478 228.349 464.478 228.349C466.603 227.974 464.728 227.974 464.853 227.099C464.978 226.224 465.853 226.224 465.853 226.224C465.853 226.224 466.603 226.349 467.103 225.849C467.603 225.349 467.853 225.099 467.853 224.474C467.853 223.849 467.228 222.849 467.228 222.849C467.228 222.849 466.353 222.224 466.353 221.474C466.353 220.724 466.478 220.474 466.728 219.974C466.978 219.474 466.728 218.599 466.728 217.099C466.728 215.599 466.728 215.474 466.853 214.474C466.978 213.474 467.603 213.974 468.353 213.474C469.103 212.974 468.103 211.724 468.103 211.724C468.103 211.724 467.603 211.724 466.478 211.349C465.353 210.974 464.853 210.974 464.103 209.474C463.353 207.974 463.728 208.349 463.603 207.724C463.478 207.099 462.853 206.849 463.103 205.349C463.353 203.849 462.11 202.422 462.11 202.422L461.049 202.069C461.049 202.069 460.342 201.715 460.165 201.008C459.988 200.301 460.342 200.124 460.519 199.063C460.695 198.003 459.988 196.942 459.988 196.942L458.751 198.003C458.751 198.003 460.519 195.174 460.695 194.291C460.872 193.407 460.695 193.23 461.049 192.523C461.402 191.816 461.756 191.992 462.817 191.639C463.877 191.285 464.231 190.578 464.231 190.578C464.231 190.578 464.761 189.164 464.584 187.75C464.408 186.336 464.231 185.805 464.231 184.568C464.231 183.33 462.817 183.684 462.817 183.684L461.756 182.27C461.756 182.27 460.695 181.916 460.165 181.032C459.635 180.148 460.165 179.618 460.342 178.557C460.519 177.497 459.812 177.143 459.812 177.143C459.812 177.143 458.928 175.022 458.574 173.961C458.221 172.901 458.397 172.37 458.221 171.486C458.044 170.602 458.397 170.072 458.928 169.365C459.458 168.658 460.165 167.597 461.226 167.244C462.286 166.89 460.872 165.653 460.872 165.653C460.872 165.653 462.11 161.94 462.817 161.94C463.524 161.94 463.524 161.94 466.175 161.764C468.827 161.587 467.59 160.88 468.12 160.173C468.65 159.466 469.888 159.642 470.595 159.466C471.302 159.289 471.302 159.466 472.009 159.466C472.716 159.466 475.191 158.758 475.191 158.758C475.191 158.758 476.782 157.344 477.489 156.991C478.196 156.637 478.903 156.107 478.903 156.107L480.141 157.344L481.555 157.521C481.555 157.521 483.146 158.228 484.03 158.405C484.914 158.582 485.267 158.758 486.151 158.582C487.035 158.405 487.212 158.051 487.919 156.637C488.626 155.223 488.803 154.869 488.98 153.632C489.156 152.394 492.338 152.394 493.222 152.041C494.106 151.687 494.283 151.334 495.344 150.803C496.404 150.273 495.344 149.212 495.344 147.445C495.344 145.677 494.813 145.5 494.637 144.263C494.46 143.025 494.106 142.672 493.929 141.788C493.753 140.904 495.52 140.02 496.228 138.606C496.935 137.192 496.227 136.661 496.051 135.424C495.874 134.186 494.283 134.186 494.283 134.186L491.101 132.065L489.687 131.358C489.687 131.358 489.51 129.944 489.687 128.353C489.864 126.762 490.747 126.231 491.455 124.994C492.162 123.757 492.162 122.342 492.162 121.459C492.162 120.575 490.394 120.221 490.394 120.221C490.394 120.221 490.394 117.039 490.394 116.155C490.394 115.271 490.394 112.62 490.394 111.382C490.394 110.145 489.687 107.847 489.156 106.963C488.626 106.079 489.687 104.488 489.687 104.488C489.687 104.488 488.803 102.543 488.626 101.66C488.449 100.776 489.687 96.8866 489.687 96.8866L491.631 92.1136L492.869 89.9923C492.869 89.9923 492.869 86.8103 493.399 86.1032C493.929 85.3961 493.753 82.0373 493.753 82.0373C493.753 82.0373 493.046 75.3198 492.338 74.8779C491.631 74.4359 491.366 73.9056 490.659 73.0217C489.952 72.1378 488.626 72.9333 487.654 72.9333C486.682 72.9333 485.709 72.8449 484.649 72.6681C483.588 72.4914 483.323 72.2262 481.997 71.9611C480.671 71.6959 479.787 72.8449 479.434 73.552C479.08 74.2592 478.727 74.5243 477.666 76.1153C476.605 77.7063 476.517 76.4688 475.191 77.0876C473.865 77.7063 473.954 76.2037 472.981 75.8501C472.009 75.4966 470.772 76.2037 469.711 76.2037C468.65 76.2037 468.739 75.9385 467.413 75.0546C466.087 74.1708 466.087 74.5243 464.231 76.2921C462.375 78.0598 462.552 77.4411 461.226 77.176C459.9 76.9108 459.281 78.4134 459.281 78.4134C459.281 78.4134 456.895 80.7115 456.276 81.065C455.657 81.4186 453.182 82.1257 452.299 83.3632C451.415 84.6006 452.122 84.1586 450.442 85.0425C448.763 85.9264 449.117 85.1309 449.117 84.0702C449.117 83.0096 449.117 83.6283 449.735 82.2141C450.354 80.7999 449.735 81.5954 449.117 81.3302C448.498 81.0651 448.056 80.5347 447.437 79.6508C446.818 78.7669 446.818 78.4134 446.111 77.7063C445.404 76.9992 443.99 78.5018 442.753 78.325C441.515 78.1482 441.604 78.325 440.72 78.4134C439.836 78.5018 440.631 79.2089 440.896 80.0044C441.162 80.7999 441.338 80.7115 441.957 81.4186C442.576 82.1257 441.869 83.3631 441.869 84.0702C441.869 84.7774 441.692 84.8657 441.957 85.6612C442.222 86.4567 442.664 86.1916 443.548 86.8103C444.432 87.429 444.078 87.7826 443.902 88.5781C443.725 89.3735 442.929 88.4897 441.957 88.4013C440.985 88.3129 440.366 89.7271 439.394 90.2574C438.422 90.7878 437.98 90.611 437.007 90.6994C436.035 90.7878 436.212 91.3181 434.621 92.8207C433.03 94.3233 432.941 93.4394 431.792 93.4394C430.643 93.4394 431.085 92.8207 429.759 91.9368C428.434 91.0529 429.141 92.0252 428.169 92.3788C427.196 92.7323 428.257 93.4394 428.876 94.4117C429.494 95.384 429.671 96.0911 429.848 96.4446C430.025 96.7982 429.848 96.8866 428.434 98.3892C427.019 99.8918 427.373 98.4775 426.312 98.4775C425.252 98.4775 425.517 98.5659 424.456 98.6543C423.396 98.7427 423.749 98.2124 423.749 97.5053C423.749 96.7982 423.749 96.8866 423.749 95.384C423.749 93.8814 423.219 94.2349 422.954 93.8814C422.688 93.5278 422.954 93.0859 422.777 92.6439C422.6 92.202 421.893 91.5833 421.451 91.5833C421.009 91.5833 419.772 91.6716 419.506 91.3181C419.241 90.9645 418.711 90.4342 417.915 90.0807C417.12 89.7271 416.236 88.8432 415.882 88.4897C415.529 88.1361 415.882 87.6942 415.971 87.2522C416.059 86.8103 417.65 86.1916 418.976 86.3683C420.302 86.5451 423.13 86.8987 425.34 86.8987C427.55 86.8987 428.61 86.8987 429.494 86.8987C430.378 86.8987 432.5 86.4567 433.649 86.1916C434.798 85.9264 436.3 85.1309 436.831 84.5122C437.361 83.8935 437.007 83.7167 436.919 82.5677C436.831 81.4186 436.477 80.9767 435.682 80.2695C434.886 79.5624 434.974 79.1205 431.616 76.9108C428.257 74.7011 428.434 76.2037 427.108 76.2921C425.782 76.3805 425.959 75.7617 424.987 75.4966C424.014 75.2314 421.981 75.3198 420.302 75.3198C418.623 75.3198 418.534 75.585 417.208 75.2314C415.882 74.8779 416.501 74.4359 415.352 74.3475C414.203 74.2591 413.938 74.5243 412.966 74.1708C411.993 73.8172 411.728 73.2869 411.021 73.0217C410.314 72.7565 411.286 73.1985 410.049 73.1101Z"
                className={getCountryClass("ukraine")}
                fill={getFill("ukraine")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_5">
                <path
                  id="Ukraine"
                  d="M437.743 131.636H438.665V134.47C438.665 134.788 438.589 135.067 438.437 135.305C438.287 135.544 438.076 135.73 437.804 135.864C437.533 135.996 437.217 136.062 436.856 136.062C436.494 136.062 436.177 135.996 435.906 135.864C435.635 135.73 435.424 135.544 435.273 135.305C435.123 135.067 435.047 134.788 435.047 134.47V131.636H435.97V134.391C435.97 134.558 436.006 134.705 436.078 134.835C436.152 134.964 436.256 135.065 436.39 135.139C436.523 135.213 436.679 135.25 436.856 135.25C437.035 135.25 437.191 135.213 437.323 135.139C437.456 135.065 437.559 134.964 437.632 134.835C437.706 134.705 437.743 134.558 437.743 134.391V131.636ZM440.23 135.058L440.232 133.969H440.364L441.412 132.727H442.454L441.046 134.372H440.83L440.23 135.058ZM439.407 136V131.636H440.315V136H439.407ZM441.453 136L440.49 134.575L441.095 133.933L442.516 136H441.453ZM442.899 136V132.727H443.779V133.298H443.813C443.873 133.095 443.973 132.942 444.114 132.838C444.254 132.733 444.416 132.68 444.6 132.68C444.645 132.68 444.694 132.683 444.747 132.689C444.799 132.695 444.845 132.702 444.885 132.712V133.518C444.843 133.505 444.784 133.494 444.708 133.484C444.633 133.474 444.564 133.469 444.502 133.469C444.368 133.469 444.249 133.498 444.144 133.556C444.04 133.613 443.958 133.692 443.896 133.795C443.837 133.897 443.807 134.015 443.807 134.148V136H442.899ZM446.194 136.062C445.985 136.062 445.799 136.026 445.636 135.953C445.472 135.879 445.343 135.771 445.248 135.627C445.154 135.482 445.107 135.302 445.107 135.086C445.107 134.904 445.141 134.751 445.207 134.628C445.274 134.504 445.365 134.405 445.48 134.33C445.595 134.254 445.726 134.197 445.872 134.159C446.02 134.121 446.175 134.094 446.337 134.078C446.527 134.058 446.68 134.04 446.797 134.023C446.913 134.004 446.998 133.977 447.05 133.942C447.103 133.906 447.129 133.854 447.129 133.784V133.771C447.129 133.636 447.087 133.532 447.001 133.458C446.918 133.384 446.798 133.347 446.643 133.347C446.48 133.347 446.35 133.384 446.254 133.456C446.157 133.527 446.093 133.616 446.062 133.724L445.222 133.656C445.265 133.457 445.349 133.286 445.474 133.141C445.599 132.994 445.76 132.882 445.957 132.804C446.156 132.724 446.386 132.685 446.648 132.685C446.83 132.685 447.004 132.706 447.17 132.749C447.337 132.791 447.486 132.857 447.615 132.947C447.746 133.036 447.849 133.151 447.924 133.292C447.999 133.431 448.037 133.598 448.037 133.793V136H447.176V135.546H447.151C447.098 135.648 447.028 135.739 446.94 135.817C446.852 135.893 446.746 135.954 446.622 135.998C446.499 136.04 446.356 136.062 446.194 136.062ZM446.454 135.435C446.587 135.435 446.705 135.409 446.808 135.357C446.91 135.303 446.99 135.23 447.048 135.139C447.107 135.048 447.136 134.945 447.136 134.83V134.483C447.107 134.501 447.068 134.518 447.018 134.534C446.97 134.548 446.915 134.562 446.854 134.575C446.793 134.586 446.732 134.597 446.671 134.607C446.61 134.615 446.555 134.623 446.505 134.63C446.398 134.646 446.305 134.67 446.226 134.705C446.146 134.739 446.085 134.785 446.04 134.843C445.996 134.9 445.974 134.971 445.974 135.056C445.974 135.18 446.019 135.274 446.109 135.339C446.2 135.403 446.315 135.435 446.454 135.435ZM448.741 136V132.727H449.649V136H448.741ZM449.197 132.305C449.062 132.305 448.946 132.261 448.85 132.171C448.755 132.08 448.707 131.972 448.707 131.845C448.707 131.72 448.755 131.613 448.85 131.523C448.946 131.433 449.062 131.387 449.197 131.387C449.332 131.387 449.447 131.433 449.542 131.523C449.639 131.613 449.687 131.72 449.687 131.845C449.687 131.972 449.639 132.08 449.542 132.171C449.447 132.261 449.332 132.305 449.197 132.305ZM451.284 134.108V136H450.376V132.727H451.241V133.305H451.279C451.352 133.114 451.473 132.964 451.644 132.853C451.814 132.741 452.021 132.685 452.264 132.685C452.491 132.685 452.689 132.734 452.858 132.834C453.027 132.933 453.159 133.075 453.252 133.26C453.346 133.443 453.393 133.662 453.393 133.916V136H452.485V134.078C452.487 133.878 452.436 133.722 452.332 133.609C452.228 133.496 452.085 133.439 451.904 133.439C451.781 133.439 451.673 133.465 451.58 133.518C451.487 133.57 451.415 133.647 451.362 133.748C451.311 133.847 451.285 133.967 451.284 134.108ZM455.6 136.064C455.263 136.064 454.973 135.996 454.73 135.859C454.489 135.722 454.303 135.527 454.172 135.276C454.042 135.023 453.976 134.724 453.976 134.379C453.976 134.042 454.042 133.746 454.172 133.492C454.303 133.238 454.487 133.04 454.724 132.898C454.963 132.756 455.243 132.685 455.564 132.685C455.779 132.685 455.98 132.719 456.167 132.789C456.354 132.857 456.517 132.96 456.657 133.098C456.797 133.236 456.907 133.409 456.985 133.618C457.063 133.825 457.102 134.068 457.102 134.347V134.596H454.338V134.033H456.248C456.248 133.903 456.219 133.787 456.162 133.686C456.105 133.585 456.027 133.506 455.926 133.45C455.826 133.391 455.711 133.362 455.578 133.362C455.441 133.362 455.319 133.394 455.212 133.458C455.107 133.521 455.025 133.605 454.965 133.712C454.905 133.817 454.875 133.934 454.873 134.063V134.598C454.873 134.76 454.903 134.9 454.963 135.018C455.024 135.136 455.11 135.227 455.221 135.29C455.331 135.354 455.463 135.386 455.615 135.386C455.716 135.386 455.808 135.372 455.892 135.344C455.975 135.315 456.047 135.273 456.107 135.216C456.167 135.159 456.212 135.089 456.243 135.007L457.083 135.062C457.04 135.264 456.953 135.44 456.821 135.591C456.69 135.74 456.521 135.857 456.314 135.94C456.108 136.023 455.87 136.064 455.6 136.064Z"
                  fill="black"
                ></path>
                <g id="Army_5">
                  <circle
                    id="armycircle_5"
                    cx="446"
                    cy="145"
                    r="5.5"
                    fill={getCircleFill("ukraine")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("ukraine")}
                  ></circle>
                  {getArmyNum("ukraine", "446", "145")}
                </g>
              </g>
            </g>
            <g id="north-eu">
              <path
                id="northern_europe"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M392.603 148.474L393.853 148.599C394.699 149.393 395.304 150.317 396.165 151.099C396.165 151.099 398.665 152.474 399.54 152.474C400.415 152.474 401.415 151.912 401.915 151.849C402.415 151.787 401.853 152.724 401.853 153.037C401.853 153.349 402.54 156.287 402.853 156.912C403.165 157.537 403.228 164.974 403.29 166.349C403.353 167.724 404.665 169.099 405.04 169.412C405.415 169.724 405.665 170.474 405.665 170.787C405.665 171.099 404.853 172.162 404.79 172.599C404.728 173.037 404.915 173.787 404.853 174.349C404.79 174.912 404.353 175.162 403.853 175.599C403.353 176.037 403.478 177.037 403.165 177.662C402.853 178.287 402.353 178.287 401.728 178.537C400.043 180.836 399.63 182.874 396.728 183.537C396.165 183.537 394.665 183.974 394.478 184.474C394.29 184.974 394.29 185.974 394.29 185.974L396.603 188.162C395.907 189.252 396.172 189.252 396.172 189.252C396.172 189.252 395.465 189.959 395.023 190.136C394.581 190.313 394.404 191.197 394.316 191.639C394.227 192.081 393.432 192.434 392.106 193.318C390.78 194.202 390.25 197.119 390.25 197.119C390.25 197.119 390.073 199.947 390.073 200.301C390.073 200.654 390.869 201.715 390.957 202.422C391.045 203.129 390.338 204.632 390.338 204.632H381.146V200.743C381.146 200.743 380.174 199.329 380.085 198.975C379.997 198.622 380.439 197.473 380.616 197.119C380.792 196.765 381.323 195.882 381.499 195.086C381.676 194.291 380.792 193.318 380.35 193.23C379.908 193.141 379.908 192.876 379.908 192.876C379.908 192.876 378.494 192.611 378.052 192.7C377.61 192.788 377.61 193.495 377.08 193.849C376.55 194.202 375.666 194.202 374.782 194.291C373.898 194.379 370.097 194.909 370.097 194.909C370.097 194.909 370.097 196.058 370.097 196.942C370.097 197.826 368.241 199.417 367.711 200.124C367.181 200.831 366.562 200.92 365.413 201.273C364.264 201.627 364.087 201.45 363.026 201.362C361.966 201.273 362.054 201.715 361.258 202.157C360.463 202.599 358.784 203.041 357.9 203.395C357.016 203.748 356.132 201.185 356.132 200.743C356.132 200.301 354.806 200.478 354.806 200.478C354.806 200.478 354.011 201.45 353.215 201.804C352.42 202.157 352.154 202.422 351.005 202.245C349.856 202.069 350.103 201.662 350.103 201.662C350.103 201.662 349.165 200.974 348.853 200.599C348.54 200.224 348.353 199.412 348.228 198.662C348.103 197.912 347.54 197.974 347.165 197.474C346.79 196.974 346.728 196.849 346.603 196.037C346.478 195.224 346.228 195.224 345.79 195.099C345.353 194.974 344.915 193.849 344.04 192.599C343.165 191.349 341.853 190.537 341.853 190.537C341.853 190.537 340.79 187.787 340.853 187.349C340.915 186.912 339.728 186.599 339.728 186.599C340.478 185.724 341.103 183.474 341.728 183.224C342.353 182.974 342.728 183.599 343.103 181.599C343.478 179.599 342.853 179.974 343.478 179.474C344.103 178.974 344.853 179.599 345.228 178.224C345.603 176.849 345.478 176.599 345.478 175.974C345.478 175.349 343.728 175.349 346.103 174.849C348.478 174.349 348.603 175.099 349.103 174.099C349.603 173.099 349.603 173.349 349.853 172.349C350.103 171.349 350.603 171.599 351.228 170.599C351.853 169.599 351.478 169.599 351.853 168.724C352.228 167.849 352.228 164.599 352.853 164.349C353.478 164.099 353.478 164.849 353.853 163.849C354.228 162.849 353.853 162.599 354.603 161.599C355.353 160.599 355.478 160.724 356.228 160.224C356.978 159.724 357.103 159.849 357.353 159.224C357.603 158.599 356.478 158.724 358.228 157.474C359.978 156.224 359.853 156.724 360.103 156.099C360.353 155.474 360.603 155.099 360.728 154.474C360.853 153.849 360.728 153.849 360.853 152.974C360.978 152.099 360.853 152.724 360.978 151.224C361.103 149.724 361.353 148.724 361.478 148.099C361.603 147.474 361.728 147.099 361.103 147.224C360.478 147.349 360.353 148.349 360.228 147.224C360.103 146.099 359.853 145.724 359.603 145.099C359.353 144.474 358.978 143.349 358.978 143.349C358.978 143.349 358.478 142.849 358.978 142.099C359.478 141.349 360.103 140.224 360.103 140.224C360.103 140.224 360.478 139.849 361.103 139.724C361.728 139.599 361.853 139.849 362.353 139.224C362.853 138.599 361.853 138.474 363.103 138.349C364.353 138.224 364.603 138.224 364.603 138.224L363.853 139.349L363.728 140.349C363.728 140.349 365.103 141.099 365.353 142.599C365.603 144.099 365.853 144.224 365.728 144.974C365.603 145.724 365.478 148.724 365.478 148.724C365.478 148.724 365.478 149.724 366.228 150.349C366.978 150.974 367.478 151.224 368.228 151.349C368.978 151.474 370.353 151.599 370.978 151.349C371.603 151.099 372.228 150.974 372.853 151.349C373.478 151.724 374.228 151.349 374.728 151.099C375.228 150.849 375.853 150.599 376.478 150.474C377.103 150.349 377.603 150.349 378.853 150.349C380.103 150.349 380.478 150.599 380.978 150.099C381.478 149.599 381.353 149.974 381.978 149.474C382.603 148.974 383.853 148.349 384.478 148.349C385.103 148.349 385.103 148.224 385.853 148.099C386.603 147.974 387.603 147.474 388.603 147.849C389.603 148.224 389.978 148.349 390.853 148.474C391.728 148.599 392.103 148.849 392.603 148.474Z"
                className={getCountryClass("north-eu")}
                fill={getFill("north-eu")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_6">
                <path
                  id="Northern Europe"
                  d="M371.714 153.636V158H370.917L369.018 155.254H368.986V158H368.064V153.636H368.873L370.757 156.381H370.795V153.636H371.714ZM373.938 158.064C373.607 158.064 373.32 157.994 373.079 157.853C372.839 157.711 372.653 157.513 372.523 157.261C372.392 157.006 372.327 156.712 372.327 156.376C372.327 156.038 372.392 155.743 372.523 155.49C372.653 155.236 372.839 155.038 373.079 154.898C373.32 154.756 373.607 154.685 373.938 154.685C374.269 154.685 374.554 154.756 374.794 154.898C375.036 155.038 375.222 155.236 375.352 155.49C375.483 155.743 375.548 156.038 375.548 156.376C375.548 156.712 375.483 157.006 375.352 157.261C375.222 157.513 375.036 157.711 374.794 157.853C374.554 157.994 374.269 158.064 373.938 158.064ZM373.942 157.361C374.092 157.361 374.218 157.318 374.319 157.233C374.42 157.146 374.496 157.028 374.547 156.879C374.6 156.73 374.626 156.56 374.626 156.37C374.626 156.18 374.6 156.01 374.547 155.861C374.496 155.712 374.42 155.594 374.319 155.507C374.218 155.42 374.092 155.377 373.942 155.377C373.79 155.377 373.662 155.42 373.558 155.507C373.456 155.594 373.379 155.712 373.326 155.861C373.275 156.01 373.249 156.18 373.249 156.37C373.249 156.56 373.275 156.73 373.326 156.879C373.379 157.028 373.456 157.146 373.558 157.233C373.662 157.318 373.79 157.361 373.942 157.361ZM376.139 158V154.727H377.019V155.298H377.053C377.112 155.095 377.212 154.942 377.353 154.838C377.494 154.733 377.656 154.68 377.839 154.68C377.884 154.68 377.933 154.683 377.986 154.689C378.038 154.695 378.085 154.702 378.124 154.712V155.518C378.082 155.505 378.023 155.494 377.948 155.484C377.872 155.474 377.803 155.469 377.741 155.469C377.607 155.469 377.488 155.498 377.383 155.556C377.279 155.613 377.197 155.692 377.136 155.795C377.076 155.897 377.046 156.015 377.046 156.148V158H376.139ZM380.498 154.727V155.409H378.528V154.727H380.498ZM378.975 153.943H379.883V156.994C379.883 157.078 379.896 157.143 379.921 157.19C379.947 157.236 379.982 157.268 380.028 157.286C380.074 157.305 380.128 157.314 380.19 157.314C380.232 157.314 380.275 157.31 380.317 157.303C380.36 157.295 380.393 157.288 380.415 157.284L380.558 157.96C380.513 157.974 380.449 157.99 380.366 158.009C380.284 158.028 380.184 158.04 380.066 158.045C379.847 158.053 379.655 158.024 379.491 157.957C379.327 157.891 379.2 157.787 379.109 157.646C379.018 157.506 378.974 157.328 378.975 157.114V153.943ZM382.068 156.108V158H381.16V153.636H382.042V155.305H382.081C382.154 155.112 382.274 154.96 382.438 154.851C382.603 154.74 382.81 154.685 383.059 154.685C383.286 154.685 383.484 154.734 383.653 154.834C383.823 154.932 383.956 155.073 384.049 155.258C384.144 155.441 384.191 155.661 384.19 155.916V158H383.282V156.078C383.284 155.876 383.233 155.719 383.129 155.607C383.027 155.495 382.883 155.439 382.698 155.439C382.575 155.439 382.465 155.465 382.37 155.518C382.277 155.57 382.203 155.647 382.149 155.748C382.096 155.847 382.069 155.967 382.068 156.108ZM386.396 158.064C386.059 158.064 385.769 157.996 385.526 157.859C385.285 157.722 385.099 157.527 384.968 157.276C384.837 157.023 384.772 156.724 384.772 156.379C384.772 156.042 384.837 155.746 384.968 155.492C385.099 155.238 385.283 155.04 385.52 154.898C385.759 154.756 386.038 154.685 386.359 154.685C386.575 154.685 386.776 154.719 386.962 154.789C387.15 154.857 387.313 154.96 387.453 155.098C387.593 155.236 387.703 155.409 387.781 155.618C387.859 155.825 387.898 156.068 387.898 156.347V156.596H385.134V156.033H387.043C387.043 155.903 387.015 155.787 386.958 155.686C386.901 155.585 386.823 155.506 386.722 155.45C386.622 155.391 386.506 155.362 386.374 155.362C386.237 155.362 386.114 155.394 386.008 155.458C385.903 155.521 385.82 155.605 385.761 155.712C385.701 155.817 385.671 155.934 385.669 156.063V156.598C385.669 156.76 385.699 156.9 385.759 157.018C385.82 157.136 385.906 157.227 386.016 157.29C386.127 157.354 386.259 157.386 386.411 157.386C386.511 157.386 386.604 157.372 386.688 157.344C386.771 157.315 386.843 157.273 386.903 157.216C386.962 157.159 387.008 157.089 387.039 157.007L387.879 157.062C387.836 157.264 387.749 157.44 387.617 157.591C387.486 157.74 387.317 157.857 387.109 157.94C386.903 158.023 386.666 158.064 386.396 158.064ZM388.49 158V154.727H389.37V155.298H389.404C389.464 155.095 389.564 154.942 389.705 154.838C389.845 154.733 390.007 154.68 390.19 154.68C390.236 154.68 390.285 154.683 390.337 154.689C390.39 154.695 390.436 154.702 390.476 154.712V155.518C390.433 155.505 390.374 155.494 390.299 155.484C390.224 155.474 390.155 155.469 390.092 155.469C389.959 155.469 389.84 155.498 389.734 155.556C389.631 155.613 389.548 155.692 389.487 155.795C389.428 155.897 389.398 156.015 389.398 156.148V158H388.49ZM391.853 156.108V158H390.945V154.727H391.81V155.305H391.849C391.921 155.114 392.043 154.964 392.213 154.853C392.383 154.741 392.59 154.685 392.833 154.685C393.06 154.685 393.258 154.734 393.427 154.834C393.597 154.933 393.728 155.075 393.822 155.26C393.915 155.443 393.962 155.662 393.962 155.916V158H393.055V156.078C393.056 155.878 393.005 155.722 392.901 155.609C392.797 155.496 392.655 155.439 392.473 155.439C392.351 155.439 392.243 155.465 392.149 155.518C392.057 155.57 391.984 155.647 391.932 155.748C391.881 155.847 391.854 155.967 391.853 156.108ZM370.994 165V160.636H373.934V161.397H371.916V162.437H373.783V163.197H371.916V164.239H373.942V165H370.994ZM376.749 163.607V161.727H377.657V165H376.785V164.406H376.751C376.677 164.597 376.554 164.751 376.383 164.868C376.212 164.984 376.004 165.043 375.758 165.043C375.54 165.043 375.347 164.993 375.181 164.893C375.015 164.794 374.885 164.653 374.791 164.469C374.699 164.286 374.652 164.067 374.65 163.811V161.727H375.558V163.649C375.559 163.842 375.611 163.995 375.714 164.107C375.816 164.219 375.953 164.276 376.125 164.276C376.234 164.276 376.336 164.251 376.432 164.201C376.527 164.15 376.603 164.075 376.662 163.975C376.721 163.876 376.75 163.753 376.749 163.607ZM378.383 165V161.727H379.263V162.298H379.297C379.356 162.095 379.457 161.942 379.597 161.838C379.738 161.733 379.9 161.68 380.083 161.68C380.128 161.68 380.177 161.683 380.23 161.689C380.283 161.695 380.329 161.702 380.369 161.712V162.518C380.326 162.505 380.267 162.494 380.192 162.484C380.116 162.474 380.047 162.469 379.985 162.469C379.851 162.469 379.732 162.498 379.627 162.556C379.523 162.613 379.441 162.692 379.38 162.795C379.32 162.897 379.29 163.015 379.29 163.148V165H378.383ZM382.164 165.064C381.833 165.064 381.547 164.994 381.305 164.853C381.065 164.711 380.88 164.513 380.749 164.261C380.619 164.006 380.553 163.712 380.553 163.376C380.553 163.038 380.619 162.743 380.749 162.49C380.88 162.236 381.065 162.038 381.305 161.898C381.547 161.756 381.833 161.685 382.164 161.685C382.495 161.685 382.781 161.756 383.021 161.898C383.262 162.038 383.448 162.236 383.579 162.49C383.71 162.743 383.775 163.038 383.775 163.376C383.775 163.712 383.71 164.006 383.579 164.261C383.448 164.513 383.262 164.711 383.021 164.853C382.781 164.994 382.495 165.064 382.164 165.064ZM382.168 164.361C382.319 164.361 382.445 164.318 382.546 164.233C382.646 164.146 382.722 164.028 382.774 163.879C382.826 163.73 382.852 163.56 382.852 163.37C382.852 163.18 382.826 163.01 382.774 162.861C382.722 162.712 382.646 162.594 382.546 162.507C382.445 162.42 382.319 162.377 382.168 162.377C382.016 162.377 381.889 162.42 381.785 162.507C381.683 162.594 381.605 162.712 381.553 162.861C381.502 163.01 381.476 163.18 381.476 163.37C381.476 163.56 381.502 163.73 381.553 163.879C381.605 164.028 381.683 164.146 381.785 164.233C381.889 164.318 382.016 164.361 382.168 164.361ZM384.365 166.227V161.727H385.26V162.277H385.301C385.34 162.189 385.398 162.099 385.473 162.009C385.55 161.916 385.649 161.839 385.771 161.778C385.895 161.716 386.048 161.685 386.232 161.685C386.47 161.685 386.69 161.747 386.892 161.872C387.094 161.996 387.255 162.183 387.376 162.433C387.497 162.681 387.557 162.993 387.557 163.368C387.557 163.733 387.498 164.041 387.38 164.293C387.264 164.543 387.104 164.732 386.903 164.862C386.703 164.989 386.478 165.053 386.229 165.053C386.053 165.053 385.903 165.024 385.78 164.966C385.658 164.908 385.558 164.835 385.479 164.746C385.401 164.657 385.342 164.567 385.301 164.476H385.273V166.227H384.365ZM385.254 163.364C385.254 163.558 385.281 163.728 385.335 163.873C385.389 164.018 385.467 164.131 385.569 164.212C385.671 164.291 385.796 164.331 385.942 164.331C386.09 164.331 386.215 164.29 386.317 164.21C386.419 164.127 386.497 164.013 386.549 163.869C386.603 163.722 386.63 163.554 386.63 163.364C386.63 163.175 386.604 163.009 386.551 162.865C386.499 162.722 386.421 162.609 386.319 162.528C386.217 162.447 386.091 162.407 385.942 162.407C385.794 162.407 385.669 162.446 385.567 162.524C385.466 162.602 385.389 162.713 385.335 162.857C385.281 163 385.254 163.169 385.254 163.364ZM389.653 165.064C389.317 165.064 389.027 164.996 388.784 164.859C388.543 164.722 388.357 164.527 388.226 164.276C388.095 164.023 388.03 163.724 388.03 163.379C388.03 163.042 388.095 162.746 388.226 162.492C388.357 162.238 388.541 162.04 388.778 161.898C389.016 161.756 389.296 161.685 389.617 161.685C389.833 161.685 390.034 161.719 390.22 161.789C390.408 161.857 390.571 161.96 390.71 162.098C390.851 162.236 390.96 162.409 391.038 162.618C391.117 162.825 391.156 163.068 391.156 163.347V163.596H388.392V163.033H390.301C390.301 162.903 390.273 162.787 390.216 162.686C390.159 162.585 390.08 162.506 389.979 162.45C389.88 162.391 389.764 162.362 389.632 162.362C389.494 162.362 389.372 162.394 389.266 162.458C389.161 162.521 389.078 162.605 389.019 162.712C388.959 162.817 388.928 162.934 388.927 163.063V163.598C388.927 163.76 388.957 163.9 389.016 164.018C389.078 164.136 389.163 164.227 389.274 164.29C389.385 164.354 389.516 164.386 389.668 164.386C389.769 164.386 389.862 164.372 389.945 164.344C390.029 164.315 390.101 164.273 390.161 164.216C390.22 164.159 390.266 164.089 390.297 164.007L391.136 164.062C391.094 164.264 391.006 164.44 390.874 164.591C390.744 164.74 390.575 164.857 390.367 164.94C390.161 165.023 389.923 165.064 389.653 165.064Z"
                  fill="black"
                ></path>
                <g id="Army_6">
                  <circle
                    id="armycircle_6"
                    cx="381"
                    cy="172"
                    r="5.5"
                    fill={getCircleFill("north-eu")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("north-eu")}
                  ></circle>
                  {getArmyNum("north-eu", "381", "172")}
                </g>
              </g>
            </g>
            <g id="south-eu">
              <path
                id="southern_europe"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M396.603 188.162C396.853 188.099 397.103 187.349 397.353 186.974C397.603 186.599 398.54 186.537 398.54 186.537C398.54 186.537 400.165 186.474 400.853 186.912C401.54 187.349 401.103 187.662 401.165 188.974C401.228 190.287 401.228 190.037 401.415 190.662C401.603 191.287 401.915 191.037 403.04 191.349C404.165 191.662 403.79 191.537 404.665 191.662C405.54 191.787 405.353 192.412 405.79 193.349C406.228 194.287 406.29 194.974 406.728 195.787C407.165 196.599 407.165 197.099 407.165 197.349C407.165 197.599 406.853 198.849 406.79 199.537C406.728 200.224 406.415 200.349 406.29 200.662C406.165 200.974 406.228 201.849 406.228 202.162C406.228 202.474 406.665 202.912 407.04 203.349C407.415 203.787 407.415 204.162 407.415 204.849C407.415 205.537 406.853 206.599 406.853 207.224C406.853 207.849 407.79 208.287 407.665 208.849C407.54 209.412 409.853 211.099 409.853 211.099C409.853 211.099 408.728 211.849 409.228 212.599C409.728 213.349 410.353 213.974 410.103 214.474C409.853 214.974 409.978 214.974 409.353 215.474C408.728 215.974 408.353 215.849 408.353 216.974C408.353 218.099 409.228 218.349 408.603 219.349C407.978 220.349 408.228 220.224 407.728 220.974C407.228 221.724 406.978 222.349 406.728 223.099C406.478 223.849 407.228 223.974 406.353 224.724C405.478 225.474 405.228 225.099 404.978 225.974C404.728 226.849 405.103 226.849 404.603 227.474C404.103 228.099 404.103 228.474 403.603 228.849C403.103 229.224 403.103 229.099 402.478 229.849C401.853 230.599 402.353 230.974 401.853 231.599C401.353 232.224 400.978 231.724 400.728 232.599C400.478 233.474 400.728 233.099 400.853 233.974C400.978 234.849 401.603 234.849 400.853 235.849C400.103 236.849 399.728 237.474 399.228 237.849C398.728 238.224 398.728 237.724 398.353 238.849C397.978 239.974 398.603 240.349 397.853 240.599C397.103 240.849 396.728 240.849 395.978 240.974C395.228 241.099 394.853 240.849 394.353 240.974C393.853 241.099 393.603 240.974 393.228 241.599C392.853 242.224 392.478 242.099 392.978 242.849C393.478 243.599 393.353 243.599 393.853 244.099C394.353 244.599 394.728 244.974 395.228 245.474C395.728 245.974 396.103 246.224 396.228 246.849C396.353 247.474 396.353 247.974 396.353 247.974C396.353 247.974 396.978 249.849 396.478 250.099C395.978 250.349 395.478 250.349 395.353 251.099C395.228 251.849 395.103 251.599 395.353 252.474C395.603 253.349 395.353 253.349 395.853 253.849C396.353 254.349 396.478 254.349 397.228 255.099C397.978 255.849 398.853 255.974 398.353 256.599C397.853 257.224 397.228 257.349 396.478 257.099C395.728 256.849 395.353 257.474 394.853 256.349C394.353 255.224 394.103 254.974 394.103 254.974C394.103 254.974 393.353 255.099 393.353 255.724C393.353 256.349 395.228 256.474 392.853 256.474C390.478 256.474 390.728 257.224 390.103 256.474C389.478 255.724 389.978 255.474 389.103 255.224C388.228 254.974 388.103 255.724 387.728 254.974C387.353 254.224 387.228 254.224 387.228 253.099C387.228 251.974 387.853 251.974 387.478 250.474C387.103 248.974 386.853 249.349 386.603 248.474C386.353 247.599 386.603 247.599 386.603 246.474C386.603 245.349 386.228 244.849 386.228 244.849C386.228 244.849 385.853 244.599 385.603 243.349C385.353 242.099 385.478 241.974 385.228 240.849C384.978 239.724 385.103 239.349 384.478 239.349C383.853 239.349 384.228 239.849 383.228 239.099C382.228 238.349 382.728 238.099 381.853 237.724C380.978 237.349 380.853 238.099 380.603 236.849C380.353 235.599 380.353 236.224 380.353 234.724C380.353 233.224 380.353 232.724 380.353 232.099C380.353 231.474 380.853 231.474 380.103 230.474C379.353 229.474 379.478 229.224 378.603 229.099C377.728 228.974 377.978 229.974 377.228 228.724C376.478 227.474 376.353 226.724 375.353 226.474C374.353 226.224 374.478 226.849 373.978 226.224C373.478 225.599 373.728 225.474 373.103 224.849C372.478 224.224 373.228 223.974 371.603 223.974C369.978 223.974 369.978 223.099 369.103 223.474C368.228 223.849 367.978 224.474 367.978 225.099C367.978 225.724 367.978 225.724 368.103 226.599C368.228 227.474 367.978 227.974 368.603 228.099C369.228 228.224 369.228 227.599 369.353 228.724C369.478 229.849 369.228 230.974 370.728 230.349C372.228 229.724 373.103 228.849 373.228 229.599C373.353 230.349 373.103 230.474 373.353 231.474C373.603 232.474 373.353 233.349 374.228 233.974C375.103 234.599 375.478 234.599 375.853 235.099C376.228 235.599 376.103 235.474 376.603 235.724C377.103 235.974 377.103 237.099 377.728 237.974C378.353 238.849 379.103 238.099 378.728 239.224C378.353 240.349 378.353 240.849 377.853 241.224C377.353 241.599 376.228 241.974 375.478 241.349C374.728 240.724 374.103 240.224 374.103 240.224C374.103 240.224 374.728 238.974 373.228 239.349C371.728 239.724 371.728 239.849 371.103 239.849C370.478 239.849 370.103 238.849 370.353 240.224C370.603 241.599 371.603 242.099 371.603 242.099C371.603 242.099 372.728 242.099 372.603 243.349C372.478 244.599 372.978 244.224 372.353 245.474C371.728 246.724 371.853 246.474 371.353 247.599C370.853 248.724 371.353 248.724 370.728 249.599C370.103 250.474 369.853 250.974 368.978 251.349C368.103 251.724 368.103 250.974 367.728 252.349C367.353 253.724 367.478 253.724 366.853 253.974C366.228 254.224 364.853 254.224 364.353 254.599C363.853 254.974 364.728 255.474 363.353 255.099C361.978 254.724 362.353 254.724 361.728 254.599C361.103 254.474 360.853 254.474 360.353 253.849C359.853 253.224 360.228 252.099 359.728 252.474C359.228 252.849 358.853 254.224 358.353 252.849C357.853 251.474 357.978 251.349 357.478 251.099C356.978 250.849 356.728 252.349 356.603 250.724C356.478 249.099 356.228 249.099 356.978 248.349C357.728 247.599 357.978 247.349 358.603 247.349C359.228 247.349 359.353 247.474 360.103 247.599C360.853 247.724 360.728 248.349 361.353 248.474C361.978 248.599 363.853 247.474 364.103 248.224C364.353 248.974 363.853 251.224 364.478 249.224C365.103 247.224 364.728 246.849 365.603 246.099C366.478 245.349 367.353 244.599 367.728 244.099C368.103 243.599 368.478 242.849 367.603 241.974C366.728 241.099 366.478 241.974 366.478 240.349C366.478 238.724 366.728 238.349 366.228 237.474C365.728 236.599 366.228 236.849 365.228 236.349C364.228 235.849 364.228 235.599 363.728 234.974C363.228 234.349 362.353 233.849 361.478 233.599C360.603 233.349 361.228 233.974 360.353 232.599C359.478 231.224 359.228 230.849 358.478 230.974C357.728 231.099 358.103 232.099 357.353 231.224C356.603 230.349 356.853 230.224 356.353 229.849C355.853 229.474 355.603 229.849 354.978 229.349C354.353 228.849 354.353 228.849 354.228 227.849C354.103 226.849 354.353 226.474 353.728 225.974C353.103 225.474 351.853 225.099 351.853 225.099C351.853 225.099 352.103 224.849 350.478 225.099C348.853 225.349 348.728 225.349 348.228 225.724C348.228 225.724 350.652 224.873 349.061 223.459C347.47 222.044 346.763 220.277 347.47 220.1C348.177 219.923 349.061 219.216 349.238 218.509C349.414 217.802 349.68 216.388 349.326 215.946C348.973 215.504 347.116 214.266 347.116 214.266C347.116 214.266 346.056 213.382 346.232 213.029C346.409 212.675 347.293 211.703 347.293 211.703C347.293 211.703 348.354 211.88 348.354 210.377C348.354 208.875 348.354 208.079 348 207.195C347.647 206.311 347.558 205.604 348.177 204.986C348.796 204.367 349.503 203.395 349.68 203.041C349.856 202.687 349.856 202.069 351.005 202.245C352.154 202.422 352.42 202.157 353.215 201.804C354.011 201.45 354.806 200.478 354.806 200.478C354.806 200.478 356.132 200.301 356.132 200.743C356.132 201.185 357.016 203.748 357.9 203.395C358.784 203.041 360.463 202.599 361.258 202.157C362.054 201.715 361.966 201.273 363.026 201.362C364.087 201.45 364.264 201.627 365.413 201.273C366.562 200.92 367.181 200.831 367.711 200.124C368.241 199.417 370.097 197.826 370.097 196.942C370.097 196.058 370.097 194.909 370.097 194.909C370.097 194.909 373.898 194.379 374.782 194.291C375.666 194.202 376.55 194.202 377.08 193.849C377.61 193.495 377.61 192.788 378.052 192.7C378.494 192.611 379.908 192.876 379.908 192.876C379.908 192.876 379.908 193.141 380.35 193.23C380.792 193.318 381.676 194.291 381.499 195.086C381.323 195.882 380.792 196.765 380.616 197.119C380.439 197.473 379.997 198.622 380.085 198.975C380.174 199.329 381.146 200.743 381.146 200.743V204.632H390.338C390.338 204.632 391.045 203.129 390.957 202.422C390.869 201.715 390.073 200.654 390.073 200.301C390.073 199.947 390.25 197.119 390.25 197.119C390.25 197.119 390.78 194.202 392.106 193.318C393.432 192.434 394.227 192.081 394.316 191.639C394.404 191.197 394.581 190.313 395.023 190.136C395.465 189.959 396.172 189.252 396.172 189.252C396.172 189.252 395.907 189.252 396.603 188.162Z"
                className={getCountryClass("south-eu")}
                fill={getFill("south-eu")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_7">
                <path
                  id="Southern Europe"
                  d="M381.115 202.891C381.098 202.719 381.024 202.586 380.895 202.491C380.766 202.396 380.59 202.348 380.369 202.348C380.218 202.348 380.091 202.369 379.987 202.412C379.884 202.453 379.804 202.511 379.749 202.585C379.695 202.658 379.668 202.742 379.668 202.836C379.665 202.914 379.681 202.982 379.717 203.04C379.754 203.099 379.804 203.149 379.868 203.192C379.932 203.233 380.006 203.269 380.09 203.3C380.174 203.33 380.263 203.356 380.358 203.377L380.75 203.471C380.941 203.513 381.115 203.57 381.274 203.641C381.434 203.712 381.571 203.8 381.688 203.903C381.804 204.007 381.894 204.129 381.958 204.27C382.024 204.411 382.057 204.572 382.059 204.754C382.057 205.021 381.989 205.252 381.854 205.448C381.72 205.643 381.527 205.794 381.274 205.902C381.023 206.009 380.72 206.062 380.365 206.062C380.012 206.062 379.706 206.008 379.444 205.9C379.184 205.792 378.981 205.632 378.835 205.42C378.69 205.207 378.614 204.944 378.607 204.63H379.5C379.509 204.776 379.551 204.898 379.625 204.996C379.701 205.093 379.801 205.166 379.926 205.216C380.052 205.264 380.195 205.288 380.354 205.288C380.51 205.288 380.646 205.266 380.761 205.22C380.877 205.175 380.968 205.112 381.032 205.031C381.095 204.95 381.127 204.857 381.127 204.751C381.127 204.653 381.098 204.571 381.04 204.504C380.983 204.437 380.899 204.381 380.789 204.334C380.679 204.287 380.545 204.244 380.386 204.206L379.911 204.087C379.543 203.997 379.252 203.857 379.039 203.667C378.826 203.477 378.72 203.22 378.722 202.898C378.72 202.634 378.791 202.403 378.933 202.205C379.076 202.008 379.273 201.854 379.523 201.743C379.773 201.632 380.057 201.577 380.375 201.577C380.699 201.577 380.982 201.632 381.223 201.743C381.466 201.854 381.655 202.008 381.79 202.205C381.925 202.403 381.995 202.631 381.999 202.891H381.115ZM384.141 206.064C383.81 206.064 383.524 205.994 383.282 205.853C383.042 205.711 382.857 205.513 382.726 205.261C382.595 205.006 382.53 204.712 382.53 204.376C382.53 204.038 382.595 203.743 382.726 203.49C382.857 203.236 383.042 203.038 383.282 202.898C383.524 202.756 383.81 202.685 384.141 202.685C384.472 202.685 384.757 202.756 384.997 202.898C385.239 203.038 385.425 203.236 385.555 203.49C385.686 203.743 385.752 204.038 385.752 204.376C385.752 204.712 385.686 205.006 385.555 205.261C385.425 205.513 385.239 205.711 384.997 205.853C384.757 205.994 384.472 206.064 384.141 206.064ZM384.145 205.361C384.296 205.361 384.421 205.318 384.522 205.233C384.623 205.146 384.699 205.028 384.75 204.879C384.803 204.73 384.829 204.56 384.829 204.37C384.829 204.18 384.803 204.01 384.75 203.861C384.699 203.712 384.623 203.594 384.522 203.507C384.421 203.42 384.296 203.377 384.145 203.377C383.993 203.377 383.865 203.42 383.761 203.507C383.659 203.594 383.582 203.712 383.529 203.861C383.478 204.01 383.453 204.18 383.453 204.37C383.453 204.56 383.478 204.73 383.529 204.879C383.582 205.028 383.659 205.146 383.761 205.233C383.865 205.318 383.993 205.361 384.145 205.361ZM388.44 204.607V202.727H389.348V206H388.477V205.406H388.443C388.369 205.597 388.246 205.751 388.074 205.868C387.903 205.984 387.695 206.043 387.45 206.043C387.231 206.043 387.038 205.993 386.872 205.893C386.706 205.794 386.576 205.653 386.482 205.469C386.39 205.286 386.343 205.067 386.342 204.811V202.727H387.249V204.649C387.251 204.842 387.303 204.995 387.405 205.107C387.507 205.219 387.644 205.276 387.816 205.276C387.926 205.276 388.028 205.251 388.123 205.201C388.218 205.15 388.295 205.075 388.353 204.975C388.413 204.876 388.442 204.753 388.44 204.607ZM391.815 202.727V203.409H389.844V202.727H391.815ZM390.291 201.943H391.199V204.994C391.199 205.078 391.212 205.143 391.237 205.19C391.263 205.236 391.299 205.268 391.344 205.286C391.391 205.305 391.445 205.314 391.506 205.314C391.549 205.314 391.591 205.31 391.634 205.303C391.676 205.295 391.709 205.288 391.732 205.284L391.875 205.96C391.829 205.974 391.765 205.99 391.683 206.009C391.6 206.028 391.5 206.04 391.382 206.045C391.164 206.053 390.972 206.024 390.807 205.957C390.644 205.891 390.517 205.787 390.426 205.646C390.335 205.506 390.29 205.328 390.291 205.114V201.943ZM393.384 204.108V206H392.476V201.636H393.359V203.305H393.397C393.471 203.112 393.59 202.96 393.755 202.851C393.92 202.74 394.126 202.685 394.375 202.685C394.602 202.685 394.8 202.734 394.969 202.834C395.14 202.932 395.272 203.073 395.366 203.258C395.461 203.441 395.508 203.661 395.506 203.916V206H394.599V204.078C394.6 203.876 394.549 203.719 394.445 203.607C394.343 203.495 394.199 203.439 394.015 203.439C393.891 203.439 393.782 203.465 393.687 203.518C393.593 203.57 393.519 203.647 393.465 203.748C393.413 203.847 393.386 203.967 393.384 204.108ZM397.712 206.064C397.375 206.064 397.086 205.996 396.843 205.859C396.601 205.722 396.415 205.527 396.285 205.276C396.154 205.023 396.089 204.724 396.089 204.379C396.089 204.042 396.154 203.746 396.285 203.492C396.415 203.238 396.599 203.04 396.836 202.898C397.075 202.756 397.355 202.685 397.676 202.685C397.892 202.685 398.093 202.719 398.279 202.789C398.466 202.857 398.63 202.96 398.769 203.098C398.91 203.236 399.019 203.409 399.097 203.618C399.175 203.825 399.214 204.068 399.214 204.347V204.596H396.451V204.033H398.36C398.36 203.903 398.331 203.787 398.275 203.686C398.218 203.585 398.139 203.506 398.038 203.45C397.939 203.391 397.823 203.362 397.691 203.362C397.553 203.362 397.431 203.394 397.324 203.458C397.219 203.521 397.137 203.605 397.077 203.712C397.017 203.817 396.987 203.934 396.986 204.063V204.598C396.986 204.76 397.015 204.9 397.075 205.018C397.136 205.136 397.222 205.227 397.333 205.29C397.444 205.354 397.575 205.386 397.727 205.386C397.828 205.386 397.92 205.372 398.004 205.344C398.088 205.315 398.16 205.273 398.219 205.216C398.279 205.159 398.324 205.089 398.356 205.007L399.195 205.062C399.152 205.264 399.065 205.44 398.933 205.591C398.802 205.74 398.633 205.857 398.426 205.94C398.22 206.023 397.982 206.064 397.712 206.064ZM399.807 206V202.727H400.687V203.298H400.721C400.78 203.095 400.88 202.942 401.021 202.838C401.162 202.733 401.324 202.68 401.507 202.68C401.552 202.68 401.601 202.683 401.654 202.689C401.706 202.695 401.753 202.702 401.792 202.712V203.518C401.75 203.505 401.691 203.494 401.616 203.484C401.54 203.474 401.471 203.469 401.409 203.469C401.275 203.469 401.156 203.498 401.051 203.556C400.947 203.613 400.865 203.692 400.804 203.795C400.744 203.897 400.714 204.015 400.714 204.148V206H399.807ZM403.169 204.108V206H402.262V202.727H403.127V203.305H403.165C403.237 203.114 403.359 202.964 403.529 202.853C403.7 202.741 403.907 202.685 404.149 202.685C404.377 202.685 404.575 202.734 404.744 202.834C404.913 202.933 405.044 203.075 405.138 203.26C405.232 203.443 405.279 203.662 405.279 203.916V206H404.371V204.078C404.372 203.878 404.321 203.722 404.218 203.609C404.114 203.496 403.971 203.439 403.789 203.439C403.667 203.439 403.559 203.465 403.465 203.518C403.373 203.57 403.301 203.647 403.248 203.748C403.197 203.847 403.171 203.967 403.169 204.108ZM381.994 213V208.636H384.934V209.397H382.916V210.437H384.783V211.197H382.916V212.239H384.942V213H381.994ZM387.749 211.607V209.727H388.657V213H387.785V212.406H387.751C387.677 212.597 387.554 212.751 387.383 212.868C387.212 212.984 387.004 213.043 386.758 213.043C386.54 213.043 386.347 212.993 386.181 212.893C386.015 212.794 385.885 212.653 385.791 212.469C385.699 212.286 385.652 212.067 385.65 211.811V209.727H386.558V211.649C386.559 211.842 386.611 211.995 386.714 212.107C386.816 212.219 386.953 212.276 387.125 212.276C387.234 212.276 387.336 212.251 387.432 212.201C387.527 212.15 387.603 212.075 387.662 211.975C387.721 211.876 387.75 211.753 387.749 211.607ZM389.383 213V209.727H390.263V210.298H390.297C390.356 210.095 390.457 209.942 390.597 209.838C390.738 209.733 390.9 209.68 391.083 209.68C391.128 209.68 391.177 209.683 391.23 209.689C391.283 209.695 391.329 209.702 391.369 209.712V210.518C391.326 210.505 391.267 210.494 391.192 210.484C391.116 210.474 391.047 210.469 390.985 210.469C390.851 210.469 390.732 210.498 390.627 210.556C390.523 210.613 390.441 210.692 390.38 210.795C390.32 210.897 390.29 211.015 390.29 211.148V213H389.383ZM393.164 213.064C392.833 213.064 392.547 212.994 392.305 212.853C392.065 212.711 391.88 212.513 391.749 212.261C391.619 212.006 391.553 211.712 391.553 211.376C391.553 211.038 391.619 210.743 391.749 210.49C391.88 210.236 392.065 210.038 392.305 209.898C392.547 209.756 392.833 209.685 393.164 209.685C393.495 209.685 393.781 209.756 394.021 209.898C394.262 210.038 394.448 210.236 394.579 210.49C394.71 210.743 394.775 211.038 394.775 211.376C394.775 211.712 394.71 212.006 394.579 212.261C394.448 212.513 394.262 212.711 394.021 212.853C393.781 212.994 393.495 213.064 393.164 213.064ZM393.168 212.361C393.319 212.361 393.445 212.318 393.546 212.233C393.646 212.146 393.722 212.028 393.774 211.879C393.826 211.73 393.852 211.56 393.852 211.37C393.852 211.18 393.826 211.01 393.774 210.861C393.722 210.712 393.646 210.594 393.546 210.507C393.445 210.42 393.319 210.377 393.168 210.377C393.016 210.377 392.889 210.42 392.785 210.507C392.683 210.594 392.605 210.712 392.553 210.861C392.502 211.01 392.476 211.18 392.476 211.37C392.476 211.56 392.502 211.73 392.553 211.879C392.605 212.028 392.683 212.146 392.785 212.233C392.889 212.318 393.016 212.361 393.168 212.361ZM395.365 214.227V209.727H396.26V210.277H396.301C396.34 210.189 396.398 210.099 396.473 210.009C396.55 209.916 396.649 209.839 396.771 209.778C396.895 209.716 397.048 209.685 397.232 209.685C397.47 209.685 397.69 209.747 397.892 209.872C398.094 209.996 398.255 210.183 398.376 210.433C398.497 210.681 398.557 210.993 398.557 211.368C398.557 211.733 398.498 212.041 398.38 212.293C398.264 212.543 398.104 212.732 397.903 212.862C397.703 212.989 397.478 213.053 397.229 213.053C397.053 213.053 396.903 213.024 396.78 212.966C396.658 212.908 396.558 212.835 396.479 212.746C396.401 212.657 396.342 212.567 396.301 212.476H396.273V214.227H395.365ZM396.254 211.364C396.254 211.558 396.281 211.728 396.335 211.873C396.389 212.018 396.467 212.131 396.569 212.212C396.671 212.291 396.796 212.331 396.942 212.331C397.09 212.331 397.215 212.29 397.317 212.21C397.419 212.127 397.497 212.013 397.549 211.869C397.603 211.722 397.63 211.554 397.63 211.364C397.63 211.175 397.604 211.009 397.551 210.865C397.499 210.722 397.421 210.609 397.319 210.528C397.217 210.447 397.091 210.407 396.942 210.407C396.794 210.407 396.669 210.446 396.567 210.524C396.466 210.602 396.389 210.713 396.335 210.857C396.281 211 396.254 211.169 396.254 211.364ZM400.653 213.064C400.317 213.064 400.027 212.996 399.784 212.859C399.543 212.722 399.357 212.527 399.226 212.276C399.095 212.023 399.03 211.724 399.03 211.379C399.03 211.042 399.095 210.746 399.226 210.492C399.357 210.238 399.541 210.04 399.778 209.898C400.016 209.756 400.296 209.685 400.617 209.685C400.833 209.685 401.034 209.719 401.22 209.789C401.408 209.857 401.571 209.96 401.71 210.098C401.851 210.236 401.96 210.409 402.038 210.618C402.117 210.825 402.156 211.068 402.156 211.347V211.596H399.392V211.033H401.301C401.301 210.903 401.273 210.787 401.216 210.686C401.159 210.585 401.08 210.506 400.979 210.45C400.88 210.391 400.764 210.362 400.632 210.362C400.494 210.362 400.372 210.394 400.266 210.458C400.161 210.521 400.078 210.605 400.019 210.712C399.959 210.817 399.928 210.934 399.927 211.063V211.598C399.927 211.76 399.957 211.9 400.016 212.018C400.078 212.136 400.163 212.227 400.274 212.29C400.385 212.354 400.516 212.386 400.668 212.386C400.769 212.386 400.862 212.372 400.945 212.344C401.029 212.315 401.101 212.273 401.161 212.216C401.22 212.159 401.266 212.089 401.297 212.007L402.136 212.062C402.094 212.264 402.006 212.44 401.874 212.591C401.744 212.74 401.575 212.857 401.367 212.94C401.161 213.023 400.923 213.064 400.653 213.064Z"
                  fill="black"
                ></path>
                <g id="Army_7">
                  <circle
                    id="armycircle_7"
                    cx="391"
                    cy="221"
                    r="5.5"
                    fill={getCircleFill("south-eu")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("south-eu")}
                  ></circle>
                  {getArmyNum("south-eu", "391", "221")}
                </g>
              </g>
            </g>
            <g id="west-eu">
              <path
                id="western_europe"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M351.005 202.245C349.856 202.069 349.856 202.687 349.68 203.041C349.503 203.395 348.796 204.367 348.177 204.986C347.558 205.604 347.647 206.311 348 207.195C348.354 208.079 348.354 208.875 348.354 210.377C348.354 211.88 347.293 211.703 347.293 211.703C347.293 211.703 346.409 212.675 346.232 213.029C346.056 213.382 347.116 214.266 347.116 214.266C347.116 214.266 348.973 215.504 349.326 215.946C349.68 216.388 349.414 217.802 349.238 218.509C349.061 219.216 348.177 219.923 347.47 220.1C346.763 220.277 347.47 222.044 349.061 223.459C350.652 224.873 349.642 225.194 349.642 225.194C349.642 225.194 348.728 225.349 348.228 225.724C347.728 226.099 348.103 226.099 347.603 226.724C347.103 227.349 347.228 227.474 346.353 227.724C345.478 227.974 346.228 228.474 345.353 228.349C344.478 228.224 344.603 228.599 344.103 228.099C343.603 227.599 343.978 226.974 343.103 226.974C342.228 226.974 341.853 227.099 342.228 226.349C342.603 225.599 343.103 225.599 342.103 225.599C341.103 225.599 341.228 225.849 339.978 225.599C338.728 225.349 338.228 225.474 337.728 225.474L336.353 227.974C336.353 227.974 336.478 228.474 336.353 229.099C336.228 229.724 335.728 230.224 335.728 230.224C335.728 230.224 335.353 230.599 335.353 231.349C335.353 232.099 335.603 232.224 334.853 232.974C334.103 233.724 334.103 233.974 333.603 234.224C333.103 234.474 333.103 234.349 332.728 234.849C332.353 235.349 332.103 235.349 331.853 235.974C331.603 236.599 331.603 236.599 331.978 237.224C332.353 237.849 332.603 238.599 332.603 238.599C332.603 238.599 332.978 238.724 332.728 239.849C332.478 240.974 332.353 241.724 332.353 241.724C332.353 241.724 332.353 242.224 332.478 243.224C332.603 244.224 333.478 245.349 333.478 245.349L334.103 246.224C334.103 246.224 334.478 247.724 334.603 248.474C334.728 249.224 335.853 248.974 334.728 249.974C333.603 250.974 331.978 251.599 330.853 253.474C329.728 255.349 330.103 256.849 329.228 257.849C328.353 258.849 329.103 258.974 327.978 258.974C326.853 258.974 325.853 257.724 325.228 258.974C324.603 260.224 324.228 261.349 323.353 261.474C322.478 261.599 322.353 260.099 322.353 261.849C322.353 263.599 321.978 264.724 321.978 264.724C321.978 264.724 321.728 265.599 320.853 265.474C319.978 265.349 319.853 265.224 319.103 265.099C318.353 264.974 318.353 265.474 317.728 264.724C317.103 263.974 316.978 263.599 316.728 262.974C316.478 262.349 316.478 262.099 315.478 261.974C314.478 261.849 314.478 262.224 313.978 261.349C313.478 260.474 313.228 260.224 312.478 260.349C311.728 260.474 311.728 260.974 310.728 259.974C309.728 258.974 309.728 258.224 309.228 258.349C308.728 258.474 308.103 259.349 308.103 259.349C308.103 259.349 308.228 259.849 306.728 259.724C305.228 259.599 304.978 259.349 303.853 259.349C302.728 259.349 302.603 260.099 301.603 259.599C300.603 259.099 300.478 258.974 300.478 258.349C300.478 257.724 300.603 256.849 300.103 256.349C299.603 255.849 300.228 255.224 299.478 254.849C298.728 254.474 299.103 254.599 298.228 254.599C297.353 254.599 297.353 254.724 296.478 254.224C295.603 253.724 295.228 254.474 295.603 253.099C295.978 251.724 295.728 251.849 296.353 250.849C296.978 249.849 296.978 249.849 297.353 248.724C297.728 247.599 297.853 247.349 298.478 245.724C299.103 244.099 299.353 244.599 299.353 243.349C299.353 242.099 298.853 242.099 299.603 241.224C300.353 240.349 300.478 240.349 300.353 239.349C300.228 238.349 300.603 238.599 300.103 237.849C299.603 237.099 298.353 235.974 297.853 235.474C297.353 234.974 297.478 235.599 297.228 234.099C296.978 232.599 296.478 232.849 296.228 231.974C295.978 231.099 295.978 231.099 295.978 229.974C295.978 228.849 295.103 229.224 295.103 228.599C295.103 227.974 294.728 227.474 295.603 226.974C296.478 226.474 296.603 226.849 297.728 225.849C298.853 224.849 298.853 225.099 299.103 224.224C299.353 223.349 300.228 222.849 300.228 222.849C300.228 222.849 300.103 222.974 300.853 223.724C301.603 224.474 301.728 224.474 301.853 224.974C301.978 225.474 301.478 225.599 302.978 225.974C304.478 226.349 304.103 226.474 305.603 226.474C307.103 226.474 307.478 226.599 308.103 226.349C308.728 226.099 309.353 225.724 309.353 225.724C309.353 225.724 309.853 225.349 310.728 225.349C311.603 225.349 311.728 225.224 312.478 225.474C313.228 225.724 312.603 225.849 313.353 225.724C314.103 225.599 314.228 225.849 314.853 225.474C315.478 225.099 315.853 225.724 316.228 224.599C316.603 223.474 316.228 223.099 317.228 222.349C318.228 221.599 318.603 221.349 319.603 221.349C320.603 221.349 318.978 219.724 318.353 219.599C317.728 219.474 317.353 220.099 317.353 219.474C317.353 218.849 317.228 218.724 317.603 217.724C317.978 216.724 318.728 216.099 318.728 216.099C318.728 216.099 318.603 215.599 318.478 214.724C318.353 213.849 320.103 213.349 318.978 212.599C317.853 211.849 317.353 211.474 316.603 211.474C315.853 211.474 315.978 212.724 315.353 211.224C314.728 209.724 315.228 209.474 314.603 208.724C313.978 207.974 313.728 208.224 313.103 207.349C312.478 206.474 313.353 206.599 311.978 205.599C310.603 204.599 309.728 204.349 309.103 204.349C308.478 204.349 308.228 205.224 308.353 203.974C308.478 202.724 308.478 202.349 309.353 201.599C310.228 200.849 312.478 200.224 313.353 200.099C314.228 199.974 312.853 199.599 314.728 199.974C316.603 200.349 315.978 200.349 316.853 200.474C317.728 200.599 319.353 201.099 319.353 201.099C319.353 201.099 319.603 199.224 320.103 198.599C320.603 197.974 320.728 197.974 321.103 196.974C321.478 195.974 321.603 195.849 322.853 195.474C324.103 195.099 324.978 196.099 324.978 196.099C324.978 196.099 323.353 197.724 324.603 197.099C325.853 196.474 324.228 194.474 326.978 194.849C329.728 195.224 330.728 196.849 331.103 194.974C331.478 193.099 331.103 193.099 331.728 192.099C332.353 191.099 332.353 191.099 333.478 190.474C334.603 189.849 334.353 187.974 335.728 187.724C337.103 187.474 336.603 187.724 337.853 187.474C339.103 187.224 338.978 187.474 339.728 186.599C339.728 186.599 340.915 186.912 340.853 187.349C340.79 187.787 341.853 190.537 341.853 190.537C341.853 190.537 343.165 191.349 344.04 192.599C344.915 193.849 345.353 194.974 345.79 195.099C346.228 195.224 346.478 195.224 346.603 196.037C346.728 196.849 346.79 196.974 347.165 197.474C347.54 197.974 348.103 197.912 348.228 198.662C348.353 199.412 348.54 200.224 348.853 200.599C349.165 200.974 350.103 201.662 350.103 201.662C350.103 201.662 350.915 202.412 351.005 202.245Z"
                className={getCountryClass("west-eu")}
                fill={getFill("west-eu")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_8">
                <path
                  id="Western Europe"
                  d="M309.916 228L308.668 223.636H309.675L310.398 226.668H310.434L311.231 223.636H312.094L312.888 226.675H312.927L313.649 223.636H314.657L313.408 228H312.509L311.678 225.147H311.644L310.815 228H309.916ZM316.274 228.064C315.937 228.064 315.647 227.996 315.404 227.859C315.163 227.722 314.977 227.527 314.846 227.276C314.715 227.023 314.65 226.724 314.65 226.379C314.65 226.042 314.715 225.746 314.846 225.492C314.977 225.238 315.161 225.04 315.398 224.898C315.637 224.756 315.916 224.685 316.237 224.685C316.453 224.685 316.654 224.719 316.84 224.789C317.028 224.857 317.191 224.96 317.33 225.098C317.471 225.236 317.58 225.409 317.659 225.618C317.737 225.825 317.776 226.068 317.776 226.347V226.596H315.012V226.033H316.921C316.921 225.903 316.893 225.787 316.836 225.686C316.779 225.585 316.7 225.506 316.6 225.45C316.5 225.391 316.384 225.362 316.252 225.362C316.115 225.362 315.992 225.394 315.886 225.458C315.781 225.521 315.698 225.605 315.639 225.712C315.579 225.817 315.548 225.934 315.547 226.063V226.598C315.547 226.76 315.577 226.9 315.637 227.018C315.698 227.136 315.784 227.227 315.894 227.29C316.005 227.354 316.137 227.386 316.289 227.386C316.389 227.386 316.482 227.372 316.566 227.344C316.649 227.315 316.721 227.273 316.781 227.216C316.84 227.159 316.886 227.089 316.917 227.007L317.757 227.062C317.714 227.264 317.627 227.44 317.494 227.591C317.364 227.74 317.195 227.857 316.987 227.94C316.781 228.023 316.544 228.064 316.274 228.064ZM321.091 225.661L320.26 225.712C320.246 225.641 320.215 225.577 320.169 225.52C320.122 225.462 320.06 225.415 319.983 225.381C319.908 225.346 319.818 225.328 319.713 225.328C319.572 225.328 319.453 225.358 319.357 225.418C319.26 225.476 319.212 225.554 319.212 225.652C319.212 225.73 319.243 225.796 319.306 225.85C319.368 225.904 319.475 225.947 319.627 225.98L320.22 226.099C320.538 226.165 320.775 226.27 320.931 226.415C321.088 226.56 321.166 226.75 321.166 226.986C321.166 227.2 321.102 227.388 320.976 227.55C320.851 227.712 320.679 227.839 320.46 227.93C320.243 228.019 319.992 228.064 319.708 228.064C319.275 228.064 318.93 227.974 318.673 227.793C318.417 227.612 318.267 227.364 318.223 227.052L319.116 227.005C319.143 227.137 319.208 227.238 319.312 227.308C319.416 227.376 319.548 227.41 319.71 227.41C319.869 227.41 319.997 227.379 320.094 227.318C320.192 227.256 320.242 227.175 320.243 227.077C320.242 226.995 320.207 226.928 320.139 226.875C320.07 226.821 319.965 226.78 319.823 226.751L319.257 226.638C318.937 226.575 318.699 226.464 318.543 226.306C318.388 226.148 318.311 225.947 318.311 225.703C318.311 225.493 318.367 225.312 318.481 225.16C318.596 225.008 318.757 224.891 318.965 224.808C319.173 224.726 319.418 224.685 319.698 224.685C320.111 224.685 320.436 224.772 320.673 224.947C320.912 225.121 321.051 225.359 321.091 225.661ZM323.478 224.727V225.409H321.507V224.727H323.478ZM321.955 223.943H322.862V226.994C322.862 227.078 322.875 227.143 322.901 227.19C322.926 227.236 322.962 227.268 323.007 227.286C323.054 227.305 323.108 227.314 323.169 227.314C323.212 227.314 323.254 227.31 323.297 227.303C323.339 227.295 323.372 227.288 323.395 227.284L323.538 227.96C323.492 227.974 323.428 227.99 323.346 228.009C323.263 228.028 323.163 228.04 323.045 228.045C322.827 228.053 322.635 228.024 322.47 227.957C322.307 227.891 322.18 227.787 322.089 227.646C321.998 227.506 321.953 227.328 321.955 227.114V223.943ZM325.526 228.064C325.189 228.064 324.899 227.996 324.656 227.859C324.415 227.722 324.229 227.527 324.098 227.276C323.967 227.023 323.902 226.724 323.902 226.379C323.902 226.042 323.967 225.746 324.098 225.492C324.229 225.238 324.413 225.04 324.65 224.898C324.888 224.756 325.168 224.685 325.489 224.685C325.705 224.685 325.906 224.719 326.092 224.789C326.28 224.857 326.443 224.96 326.582 225.098C326.723 225.236 326.832 225.409 326.911 225.618C326.989 225.825 327.028 226.068 327.028 226.347V226.596H324.264V226.033H326.173C326.173 225.903 326.145 225.787 326.088 225.686C326.031 225.585 325.952 225.506 325.852 225.45C325.752 225.391 325.636 225.362 325.504 225.362C325.366 225.362 325.244 225.394 325.138 225.458C325.033 225.521 324.95 225.605 324.891 225.712C324.831 225.817 324.8 225.934 324.799 226.063V226.598C324.799 226.76 324.829 226.9 324.888 227.018C324.95 227.136 325.036 227.227 325.146 227.29C325.257 227.354 325.388 227.386 325.54 227.386C325.641 227.386 325.734 227.372 325.817 227.344C325.901 227.315 325.973 227.273 326.033 227.216C326.092 227.159 326.138 227.089 326.169 227.007L327.009 227.062C326.966 227.264 326.879 227.44 326.746 227.591C326.616 227.74 326.447 227.857 326.239 227.94C326.033 228.023 325.795 228.064 325.526 228.064ZM327.62 228V224.727H328.5V225.298H328.534C328.594 225.095 328.694 224.942 328.835 224.838C328.975 224.733 329.137 224.68 329.32 224.68C329.366 224.68 329.415 224.683 329.467 224.689C329.52 224.695 329.566 224.702 329.606 224.712V225.518C329.563 225.505 329.504 225.494 329.429 225.484C329.354 225.474 329.285 225.469 329.222 225.469C329.089 225.469 328.969 225.498 328.864 225.556C328.761 225.613 328.678 225.692 328.617 225.795C328.558 225.897 328.528 226.015 328.528 226.148V228H327.62ZM330.983 226.108V228H330.075V224.727H330.94V225.305H330.979C331.051 225.114 331.172 224.964 331.343 224.853C331.513 224.741 331.72 224.685 331.963 224.685C332.19 224.685 332.388 224.734 332.557 224.834C332.726 224.933 332.858 225.075 332.952 225.26C333.045 225.443 333.092 225.662 333.092 225.916V228H332.184V226.078C332.186 225.878 332.135 225.722 332.031 225.609C331.927 225.496 331.785 225.439 331.603 225.439C331.481 225.439 331.373 225.465 331.279 225.518C331.187 225.57 331.114 225.647 331.062 225.748C331.01 225.847 330.984 225.967 330.983 226.108ZM310.994 235V230.636H313.934V231.397H311.916V232.437H313.783V233.197H311.916V234.239H313.942V235H310.994ZM316.749 233.607V231.727H317.657V235H316.785V234.406H316.751C316.677 234.597 316.554 234.751 316.383 234.868C316.212 234.984 316.004 235.043 315.758 235.043C315.54 235.043 315.347 234.993 315.181 234.893C315.015 234.794 314.885 234.653 314.791 234.469C314.699 234.286 314.652 234.067 314.65 233.811V231.727H315.558V233.649C315.559 233.842 315.611 233.995 315.714 234.107C315.816 234.219 315.953 234.276 316.125 234.276C316.234 234.276 316.336 234.251 316.432 234.201C316.527 234.15 316.603 234.075 316.662 233.975C316.721 233.876 316.75 233.753 316.749 233.607ZM318.383 235V231.727H319.263V232.298H319.297C319.356 232.095 319.457 231.942 319.597 231.838C319.738 231.733 319.9 231.68 320.083 231.68C320.128 231.68 320.177 231.683 320.23 231.689C320.283 231.695 320.329 231.702 320.369 231.712V232.518C320.326 232.505 320.267 232.494 320.192 232.484C320.116 232.474 320.047 232.469 319.985 232.469C319.851 232.469 319.732 232.498 319.627 232.556C319.523 232.613 319.441 232.692 319.38 232.795C319.32 232.897 319.29 233.015 319.29 233.148V235H318.383ZM322.164 235.064C321.833 235.064 321.547 234.994 321.305 234.853C321.065 234.711 320.88 234.513 320.749 234.261C320.619 234.006 320.553 233.712 320.553 233.376C320.553 233.038 320.619 232.743 320.749 232.49C320.88 232.236 321.065 232.038 321.305 231.898C321.547 231.756 321.833 231.685 322.164 231.685C322.495 231.685 322.781 231.756 323.021 231.898C323.262 232.038 323.448 232.236 323.579 232.49C323.71 232.743 323.775 233.038 323.775 233.376C323.775 233.712 323.71 234.006 323.579 234.261C323.448 234.513 323.262 234.711 323.021 234.853C322.781 234.994 322.495 235.064 322.164 235.064ZM322.168 234.361C322.319 234.361 322.445 234.318 322.546 234.233C322.646 234.146 322.722 234.028 322.774 233.879C322.826 233.73 322.852 233.56 322.852 233.37C322.852 233.18 322.826 233.01 322.774 232.861C322.722 232.712 322.646 232.594 322.546 232.507C322.445 232.42 322.319 232.377 322.168 232.377C322.016 232.377 321.889 232.42 321.785 232.507C321.683 232.594 321.605 232.712 321.553 232.861C321.502 233.01 321.476 233.18 321.476 233.37C321.476 233.56 321.502 233.73 321.553 233.879C321.605 234.028 321.683 234.146 321.785 234.233C321.889 234.318 322.016 234.361 322.168 234.361ZM324.365 236.227V231.727H325.26V232.277H325.301C325.34 232.189 325.398 232.099 325.473 232.009C325.55 231.916 325.649 231.839 325.771 231.778C325.895 231.716 326.048 231.685 326.232 231.685C326.47 231.685 326.69 231.747 326.892 231.872C327.094 231.996 327.255 232.183 327.376 232.433C327.497 232.681 327.557 232.993 327.557 233.368C327.557 233.733 327.498 234.041 327.38 234.293C327.264 234.543 327.104 234.732 326.903 234.862C326.703 234.989 326.478 235.053 326.229 235.053C326.053 235.053 325.903 235.024 325.78 234.966C325.658 234.908 325.558 234.835 325.479 234.746C325.401 234.657 325.342 234.567 325.301 234.476H325.273V236.227H324.365ZM325.254 233.364C325.254 233.558 325.281 233.728 325.335 233.873C325.389 234.018 325.467 234.131 325.569 234.212C325.671 234.291 325.796 234.331 325.942 234.331C326.09 234.331 326.215 234.29 326.317 234.21C326.419 234.127 326.497 234.013 326.549 233.869C326.603 233.722 326.63 233.554 326.63 233.364C326.63 233.175 326.604 233.009 326.551 232.865C326.499 232.722 326.421 232.609 326.319 232.528C326.217 232.447 326.091 232.407 325.942 232.407C325.794 232.407 325.669 232.446 325.567 232.524C325.466 232.602 325.389 232.713 325.335 232.857C325.281 233 325.254 233.169 325.254 233.364ZM329.653 235.064C329.317 235.064 329.027 234.996 328.784 234.859C328.543 234.722 328.357 234.527 328.226 234.276C328.095 234.023 328.03 233.724 328.03 233.379C328.03 233.042 328.095 232.746 328.226 232.492C328.357 232.238 328.541 232.04 328.778 231.898C329.016 231.756 329.296 231.685 329.617 231.685C329.833 231.685 330.034 231.719 330.22 231.789C330.408 231.857 330.571 231.96 330.71 232.098C330.851 232.236 330.96 232.409 331.038 232.618C331.117 232.825 331.156 233.068 331.156 233.347V233.596H328.392V233.033H330.301C330.301 232.903 330.273 232.787 330.216 232.686C330.159 232.585 330.08 232.506 329.979 232.45C329.88 232.391 329.764 232.362 329.632 232.362C329.494 232.362 329.372 232.394 329.266 232.458C329.161 232.521 329.078 232.605 329.019 232.712C328.959 232.817 328.928 232.934 328.927 233.063V233.598C328.927 233.76 328.957 233.9 329.016 234.018C329.078 234.136 329.163 234.227 329.274 234.29C329.385 234.354 329.516 234.386 329.668 234.386C329.769 234.386 329.862 234.372 329.945 234.344C330.029 234.315 330.101 234.273 330.161 234.216C330.22 234.159 330.266 234.089 330.297 234.007L331.136 234.062C331.094 234.264 331.006 234.44 330.874 234.591C330.744 234.74 330.575 234.857 330.367 234.94C330.161 235.023 329.923 235.064 329.653 235.064Z"
                  fill="black"
                ></path>
                <g id="Army_8">
                  <circle
                    id="armycircle_8"
                    cx="321"
                    cy="242"
                    r="5.5"
                    fill={getCircleFill("west-eu")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("west-eu")}
                  ></circle>
                  {getArmyNum("west-eu", "321", "242")}
                </g>
              </g>
            </g>
            <g id="north-af">
              <path
                id="north_africa"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M374.228 270.224C373.353 269.224 373.228 268.849 372.853 268.099C372.478 267.349 372.228 265.974 370.978 265.849C369.728 265.724 369.853 266.974 369.478 265.099C369.103 263.224 368.728 261.724 368.228 261.349C367.728 260.974 366.853 260.599 365.728 259.474C364.603 258.349 364.478 257.224 364.478 257.224L362.353 255.849C362.353 255.849 356.853 256.099 356.228 256.099C355.603 256.099 354.478 256.224 353.728 256.724C352.978 257.224 353.353 257.474 351.978 258.099C350.603 258.724 348.353 259.849 347.728 260.099C347.103 260.349 344.228 260.474 344.228 260.474C344.228 260.474 344.228 261.474 343.103 262.224C341.978 262.974 340.478 263.849 339.228 263.724C337.978 263.599 337.834 263.156 336.853 263.349C335.005 263.714 333.794 264.932 333.103 264.849C332.47 264.774 331.353 265.224 330.228 265.599C329.103 265.974 330.353 266.099 327.978 266.099C325.603 266.099 324.353 266.099 323.603 265.974C322.853 265.849 322.228 266.224 321.603 266.349C320.978 266.474 320.103 266.599 320.335 266.769C318.92 266.769 318.213 267.83 318.213 267.83L318.567 272.426L315.385 275.961C315.385 275.961 314.678 278.79 313.971 280.911C313.264 283.032 312.203 285.154 312.203 285.154L310.789 289.043C310.789 289.043 309.228 289.849 309.353 290.474C309.478 291.099 309.728 292.349 309.228 292.724C308.728 293.099 308.103 292.724 307.478 293.974C306.853 295.224 306.353 296.349 306.353 296.849C306.353 297.349 306.978 297.849 306.103 298.849C305.228 299.849 304.353 299.974 304.103 302.099C303.853 304.224 302.853 306.099 303.853 307.349C304.853 308.599 305.478 309.599 305.478 310.974C305.478 312.349 305.103 312.224 305.228 314.224C305.353 316.224 305.603 316.099 305.603 317.474C305.603 318.849 305.478 320.724 305.228 322.349C304.978 323.974 304.478 324.474 304.103 326.349C303.728 328.224 301.478 328.974 303.228 330.599C304.978 332.224 304.728 333.724 305.228 335.099C305.728 336.474 310.228 336.099 310.228 338.974C310.228 341.849 313.603 342.224 313.853 343.724C314.103 345.224 313.228 347.349 316.228 348.599C319.228 349.849 318.978 351.724 319.603 352.224C320.228 352.724 322.978 353.099 323.603 353.849C324.228 354.599 325.103 355.849 325.728 356.474C326.353 357.099 326.978 358.099 329.103 357.974C331.228 357.849 331.478 357.974 334.853 357.599C338.228 357.224 340.603 357.099 341.478 356.974C342.353 356.849 344.228 357.474 345.603 356.849C346.978 356.224 346.728 355.099 348.478 354.724C350.228 354.349 350.853 354.724 351.978 354.474C353.103 354.224 357.478 354.224 358.103 354.724C358.728 355.224 359.478 354.724 360.228 356.349C360.978 357.974 358.728 360.474 363.478 360.224C368.228 359.974 370.978 359.224 371.603 360.349C372.228 361.474 370.103 363.099 370.478 364.599C370.853 366.099 371.353 366.474 370.853 367.224L371.423 367.532C371.953 368.592 371.953 369.123 372.661 369.476C373.368 369.83 375.312 368.239 375.312 368.239C375.312 368.239 376.903 368.239 378.494 368.592C380.085 368.946 380.262 368.239 381.853 367.885C383.444 367.532 383.798 369.123 383.798 369.123C383.798 369.123 385.035 370.007 386.449 369.123C387.863 368.239 387.51 367.885 386.979 366.471C386.449 365.057 387.333 364.703 387.687 360.814C388.04 356.925 386.449 358.87 386.449 358.87C386.449 358.87 385.919 357.632 386.096 355.157C386.272 352.682 386.979 354.45 387.51 353.39C388.04 352.329 388.747 352.329 389.631 351.622C390.515 350.915 391.752 350.915 392.636 350.384C393.52 349.854 394.051 348.793 395.465 348.263C396.879 347.733 398.293 347.026 400.591 345.965C402.889 344.904 402.359 343.844 402.359 342.96C402.359 342.076 404.657 339.601 404.657 339.601C404.657 339.601 404.127 337.48 403.243 336.242C402.359 335.005 402.889 333.591 402.889 332.707C402.889 331.823 403.243 331.292 403.773 330.585C404.304 329.878 403.95 329.525 403.95 329.525L404.834 327.757C404.834 327.757 405.364 326.343 405.364 325.105C405.364 323.868 404.657 324.398 403.95 324.221C403.243 324.045 403.773 323.868 404.834 323.338C405.895 322.807 405.541 321.57 405.718 320.509C405.895 319.448 405.364 315.029 405.187 314.145C405.011 313.261 401.298 314.322 400.415 313.968C399.531 313.615 399 312.908 399 312.908C399 312.908 398.293 310.786 398.116 309.726C397.94 308.665 395.465 309.902 394.581 309.726C393.697 309.549 394.404 308.312 394.051 307.074C393.697 305.837 392.283 306.367 391.399 306.367C390.515 306.367 389.101 305.66 387.863 304.776C386.626 303.892 386.272 305.13 384.858 305.306C383.444 305.483 383.444 305.13 382.914 304.246C382.383 303.362 380.616 304.776 379.025 304.599C377.434 304.422 377.787 303.715 376.903 302.301C376.019 300.887 375.135 301.948 373.191 301.417C371.246 300.887 371.953 300.71 371.777 299.296C371.6 297.882 370.362 298.058 370.362 298.058C370.362 298.058 370.186 296.467 370.009 295.23C369.832 293.993 370.186 292.048 370.186 291.341C370.186 290.634 369.832 287.982 368.595 287.452C367.357 286.922 368.241 285.684 368.241 285.684C368.241 285.684 367.711 283.916 367.888 283.032C368.064 282.149 369.302 281.088 370.186 281.088C371.07 281.088 371.6 280.027 371.6 280.027C371.6 280.027 370.186 277.906 369.479 276.668C368.772 275.431 370.716 275.608 370.716 275.608L371.6 274.547C371.6 274.547 371.953 274.017 373.544 273.133C375.135 272.249 374.228 270.224 374.228 270.224Z"
                className={getCountryClass("north-af")}
                fill={getFill("north-af")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_9">
                <path
                  id="North africa"
                  d="M336.463 304.636V309H335.666L333.767 306.254H333.735V309H332.813V304.636H333.623L335.506 307.381H335.544V304.636H336.463ZM338.687 309.064C338.356 309.064 338.069 308.994 337.828 308.853C337.588 308.711 337.403 308.513 337.272 308.261C337.141 308.006 337.076 307.712 337.076 307.376C337.076 307.038 337.141 306.743 337.272 306.49C337.403 306.236 337.588 306.038 337.828 305.898C338.069 305.756 338.356 305.685 338.687 305.685C339.018 305.685 339.303 305.756 339.543 305.898C339.785 306.038 339.971 306.236 340.101 306.49C340.232 306.743 340.297 307.038 340.297 307.376C340.297 307.712 340.232 308.006 340.101 308.261C339.971 308.513 339.785 308.711 339.543 308.853C339.303 308.994 339.018 309.064 338.687 309.064ZM338.691 308.361C338.841 308.361 338.967 308.318 339.068 308.233C339.169 308.146 339.245 308.028 339.296 307.879C339.349 307.73 339.375 307.56 339.375 307.37C339.375 307.18 339.349 307.01 339.296 306.861C339.245 306.712 339.169 306.594 339.068 306.507C338.967 306.42 338.841 306.377 338.691 306.377C338.539 306.377 338.411 306.42 338.307 306.507C338.205 306.594 338.128 306.712 338.075 306.861C338.024 307.01 337.998 307.18 337.998 307.37C337.998 307.56 338.024 307.73 338.075 307.879C338.128 308.028 338.205 308.146 338.307 308.233C338.411 308.318 338.539 308.361 338.691 308.361ZM340.888 309V305.727H341.768V306.298H341.802C341.861 306.095 341.961 305.942 342.102 305.838C342.243 305.733 342.405 305.68 342.588 305.68C342.633 305.68 342.682 305.683 342.735 305.689C342.787 305.695 342.834 305.702 342.873 305.712V306.518C342.831 306.505 342.772 306.494 342.697 306.484C342.621 306.474 342.552 306.469 342.49 306.469C342.356 306.469 342.237 306.498 342.132 306.556C342.028 306.613 341.946 306.692 341.885 306.795C341.825 306.897 341.795 307.015 341.795 307.148V309H340.888ZM345.248 305.727V306.409H343.277V305.727H345.248ZM343.724 304.943H344.632V307.994C344.632 308.078 344.645 308.143 344.67 308.19C344.696 308.236 344.731 308.268 344.777 308.286C344.824 308.305 344.877 308.314 344.939 308.314C344.981 308.314 345.024 308.31 345.066 308.303C345.109 308.295 345.142 308.288 345.164 308.284L345.307 308.96C345.262 308.974 345.198 308.99 345.115 309.009C345.033 309.028 344.933 309.04 344.815 309.045C344.596 309.053 344.404 309.024 344.24 308.957C344.076 308.891 343.949 308.787 343.858 308.646C343.767 308.506 343.723 308.328 343.724 308.114V304.943ZM346.817 307.108V309H345.909V304.636H346.791V306.305H346.83C346.903 306.112 347.023 305.96 347.188 305.851C347.352 305.74 347.559 305.685 347.808 305.685C348.035 305.685 348.233 305.734 348.402 305.834C348.572 305.932 348.705 306.073 348.798 306.258C348.893 306.441 348.94 306.661 348.939 306.916V309H348.031V307.078C348.033 306.876 347.982 306.719 347.878 306.607C347.776 306.495 347.632 306.439 347.447 306.439C347.324 306.439 347.214 306.465 347.119 306.518C347.026 306.57 346.952 306.647 346.898 306.748C346.845 306.847 346.818 306.967 346.817 307.108ZM351.975 309.062C351.766 309.062 351.58 309.026 351.417 308.953C351.254 308.879 351.124 308.771 351.029 308.627C350.935 308.482 350.888 308.302 350.888 308.086C350.888 307.904 350.922 307.751 350.989 307.628C351.055 307.504 351.146 307.405 351.261 307.33C351.376 307.254 351.507 307.197 351.653 307.159C351.801 307.121 351.956 307.094 352.118 307.078C352.308 307.058 352.462 307.04 352.578 307.023C352.695 307.004 352.779 306.977 352.832 306.942C352.884 306.906 352.911 306.854 352.911 306.784V306.771C352.911 306.636 352.868 306.532 352.783 306.458C352.699 306.384 352.58 306.347 352.425 306.347C352.261 306.347 352.131 306.384 352.035 306.456C351.938 306.527 351.874 306.616 351.843 306.724L351.004 306.656C351.046 306.457 351.13 306.286 351.255 306.141C351.38 305.994 351.541 305.882 351.739 305.804C351.938 305.724 352.168 305.685 352.429 305.685C352.611 305.685 352.785 305.706 352.951 305.749C353.119 305.791 353.267 305.857 353.396 305.947C353.527 306.036 353.63 306.151 353.705 306.292C353.781 306.431 353.818 306.598 353.818 306.793V309H352.957V308.546H352.932C352.879 308.648 352.809 308.739 352.721 308.817C352.633 308.893 352.527 308.954 352.403 308.998C352.28 309.04 352.137 309.062 351.975 309.062ZM352.235 308.435C352.369 308.435 352.487 308.409 352.589 308.357C352.691 308.303 352.771 308.23 352.83 308.139C352.888 308.048 352.917 307.945 352.917 307.83V307.483C352.888 307.501 352.849 307.518 352.8 307.534C352.751 307.548 352.697 307.562 352.636 307.575C352.575 307.586 352.513 307.597 352.452 307.607C352.391 307.615 352.336 307.623 352.286 307.63C352.18 307.646 352.087 307.67 352.007 307.705C351.928 307.739 351.866 307.785 351.822 307.843C351.778 307.9 351.756 307.971 351.756 308.056C351.756 308.18 351.8 308.274 351.89 308.339C351.981 308.403 352.096 308.435 352.235 308.435ZM356.282 305.727V306.409H354.262V305.727H356.282ZM354.725 309V305.491C354.725 305.254 354.771 305.057 354.863 304.901C354.957 304.744 355.085 304.627 355.247 304.549C355.409 304.471 355.593 304.432 355.799 304.432C355.938 304.432 356.065 304.442 356.18 304.464C356.297 304.485 356.383 304.504 356.44 304.521L356.278 305.203C356.243 305.192 356.199 305.181 356.146 305.171C356.095 305.161 356.042 305.156 355.988 305.156C355.855 305.156 355.762 305.188 355.709 305.25C355.657 305.311 355.63 305.397 355.63 305.508V309H354.725ZM356.837 309V305.727H357.717V306.298H357.751C357.811 306.095 357.911 305.942 358.051 305.838C358.192 305.733 358.354 305.68 358.537 305.68C358.583 305.68 358.632 305.683 358.684 305.689C358.737 305.695 358.783 305.702 358.823 305.712V306.518C358.78 306.505 358.721 306.494 358.646 306.484C358.57 306.474 358.502 306.469 358.439 306.469C358.306 306.469 358.186 306.498 358.081 306.556C357.977 306.613 357.895 306.692 357.834 306.795C357.774 306.897 357.744 307.015 357.744 307.148V309H356.837ZM359.292 309V305.727H360.2V309H359.292ZM359.748 305.305C359.613 305.305 359.497 305.261 359.401 305.171C359.305 305.08 359.258 304.972 359.258 304.845C359.258 304.72 359.305 304.613 359.401 304.523C359.497 304.433 359.613 304.387 359.748 304.387C359.883 304.387 359.998 304.433 360.093 304.523C360.19 304.613 360.238 304.72 360.238 304.845C360.238 304.972 360.19 305.08 360.093 305.171C359.998 305.261 359.883 305.305 359.748 305.305ZM362.405 309.064C362.07 309.064 361.782 308.993 361.54 308.851C361.3 308.707 361.116 308.509 360.986 308.254C360.858 308 360.795 307.707 360.795 307.376C360.795 307.041 360.859 306.747 360.988 306.494C361.119 306.24 361.305 306.042 361.545 305.9C361.785 305.756 362.07 305.685 362.401 305.685C362.687 305.685 362.937 305.737 363.151 305.84C363.366 305.944 363.535 306.089 363.66 306.277C363.785 306.464 363.854 306.685 363.867 306.938H363.01C362.986 306.774 362.922 306.643 362.819 306.543C362.716 306.442 362.582 306.392 362.416 306.392C362.275 306.392 362.153 306.43 362.047 306.507C361.944 306.582 361.863 306.692 361.805 306.837C361.746 306.982 361.717 307.158 361.717 307.364C361.717 307.572 361.746 307.75 361.802 307.896C361.861 308.043 361.942 308.154 362.047 308.231C362.153 308.308 362.275 308.346 362.416 308.346C362.52 308.346 362.613 308.325 362.695 308.282C362.779 308.239 362.848 308.178 362.902 308.097C362.957 308.014 362.993 307.915 363.01 307.8H363.867C363.853 308.05 363.785 308.271 363.662 308.461C363.542 308.65 363.375 308.798 363.162 308.904C362.949 309.011 362.697 309.064 362.405 309.064ZM365.381 309.062C365.173 309.062 364.987 309.026 364.823 308.953C364.66 308.879 364.531 308.771 364.435 308.627C364.342 308.482 364.295 308.302 364.295 308.086C364.295 307.904 364.328 307.751 364.395 307.628C364.462 307.504 364.553 307.405 364.668 307.33C364.783 307.254 364.913 307.197 365.06 307.159C365.207 307.121 365.362 307.094 365.524 307.078C365.714 307.058 365.868 307.04 365.984 307.023C366.101 307.004 366.185 306.977 366.238 306.942C366.29 306.906 366.317 306.854 366.317 306.784V306.771C366.317 306.636 366.274 306.532 366.189 306.458C366.105 306.384 365.986 306.347 365.831 306.347C365.668 306.347 365.538 306.384 365.441 306.456C365.344 306.527 365.281 306.616 365.249 306.724L364.41 306.656C364.452 306.457 364.536 306.286 364.661 306.141C364.786 305.994 364.947 305.882 365.145 305.804C365.344 305.724 365.574 305.685 365.835 305.685C366.017 305.685 366.191 305.706 366.357 305.749C366.525 305.791 366.673 305.857 366.803 305.947C366.933 306.036 367.036 306.151 367.112 306.292C367.187 306.431 367.224 306.598 367.224 306.793V309H366.364V308.546H366.338C366.286 308.648 366.215 308.739 366.127 308.817C366.039 308.893 365.933 308.954 365.81 308.998C365.686 309.04 365.543 309.062 365.381 309.062ZM365.641 308.435C365.775 308.435 365.893 308.409 365.995 308.357C366.097 308.303 366.178 308.23 366.236 308.139C366.294 308.048 366.323 307.945 366.323 307.83V307.483C366.295 307.501 366.256 307.518 366.206 307.534C366.158 307.548 366.103 307.562 366.042 307.575C365.981 307.586 365.92 307.597 365.859 307.607C365.798 307.615 365.742 307.623 365.692 307.63C365.586 307.646 365.493 307.67 365.413 307.705C365.334 307.739 365.272 307.785 365.228 307.843C365.184 307.9 365.162 307.971 365.162 308.056C365.162 308.18 365.207 308.274 365.296 308.339C365.387 308.403 365.502 308.435 365.641 308.435Z"
                  fill="black"
                ></path>
                <g id="Army_9">
                  <circle
                    id="armycircle_9"
                    cx="350"
                    cy="318"
                    r="5.5"
                    fill={getCircleFill("north-af")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("north-af")}
                  ></circle>
                  {getArmyNum("north-af", "350", "318")}
                </g>
              </g>
            </g>
            <g id="east-af">
              <path
                id="east_africa"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M404.657 339.601C404.657 339.601 404.127 337.48 403.243 336.242C402.359 335.005 402.889 333.591 402.889 332.707C402.889 331.823 403.243 331.292 403.773 330.585C404.304 329.878 403.95 329.525 403.95 329.525L404.834 327.757C404.834 327.757 405.364 326.343 405.364 325.105C405.364 323.868 404.657 324.398 403.95 324.221C403.243 324.045 403.773 323.868 404.834 323.338C405.895 322.807 405.541 321.57 405.718 320.509C405.895 319.448 405.364 315.029 405.187 314.145C405.187 314.145 407.228 312.849 407.853 313.099C408.478 313.349 408.103 308.599 409.728 308.099C411.353 307.599 438.728 309.224 438.603 307.599L438.853 307.849C439.228 308.974 440.103 308.849 440.103 308.849C440.103 308.849 442.103 310.349 442.353 311.099C442.603 311.849 442.853 311.349 442.853 311.974C442.853 312.599 443.228 314.849 443.728 316.349C444.228 317.849 444.353 317.099 445.353 317.974C446.353 318.849 445.603 318.724 445.603 320.724C445.603 322.724 446.603 322.224 447.603 323.849C448.603 325.474 447.728 324.724 448.228 326.099C448.728 327.474 448.853 328.099 449.353 329.099C449.853 330.099 450.103 329.849 450.728 329.849C451.353 329.849 451.478 330.224 451.478 331.724C451.478 333.224 453.853 333.724 454.853 335.224C455.853 336.724 455.978 336.224 456.603 337.224C457.228 338.224 456.603 337.974 455.978 340.099C455.353 342.224 456.103 342.349 456.728 343.349C457.353 344.349 460.728 344.224 460.728 344.224C460.728 344.224 463.728 343.974 464.853 343.349C465.978 342.724 465.853 342.474 466.353 342.099C466.853 341.724 470.353 342.099 472.853 341.474C475.353 340.849 478.603 338.474 480.103 341.099C481.603 343.724 476.353 354.099 474.103 359.099C471.853 364.099 465.603 369.099 461.728 372.849C457.853 376.599 455.478 381.224 455.228 381.724C454.978 382.224 453.978 383.224 453.478 383.474C452.978 383.724 452.478 384.099 451.478 385.349C450.478 386.599 449.853 386.099 448.478 387.099C447.103 388.099 447.353 389.099 447.353 389.849C447.353 390.599 446.978 392.224 446.603 392.724C446.228 393.224 447.103 395.724 447.103 396.599C447.103 397.474 446.853 399.474 446.853 399.474C446.853 399.474 446.853 399.849 448.228 400.599C449.603 401.349 448.728 405.849 448.728 405.849L448.978 406.349C448.978 406.349 447.353 407.974 446.228 407.974C445.103 407.974 443.603 409.349 443.603 409.349C443.603 409.349 442.978 409.474 441.728 409.849C440.478 410.224 439.478 410.099 438.353 411.599C437.228 413.099 437.853 412.974 438.728 415.849C439.603 418.724 438.353 416.974 437.978 417.974C437.603 418.974 437.978 421.099 437.978 422.349C437.978 423.599 437.103 424.099 436.478 424.599C435.853 425.099 433.853 423.099 433.103 421.849C432.353 420.599 433.103 418.599 433.603 417.099C434.103 415.599 432.478 413.474 432.103 412.224C431.728 410.974 431.853 410.849 432.478 409.724C433.103 408.599 432.603 408.849 432.228 407.099C431.853 405.349 430.853 405.474 430.478 404.724C430.103 403.974 428.978 402.474 427.978 402.474C426.978 402.474 427.478 400.849 427.228 399.974C426.978 399.099 425.228 399.474 424.603 399.724C423.978 399.974 423.853 399.099 423.478 396.349C423.103 393.599 422.353 386.599 422.478 385.474C422.603 384.349 425.353 386.474 425.853 385.724C426.353 384.974 426.478 379.349 426.228 377.849C425.978 376.349 428.353 376.974 429.853 376.849C431.353 376.724 431.603 374.849 432.228 373.599C432.853 372.349 433.478 372.474 434.103 372.224C434.728 371.974 434.603 370.724 435.353 369.724C436.103 368.724 437.103 366.974 437.103 365.599C437.103 364.224 435.228 362.849 432.978 362.724C430.728 362.599 431.228 363.724 428.103 362.974C424.978 362.224 424.353 362.349 423.353 362.099C422.353 361.849 422.478 360.224 421.353 359.849C420.228 359.474 418.853 361.974 418.853 361.974C418.853 361.974 417.603 361.599 416.353 358.599C415.103 355.599 413.353 354.724 412.853 354.599C412.353 354.474 412.228 350.974 412.228 350.349C412.228 349.724 409.978 348.974 409.478 348.224C408.978 347.474 408.603 346.349 407.728 346.099C406.853 345.849 406.228 345.849 405.853 343.724C405.478 341.599 404.657 339.601 404.657 339.601Z"
                className={getCountryClass("east-af")}
                fill={getFill("east-af")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_10">
                <path
                  id="East africa"
                  d="M419.814 333V328.636H422.754V329.397H420.736V330.437H422.603V331.197H420.736V332.239H422.763V333H419.814ZM424.404 333.062C424.195 333.062 424.009 333.026 423.846 332.953C423.682 332.879 423.553 332.771 423.458 332.627C423.364 332.482 423.317 332.302 423.317 332.086C423.317 331.904 423.351 331.751 423.417 331.628C423.484 331.504 423.575 331.405 423.69 331.33C423.805 331.254 423.936 331.197 424.082 331.159C424.23 331.121 424.385 331.094 424.547 331.078C424.737 331.058 424.89 331.04 425.007 331.023C425.123 331.004 425.208 330.977 425.26 330.942C425.313 330.906 425.339 330.854 425.339 330.784V330.771C425.339 330.636 425.297 330.532 425.211 330.458C425.128 330.384 425.008 330.347 424.853 330.347C424.69 330.347 424.56 330.384 424.464 330.456C424.367 330.527 424.303 330.616 424.272 330.724L423.432 330.656C423.475 330.457 423.559 330.286 423.684 330.141C423.809 329.994 423.97 329.882 424.167 329.804C424.366 329.724 424.596 329.685 424.858 329.685C425.04 329.685 425.214 329.706 425.38 329.749C425.547 329.791 425.696 329.857 425.825 329.947C425.956 330.036 426.059 330.151 426.134 330.292C426.209 330.431 426.247 330.598 426.247 330.793V333H425.386V332.546H425.361C425.308 332.648 425.238 332.739 425.15 332.817C425.062 332.893 424.956 332.954 424.832 332.998C424.709 333.04 424.566 333.062 424.404 333.062ZM424.664 332.435C424.797 332.435 424.915 332.409 425.017 332.357C425.12 332.303 425.2 332.23 425.258 332.139C425.316 332.048 425.346 331.945 425.346 331.83V331.483C425.317 331.501 425.278 331.518 425.228 331.534C425.18 331.548 425.125 331.562 425.064 331.575C425.003 331.586 424.942 331.597 424.881 331.607C424.82 331.615 424.765 331.623 424.715 331.63C424.608 331.646 424.515 331.67 424.436 331.705C424.356 331.739 424.294 331.785 424.25 331.843C424.206 331.9 424.184 331.971 424.184 332.056C424.184 332.18 424.229 332.274 424.319 332.339C424.41 332.403 424.525 332.435 424.664 332.435ZM429.674 330.661L428.843 330.712C428.829 330.641 428.798 330.577 428.752 330.52C428.705 330.462 428.643 330.415 428.566 330.381C428.491 330.346 428.401 330.328 428.296 330.328C428.155 330.328 428.036 330.358 427.94 330.418C427.843 330.476 427.795 330.554 427.795 330.652C427.795 330.73 427.826 330.796 427.889 330.85C427.951 330.904 428.058 330.947 428.21 330.98L428.803 331.099C429.121 331.165 429.358 331.27 429.514 331.415C429.671 331.56 429.749 331.75 429.749 331.986C429.749 332.2 429.685 332.388 429.559 332.55C429.434 332.712 429.262 332.839 429.043 332.93C428.826 333.019 428.575 333.064 428.291 333.064C427.858 333.064 427.513 332.974 427.256 332.793C427 332.612 426.85 332.364 426.806 332.052L427.699 332.005C427.726 332.137 427.791 332.238 427.895 332.308C427.999 332.376 428.131 332.41 428.293 332.41C428.453 332.41 428.58 332.379 428.677 332.318C428.775 332.256 428.825 332.175 428.826 332.077C428.825 331.995 428.79 331.928 428.722 331.875C428.653 331.821 428.548 331.78 428.406 331.751L427.84 331.638C427.52 331.575 427.282 331.464 427.126 331.306C426.971 331.148 426.894 330.947 426.894 330.703C426.894 330.493 426.95 330.312 427.064 330.16C427.179 330.008 427.34 329.891 427.548 329.808C427.756 329.726 428.001 329.685 428.281 329.685C428.694 329.685 429.019 329.772 429.256 329.947C429.495 330.121 429.634 330.359 429.674 330.661ZM432.061 329.727V330.409H430.09V329.727H432.061ZM430.538 328.943H431.445V331.994C431.445 332.078 431.458 332.143 431.484 332.19C431.509 332.236 431.545 332.268 431.59 332.286C431.637 332.305 431.691 332.314 431.752 332.314C431.795 332.314 431.837 332.31 431.88 332.303C431.922 332.295 431.955 332.288 431.978 332.284L432.121 332.96C432.075 332.974 432.011 332.99 431.929 333.009C431.847 333.028 431.746 333.04 431.628 333.045C431.41 333.053 431.218 333.024 431.053 332.957C430.89 332.891 430.763 332.787 430.672 332.646C430.581 332.506 430.536 332.328 430.538 332.114V328.943ZM434.974 333.062C434.765 333.062 434.579 333.026 434.416 332.953C434.253 332.879 434.123 332.771 434.028 332.627C433.934 332.482 433.888 332.302 433.888 332.086C433.888 331.904 433.921 331.751 433.988 331.628C434.054 331.504 434.145 331.405 434.26 331.33C434.375 331.254 434.506 331.197 434.652 331.159C434.8 331.121 434.955 331.094 435.117 331.078C435.307 331.058 435.461 331.04 435.577 331.023C435.694 331.004 435.778 330.977 435.831 330.942C435.883 330.906 435.91 330.854 435.91 330.784V330.771C435.91 330.636 435.867 330.532 435.782 330.458C435.698 330.384 435.579 330.347 435.424 330.347C435.26 330.347 435.13 330.384 435.034 330.456C434.937 330.527 434.873 330.616 434.842 330.724L434.003 330.656C434.045 330.457 434.129 330.286 434.254 330.141C434.379 329.994 434.54 329.882 434.738 329.804C434.937 329.724 435.167 329.685 435.428 329.685C435.61 329.685 435.784 329.706 435.95 329.749C436.118 329.791 436.266 329.857 436.395 329.947C436.526 330.036 436.629 330.151 436.704 330.292C436.78 330.431 436.817 330.598 436.817 330.793V333H435.956V332.546H435.931C435.878 332.648 435.808 332.739 435.72 332.817C435.632 332.893 435.526 332.954 435.402 332.998C435.279 333.04 435.136 333.062 434.974 333.062ZM435.234 332.435C435.368 332.435 435.486 332.409 435.588 332.357C435.69 332.303 435.77 332.23 435.829 332.139C435.887 332.048 435.916 331.945 435.916 331.83V331.483C435.888 331.501 435.848 331.518 435.799 331.534C435.75 331.548 435.696 331.562 435.635 331.575C435.574 331.586 435.513 331.597 435.451 331.607C435.39 331.615 435.335 331.623 435.285 331.63C435.179 331.646 435.086 331.67 435.006 331.705C434.927 331.739 434.865 331.785 434.821 331.843C434.777 331.9 434.755 331.971 434.755 332.056C434.755 332.18 434.799 332.274 434.889 332.339C434.98 332.403 435.095 332.435 435.234 332.435ZM439.281 329.727V330.409H437.261V329.727H439.281ZM437.724 333V329.491C437.724 329.254 437.77 329.057 437.862 328.901C437.956 328.744 438.084 328.627 438.246 328.549C438.408 328.471 438.592 328.432 438.798 328.432C438.937 328.432 439.064 328.442 439.179 328.464C439.296 328.485 439.382 328.504 439.439 328.521L439.277 329.203C439.242 329.192 439.198 329.181 439.145 329.171C439.094 329.161 439.041 329.156 438.987 329.156C438.854 329.156 438.761 329.188 438.708 329.25C438.656 329.311 438.629 329.397 438.629 329.508V333H437.724ZM439.836 333V329.727H440.716V330.298H440.75C440.81 330.095 440.91 329.942 441.05 329.838C441.191 329.733 441.353 329.68 441.536 329.68C441.582 329.68 441.631 329.683 441.683 329.689C441.736 329.695 441.782 329.702 441.822 329.712V330.518C441.779 330.505 441.72 330.494 441.645 330.484C441.57 330.474 441.501 330.469 441.438 330.469C441.305 330.469 441.185 330.498 441.08 330.556C440.976 330.613 440.894 330.692 440.833 330.795C440.773 330.897 440.744 331.015 440.744 331.148V333H439.836ZM442.291 333V329.727H443.199V333H442.291ZM442.747 329.305C442.612 329.305 442.496 329.261 442.4 329.171C442.304 329.08 442.257 328.972 442.257 328.845C442.257 328.72 442.304 328.613 442.4 328.523C442.496 328.433 442.612 328.387 442.747 328.387C442.882 328.387 442.997 328.433 443.092 328.523C443.189 328.613 443.237 328.72 443.237 328.845C443.237 328.972 443.189 329.08 443.092 329.171C442.997 329.261 442.882 329.305 442.747 329.305ZM445.404 333.064C445.069 333.064 444.781 332.993 444.539 332.851C444.299 332.707 444.115 332.509 443.985 332.254C443.858 332 443.794 331.707 443.794 331.376C443.794 331.041 443.858 330.747 443.987 330.494C444.118 330.24 444.304 330.042 444.544 329.9C444.784 329.756 445.069 329.685 445.4 329.685C445.686 329.685 445.936 329.737 446.15 329.84C446.365 329.944 446.534 330.089 446.659 330.277C446.784 330.464 446.853 330.685 446.866 330.938H446.009C445.985 330.774 445.921 330.643 445.818 330.543C445.715 330.442 445.581 330.392 445.415 330.392C445.274 330.392 445.152 330.43 445.046 330.507C444.943 330.582 444.862 330.692 444.804 330.837C444.745 330.982 444.716 331.158 444.716 331.364C444.716 331.572 444.745 331.75 444.801 331.896C444.86 332.043 444.941 332.154 445.046 332.231C445.152 332.308 445.274 332.346 445.415 332.346C445.519 332.346 445.612 332.325 445.694 332.282C445.778 332.239 445.847 332.178 445.901 332.097C445.956 332.014 445.992 331.915 446.009 331.8H446.866C446.852 332.05 446.784 332.271 446.661 332.461C446.541 332.65 446.374 332.798 446.161 332.904C445.948 333.011 445.696 333.064 445.404 333.064ZM448.38 333.062C448.172 333.062 447.986 333.026 447.822 332.953C447.659 332.879 447.53 332.771 447.434 332.627C447.341 332.482 447.294 332.302 447.294 332.086C447.294 331.904 447.327 331.751 447.394 331.628C447.461 331.504 447.552 331.405 447.667 331.33C447.782 331.254 447.912 331.197 448.059 331.159C448.206 331.121 448.361 331.094 448.523 331.078C448.714 331.058 448.867 331.04 448.983 331.023C449.1 331.004 449.184 330.977 449.237 330.942C449.29 330.906 449.316 330.854 449.316 330.784V330.771C449.316 330.636 449.273 330.532 449.188 330.458C449.104 330.384 448.985 330.347 448.83 330.347C448.667 330.347 448.537 330.384 448.44 330.456C448.343 330.527 448.28 330.616 448.248 330.724L447.409 330.656C447.451 330.457 447.535 330.286 447.66 330.141C447.785 329.994 447.946 329.882 448.144 329.804C448.343 329.724 448.573 329.685 448.834 329.685C449.016 329.685 449.19 329.706 449.356 329.749C449.524 329.791 449.672 329.857 449.802 329.947C449.932 330.036 450.035 330.151 450.111 330.292C450.186 330.431 450.223 330.598 450.223 330.793V333H449.363V332.546H449.337C449.285 332.648 449.214 332.739 449.126 332.817C449.038 332.893 448.932 332.954 448.809 332.998C448.685 333.04 448.542 333.062 448.38 333.062ZM448.64 332.435C448.774 332.435 448.892 332.409 448.994 332.357C449.096 332.303 449.177 332.23 449.235 332.139C449.293 332.048 449.322 331.945 449.322 331.83V331.483C449.294 331.501 449.255 331.518 449.205 331.534C449.157 331.548 449.102 331.562 449.041 331.575C448.98 331.586 448.919 331.597 448.858 331.607C448.797 331.615 448.741 331.623 448.691 331.63C448.585 331.646 448.492 331.67 448.412 331.705C448.333 331.739 448.271 331.785 448.227 331.843C448.183 331.9 448.161 331.971 448.161 332.056C448.161 332.18 448.206 332.274 448.295 332.339C448.386 332.403 448.501 332.435 448.64 332.435Z"
                  fill="black"
                ></path>
                <g id="Army_10">
                  <circle
                    id="armycircle_10"
                    cx="435"
                    cy="342"
                    r="5.5"
                    fill={getCircleFill("east-af")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("east-af")}
                  ></circle>
                  {getArmyNum("east-af", "435", "342")}
                </g>
              </g>
            </g>
            <g id="egypt">
              <path
                id="egypt_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M405.188 314.145C405.011 313.261 401.298 314.322 400.415 313.968C399.531 313.615 399 312.908 399 312.908C399 312.908 398.293 310.786 398.116 309.726C397.94 308.665 395.465 309.902 394.581 309.726C393.697 309.549 394.404 308.312 394.051 307.074C393.697 305.837 392.283 306.367 391.399 306.367C390.515 306.367 389.101 305.66 387.863 304.776C386.626 303.892 386.272 305.13 384.858 305.306C383.444 305.483 383.444 305.13 382.914 304.246C382.383 303.362 380.616 304.776 379.025 304.599C377.434 304.422 377.787 303.715 376.903 302.301C376.019 300.887 375.135 301.948 373.191 301.417C371.246 300.887 371.954 300.71 371.777 299.296C371.6 297.882 370.362 298.058 370.362 298.058C370.362 298.058 370.186 296.467 370.009 295.23C369.832 293.993 370.186 292.048 370.186 291.341C370.186 290.634 369.832 287.982 368.595 287.452C367.357 286.922 368.241 285.684 368.241 285.684C368.241 285.684 367.711 283.916 367.888 283.032C368.064 282.149 369.302 281.088 370.186 281.088C371.07 281.088 371.6 280.027 371.6 280.027C371.6 280.027 370.186 277.906 369.479 276.668C368.772 275.431 370.716 275.608 370.716 275.608L371.6 274.547C371.6 274.547 371.954 274.017 373.544 273.133C375.135 272.249 374.228 270.224 374.228 270.224C374.228 270.224 375.853 270.349 377.478 270.599C379.103 270.849 378.853 271.599 379.853 272.599C380.853 273.599 381.228 273.849 383.353 274.599C385.478 275.349 385.603 275.724 386.978 275.724C388.353 275.724 390.603 274.474 391.478 274.099C392.353 273.724 393.853 273.599 399.853 273.224C405.853 272.849 405.853 276.724 407.228 276.224C408.603 275.724 410.103 276.224 410.853 276.474C411.603 276.724 413.728 277.474 414.978 277.474C416.228 277.474 417.603 278.224 418.103 278.474C418.603 278.724 424.353 279.974 424.978 279.974L426.603 278.474L427.853 278.849C427.853 278.849 428.853 279.349 429.353 279.349C429.853 279.349 430.103 278.474 430.103 278.474L432.103 277.224L434.353 281.599C434.353 281.599 433.353 284.224 433.353 284.974C433.353 285.724 433.228 287.599 432.728 287.724C432.228 287.849 431.603 287.599 430.853 287.099C430.103 286.599 429.353 285.224 428.228 284.474C427.103 283.724 428.228 286.974 428.228 286.974C428.103 287.474 430.603 290.849 434.978 296.849C439.353 302.849 435.478 299.849 436.353 301.349C437.228 302.849 438.103 303.349 438.353 305.599C438.603 307.849 438.478 306.724 438.853 307.849L438.603 307.599C438.728 309.224 411.353 307.599 409.728 308.099C408.103 308.599 408.478 313.349 407.853 313.099C407.228 312.849 405.188 314.145 405.188 314.145Z"
                className={getCountryClass("egypt")}
                fill={getFill("egypt")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_11">
                <path
                  id="Egypt"
                  d="M397.822 284V279.636H400.762V280.397H398.744V281.437H400.611V282.197H398.744V283.239H400.771V284H397.822ZM402.953 285.295C402.659 285.295 402.407 285.255 402.196 285.174C401.988 285.094 401.821 284.986 401.698 284.848C401.574 284.71 401.494 284.555 401.457 284.384L402.297 284.271C402.322 284.336 402.363 284.397 402.418 284.454C402.473 284.511 402.547 284.556 402.638 284.59C402.73 284.626 402.842 284.643 402.974 284.643C403.172 284.643 403.334 284.595 403.462 284.499C403.591 284.403 403.656 284.244 403.656 284.019V283.42H403.618C403.578 283.511 403.518 283.597 403.439 283.678C403.359 283.759 403.257 283.825 403.132 283.876C403.007 283.928 402.858 283.953 402.684 283.953C402.439 283.953 402.215 283.896 402.013 283.783C401.813 283.668 401.653 283.492 401.534 283.256C401.416 283.019 401.357 282.719 401.357 282.357C401.357 281.987 401.417 281.677 401.538 281.428C401.659 281.18 401.819 280.994 402.02 280.87C402.221 280.746 402.442 280.685 402.682 280.685C402.866 280.685 403.019 280.716 403.142 280.778C403.266 280.839 403.366 280.916 403.441 281.009C403.517 281.099 403.576 281.189 403.618 281.277H403.652V280.727H404.553V284.032C404.553 284.31 404.485 284.543 404.348 284.731C404.212 284.918 404.023 285.059 403.782 285.153C403.542 285.248 403.265 285.295 402.953 285.295ZM402.972 283.271C403.118 283.271 403.242 283.235 403.343 283.163C403.445 283.089 403.523 282.984 403.577 282.847C403.633 282.71 403.66 282.545 403.66 282.353C403.66 282.161 403.633 281.995 403.579 281.854C403.525 281.712 403.447 281.602 403.345 281.524C403.243 281.446 403.118 281.407 402.972 281.407C402.823 281.407 402.697 281.447 402.595 281.528C402.493 281.608 402.415 281.719 402.363 281.861C402.31 282.003 402.284 282.167 402.284 282.353C402.284 282.542 402.31 282.705 402.363 282.843C402.417 282.979 402.494 283.085 402.595 283.161C402.697 283.234 402.823 283.271 402.972 283.271ZM405.836 285.227C405.721 285.227 405.613 285.218 405.512 285.2C405.412 285.183 405.33 285.161 405.265 285.134L405.469 284.456C405.576 284.489 405.672 284.506 405.757 284.509C405.843 284.512 405.918 284.492 405.981 284.45C406.044 284.407 406.096 284.335 406.136 284.232L406.189 284.094L405.015 280.727H405.97L406.647 283.131H406.682L407.366 280.727H408.326L407.054 284.354C406.993 284.53 406.91 284.683 406.805 284.814C406.701 284.946 406.57 285.048 406.411 285.119C406.252 285.191 406.06 285.227 405.836 285.227ZM408.791 285.227V280.727H409.686V281.277H409.726C409.766 281.189 409.824 281.099 409.899 281.009C409.976 280.916 410.075 280.839 410.197 280.778C410.321 280.716 410.474 280.685 410.657 280.685C410.896 280.685 411.116 280.747 411.318 280.872C411.52 280.996 411.681 281.183 411.802 281.433C411.922 281.681 411.983 281.993 411.983 282.368C411.983 282.733 411.924 283.041 411.806 283.293C411.689 283.543 411.53 283.732 411.329 283.862C411.128 283.989 410.904 284.053 410.655 284.053C410.479 284.053 410.329 284.024 410.206 283.966C410.084 283.908 409.983 283.835 409.905 283.746C409.827 283.657 409.767 283.567 409.726 283.476H409.699V285.227H408.791ZM409.679 282.364C409.679 282.558 409.706 282.728 409.76 282.873C409.814 283.018 409.892 283.131 409.995 283.212C410.097 283.291 410.221 283.331 410.368 283.331C410.515 283.331 410.64 283.29 410.743 283.21C410.845 283.127 410.922 283.013 410.975 282.869C411.029 282.722 411.056 282.554 411.056 282.364C411.056 282.175 411.03 282.009 410.977 281.865C410.924 281.722 410.847 281.609 410.745 281.528C410.642 281.447 410.517 281.407 410.368 281.407C410.22 281.407 410.095 281.446 409.993 281.524C409.892 281.602 409.814 281.713 409.76 281.857C409.706 282 409.679 282.169 409.679 282.364ZM414.329 280.727V281.409H412.358V280.727H414.329ZM412.805 279.943H413.713V282.994C413.713 283.078 413.726 283.143 413.751 283.19C413.777 283.236 413.812 283.268 413.858 283.286C413.905 283.305 413.959 283.314 414.02 283.314C414.062 283.314 414.105 283.31 414.147 283.303C414.19 283.295 414.223 283.288 414.245 283.284L414.388 283.96C414.343 283.974 414.279 283.99 414.196 284.009C414.114 284.028 414.014 284.04 413.896 284.045C413.677 284.053 413.486 284.024 413.321 283.957C413.157 283.891 413.03 283.787 412.939 283.646C412.848 283.506 412.804 283.328 412.805 283.114V279.943Z"
                  fill="black"
                ></path>
                <g id="Army_11">
                  <circle
                    id="armycircle_11"
                    cx="406"
                    cy="293"
                    r="5.5"
                    fill={getCircleFill("egypt")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("egypt")}
                  ></circle>
                  {getArmyNum("egypt", "406", "293")}
                </g>
              </g>
            </g>
            <g id="congo">
              <path
                id="congo_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M424.603 399.724C423.978 399.974 423.853 399.099 423.478 396.349C423.103 393.599 422.353 386.599 422.478 385.474C422.603 384.349 425.353 386.474 425.853 385.724C426.353 384.974 426.478 379.349 426.228 377.849C425.978 376.349 428.353 376.974 429.853 376.849C431.353 376.724 431.603 374.849 432.228 373.599C432.853 372.349 433.478 372.474 434.103 372.224C434.728 371.974 434.603 370.724 435.353 369.724C436.103 368.724 437.103 366.974 437.103 365.599C437.103 364.224 435.228 362.849 432.978 362.724C430.728 362.599 431.228 363.724 428.103 362.974C424.978 362.224 424.353 362.349 423.353 362.099C422.353 361.849 422.478 360.224 421.353 359.849C420.228 359.474 418.853 361.974 418.853 361.974C418.853 361.974 417.603 361.599 416.353 358.599C415.103 355.599 413.353 354.724 412.853 354.599C412.353 354.474 412.228 350.974 412.228 350.349C412.228 349.724 409.978 348.974 409.478 348.224C408.978 347.474 408.603 346.349 407.728 346.099C406.853 345.849 406.228 345.849 405.853 343.724C405.853 343.724 405.353 340.099 404.692 339.725C404.657 339.601 402.359 342.076 402.359 342.96C402.359 343.844 402.889 344.904 400.591 345.965C398.293 347.026 396.879 347.733 395.465 348.263C394.051 348.793 393.52 349.854 392.636 350.384C391.752 350.915 390.515 350.915 389.631 351.622C388.747 352.329 388.04 352.329 387.51 353.39C386.979 354.45 386.272 352.682 386.096 355.157C385.919 357.632 386.449 358.87 386.449 358.87C386.449 358.87 388.04 356.925 387.687 360.814C387.333 364.703 386.449 365.057 386.979 366.471C387.51 367.885 387.863 368.239 386.449 369.123C385.035 370.007 383.798 369.123 383.798 369.123C383.798 369.123 383.444 367.532 381.853 367.885C380.262 368.239 380.085 368.946 378.494 368.592C376.903 368.239 375.312 368.239 375.312 368.239C375.312 368.239 373.368 369.83 372.661 369.476C371.953 369.123 371.953 368.592 371.423 367.532L370.79 367.349C369.728 366.974 369.603 369.474 369.603 369.474C369.978 370.599 370.978 371.099 370.478 371.599C369.978 372.099 369.353 373.599 368.728 374.474C368.103 375.349 365.478 376.599 366.478 377.724C367.478 378.849 374.103 384.099 375.478 387.224C375.478 387.224 376.103 388.099 376.728 388.974C377.353 389.849 379.603 387.974 380.353 388.599C381.103 389.224 383.103 390.599 383.853 390.974C384.603 391.349 388.728 390.724 389.728 391.474C390.728 392.224 391.478 391.849 391.478 391.849C391.478 391.849 390.853 396.099 391.478 396.724C392.103 397.349 393.603 398.099 394.478 396.849C395.353 395.599 401.853 394.849 402.228 395.849C402.603 396.849 401.603 398.849 402.853 399.849C404.103 400.849 404.978 401.599 404.853 402.599C404.728 403.599 403.478 404.599 403.978 405.974C404.478 407.349 405.853 407.849 407.353 407.724C408.853 407.599 408.728 408.724 409.978 408.974C411.228 409.224 416.103 409.224 416.603 409.599C417.103 409.974 418.353 410.849 418.728 411.474C419.103 412.099 420.478 414.349 421.353 413.474C422.228 412.599 423.228 407.974 421.853 407.474C420.478 406.974 419.603 406.974 419.603 405.474C419.603 403.974 420.353 401.349 420.853 401.349C421.353 401.349 421.978 400.724 421.978 400.724C421.978 400.724 425.853 400.724 424.603 399.724Z"
                className={getCountryClass("congo")}
                fill={getFill("congo")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_12">
                <path
                  id="Congo"
                  d="M403.529 365.164H402.596C402.579 365.043 402.544 364.936 402.492 364.842C402.439 364.747 402.372 364.666 402.289 364.599C402.207 364.533 402.112 364.482 402.004 364.446C401.897 364.411 401.781 364.393 401.656 364.393C401.43 364.393 401.234 364.449 401.066 364.561C400.899 364.672 400.769 364.834 400.676 365.047C400.584 365.259 400.538 365.516 400.538 365.818C400.538 366.129 400.584 366.391 400.676 366.602C400.77 366.814 400.901 366.974 401.068 367.082C401.236 367.19 401.43 367.244 401.65 367.244C401.774 367.244 401.888 367.227 401.993 367.195C402.1 367.162 402.194 367.114 402.276 367.052C402.359 366.988 402.427 366.911 402.481 366.82C402.536 366.729 402.575 366.625 402.596 366.509L403.529 366.513C403.505 366.713 403.445 366.906 403.348 367.092C403.253 367.277 403.124 367.442 402.962 367.589C402.802 367.734 402.61 367.849 402.387 367.934C402.166 368.018 401.915 368.06 401.635 368.06C401.246 368.06 400.898 367.972 400.591 367.795C400.286 367.619 400.044 367.364 399.867 367.031C399.69 366.697 399.602 366.293 399.602 365.818C399.602 365.342 399.692 364.938 399.871 364.604C400.05 364.27 400.293 364.016 400.6 363.841C400.906 363.665 401.252 363.577 401.635 363.577C401.888 363.577 402.122 363.612 402.338 363.683C402.555 363.754 402.748 363.858 402.916 363.994C403.083 364.129 403.22 364.295 403.325 364.491C403.431 364.687 403.499 364.911 403.529 365.164ZM405.652 368.064C405.321 368.064 405.035 367.994 404.794 367.853C404.554 367.711 404.368 367.513 404.238 367.261C404.107 367.006 404.042 366.712 404.042 366.376C404.042 366.038 404.107 365.743 404.238 365.49C404.368 365.236 404.554 365.038 404.794 364.898C405.035 364.756 405.321 364.685 405.652 364.685C405.983 364.685 406.269 364.756 406.509 364.898C406.75 365.038 406.937 365.236 407.067 365.49C407.198 365.743 407.263 366.038 407.263 366.376C407.263 366.712 407.198 367.006 407.067 367.261C406.937 367.513 406.75 367.711 406.509 367.853C406.269 367.994 405.983 368.064 405.652 368.064ZM405.657 367.361C405.807 367.361 405.933 367.318 406.034 367.233C406.135 367.146 406.211 367.028 406.262 366.879C406.314 366.73 406.341 366.56 406.341 366.37C406.341 366.18 406.314 366.01 406.262 365.861C406.211 365.712 406.135 365.594 406.034 365.507C405.933 365.42 405.807 365.377 405.657 365.377C405.505 365.377 405.377 365.42 405.273 365.507C405.171 365.594 405.093 365.712 405.041 365.861C404.99 366.01 404.964 366.18 404.964 366.37C404.964 366.56 404.99 366.73 405.041 366.879C405.093 367.028 405.171 367.146 405.273 367.233C405.377 367.318 405.505 367.361 405.657 367.361ZM408.761 366.108V368H407.853V364.727H408.718V365.305H408.757C408.829 365.114 408.951 364.964 409.121 364.853C409.292 364.741 409.498 364.685 409.741 364.685C409.968 364.685 410.167 364.734 410.336 364.834C410.505 364.933 410.636 365.075 410.73 365.26C410.824 365.443 410.87 365.662 410.87 365.916V368H409.963V366.078C409.964 365.878 409.913 365.722 409.809 365.609C409.706 365.496 409.563 365.439 409.381 365.439C409.259 365.439 409.151 365.465 409.057 365.518C408.965 365.57 408.892 365.647 408.84 365.748C408.789 365.847 408.763 365.967 408.761 366.108ZM413.06 369.295C412.766 369.295 412.514 369.255 412.304 369.174C412.095 369.094 411.929 368.986 411.805 368.848C411.682 368.71 411.601 368.555 411.565 368.384L412.404 368.271C412.43 368.336 412.47 368.397 412.525 368.454C412.581 368.511 412.654 368.556 412.745 368.59C412.837 368.626 412.949 368.643 413.082 368.643C413.279 368.643 413.442 368.595 413.57 368.499C413.699 368.403 413.763 368.244 413.763 368.019V367.42H413.725C413.685 367.511 413.626 367.597 413.546 367.678C413.467 367.759 413.364 367.825 413.239 367.876C413.114 367.928 412.965 367.953 412.792 367.953C412.546 367.953 412.322 367.896 412.121 367.783C411.92 367.668 411.761 367.492 411.641 367.256C411.523 367.019 411.464 366.719 411.464 366.357C411.464 365.987 411.525 365.677 411.646 365.428C411.766 365.18 411.927 364.994 412.127 364.87C412.329 364.746 412.55 364.685 412.79 364.685C412.973 364.685 413.126 364.716 413.25 364.778C413.373 364.839 413.473 364.916 413.548 365.009C413.625 365.099 413.684 365.189 413.725 365.277H413.759V364.727H414.66V368.032C414.66 368.31 414.592 368.543 414.456 368.731C414.32 368.918 414.131 369.059 413.889 369.153C413.649 369.248 413.373 369.295 413.06 369.295ZM413.079 367.271C413.226 367.271 413.349 367.235 413.45 367.163C413.552 367.089 413.631 366.984 413.685 366.847C413.74 366.71 413.768 366.545 413.768 366.353C413.768 366.161 413.741 365.995 413.687 365.854C413.633 365.712 413.555 365.602 413.452 365.524C413.35 365.446 413.226 365.407 413.079 365.407C412.93 365.407 412.805 365.447 412.702 365.528C412.6 365.608 412.523 365.719 412.47 365.861C412.418 366.003 412.391 366.167 412.391 366.353C412.391 366.542 412.418 366.705 412.47 366.843C412.524 366.979 412.601 367.085 412.702 367.161C412.805 367.234 412.93 367.271 413.079 367.271ZM416.861 368.064C416.53 368.064 416.244 367.994 416.003 367.853C415.763 367.711 415.577 367.513 415.447 367.261C415.316 367.006 415.251 366.712 415.251 366.376C415.251 366.038 415.316 365.743 415.447 365.49C415.577 365.236 415.763 365.038 416.003 364.898C416.244 364.756 416.53 364.685 416.861 364.685C417.192 364.685 417.478 364.756 417.718 364.898C417.959 365.038 418.146 365.236 418.276 365.49C418.407 365.743 418.472 366.038 418.472 366.376C418.472 366.712 418.407 367.006 418.276 367.261C418.146 367.513 417.959 367.711 417.718 367.853C417.478 367.994 417.192 368.064 416.861 368.064ZM416.866 367.361C417.016 367.361 417.142 367.318 417.243 367.233C417.344 367.146 417.42 367.028 417.471 366.879C417.523 366.73 417.55 366.56 417.55 366.37C417.55 366.18 417.523 366.01 417.471 365.861C417.42 365.712 417.344 365.594 417.243 365.507C417.142 365.42 417.016 365.377 416.866 365.377C416.714 365.377 416.586 365.42 416.482 365.507C416.38 365.594 416.302 365.712 416.25 365.861C416.199 366.01 416.173 366.18 416.173 366.37C416.173 366.56 416.199 366.73 416.25 366.879C416.302 367.028 416.38 367.146 416.482 367.233C416.586 367.318 416.714 367.361 416.866 367.361Z"
                  fill="black"
                ></path>
                <g id="Army_12">
                  <circle
                    id="armycircle_12"
                    cx="409"
                    cy="377"
                    r="5.5"
                    fill={getCircleFill("congo")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("congo")}
                  ></circle>
                  {getArmyNum("congo", "409", "377")}
                </g>
              </g>
            </g>
            <g id="south-af">
              <path
                id="south_africa"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M376.728 388.974C377.353 389.849 379.603 387.974 380.353 388.599C381.103 389.224 383.103 390.599 383.853 390.974C384.603 391.349 388.728 390.724 389.728 391.474C390.728 392.224 391.478 391.849 391.478 391.849C391.478 391.849 390.853 396.099 391.478 396.724C392.103 397.349 393.603 398.099 394.478 396.849C395.353 395.599 401.853 394.849 402.228 395.849C402.603 396.849 401.603 398.849 402.853 399.849C404.103 400.849 404.978 401.599 404.853 402.599C404.728 403.599 403.478 404.599 403.978 405.974C404.478 407.349 405.853 407.849 407.353 407.724C408.853 407.599 408.728 408.724 409.978 408.974C411.228 409.224 416.103 409.224 416.603 409.599C417.103 409.974 418.353 410.849 418.728 411.474C419.103 412.099 420.478 414.349 421.353 413.474C422.228 412.599 423.228 407.974 421.853 407.474C420.478 406.974 419.603 406.974 419.603 405.474C419.603 403.974 420.353 401.349 420.853 401.349C421.353 401.349 421.978 400.724 421.978 400.724C421.978 400.724 425.853 400.724 424.603 399.724C425.228 399.474 426.978 399.099 427.228 399.974C427.478 400.849 426.978 402.474 427.978 402.474C428.978 402.474 430.103 403.974 430.478 404.724C430.853 405.474 431.853 405.349 432.228 407.099C432.603 408.849 433.103 408.599 432.478 409.724C431.853 410.849 431.728 410.974 432.103 412.224C432.478 413.474 434.103 415.599 433.603 417.099C433.103 418.599 432.353 420.599 433.103 421.849C433.853 423.099 435.853 425.099 436.478 424.599C437.103 424.099 437.978 423.599 437.978 422.349C437.978 421.099 437.603 418.974 437.978 417.974C438.353 416.974 439.603 418.724 438.728 415.849C437.853 412.974 437.228 413.099 438.353 411.599C439.478 410.099 440.478 410.224 441.728 409.849C442.978 409.474 443.603 409.349 443.603 409.349C443.603 409.349 445.103 407.974 446.228 407.974C447.353 407.974 448.978 406.349 448.978 406.349L448.728 405.849C448.728 405.849 451.603 404.974 451.103 405.974C450.603 406.974 451.978 410.599 451.978 410.599C451.978 410.599 452.103 411.349 452.353 412.349C452.603 413.349 452.478 413.474 452.603 414.474C452.728 415.474 452.228 415.974 452.103 416.724C451.978 417.474 452.228 418.099 452.353 419.099C452.478 420.099 451.728 422.349 451.478 422.974C451.228 423.599 450.478 423.599 449.978 424.099C449.478 424.599 449.353 425.349 448.228 426.474C447.103 427.599 447.353 427.599 446.603 428.724C445.853 429.849 446.478 429.224 445.353 430.974C444.228 432.724 444.728 431.474 443.603 431.849C442.478 432.224 441.853 433.474 441.353 433.599C440.853 433.724 439.478 434.974 438.728 439.599C437.978 444.224 439.478 445.099 439.103 445.974C438.728 446.849 436.353 450.224 435.978 451.224C435.603 452.224 435.228 452.099 434.103 452.599C432.978 453.099 433.353 455.099 433.353 455.849C433.353 456.599 432.603 459.099 431.228 460.349C429.853 461.599 431.103 461.474 431.478 461.974C431.853 462.474 431.853 463.099 431.603 464.724C431.353 466.349 429.978 465.474 429.228 465.974C428.478 466.474 426.103 469.224 426.353 470.224C426.603 471.224 427.603 471.099 427.603 471.099C427.603 471.099 425.978 472.849 424.478 474.724C422.978 476.599 424.603 475.849 424.978 477.099C425.353 478.349 424.103 477.349 423.353 477.349C422.603 477.349 422.478 477.724 421.728 478.349C420.978 478.974 420.478 478.849 416.978 479.599C413.478 480.349 415.603 480.849 413.853 482.099C412.103 483.349 412.228 483.724 407.353 483.724C402.478 483.724 404.103 484.224 403.228 484.599C402.353 484.974 401.728 484.974 400.728 484.974C399.728 484.974 398.978 485.474 398.353 485.849C397.728 486.224 397.228 487.224 397.228 487.224C397.228 487.224 396.728 486.974 396.228 486.099C395.728 485.224 394.603 485.599 393.728 485.474C392.853 485.349 392.728 485.224 391.853 484.099C390.978 482.974 392.103 482.599 392.103 481.974C392.103 481.349 391.353 479.349 391.353 478.349C391.353 477.349 391.353 476.849 391.353 475.599C391.353 474.349 391.228 474.349 391.228 472.974C391.228 471.599 391.228 471.474 390.853 470.724C390.478 469.974 389.478 469.099 389.228 467.724C388.978 466.349 389.228 465.849 389.228 464.724C389.228 463.599 387.978 464.224 387.728 463.724C387.478 463.224 386.853 462.724 386.353 461.224C385.853 459.724 386.478 459.849 386.478 458.599C386.478 457.349 386.478 457.224 386.478 456.224C386.478 455.224 385.728 454.849 385.478 454.224C385.228 453.599 383.728 450.974 383.603 450.099C383.478 449.224 383.353 448.724 383.353 447.599C383.353 446.474 383.478 446.599 383.603 445.724C383.728 444.849 382.978 444.349 382.978 443.724C382.978 443.099 379.728 439.974 379.728 439.974C379.728 439.974 379.353 439.724 379.228 438.974C379.103 438.224 378.478 437.724 377.353 436.349C376.228 434.974 376.728 434.974 376.853 433.974C376.978 432.974 376.728 431.974 376.603 431.349C376.478 430.724 375.228 427.974 375.228 427.974C375.228 427.974 375.103 426.724 375.353 425.724C375.603 424.724 375.978 424.474 376.103 422.974C376.228 421.474 376.103 421.849 376.228 420.974C376.353 420.099 376.478 420.099 376.853 419.349C377.228 418.599 377.853 417.974 377.853 416.849C377.853 415.724 378.603 414.724 378.853 414.224C379.103 413.724 379.603 413.224 380.353 412.099C381.103 410.974 379.978 411.349 380.103 410.349C380.228 409.349 379.978 408.599 379.853 407.849C379.728 407.099 377.853 404.724 377.353 403.349C376.853 401.974 379.103 400.599 380.853 397.849H380.915C382.915 394.912 376.728 390.162 376.728 388.974Z"
                className={getCountryClass("south-af")}
                fill={getFill("south-af")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_13">
                <path
                  id="South africa"
                  d="M406.001 417.891C405.984 417.719 405.911 417.586 405.782 417.491C405.653 417.396 405.477 417.348 405.256 417.348C405.105 417.348 404.978 417.369 404.874 417.412C404.771 417.453 404.691 417.511 404.636 417.585C404.582 417.658 404.555 417.742 404.555 417.836C404.552 417.914 404.568 417.982 404.604 418.04C404.641 418.099 404.691 418.149 404.755 418.192C404.819 418.233 404.893 418.269 404.976 418.3C405.06 418.33 405.15 418.356 405.245 418.377L405.637 418.471C405.827 418.513 406.002 418.57 406.161 418.641C406.32 418.712 406.458 418.8 406.574 418.903C406.691 419.007 406.781 419.129 406.845 419.27C406.91 419.411 406.944 419.572 406.945 419.754C406.944 420.021 406.876 420.252 406.741 420.448C406.607 420.643 406.414 420.794 406.161 420.902C405.91 421.009 405.606 421.062 405.251 421.062C404.899 421.062 404.592 421.008 404.331 420.9C404.071 420.792 403.868 420.632 403.722 420.42C403.577 420.207 403.501 419.944 403.494 419.63H404.386C404.396 419.776 404.438 419.898 404.512 419.996C404.587 420.093 404.687 420.166 404.812 420.216C404.939 420.264 405.082 420.288 405.241 420.288C405.397 420.288 405.533 420.266 405.648 420.22C405.764 420.175 405.854 420.112 405.918 420.031C405.982 419.95 406.014 419.857 406.014 419.751C406.014 419.653 405.985 419.571 405.927 419.504C405.87 419.437 405.786 419.381 405.675 419.334C405.566 419.287 405.432 419.244 405.273 419.206L404.797 419.087C404.43 418.997 404.139 418.857 403.926 418.667C403.713 418.477 403.607 418.22 403.609 417.898C403.607 417.634 403.677 417.403 403.82 417.205C403.963 417.008 404.16 416.854 404.41 416.743C404.66 416.632 404.944 416.577 405.262 416.577C405.586 416.577 405.869 416.632 406.11 416.743C406.353 416.854 406.542 417.008 406.677 417.205C406.812 417.403 406.881 417.631 406.886 417.891H406.001ZM409.027 421.064C408.696 421.064 408.41 420.994 408.169 420.853C407.929 420.711 407.743 420.513 407.613 420.261C407.482 420.006 407.417 419.712 407.417 419.376C407.417 419.038 407.482 418.743 407.613 418.49C407.743 418.236 407.929 418.038 408.169 417.898C408.41 417.756 408.696 417.685 409.027 417.685C409.358 417.685 409.644 417.756 409.884 417.898C410.125 418.038 410.312 418.236 410.442 418.49C410.573 418.743 410.638 419.038 410.638 419.376C410.638 419.712 410.573 420.006 410.442 420.261C410.312 420.513 410.125 420.711 409.884 420.853C409.644 420.994 409.358 421.064 409.027 421.064ZM409.032 420.361C409.182 420.361 409.308 420.318 409.409 420.233C409.51 420.146 409.586 420.028 409.637 419.879C409.689 419.73 409.716 419.56 409.716 419.37C409.716 419.18 409.689 419.01 409.637 418.861C409.586 418.712 409.51 418.594 409.409 418.507C409.308 418.42 409.182 418.377 409.032 418.377C408.88 418.377 408.752 418.42 408.648 418.507C408.546 418.594 408.468 418.712 408.416 418.861C408.365 419.01 408.339 419.18 408.339 419.37C408.339 419.56 408.365 419.73 408.416 419.879C408.468 420.028 408.546 420.146 408.648 420.233C408.752 420.318 408.88 420.361 409.032 420.361ZM413.327 419.607V417.727H414.235V421H413.363V420.406H413.329C413.255 420.597 413.133 420.751 412.961 420.868C412.79 420.984 412.582 421.043 412.336 421.043C412.118 421.043 411.925 420.993 411.759 420.893C411.593 420.794 411.463 420.653 411.369 420.469C411.277 420.286 411.23 420.067 411.228 419.811V417.727H412.136V419.649C412.138 419.842 412.189 419.995 412.292 420.107C412.394 420.219 412.531 420.276 412.703 420.276C412.812 420.276 412.915 420.251 413.01 420.201C413.105 420.15 413.182 420.075 413.24 419.975C413.299 419.876 413.329 419.753 413.327 419.607ZM416.702 417.727V418.409H414.731V417.727H416.702ZM415.178 416.943H416.086V419.994C416.086 420.078 416.099 420.143 416.124 420.19C416.15 420.236 416.185 420.268 416.231 420.286C416.278 420.305 416.332 420.314 416.393 420.314C416.435 420.314 416.478 420.31 416.521 420.303C416.563 420.295 416.596 420.288 416.619 420.284L416.761 420.96C416.716 420.974 416.652 420.99 416.57 421.009C416.487 421.028 416.387 421.04 416.269 421.045C416.05 421.053 415.859 421.024 415.694 420.957C415.53 420.891 415.403 420.787 415.312 420.646C415.222 420.506 415.177 420.328 415.178 420.114V416.943ZM418.271 419.108V421H417.363V416.636H418.245V418.305H418.284C418.358 418.112 418.477 417.96 418.642 417.851C418.806 417.74 419.013 417.685 419.262 417.685C419.489 417.685 419.687 417.734 419.856 417.834C420.027 417.932 420.159 418.073 420.252 418.258C420.348 418.441 420.394 418.661 420.393 418.916V421H419.485V419.078C419.487 418.876 419.436 418.719 419.332 418.607C419.23 418.495 419.086 418.439 418.902 418.439C418.778 418.439 418.669 418.465 418.573 418.518C418.48 418.57 418.406 418.647 418.352 418.748C418.299 418.847 418.272 418.967 418.271 419.108ZM404.852 428.062C404.643 428.062 404.457 428.026 404.294 427.953C404.131 427.879 404.001 427.771 403.906 427.627C403.812 427.482 403.765 427.302 403.765 427.086C403.765 426.904 403.799 426.751 403.866 426.628C403.932 426.504 404.023 426.405 404.138 426.33C404.253 426.254 404.384 426.197 404.53 426.159C404.678 426.121 404.833 426.094 404.995 426.078C405.185 426.058 405.339 426.04 405.455 426.023C405.572 426.004 405.656 425.977 405.709 425.942C405.761 425.906 405.787 425.854 405.787 425.784V425.771C405.787 425.636 405.745 425.532 405.66 425.458C405.576 425.384 405.456 425.347 405.302 425.347C405.138 425.347 405.008 425.384 404.912 425.456C404.815 425.527 404.751 425.616 404.72 425.724L403.881 425.656C403.923 425.457 404.007 425.286 404.132 425.141C404.257 424.994 404.418 424.882 404.616 424.804C404.814 424.724 405.045 424.685 405.306 424.685C405.488 424.685 405.662 424.706 405.828 424.749C405.996 424.791 406.144 424.857 406.273 424.947C406.404 425.036 406.507 425.151 406.582 425.292C406.657 425.431 406.695 425.598 406.695 425.793V428H405.834V427.546H405.809C405.756 427.648 405.686 427.739 405.598 427.817C405.51 427.893 405.404 427.954 405.28 427.998C405.157 428.04 405.014 428.062 404.852 428.062ZM405.112 427.435C405.246 427.435 405.363 427.409 405.466 427.357C405.568 427.303 405.648 427.23 405.706 427.139C405.765 427.048 405.794 426.945 405.794 426.83V426.483C405.765 426.501 405.726 426.518 405.677 426.534C405.628 426.548 405.574 426.562 405.513 426.575C405.452 426.586 405.39 426.597 405.329 426.607C405.268 426.615 405.213 426.623 405.163 426.63C405.057 426.646 404.964 426.67 404.884 426.705C404.805 426.739 404.743 426.785 404.699 426.843C404.655 426.9 404.633 426.971 404.633 427.056C404.633 427.18 404.677 427.274 404.767 427.339C404.858 427.403 404.973 427.435 405.112 427.435ZM409.159 424.727V425.409H407.139V424.727H409.159ZM407.602 428V424.491C407.602 424.254 407.648 424.057 407.74 423.901C407.834 423.744 407.962 423.627 408.124 423.549C408.286 423.471 408.47 423.432 408.676 423.432C408.815 423.432 408.942 423.442 409.057 423.464C409.173 423.485 409.26 423.504 409.317 423.521L409.155 424.203C409.119 424.192 409.075 424.181 409.023 424.171C408.972 424.161 408.919 424.156 408.865 424.156C408.732 424.156 408.639 424.188 408.586 424.25C408.534 424.311 408.507 424.397 408.507 424.508V428H407.602ZM409.714 428V424.727H410.594V425.298H410.628C410.688 425.095 410.788 424.942 410.928 424.838C411.069 424.733 411.231 424.68 411.414 424.68C411.46 424.68 411.509 424.683 411.561 424.689C411.614 424.695 411.66 424.702 411.7 424.712V425.518C411.657 425.505 411.598 425.494 411.523 425.484C411.447 425.474 411.379 425.469 411.316 425.469C411.183 425.469 411.063 425.498 410.958 425.556C410.854 425.613 410.772 425.692 410.711 425.795C410.651 425.897 410.621 426.015 410.621 426.148V428H409.714ZM412.169 428V424.727H413.077V428H412.169ZM412.625 424.305C412.49 424.305 412.374 424.261 412.278 424.171C412.182 424.08 412.135 423.972 412.135 423.845C412.135 423.72 412.182 423.613 412.278 423.523C412.374 423.433 412.49 423.387 412.625 423.387C412.76 423.387 412.875 423.433 412.97 423.523C413.067 423.613 413.115 423.72 413.115 423.845C413.115 423.972 413.067 424.08 412.97 424.171C412.875 424.261 412.76 424.305 412.625 424.305ZM415.282 428.064C414.947 428.064 414.659 427.993 414.417 427.851C414.177 427.707 413.993 427.509 413.863 427.254C413.735 427 413.672 426.707 413.672 426.376C413.672 426.041 413.736 425.747 413.865 425.494C413.996 425.24 414.181 425.042 414.422 424.9C414.662 424.756 414.947 424.685 415.278 424.685C415.564 424.685 415.814 424.737 416.028 424.84C416.243 424.944 416.412 425.089 416.537 425.277C416.662 425.464 416.731 425.685 416.744 425.938H415.887C415.863 425.774 415.799 425.643 415.696 425.543C415.593 425.442 415.459 425.392 415.293 425.392C415.152 425.392 415.029 425.43 414.924 425.507C414.821 425.582 414.74 425.692 414.681 425.837C414.623 425.982 414.594 426.158 414.594 426.364C414.594 426.572 414.623 426.75 414.679 426.896C414.738 427.043 414.819 427.154 414.924 427.231C415.029 427.308 415.152 427.346 415.293 427.346C415.397 427.346 415.49 427.325 415.572 427.282C415.656 427.239 415.725 427.178 415.779 427.097C415.834 427.014 415.87 426.915 415.887 426.8H416.744C416.73 427.05 416.662 427.271 416.539 427.461C416.419 427.65 416.252 427.798 416.039 427.904C415.826 428.011 415.574 428.064 415.282 428.064ZM418.258 428.062C418.05 428.062 417.863 428.026 417.7 427.953C417.537 427.879 417.407 427.771 417.312 427.627C417.219 427.482 417.172 427.302 417.172 427.086C417.172 426.904 417.205 426.751 417.272 426.628C417.339 426.504 417.43 426.405 417.545 426.33C417.66 426.254 417.79 426.197 417.937 426.159C418.084 426.121 418.239 426.094 418.401 426.078C418.591 426.058 418.745 426.04 418.861 426.023C418.978 426.004 419.062 425.977 419.115 425.942C419.167 425.906 419.194 425.854 419.194 425.784V425.771C419.194 425.636 419.151 425.532 419.066 425.458C418.982 425.384 418.863 425.347 418.708 425.347C418.545 425.347 418.415 425.384 418.318 425.456C418.221 425.527 418.157 425.616 418.126 425.724L417.287 425.656C417.329 425.457 417.413 425.286 417.538 425.141C417.663 424.994 417.824 424.882 418.022 424.804C418.221 424.724 418.451 424.685 418.712 424.685C418.894 424.685 419.068 424.706 419.234 424.749C419.402 424.791 419.55 424.857 419.68 424.947C419.81 425.036 419.913 425.151 419.988 425.292C420.064 425.431 420.101 425.598 420.101 425.793V428H419.241V427.546H419.215C419.162 427.648 419.092 427.739 419.004 427.817C418.916 427.893 418.81 427.954 418.687 427.998C418.563 428.04 418.42 428.062 418.258 428.062ZM418.518 427.435C418.652 427.435 418.77 427.409 418.872 427.357C418.974 427.303 419.055 427.23 419.113 427.139C419.171 427.048 419.2 426.945 419.2 426.83V426.483C419.172 426.501 419.133 426.518 419.083 426.534C419.035 426.548 418.98 426.562 418.919 426.575C418.858 426.586 418.797 426.597 418.736 426.607C418.675 426.615 418.619 426.623 418.569 426.63C418.463 426.646 418.37 426.67 418.29 426.705C418.211 426.739 418.149 426.785 418.105 426.843C418.061 426.9 418.039 426.971 418.039 427.056C418.039 427.18 418.084 427.274 418.173 427.339C418.264 427.403 418.379 427.435 418.518 427.435Z"
                  fill="black"
                ></path>
                <g id="Army_13">
                  <circle
                    id="armycircle_13"
                    cx="412"
                    cy="436"
                    r="5.5"
                    fill={getCircleFill("south-af")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("south-af")}
                  ></circle>
                  {getArmyNum("south-af", "412", "436")}
                </g>
              </g>
            </g>
            <g id="madagascar">
              <path
                id="madagascar_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M489.353 418.849C489.603 419.849 490.353 419.599 490.353 421.849C490.353 424.099 490.853 427.349 489.353 425.349C487.853 423.349 487.853 422.599 487.853 423.849C487.853 425.099 488.103 427.349 488.103 427.349C488.103 427.349 489.333 429.05 487.742 429.05C486.151 429.05 485.974 428.873 485.974 429.58C485.974 430.287 486.151 431.702 486.151 431.702L485.091 432.762L484.56 435.06C484.56 435.06 486.328 435.237 485.267 437.005C484.207 438.773 483.853 439.303 483.853 439.303C483.853 439.303 484.03 437.712 483.676 441.248C483.323 444.783 483.323 445.313 483.323 445.313C483.323 445.313 484.383 444.96 482.969 446.728C481.555 448.495 481.025 449.026 480.671 449.91C480.318 450.794 481.025 451.677 479.964 452.561C478.903 453.445 478.373 454.152 478.373 454.152L477.312 455.213C477.312 455.213 476.959 456.627 476.959 457.334C476.959 458.041 476.429 458.572 476.429 458.572C476.429 458.572 475.898 459.102 475.898 459.809C475.898 460.516 476.075 460.87 475.191 461.577C474.307 462.284 474.661 462.461 473.6 463.345C472.539 464.229 472.186 462.991 472.186 464.936C472.186 466.88 471.656 467.764 470.772 467.764C469.888 467.764 461.402 467.941 459.988 467.764C458.574 467.587 460.872 460.516 458.928 459.279C456.983 458.041 455.746 453.799 456.983 452.915C458.221 452.031 457.513 452.915 458.397 452.031C459.281 451.147 459.281 451.147 459.812 450.086C460.342 449.026 461.226 449.026 461.226 449.026C461.226 449.026 460.165 446.728 460.872 446.728C461.579 446.728 461.226 444.076 461.226 444.076C461.226 444.076 461.579 442.839 462.11 441.955C462.64 441.071 461.579 440.187 462.994 440.01C464.408 439.833 465.115 440.187 465.115 439.303C465.115 438.419 464.231 438.242 463.524 438.066C462.817 437.889 462.463 438.066 462.463 436.828C462.463 435.591 461.933 436.121 461.579 434.884C461.226 433.646 460.165 434.353 461.403 432.762C462.64 431.171 462.64 432.232 462.994 430.641C463.347 429.05 461.933 427.989 463.701 427.989C465.468 427.989 465.999 428.52 467.766 427.813C469.534 427.105 467.59 426.929 470.418 427.105C473.247 427.282 473.423 428.166 474.484 427.105C475.545 426.045 476.075 426.398 476.252 425.161C476.429 423.923 476.252 423.57 477.489 423.04C478.727 422.509 478.727 423.04 479.611 422.332C480.494 421.625 481.201 420.741 481.025 419.681C480.848 418.62 479.964 418.09 481.555 418.09C483.146 418.09 482.969 418.62 483.676 417.736C484.383 416.852 484.207 416.852 484.56 415.261C484.914 413.67 484.56 413.317 485.444 412.787C486.328 412.256 487.919 410.488 487.919 410.488C487.919 410.488 488.449 408.897 489.156 411.372C489.864 413.847 489.156 413.494 490.04 414.201C490.924 414.908 491.101 414.378 491.101 415.261C491.101 416.145 490.747 417.913 490.747 417.913L489.353 418.849Z"
                className={getCountryClass("madagascar")}
                fill={getFill("madagascar")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_14">
                <path
                  id="Madagascar"
                  d="M486.695 445.636H487.832L489.034 448.568H489.085L490.287 445.636H491.425V450H490.53V447.16H490.494L489.364 449.979H488.755L487.626 447.149H487.59V450H486.695V445.636ZM493.101 450.062C492.892 450.062 492.706 450.026 492.543 449.953C492.38 449.879 492.25 449.771 492.155 449.627C492.061 449.482 492.014 449.302 492.014 449.086C492.014 448.904 492.048 448.751 492.115 448.628C492.181 448.504 492.272 448.405 492.387 448.33C492.502 448.254 492.633 448.197 492.779 448.159C492.927 448.121 493.082 448.094 493.244 448.078C493.434 448.058 493.588 448.04 493.704 448.023C493.821 448.004 493.905 447.977 493.958 447.942C494.01 447.906 494.036 447.854 494.036 447.784V447.771C494.036 447.636 493.994 447.532 493.909 447.458C493.825 447.384 493.706 447.347 493.551 447.347C493.387 447.347 493.257 447.384 493.161 447.456C493.064 447.527 493 447.616 492.969 447.724L492.13 447.656C492.172 447.457 492.256 447.286 492.381 447.141C492.506 446.994 492.667 446.882 492.865 446.804C493.063 446.724 493.294 446.685 493.555 446.685C493.737 446.685 493.911 446.706 494.077 446.749C494.245 446.791 494.393 446.857 494.522 446.947C494.653 447.036 494.756 447.151 494.831 447.292C494.907 447.431 494.944 447.598 494.944 447.793V450H494.083V449.546H494.058C494.005 449.648 493.935 449.739 493.847 449.817C493.759 449.893 493.653 449.954 493.529 449.998C493.406 450.04 493.263 450.062 493.101 450.062ZM493.361 449.435C493.495 449.435 493.612 449.409 493.715 449.357C493.817 449.303 493.897 449.23 493.956 449.139C494.014 449.048 494.043 448.945 494.043 448.83V448.483C494.014 448.501 493.975 448.518 493.926 448.534C493.877 448.548 493.823 448.562 493.762 448.575C493.701 448.586 493.639 448.597 493.578 448.607C493.517 448.615 493.462 448.623 493.412 448.63C493.306 448.646 493.213 448.67 493.133 448.705C493.054 448.739 492.992 448.785 492.948 448.843C492.904 448.9 492.882 448.971 492.882 449.056C492.882 449.18 492.926 449.274 493.016 449.339C493.107 449.403 493.222 449.435 493.361 449.435ZM496.854 450.053C496.606 450.053 496.381 449.989 496.179 449.862C495.979 449.732 495.82 449.543 495.702 449.293C495.585 449.041 495.527 448.733 495.527 448.368C495.527 447.993 495.587 447.681 495.708 447.433C495.829 447.183 495.989 446.996 496.19 446.872C496.391 446.747 496.612 446.685 496.852 446.685C497.035 446.685 497.188 446.716 497.31 446.778C497.434 446.839 497.533 446.916 497.609 447.009C497.685 447.099 497.744 447.189 497.783 447.277H497.811V445.636H498.717V450H497.822V449.476H497.783C497.741 449.567 497.68 449.657 497.602 449.746C497.525 449.835 497.425 449.908 497.302 449.966C497.18 450.024 497.03 450.053 496.854 450.053ZM497.142 449.331C497.288 449.331 497.412 449.291 497.513 449.212C497.615 449.131 497.693 449.018 497.747 448.873C497.802 448.728 497.83 448.558 497.83 448.364C497.83 448.169 497.803 448 497.749 447.857C497.695 447.713 497.617 447.602 497.515 447.524C497.413 447.446 497.288 447.407 497.142 447.407C496.993 447.407 496.867 447.447 496.765 447.528C496.663 447.609 496.585 447.722 496.533 447.865C496.48 448.009 496.454 448.175 496.454 448.364C496.454 448.554 496.48 448.722 496.533 448.869C496.587 449.013 496.664 449.127 496.765 449.21C496.867 449.29 496.993 449.331 497.142 449.331ZM500.396 450.062C500.187 450.062 500.001 450.026 499.838 449.953C499.674 449.879 499.545 449.771 499.45 449.627C499.356 449.482 499.309 449.302 499.309 449.086C499.309 448.904 499.343 448.751 499.41 448.628C499.476 448.504 499.567 448.405 499.682 448.33C499.797 448.254 499.928 448.197 500.074 448.159C500.222 448.121 500.377 448.094 500.539 448.078C500.729 448.058 500.883 448.04 500.999 448.023C501.116 448.004 501.2 447.977 501.253 447.942C501.305 447.906 501.331 447.854 501.331 447.784V447.771C501.331 447.636 501.289 447.532 501.204 447.458C501.12 447.384 501 447.347 500.846 447.347C500.682 447.347 500.552 447.384 500.456 447.456C500.359 447.527 500.295 447.616 500.264 447.724L499.424 447.656C499.467 447.457 499.551 447.286 499.676 447.141C499.801 446.994 499.962 446.882 500.16 446.804C500.358 446.724 500.589 446.685 500.85 446.685C501.032 446.685 501.206 446.706 501.372 446.749C501.54 446.791 501.688 446.857 501.817 446.947C501.948 447.036 502.051 447.151 502.126 447.292C502.201 447.431 502.239 447.598 502.239 447.793V450H501.378V449.546H501.353C501.3 449.648 501.23 449.739 501.142 449.817C501.054 449.893 500.948 449.954 500.824 449.998C500.701 450.04 500.558 450.062 500.396 450.062ZM500.656 449.435C500.79 449.435 500.907 449.409 501.01 449.357C501.112 449.303 501.192 449.23 501.25 449.139C501.309 449.048 501.338 448.945 501.338 448.83V448.483C501.309 448.501 501.27 448.518 501.221 448.534C501.172 448.548 501.118 448.562 501.057 448.575C500.995 448.586 500.934 448.597 500.873 448.607C500.812 448.615 500.757 448.623 500.707 448.63C500.601 448.646 500.508 448.67 500.428 448.705C500.348 448.739 500.287 448.785 500.243 448.843C500.199 448.9 500.177 448.971 500.177 449.056C500.177 449.18 500.221 449.274 500.311 449.339C500.402 449.403 500.517 449.435 500.656 449.435ZM504.418 451.295C504.124 451.295 503.872 451.255 503.661 451.174C503.453 451.094 503.286 450.986 503.163 450.848C503.039 450.71 502.959 450.555 502.922 450.384L503.761 450.271C503.787 450.336 503.828 450.397 503.883 450.454C503.938 450.511 504.011 450.556 504.102 450.59C504.195 450.626 504.307 450.643 504.439 450.643C504.636 450.643 504.799 450.595 504.927 450.499C505.056 450.403 505.121 450.244 505.121 450.019V449.42H505.082C505.043 449.511 504.983 449.597 504.903 449.678C504.824 449.759 504.722 449.825 504.597 449.876C504.472 449.928 504.323 449.953 504.149 449.953C503.903 449.953 503.68 449.896 503.478 449.783C503.278 449.668 503.118 449.492 502.999 449.256C502.881 449.019 502.822 448.719 502.822 448.357C502.822 447.987 502.882 447.677 503.003 447.428C503.124 447.18 503.284 446.994 503.484 446.87C503.686 446.746 503.907 446.685 504.147 446.685C504.33 446.685 504.484 446.716 504.607 446.778C504.731 446.839 504.83 446.916 504.906 447.009C504.982 447.099 505.041 447.189 505.082 447.277H505.117V446.727H506.018V450.032C506.018 450.31 505.95 450.543 505.813 450.731C505.677 450.918 505.488 451.059 505.247 451.153C505.006 451.248 504.73 451.295 504.418 451.295ZM504.437 449.271C504.583 449.271 504.707 449.235 504.808 449.163C504.91 449.089 504.988 448.984 505.042 448.847C505.097 448.71 505.125 448.545 505.125 448.353C505.125 448.161 505.098 447.995 505.044 447.854C504.99 447.712 504.912 447.602 504.81 447.524C504.707 447.446 504.583 447.407 504.437 447.407C504.288 447.407 504.162 447.447 504.06 447.528C503.957 447.608 503.88 447.719 503.828 447.861C503.775 448.003 503.749 448.167 503.749 448.353C503.749 448.542 503.775 448.705 503.828 448.843C503.881 448.979 503.959 449.085 504.06 449.161C504.162 449.234 504.288 449.271 504.437 449.271ZM507.673 450.062C507.465 450.062 507.278 450.026 507.115 449.953C506.952 449.879 506.823 449.771 506.727 449.627C506.634 449.482 506.587 449.302 506.587 449.086C506.587 448.904 506.62 448.751 506.687 448.628C506.754 448.504 506.845 448.405 506.96 448.33C507.075 448.254 507.205 448.197 507.352 448.159C507.499 448.121 507.654 448.094 507.816 448.078C508.006 448.058 508.16 448.04 508.276 448.023C508.393 448.004 508.477 447.977 508.53 447.942C508.582 447.906 508.609 447.854 508.609 447.784V447.771C508.609 447.636 508.566 447.532 508.481 447.458C508.397 447.384 508.278 447.347 508.123 447.347C507.96 447.347 507.83 447.384 507.733 447.456C507.636 447.527 507.573 447.616 507.541 447.724L506.702 447.656C506.744 447.457 506.828 447.286 506.953 447.141C507.078 446.994 507.239 446.882 507.437 446.804C507.636 446.724 507.866 446.685 508.127 446.685C508.309 446.685 508.483 446.706 508.649 446.749C508.817 446.791 508.965 446.857 509.095 446.947C509.225 447.036 509.328 447.151 509.403 447.292C509.479 447.431 509.516 447.598 509.516 447.793V450H508.656V449.546H508.63C508.578 449.648 508.507 449.739 508.419 449.817C508.331 449.893 508.225 449.954 508.102 449.998C507.978 450.04 507.835 450.062 507.673 450.062ZM507.933 449.435C508.067 449.435 508.185 449.409 508.287 449.357C508.389 449.303 508.47 449.23 508.528 449.139C508.586 449.048 508.615 448.945 508.615 448.83V448.483C508.587 448.501 508.548 448.518 508.498 448.534C508.45 448.548 508.395 448.562 508.334 448.575C508.273 448.586 508.212 448.597 508.151 448.607C508.09 448.615 508.034 448.623 507.984 448.63C507.878 448.646 507.785 448.67 507.705 448.705C507.626 448.739 507.564 448.785 507.52 448.843C507.476 448.9 507.454 448.971 507.454 449.056C507.454 449.18 507.499 449.274 507.588 449.339C507.679 449.403 507.794 449.435 507.933 449.435ZM512.944 447.661L512.113 447.712C512.098 447.641 512.068 447.577 512.021 447.52C511.974 447.462 511.912 447.415 511.836 447.381C511.76 447.346 511.67 447.328 511.565 447.328C511.424 447.328 511.306 447.358 511.209 447.418C511.113 447.476 511.064 447.554 511.064 447.652C511.064 447.73 511.096 447.796 511.158 447.85C511.221 447.904 511.328 447.947 511.48 447.98L512.072 448.099C512.39 448.165 512.628 448.27 512.784 448.415C512.94 448.56 513.018 448.75 513.018 448.986C513.018 449.2 512.955 449.388 512.829 449.55C512.704 449.712 512.532 449.839 512.313 449.93C512.096 450.019 511.845 450.064 511.561 450.064C511.128 450.064 510.782 449.974 510.525 449.793C510.27 449.612 510.12 449.364 510.076 449.052L510.968 449.005C510.995 449.137 511.061 449.238 511.165 449.308C511.268 449.376 511.401 449.41 511.563 449.41C511.722 449.41 511.85 449.379 511.946 449.318C512.044 449.256 512.094 449.175 512.096 449.077C512.094 448.995 512.059 448.928 511.991 448.875C511.923 448.821 511.818 448.78 511.676 448.751L511.109 448.638C510.79 448.575 510.552 448.464 510.395 448.306C510.241 448.148 510.163 447.947 510.163 447.703C510.163 447.493 510.22 447.312 510.334 447.16C510.449 447.008 510.61 446.891 510.817 446.808C511.026 446.726 511.27 446.685 511.55 446.685C511.964 446.685 512.289 446.772 512.526 446.947C512.765 447.121 512.904 447.359 512.944 447.661ZM515.068 450.064C514.733 450.064 514.445 449.993 514.203 449.851C513.963 449.707 513.779 449.509 513.649 449.254C513.522 449 513.458 448.707 513.458 448.376C513.458 448.041 513.522 447.747 513.652 447.494C513.782 447.24 513.968 447.042 514.208 446.9C514.448 446.756 514.733 446.685 515.064 446.685C515.35 446.685 515.6 446.737 515.814 446.84C516.029 446.944 516.198 447.089 516.323 447.277C516.448 447.464 516.517 447.685 516.53 447.938H515.674C515.649 447.774 515.585 447.643 515.482 447.543C515.38 447.442 515.245 447.392 515.079 447.392C514.938 447.392 514.816 447.43 514.71 447.507C514.607 447.582 514.526 447.692 514.468 447.837C514.409 447.982 514.38 448.158 514.38 448.364C514.38 448.572 514.409 448.75 514.465 448.896C514.524 449.043 514.605 449.154 514.71 449.231C514.816 449.308 514.938 449.346 515.079 449.346C515.183 449.346 515.276 449.325 515.358 449.282C515.442 449.239 515.511 449.178 515.565 449.097C515.62 449.014 515.657 448.915 515.674 448.8H516.53C516.516 449.05 516.448 449.271 516.326 449.461C516.205 449.65 516.038 449.798 515.825 449.904C515.612 450.011 515.36 450.064 515.068 450.064ZM518.044 450.062C517.836 450.062 517.65 450.026 517.486 449.953C517.323 449.879 517.194 449.771 517.098 449.627C517.005 449.482 516.958 449.302 516.958 449.086C516.958 448.904 516.991 448.751 517.058 448.628C517.125 448.504 517.216 448.405 517.331 448.33C517.446 448.254 517.576 448.197 517.723 448.159C517.87 448.121 518.025 448.094 518.187 448.078C518.378 448.058 518.531 448.04 518.647 448.023C518.764 448.004 518.848 447.977 518.901 447.942C518.954 447.906 518.98 447.854 518.98 447.784V447.771C518.98 447.636 518.937 447.532 518.852 447.458C518.768 447.384 518.649 447.347 518.494 447.347C518.331 447.347 518.201 447.384 518.104 447.456C518.008 447.527 517.944 447.616 517.912 447.724L517.073 447.656C517.116 447.457 517.199 447.286 517.324 447.141C517.449 446.994 517.611 446.882 517.808 446.804C518.007 446.724 518.237 446.685 518.498 446.685C518.68 446.685 518.854 446.706 519.02 446.749C519.188 446.791 519.336 446.857 519.466 446.947C519.596 447.036 519.699 447.151 519.775 447.292C519.85 447.431 519.888 447.598 519.888 447.793V450H519.027V449.546H519.001C518.949 449.648 518.878 449.739 518.79 449.817C518.702 449.893 518.596 449.954 518.473 449.998C518.349 450.04 518.206 450.062 518.044 450.062ZM518.304 449.435C518.438 449.435 518.556 449.409 518.658 449.357C518.76 449.303 518.841 449.23 518.899 449.139C518.957 449.048 518.986 448.945 518.986 448.83V448.483C518.958 448.501 518.919 448.518 518.869 448.534C518.821 448.548 518.766 448.562 518.705 448.575C518.644 448.586 518.583 448.597 518.522 448.607C518.461 448.615 518.405 448.623 518.356 448.63C518.249 448.646 518.156 448.67 518.076 448.705C517.997 448.739 517.935 448.785 517.891 448.843C517.847 448.9 517.825 448.971 517.825 449.056C517.825 449.18 517.87 449.274 517.959 449.339C518.05 449.403 518.165 449.435 518.304 449.435ZM520.592 450V446.727H521.472V447.298H521.506C521.565 447.095 521.666 446.942 521.806 446.838C521.947 446.733 522.109 446.68 522.292 446.68C522.337 446.68 522.386 446.683 522.439 446.689C522.492 446.695 522.538 446.702 522.578 446.712V447.518C522.535 447.505 522.476 447.494 522.401 447.484C522.325 447.474 522.256 447.469 522.194 447.469C522.06 447.469 521.941 447.498 521.836 447.556C521.732 447.613 521.65 447.692 521.589 447.795C521.529 447.897 521.499 448.015 521.499 448.148V450H520.592Z"
                  fill="black"
                ></path>
                <g id="Army_14">
                  <circle
                    id="armycircle_14"
                    cx="476"
                    cy="445"
                    r="5.5"
                    fill={getCircleFill("madagascar")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("madagascar")}
                  ></circle>
                  {getArmyNum("madagascar", "476", "445")}
                </g>
              </g>
            </g>
            <g id="middle-east">
              <path
                id="middle_east"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M482.262 227.878C482.085 228.939 482.792 229.469 481.378 229.823C479.964 230.176 478.903 231.237 478.903 231.237C478.903 231.237 480.494 232.828 477.136 232.121C473.777 231.414 474.307 230.883 472.893 230.53C471.479 230.176 471.656 230.883 470.595 230.176C469.534 229.469 469.181 229.823 468.827 228.762C468.474 227.701 465.853 226.224 465.853 226.224C465.853 226.224 464.978 226.224 464.853 227.099C464.728 227.974 466.603 227.974 464.478 228.349C464.478 228.349 463.228 228.474 462.603 228.599C461.978 228.724 461.353 228.349 460.728 228.849C460.103 229.349 460.103 229.724 459.228 229.849C458.353 229.974 458.478 229.849 457.478 229.974C456.478 230.099 455.728 230.974 455.728 230.974C455.728 230.974 455.978 231.474 454.353 231.349C452.728 231.224 452.103 231.599 452.103 231.599C452.103 231.599 452.103 233.099 450.728 232.099C449.353 231.099 448.728 231.099 448.728 230.599C448.728 230.099 449.353 229.599 449.853 229.099C449.853 229.099 449.382 227.613 447.525 227.966C445.669 228.32 444.52 228.232 444.078 228.85C443.636 229.469 443.195 230.707 442.487 230.795C441.78 230.883 439.747 231.06 439.217 230.441C438.687 229.823 437.728 227.849 435.228 227.099C432.728 226.349 430.603 225.724 429.728 226.349C428.853 226.974 429.603 227.724 427.853 227.224C426.103 226.724 424.353 225.974 423.853 226.224C423.353 226.474 421.728 226.224 421.728 226.849C421.728 227.474 422.478 228.474 421.478 228.599C420.478 228.724 419.228 229.224 418.603 229.474C417.978 229.724 418.353 229.974 416.103 229.974C413.853 229.974 411.603 230.349 410.728 229.599C409.853 228.849 409.478 227.974 409.103 227.474C408.728 226.974 407.728 226.474 407.728 226.474H406.478C406.478 226.474 405.103 226.849 404.603 227.474C404.103 228.099 404.103 228.474 403.603 228.849C403.103 229.224 403.103 229.099 402.478 229.849C401.853 230.599 402.353 230.974 401.853 231.599C401.353 232.224 400.978 231.724 400.728 232.599C400.478 233.474 400.728 233.099 400.853 233.974C400.978 234.849 401.603 234.849 400.853 235.849C400.853 235.849 401.915 238.037 402.353 239.099C402.79 240.162 404.228 240.724 403.103 241.099C401.978 241.474 400.603 241.537 400.853 242.537C401.103 243.537 403.478 245.912 404.165 247.099C404.853 248.287 404.353 250.974 405.478 251.974C406.603 252.974 408.353 253.849 408.978 253.849C409.603 253.849 411.478 252.474 411.728 253.724C411.978 254.974 411.478 257.349 412.228 257.474C412.978 257.599 414.728 258.474 415.103 257.849C415.478 257.224 413.85 255.455 415.087 254.925C416.324 254.395 415.087 251.92 417.739 253.157C420.39 254.395 420.39 255.278 421.981 255.455C423.572 255.632 424.633 255.102 425.694 255.278C426.754 255.455 427.992 256.516 428.345 255.278C428.699 254.041 429.583 253.334 430.467 253.334C431.35 253.334 433.295 252.804 433.649 253.864C434.002 254.925 433.118 256.162 433.295 257.223C433.472 258.284 434.532 258.637 434.179 264.648C433.825 270.658 435.24 273.663 434.356 274.194C433.472 274.724 432.234 276.315 432.588 277.199C432.941 278.083 434.356 281.088 434.532 283.209C434.709 285.331 435.416 285.861 435.593 286.922C435.77 287.982 434.356 288.159 435.77 289.927C437.184 291.695 440.189 292.755 440.012 293.993C439.836 295.23 441.957 295.76 442.841 296.998C443.725 298.235 445.139 301.771 445.493 303.362C445.846 304.953 447.084 302.655 447.791 305.306C448.498 307.958 450.619 307.604 451.149 309.549C451.68 311.493 453.603 313.349 454.603 313.849C455.603 314.349 458.853 315.099 458.603 316.849C458.353 318.599 461.353 320.349 461.353 321.599C461.353 322.849 461.103 325.349 461.103 325.349C461.103 325.349 460.603 325.849 461.603 326.849C462.603 327.849 463.353 328.599 463.603 330.099C463.853 331.599 464.853 331.349 464.853 331.349C464.853 331.349 474.603 330.349 477.853 329.349C481.103 328.349 485.103 326.599 485.103 325.599C485.103 324.599 485.103 324.849 486.603 324.349C488.103 323.849 489.103 321.849 489.103 321.849L490.603 320.599C490.603 320.599 490.853 318.599 492.103 318.849C493.353 319.099 494.853 319.849 494.853 318.849C494.853 317.849 494.103 319.099 497.103 314.099C500.103 309.099 500.603 307.349 500.353 306.349C500.103 305.349 500.103 305.349 501.103 304.599C502.103 303.849 502.603 301.349 502.603 301.349L502.103 299.099L503.103 296.849C503.103 296.849 504.536 292.932 503.299 292.402C502.061 291.871 502.238 291.518 502.238 290.103C502.238 288.689 500.647 287.805 500.647 287.805C500.647 287.805 500.647 288.336 499.233 287.805C497.818 287.275 496.051 285.684 496.051 285.684C496.051 285.684 494.46 286.391 494.283 285.331C494.106 284.27 494.636 282.679 493.753 283.209C492.869 283.74 491.808 283.563 491.278 284.27C490.747 284.977 491.985 286.038 488.803 286.038C485.621 286.038 484.914 287.098 484.207 285.861C483.5 284.623 483.5 284.623 483.146 283.209C482.792 281.795 483.853 282.502 482.262 281.441C480.671 280.381 480.318 280.381 480.318 279.497C480.318 278.613 479.787 278.083 479.787 278.083C479.787 278.083 478.55 278.79 478.02 277.376C477.489 275.961 478.727 275.077 477.312 273.84C475.898 272.603 475.898 272.426 475.368 271.365C474.838 270.305 474.307 269.597 474.307 269.597C474.307 269.597 473.07 268.89 473.6 268.183C474.13 267.476 473.777 267.299 475.368 267.123C476.959 266.946 477.312 266.592 478.02 266.062C478.727 265.532 478.373 265.178 479.611 265.001C480.848 264.824 481.025 263.764 481.555 265.178C482.085 266.592 481.909 267.123 481.909 269.067C481.909 271.012 481.732 272.426 482.262 273.486C482.792 274.547 483.146 275.077 483.323 275.785C483.5 276.492 483.676 277.022 483.676 277.022C483.676 277.022 483.853 277.199 484.737 277.199C485.621 277.199 485.798 276.492 486.151 277.376C486.505 278.259 486.151 277.906 486.682 278.613C487.212 279.32 487.035 279.674 487.919 279.32C488.803 278.967 488.98 278.083 489.864 278.436C490.747 278.79 491.455 278.967 491.455 278.967C491.455 278.967 492.692 279.143 492.692 278.083C492.692 277.022 492.515 276.492 493.046 275.785C493.576 275.077 493.929 273.31 494.99 275.608C496.051 277.906 495.52 278.259 496.051 279.143C496.581 280.027 496.935 280.734 497.995 280.381C499.056 280.027 499.586 280.027 500.293 279.32C501 278.613 501.708 278.259 501.708 278.259C501.708 278.259 501.531 276.492 502.591 276.138C503.652 275.785 504.89 274.724 504.89 274.724L506.127 273.31L507.188 271.896C507.188 271.896 509.132 271.896 509.839 271.896C509.839 271.896 508.733 267.784 508.579 266.246C508.425 264.709 506.58 264.555 507.195 263.326C507.81 262.096 508.425 260.559 507.503 259.636C506.58 258.714 505.043 257.792 505.043 256.562C505.043 255.332 505.504 255.332 504.736 254.103C503.967 252.873 503.506 251.489 503.506 250.721C503.506 249.952 503.541 249.16 503.045 247.954C502.4 246.385 500.673 247.927 501.047 245.187C501.941 238.628 501.91 236.945 501.892 236.963C501.874 236.981 502.211 234.697 502.211 234.697C502.211 234.697 501.016 234.262 500.907 233.828C500.798 233.393 499.603 231.762 499.113 231.382C498.624 231.001 496.994 231.219 496.722 231.164C496.45 231.11 495.581 230.947 495.2 230.404C494.82 229.86 494.82 229.099 494.657 228.828C494.494 228.556 494.168 228.067 493.407 227.306C492.646 226.545 492.266 226.382 491.722 226.273C491.179 226.165 490.581 226.273 489.983 225.73C489.385 225.186 488.842 225.621 487.972 225.567C487.103 225.512 486.287 226.925 485.853 227.088C485.418 227.251 484.494 227.197 483.57 226.654C483.19 226.545 482.537 226.491 482.537 226.491L482.262 227.878Z"
                className={getCountryClass("middle-east")}
                fill={getFill("middle-east")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_15">
                <path
                  id="Middle east"
                  d="M443.814 264.636H444.952L446.153 267.568H446.204L447.406 264.636H448.544V269H447.649V266.16H447.613L446.484 268.979H445.874L444.745 266.149H444.709V269H443.814V264.636ZM449.287 269V265.727H450.195V269H449.287ZM449.743 265.305C449.608 265.305 449.492 265.261 449.396 265.171C449.301 265.08 449.253 264.972 449.253 264.845C449.253 264.72 449.301 264.613 449.396 264.523C449.492 264.433 449.608 264.387 449.743 264.387C449.878 264.387 449.993 264.433 450.088 264.523C450.185 264.613 450.233 264.72 450.233 264.845C450.233 264.972 450.185 265.08 450.088 265.171C449.993 265.261 449.878 265.305 449.743 265.305ZM452.128 269.053C451.879 269.053 451.654 268.989 451.452 268.862C451.252 268.732 451.093 268.543 450.975 268.293C450.859 268.041 450.8 267.733 450.8 267.368C450.8 266.993 450.861 266.681 450.981 266.433C451.102 266.183 451.263 265.996 451.463 265.872C451.665 265.747 451.886 265.685 452.126 265.685C452.309 265.685 452.462 265.716 452.584 265.778C452.707 265.839 452.807 265.916 452.882 266.009C452.959 266.099 453.017 266.189 453.057 266.277H453.084V264.636H453.99V269H453.095V268.476H453.057C453.014 268.567 452.954 268.657 452.876 268.746C452.799 268.835 452.699 268.908 452.575 268.966C452.453 269.024 452.304 269.053 452.128 269.053ZM452.415 268.331C452.562 268.331 452.685 268.291 452.786 268.212C452.888 268.131 452.967 268.018 453.021 267.873C453.076 267.728 453.104 267.558 453.104 267.364C453.104 267.169 453.077 267 453.023 266.857C452.969 266.713 452.891 266.602 452.788 266.524C452.686 266.446 452.562 266.407 452.415 266.407C452.266 266.407 452.141 266.447 452.038 266.528C451.936 266.609 451.859 266.722 451.806 266.865C451.753 267.009 451.727 267.175 451.727 267.364C451.727 267.554 451.753 267.722 451.806 267.869C451.86 268.013 451.937 268.127 452.038 268.21C452.141 268.29 452.266 268.331 452.415 268.331ZM455.942 269.053C455.694 269.053 455.468 268.989 455.267 268.862C455.066 268.732 454.907 268.543 454.79 268.293C454.673 268.041 454.615 267.733 454.615 267.368C454.615 266.993 454.675 266.681 454.796 266.433C454.917 266.183 455.077 265.996 455.277 265.872C455.479 265.747 455.7 265.685 455.94 265.685C456.123 265.685 456.276 265.716 456.398 265.778C456.522 265.839 456.621 265.916 456.696 266.009C456.773 266.099 456.831 266.189 456.871 266.277H456.899V264.636H457.804V269H456.91V268.476H456.871C456.829 268.567 456.768 268.657 456.69 268.746C456.613 268.835 456.513 268.908 456.39 268.966C456.267 269.024 456.118 269.053 455.942 269.053ZM456.23 268.331C456.376 268.331 456.5 268.291 456.601 268.212C456.703 268.131 456.781 268.018 456.835 267.873C456.89 267.728 456.918 267.558 456.918 267.364C456.918 267.169 456.891 267 456.837 266.857C456.783 266.713 456.705 266.602 456.603 266.524C456.5 266.446 456.376 266.407 456.23 266.407C456.081 266.407 455.955 266.447 455.853 266.528C455.75 266.609 455.673 266.722 455.62 266.865C455.568 267.009 455.542 267.175 455.542 267.364C455.542 267.554 455.568 267.722 455.62 267.869C455.674 268.013 455.752 268.127 455.853 268.21C455.955 268.29 456.081 268.331 456.23 268.331ZM459.458 264.636V269H458.551V264.636H459.458ZM461.677 269.064C461.34 269.064 461.051 268.996 460.808 268.859C460.566 268.722 460.38 268.527 460.249 268.276C460.119 268.023 460.053 267.724 460.053 267.379C460.053 267.042 460.119 266.746 460.249 266.492C460.38 266.238 460.564 266.04 460.801 265.898C461.04 265.756 461.32 265.685 461.641 265.685C461.857 265.685 462.058 265.719 462.244 265.789C462.431 265.857 462.595 265.96 462.734 266.098C462.874 266.236 462.984 266.409 463.062 266.618C463.14 266.825 463.179 267.068 463.179 267.347V267.596H460.416V267.033H462.325C462.325 266.903 462.296 266.787 462.239 266.686C462.183 266.585 462.104 266.506 462.003 266.45C461.903 266.391 461.788 266.362 461.656 266.362C461.518 266.362 461.396 266.394 461.289 266.458C461.184 266.521 461.102 266.605 461.042 266.712C460.982 266.817 460.952 266.934 460.95 267.063V267.598C460.95 267.76 460.98 267.9 461.04 268.018C461.101 268.136 461.187 268.227 461.298 268.29C461.408 268.354 461.54 268.386 461.692 268.386C461.793 268.386 461.885 268.372 461.969 268.344C462.053 268.315 462.124 268.273 462.184 268.216C462.244 268.159 462.289 268.089 462.32 268.007L463.16 268.062C463.117 268.264 463.03 268.44 462.898 268.591C462.767 268.74 462.598 268.857 462.391 268.94C462.185 269.023 461.947 269.064 461.677 269.064ZM466.652 269.064C466.315 269.064 466.025 268.996 465.782 268.859C465.541 268.722 465.355 268.527 465.224 268.276C465.093 268.023 465.028 267.724 465.028 267.379C465.028 267.042 465.093 266.746 465.224 266.492C465.355 266.238 465.539 266.04 465.776 265.898C466.014 265.756 466.294 265.685 466.615 265.685C466.831 265.685 467.032 265.719 467.218 265.789C467.406 265.857 467.569 265.96 467.708 266.098C467.849 266.236 467.958 266.409 468.036 266.618C468.115 266.825 468.154 267.068 468.154 267.347V267.596H465.39V267.033H467.299C467.299 266.903 467.271 266.787 467.214 266.686C467.157 266.585 467.078 266.506 466.978 266.45C466.878 266.391 466.762 266.362 466.63 266.362C466.492 266.362 466.37 266.394 466.264 266.458C466.159 266.521 466.076 266.605 466.017 266.712C465.957 266.817 465.926 266.934 465.925 267.063V267.598C465.925 267.76 465.955 267.9 466.014 268.018C466.076 268.136 466.161 268.227 466.272 268.29C466.383 268.354 466.514 268.386 466.666 268.386C466.767 268.386 466.86 268.372 466.943 268.344C467.027 268.315 467.099 268.273 467.159 268.216C467.218 268.159 467.264 268.089 467.295 268.007L468.134 268.062C468.092 268.264 468.005 268.44 467.872 268.591C467.742 268.74 467.573 268.857 467.365 268.94C467.159 269.023 466.921 269.064 466.652 269.064ZM469.679 269.062C469.47 269.062 469.284 269.026 469.121 268.953C468.958 268.879 468.828 268.771 468.733 268.627C468.639 268.482 468.593 268.302 468.593 268.086C468.593 267.904 468.626 267.751 468.693 267.628C468.759 267.504 468.85 267.405 468.965 267.33C469.081 267.254 469.211 267.197 469.358 267.159C469.505 267.121 469.66 267.094 469.822 267.078C470.012 267.058 470.166 267.04 470.282 267.023C470.399 267.004 470.483 266.977 470.536 266.942C470.588 266.906 470.615 266.854 470.615 266.784V266.771C470.615 266.636 470.572 266.532 470.487 266.458C470.403 266.384 470.284 266.347 470.129 266.347C469.965 266.347 469.835 266.384 469.739 266.456C469.642 266.527 469.578 266.616 469.547 266.724L468.708 266.656C468.75 266.457 468.834 266.286 468.959 266.141C469.084 265.994 469.245 265.882 469.443 265.804C469.642 265.724 469.872 265.685 470.133 265.685C470.315 265.685 470.489 265.706 470.655 265.749C470.823 265.791 470.971 265.857 471.1 265.947C471.231 266.036 471.334 266.151 471.409 266.292C471.485 266.431 471.522 266.598 471.522 266.793V269H470.661V268.546H470.636C470.583 268.648 470.513 268.739 470.425 268.817C470.337 268.893 470.231 268.954 470.108 268.998C469.984 269.04 469.841 269.062 469.679 269.062ZM469.939 268.435C470.073 268.435 470.191 268.409 470.293 268.357C470.395 268.303 470.475 268.23 470.534 268.139C470.592 268.048 470.621 267.945 470.621 267.83V267.483C470.593 267.501 470.554 267.518 470.504 267.534C470.456 267.548 470.401 267.562 470.34 267.575C470.279 267.586 470.218 267.597 470.157 267.607C470.095 267.615 470.04 267.623 469.99 267.63C469.884 267.646 469.791 267.67 469.711 267.705C469.632 267.739 469.57 267.785 469.526 267.843C469.482 267.9 469.46 267.971 469.46 268.056C469.46 268.18 469.505 268.274 469.594 268.339C469.685 268.403 469.8 268.435 469.939 268.435ZM474.949 266.661L474.119 266.712C474.104 266.641 474.074 266.577 474.027 266.52C473.98 266.462 473.918 266.415 473.842 266.381C473.766 266.346 473.676 266.328 473.571 266.328C473.43 266.328 473.312 266.358 473.215 266.418C473.119 266.476 473.07 266.554 473.07 266.652C473.07 266.73 473.101 266.796 473.164 266.85C473.226 266.904 473.334 266.947 473.486 266.98L474.078 267.099C474.396 267.165 474.633 267.27 474.79 267.415C474.946 267.56 475.024 267.75 475.024 267.986C475.024 268.2 474.961 268.388 474.834 268.55C474.709 268.712 474.538 268.839 474.319 268.93C474.101 269.019 473.851 269.064 473.567 269.064C473.133 269.064 472.788 268.974 472.531 268.793C472.275 268.612 472.126 268.364 472.082 268.052L472.974 268.005C473.001 268.137 473.067 268.238 473.17 268.308C473.274 268.376 473.407 268.41 473.569 268.41C473.728 268.41 473.856 268.379 473.952 268.318C474.05 268.256 474.1 268.175 474.101 268.077C474.1 267.995 474.065 267.928 473.997 267.875C473.929 267.821 473.824 267.78 473.682 267.751L473.115 267.638C472.795 267.575 472.557 267.464 472.401 267.306C472.246 267.148 472.169 266.947 472.169 266.703C472.169 266.493 472.226 266.312 472.339 266.16C472.454 266.008 472.616 265.891 472.823 265.808C473.032 265.726 473.276 265.685 473.556 265.685C473.969 265.685 474.295 265.772 474.532 265.947C474.771 266.121 474.91 266.359 474.949 266.661ZM477.336 265.727V266.409H475.366V265.727H477.336ZM475.813 264.943H476.721V267.994C476.721 268.078 476.733 268.143 476.759 268.19C476.785 268.236 476.82 268.268 476.866 268.286C476.912 268.305 476.966 268.314 477.027 268.314C477.07 268.314 477.113 268.31 477.155 268.303C477.198 268.295 477.231 268.288 477.253 268.284L477.396 268.96C477.351 268.974 477.287 268.99 477.204 269.009C477.122 269.028 477.022 269.04 476.904 269.045C476.685 269.053 476.493 269.024 476.329 268.957C476.165 268.891 476.038 268.787 475.947 268.646C475.856 268.506 475.812 268.328 475.813 268.114V264.943Z"
                  fill="black"
                ></path>
                <g id="Army_15">
                  <circle
                    id="armycircle_15"
                    cx="461"
                    cy="278"
                    r="5.5"
                    fill={getCircleFill("middle-east")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("middle-east")}
                  ></circle>
                  {getArmyNum("middle-east", "461", "278")}
                </g>
              </g>
            </g>
            <g id="india">
              <path
                id="india_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M531.016 220.349C531.016 221.219 529.929 222.849 528.733 224.154C527.537 225.458 523.842 224.914 523.842 224.914C523.842 224.914 521.124 223.393 520.146 222.414C519.168 221.436 518.298 222.306 516.776 222.414C515.255 222.523 515.363 225.349 514.929 226.328C514.494 227.306 512.972 226.98 512.211 226.871C511.45 226.762 509.168 227.523 508.624 227.632C508.081 227.741 508.081 228.936 508.081 229.697C508.081 230.458 505.798 231.98 505.363 233.175C504.929 234.371 502.157 234.86 502.266 234.697C502.374 234.534 501.874 236.981 501.892 236.963C501.91 236.945 501.941 238.628 501.047 245.187C500.673 247.927 502.4 246.385 503.045 247.954C503.541 249.16 503.506 249.952 503.506 250.721C503.506 251.489 503.967 252.873 504.736 254.103C505.504 255.332 505.043 255.332 505.043 256.562C505.043 257.792 506.58 258.714 507.503 259.636C508.425 260.559 507.81 262.096 507.195 263.326C506.58 264.555 508.425 264.709 508.579 266.246C508.733 267.784 509.731 271.732 509.812 271.868C510.601 272.004 511.254 271.012 511.961 270.835C512.668 270.658 514.966 269.951 515.319 271.188C515.673 272.426 515.496 274.37 515.85 275.077C516.203 275.785 518.501 276.668 518.501 276.668C518.501 276.668 519.208 276.668 519.916 276.668C520.623 276.668 520.976 275.785 521.153 277.022C521.33 278.259 520.976 278.79 521.33 279.497C521.683 280.204 523.981 280.204 523.981 280.204C523.981 280.204 526.28 280.204 525.219 281.265C524.158 282.325 523.451 282.502 523.098 283.209C522.744 283.916 522.037 284.093 522.921 284.447C523.805 284.8 523.628 283.916 524.335 285.154C525.042 286.391 524.865 286.038 525.396 286.745C525.926 287.452 525.042 287.629 526.633 287.805C528.224 287.982 528.754 287.805 528.754 287.805L529.462 286.038C529.462 286.038 530.345 284.8 531.053 286.214C531.76 287.629 531.061 287.598 530.885 289.366C530.708 291.134 530.531 292.88 530.531 294.118C530.531 295.355 529.781 296.062 529.958 297.3C530.135 298.537 530.385 299.317 530.385 300.732C530.385 302.146 531.76 301.594 531.76 302.831C531.76 304.069 531.583 304.422 532.29 305.13C532.997 305.837 533.765 307.376 533.765 308.083C533.765 308.79 534.45 309.07 534.45 310.308C534.45 311.545 534.399 312.679 535.106 313.033C535.813 313.386 536.968 313.584 536.968 314.999C536.968 316.413 538.124 317.931 538.124 317.931C538.124 317.931 538.684 319.211 538.684 319.918C538.684 320.625 539.891 321.039 539.891 321.747C539.891 322.454 541.306 321.747 542.189 326.52C543.073 331.292 543.604 328.287 545.018 332.353C546.432 336.419 547.139 337.48 548.023 337.48C548.907 337.48 549.968 337.126 550.144 336.242C550.321 335.358 550.144 335.358 551.028 335.005C551.912 334.651 551.735 334.828 551.912 333.767C552.089 332.707 551.205 332.53 551.559 331.823C551.912 331.116 551.028 329.701 552.442 329.701C553.857 329.701 554.917 328.464 554.917 328.464C554.917 328.464 554.387 327.757 554.387 326.873C554.387 325.989 553.68 328.641 554.387 324.752C555.094 320.863 555.448 320.156 555.271 317.857C555.094 315.559 554.21 316.62 555.271 313.615C556.332 310.61 556.862 312.024 556.862 309.726C556.862 307.428 557.923 304.953 558.099 303.539C558.276 302.124 558.806 303.185 558.806 301.594C558.806 300.003 557.923 299.119 558.983 298.058C560.044 296.998 561.458 296.644 561.458 295.407C561.458 294.169 561.458 293.639 561.458 292.755C561.458 291.871 561.812 290.103 561.812 290.103C561.812 290.103 564.11 289.927 563.579 288.866C563.049 287.805 563.226 286.568 563.579 285.684C563.933 284.8 564.978 281.099 566.478 282.099C567.978 283.099 568.478 283.099 568.478 283.099C568.478 283.099 569.853 281.724 569.728 281.099C569.603 280.474 570.228 279.349 570.228 279.349C570.228 279.349 570.478 277.599 570.978 277.474C571.478 277.349 573.853 277.224 573.853 277.224C573.853 277.224 573.448 273.394 574.37 273.317C575.293 273.241 575.754 273.394 575.985 272.395C576.215 271.396 576.984 270.397 577.522 270.166C578.06 269.936 578.213 267.553 578.213 267.553L579.981 266.938C579.981 266.938 580.442 263.018 581.134 262.327C581.826 261.635 582.825 259.79 582.825 259.79C582.825 259.79 580.289 252.796 579.904 252.412C579.52 252.027 570.143 251.874 570.066 252.181C569.989 252.489 568.913 253.949 568.452 253.949C567.991 253.949 566.761 252.642 566.761 252.642C566.761 252.642 567.146 249.03 566.838 248.646C566.531 248.261 563.918 247.262 563.61 247.416C563.303 247.569 562.688 249.568 562.227 249.568C561.766 249.568 558.537 247.8 558.23 246.57C557.923 245.341 558.845 245.341 557.461 245.264C556.078 245.187 557.154 246.647 555.079 246.186C553.004 245.725 552.773 245.417 552.466 245.11C552.158 244.803 551.236 243.65 550.16 243.65C549.084 243.65 546.932 242.497 546.778 242.112C546.624 241.728 546.24 241.267 545.932 240.883C545.625 240.498 545.625 239.192 545.164 238.808C544.703 238.423 543.089 239.73 542.704 239.807C542.32 239.884 541.013 239.346 541.244 238.577C541.475 237.808 541.859 236.809 542.32 236.579C542.781 236.348 543.704 235.579 543.78 235.041C543.857 234.503 544.165 234.273 544.318 233.043C544.472 231.813 543.78 228.969 543.627 228.047C543.473 227.125 543.473 224.281 543.473 224.281C543.473 224.281 543.55 223.205 543.55 222.898C543.55 222.59 543.78 221.898 543.78 221.898C543.78 221.898 542.397 222.283 542.09 222.36C541.782 222.436 538.708 222.436 538.4 222.436C538.093 222.436 536.402 221.514 536.325 221.207C536.248 220.899 536.095 219.132 535.941 218.824C535.787 218.517 535.71 217.441 535.403 217.748L534.019 219.746L534.096 219.9C532.175 220.899 531.099 220.515 531.016 220.349Z"
                className={getCountryClass("india")}
                fill={getFill("india")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_16">
                <path
                  id="India"
                  d="M540.13 256.636V261H539.207V256.636H540.13ZM541.78 259.108V261H540.872V257.727H541.737V258.305H541.775C541.848 258.114 541.969 257.964 542.14 257.853C542.31 257.741 542.517 257.685 542.76 257.685C542.987 257.685 543.185 257.734 543.354 257.834C543.523 257.933 543.655 258.075 543.748 258.26C543.842 258.443 543.889 258.662 543.889 258.916V261H542.981V259.078C542.983 258.878 542.932 258.722 542.828 258.609C542.724 258.496 542.581 258.439 542.4 258.439C542.278 258.439 542.17 258.465 542.076 258.518C541.983 258.57 541.911 258.647 541.858 258.748C541.807 258.847 541.781 258.967 541.78 259.108ZM545.81 261.053C545.562 261.053 545.337 260.989 545.135 260.862C544.935 260.732 544.776 260.543 544.658 260.293C544.541 260.041 544.483 259.733 544.483 259.368C544.483 258.993 544.543 258.681 544.664 258.433C544.785 258.183 544.945 257.996 545.146 257.872C545.347 257.747 545.568 257.685 545.808 257.685C545.991 257.685 546.144 257.716 546.266 257.778C546.39 257.839 546.489 257.916 546.565 258.009C546.641 258.099 546.7 258.189 546.739 258.277H546.767V256.636H547.673V261H546.778V260.476H546.739C546.697 260.567 546.636 260.657 546.558 260.746C546.482 260.835 546.381 260.908 546.258 260.966C546.136 261.024 545.987 261.053 545.81 261.053ZM546.098 260.331C546.244 260.331 546.368 260.291 546.469 260.212C546.571 260.131 546.649 260.018 546.703 259.873C546.759 259.728 546.786 259.558 546.786 259.364C546.786 259.169 546.759 259 546.705 258.857C546.651 258.713 546.573 258.602 546.471 258.524C546.369 258.446 546.244 258.407 546.098 258.407C545.949 258.407 545.823 258.447 545.721 258.528C545.619 258.609 545.541 258.722 545.489 258.865C545.436 259.009 545.41 259.175 545.41 259.364C545.41 259.554 545.436 259.722 545.489 259.869C545.543 260.013 545.62 260.127 545.721 260.21C545.823 260.29 545.949 260.331 546.098 260.331ZM548.419 261V257.727H549.327V261H548.419ZM548.875 257.305C548.74 257.305 548.624 257.261 548.528 257.171C548.432 257.08 548.385 256.972 548.385 256.845C548.385 256.72 548.432 256.613 548.528 256.523C548.624 256.433 548.74 256.387 548.875 256.387C549.01 256.387 549.125 256.433 549.22 256.523C549.317 256.613 549.365 256.72 549.365 256.845C549.365 256.972 549.317 257.08 549.22 257.171C549.125 257.261 549.01 257.305 548.875 257.305ZM550.987 261.062C550.778 261.062 550.592 261.026 550.429 260.953C550.265 260.879 550.136 260.771 550.041 260.627C549.947 260.482 549.9 260.302 549.9 260.086C549.9 259.904 549.934 259.751 550 259.628C550.067 259.504 550.158 259.405 550.273 259.33C550.388 259.254 550.519 259.197 550.665 259.159C550.813 259.121 550.968 259.094 551.13 259.078C551.32 259.058 551.473 259.04 551.59 259.023C551.706 259.004 551.791 258.977 551.843 258.942C551.896 258.906 551.922 258.854 551.922 258.784V258.771C551.922 258.636 551.88 258.532 551.794 258.458C551.711 258.384 551.591 258.347 551.436 258.347C551.273 258.347 551.143 258.384 551.047 258.456C550.95 258.527 550.886 258.616 550.855 258.724L550.015 258.656C550.058 258.457 550.142 258.286 550.267 258.141C550.392 257.994 550.553 257.882 550.75 257.804C550.949 257.724 551.179 257.685 551.441 257.685C551.623 257.685 551.797 257.706 551.963 257.749C552.13 257.791 552.279 257.857 552.408 257.947C552.539 258.036 552.642 258.151 552.717 258.292C552.792 258.431 552.83 258.598 552.83 258.793V261H551.969V260.546H551.944C551.891 260.648 551.821 260.739 551.733 260.817C551.645 260.893 551.539 260.954 551.415 260.998C551.292 261.04 551.149 261.062 550.987 261.062ZM551.247 260.435C551.38 260.435 551.498 260.409 551.6 260.357C551.703 260.303 551.783 260.23 551.841 260.139C551.9 260.048 551.929 259.945 551.929 259.83V259.483C551.9 259.501 551.861 259.518 551.811 259.534C551.763 259.548 551.708 259.562 551.647 259.575C551.586 259.586 551.525 259.597 551.464 259.607C551.403 259.615 551.348 259.623 551.298 259.63C551.191 259.646 551.098 259.67 551.019 259.705C550.939 259.739 550.877 259.785 550.833 259.843C550.789 259.9 550.767 259.971 550.767 260.056C550.767 260.18 550.812 260.274 550.902 260.339C550.993 260.403 551.108 260.435 551.247 260.435Z"
                  fill="black"
                ></path>
                <g id="Army_16">
                  <circle
                    id="armycircle_16"
                    cx="546"
                    cy="270"
                    r="5.5"
                    fill={getCircleFill("india")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("india")}
                  ></circle>
                  {getArmyNum("india", "546", "270")}
                </g>
              </g>
            </g>
            <g id="afghanistan">
              <path
                id="afghanistan_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M537.211 181.654L537.103 181.436C536.45 180.893 536.233 179.697 535.363 179.262C534.494 178.828 534.168 178.828 534.059 177.958C533.95 177.088 533.624 175.784 533.624 175.784C533.624 175.784 532.537 174.154 531.994 174.154C531.45 174.154 529.277 174.697 528.842 174.371C528.407 174.045 526.342 174.262 525.581 173.61C524.82 172.958 524.711 172.414 523.733 172.849C522.755 173.284 521.016 173.393 521.016 173.393L519.385 172.306C519.385 172.306 518.516 171.98 517.646 171.436C516.777 170.893 516.668 169.588 516.342 169.045C516.016 168.501 515.364 167.632 514.929 167.306C514.494 166.98 514.059 166.328 513.516 165.784C512.972 165.241 512.32 164.915 511.559 164.697C510.798 164.48 510.146 164.371 509.929 163.719C509.711 163.067 509.929 162.523 509.494 162.414C509.059 162.306 507.972 161.871 507.972 161.871C507.972 161.871 507.864 160.349 507.32 160.023C506.777 159.697 505.69 158.828 505.037 158.501C504.385 158.175 503.624 158.067 503.407 157.197C503.19 156.328 502.863 156.001 502.863 156.001C502.863 156.001 501.559 155.132 501.342 154.588C501.124 154.045 500.472 152.958 500.472 152.958L499.059 151.436L497.429 150.893L495.397 150.764L494.849 151.241C493.789 151.772 494.322 151.703 493.438 152.056C492.554 152.41 489.372 152.41 489.196 153.647C489.019 154.885 488.842 155.238 488.135 156.652C487.428 158.067 487.251 158.42 486.367 158.597C485.483 158.774 485.13 158.597 484.246 158.42C483.362 158.243 481.771 157.536 481.771 157.536L480.357 157.359L479.119 156.122C479.119 156.122 478.412 156.652 477.705 157.006C476.998 157.359 475.407 158.774 475.407 158.774C475.407 158.774 472.932 159.481 472.225 159.481C471.518 159.481 471.518 159.304 470.811 159.481C470.104 159.658 468.866 159.481 468.336 160.188C467.806 160.895 469.043 161.602 466.391 161.779C463.74 161.956 463.74 161.956 463.033 161.956C462.326 161.956 461.088 165.668 461.088 165.668C461.088 165.668 462.502 166.905 461.442 167.259C460.381 167.612 459.674 168.673 459.144 169.38C458.613 170.087 458.26 170.618 458.436 171.502C458.613 172.385 458.437 172.916 458.79 173.976C459.144 175.037 460.027 177.158 460.027 177.158C460.027 177.158 460.735 177.512 460.558 178.573C460.381 179.633 459.851 180.164 460.381 181.048C460.911 181.931 461.972 182.285 461.972 182.285L463.033 183.699C463.033 183.699 464.447 183.346 464.447 184.583C464.447 185.82 464.624 186.351 464.8 187.765C464.8 187.765 465.822 189.164 466.529 188.634C467.236 188.103 468.474 187.219 468.474 186.159C468.474 185.098 468.297 184.745 469.181 184.568C470.065 184.391 470.595 184.391 471.479 184.037C472.363 183.684 472.009 183.684 473.07 183.684C474.13 183.684 473.954 183.154 474.484 184.214C475.014 185.275 474.307 184.568 474.661 186.159C475.014 187.75 475.191 187.573 475.368 188.634C475.545 189.694 475.368 189.341 475.014 190.755C474.661 192.169 474.661 192.346 473.777 192.7C472.893 193.053 471.125 193.937 470.948 195.351C470.772 196.765 470.948 194.998 471.125 197.296C471.302 199.594 471.302 200.301 472.009 200.654C472.716 201.008 472.893 200.831 472.893 201.892C472.893 202.953 472.363 203.306 473.6 203.483C474.838 203.66 475.721 203.306 475.721 203.306C475.721 203.306 478.02 203.66 477.489 205.074C476.959 206.488 475.898 205.604 476.605 207.195C477.312 208.786 477.489 207.549 477.666 209.317C477.843 211.084 477.136 211.615 478.02 211.615C478.903 211.615 480.494 212.322 480.494 212.322L480.671 214.62L481.025 216.034C481.025 216.034 478.727 215.15 479.08 216.741C479.434 218.332 479.787 218.332 479.787 218.332C479.787 218.332 482.085 218.155 482.085 219.746C482.085 221.337 481.732 221.868 481.909 222.752C482.085 223.635 482.969 222.928 482.793 224.166C482.793 224.166 482.646 226.11 483.57 226.654C484.494 227.197 485.418 227.251 485.853 227.088C486.287 226.925 487.103 225.512 487.972 225.567C488.842 225.621 489.385 225.186 489.983 225.73C490.581 226.273 491.179 226.165 491.722 226.273C492.266 226.382 492.646 226.545 493.407 227.306C494.168 228.067 494.494 228.556 494.657 228.828C494.82 229.099 494.82 229.86 495.2 230.404C495.581 230.947 496.45 231.11 496.722 231.164C496.994 231.219 498.624 231.001 499.113 231.382C499.603 231.762 500.798 233.393 500.907 233.828C501.016 234.262 502.211 234.697 502.211 234.697C502.211 234.697 504.929 234.371 505.363 233.175C505.798 231.98 508.081 230.458 508.081 229.697C508.081 228.936 508.081 227.741 508.624 227.632C509.168 227.523 511.45 226.762 512.211 226.871C512.972 226.98 514.494 227.306 514.929 226.328C515.364 225.349 515.255 222.523 516.777 222.414C518.298 222.306 519.168 221.436 520.146 222.414C521.124 223.393 523.842 224.914 523.842 224.914C523.842 224.914 527.537 225.458 528.733 224.154C529.929 222.849 531.016 221.219 531.016 220.349C531.016 219.48 531.342 219.154 531.342 218.175C531.342 217.197 530.472 214.48 530.472 214.48C530.472 214.48 529.711 213.284 529.059 213.067C528.407 212.849 527.429 211.762 527.429 211.762C527.429 211.762 526.668 209.697 526.668 208.828C526.668 207.958 527.103 204.371 527.646 204.262C528.19 204.154 529.711 203.175 530.581 203.175C531.45 203.175 532.864 203.284 533.298 202.958C533.733 202.632 534.494 198.501 534.929 197.414C535.364 196.328 535.581 195.458 536.342 195.567C537.103 195.675 538.516 195.567 538.407 193.719C538.298 191.871 538.081 188.284 537.32 187.088C536.559 185.893 536.016 185.675 536.45 184.588C536.885 183.501 537.429 183.175 537.429 183.175L537.211 181.654Z"
                className={getCountryClass("afghanistan")}
                fill={getFill("afghanistan")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_17">
                <path
                  id="Afghanistan"
                  d="M485.667 185H484.678L486.184 180.636H487.373L488.877 185H487.889L486.796 181.634H486.762L485.667 185ZM485.605 183.285H487.94V184.005H485.605V183.285ZM491.087 181.727V182.409H489.067V181.727H491.087ZM489.529 185V181.491C489.529 181.254 489.576 181.057 489.668 180.901C489.762 180.744 489.89 180.627 490.051 180.549C490.213 180.471 490.397 180.432 490.603 180.432C490.743 180.432 490.87 180.442 490.985 180.464C491.101 180.485 491.188 180.504 491.245 180.521L491.083 181.203C491.047 181.192 491.003 181.181 490.951 181.171C490.9 181.161 490.847 181.156 490.793 181.156C490.659 181.156 490.566 181.188 490.514 181.25C490.461 181.311 490.435 181.397 490.435 181.508V185H489.529ZM492.999 186.295C492.705 186.295 492.453 186.255 492.242 186.174C492.034 186.094 491.867 185.986 491.744 185.848C491.62 185.71 491.54 185.555 491.503 185.384L492.343 185.271C492.368 185.336 492.409 185.397 492.464 185.454C492.519 185.511 492.593 185.556 492.683 185.59C492.776 185.626 492.888 185.643 493.02 185.643C493.218 185.643 493.38 185.595 493.508 185.499C493.637 185.403 493.702 185.244 493.702 185.019V184.42H493.664C493.624 184.511 493.564 184.597 493.485 184.678C493.405 184.759 493.303 184.825 493.178 184.876C493.053 184.928 492.904 184.953 492.73 184.953C492.485 184.953 492.261 184.896 492.059 184.783C491.859 184.668 491.699 184.492 491.58 184.256C491.462 184.019 491.403 183.719 491.403 183.357C491.403 182.987 491.463 182.677 491.584 182.428C491.705 182.18 491.865 181.994 492.066 181.87C492.267 181.746 492.488 181.685 492.728 181.685C492.911 181.685 493.065 181.716 493.188 181.778C493.312 181.839 493.411 181.916 493.487 182.009C493.563 182.099 493.622 182.189 493.664 182.277H493.698V181.727H494.599V185.032C494.599 185.31 494.531 185.543 494.394 185.731C494.258 185.918 494.069 186.059 493.828 186.153C493.588 186.248 493.311 186.295 492.999 186.295ZM493.018 184.271C493.164 184.271 493.288 184.235 493.389 184.163C493.491 184.089 493.569 183.984 493.623 183.847C493.678 183.71 493.706 183.545 493.706 183.353C493.706 183.161 493.679 182.995 493.625 182.854C493.571 182.712 493.493 182.602 493.391 182.524C493.289 182.446 493.164 182.407 493.018 182.407C492.869 182.407 492.743 182.447 492.641 182.528C492.539 182.608 492.461 182.719 492.409 182.861C492.356 183.003 492.33 183.167 492.33 183.353C492.33 183.542 492.356 183.705 492.409 183.843C492.463 183.979 492.54 184.085 492.641 184.161C492.743 184.234 492.869 184.271 493.018 184.271ZM496.229 183.108V185H495.321V180.636H496.203V182.305H496.242C496.316 182.112 496.435 181.96 496.6 181.851C496.764 181.74 496.971 181.685 497.22 181.685C497.447 181.685 497.645 181.734 497.814 181.834C497.985 181.932 498.117 182.073 498.21 182.258C498.306 182.441 498.352 182.661 498.351 182.916V185H497.443V183.078C497.445 182.876 497.394 182.719 497.29 182.607C497.188 182.495 497.044 182.439 496.86 182.439C496.736 182.439 496.627 182.465 496.531 182.518C496.438 182.57 496.364 182.647 496.31 182.748C496.257 182.847 496.23 182.967 496.229 183.108ZM499.999 185.062C499.79 185.062 499.604 185.026 499.44 184.953C499.277 184.879 499.148 184.771 499.053 184.627C498.959 184.482 498.912 184.302 498.912 184.086C498.912 183.904 498.945 183.751 499.012 183.628C499.079 183.504 499.17 183.405 499.285 183.33C499.4 183.254 499.531 183.197 499.677 183.159C499.825 183.121 499.979 183.094 500.141 183.078C500.332 183.058 500.485 183.04 500.602 183.023C500.718 183.004 500.803 182.977 500.855 182.942C500.908 182.906 500.934 182.854 500.934 182.784V182.771C500.934 182.636 500.891 182.532 500.806 182.458C500.722 182.384 500.603 182.347 500.448 182.347C500.285 182.347 500.155 182.384 500.058 182.456C499.962 182.527 499.898 182.616 499.866 182.724L499.027 182.656C499.07 182.457 499.153 182.286 499.278 182.141C499.403 181.994 499.565 181.882 499.762 181.804C499.961 181.724 500.191 181.685 500.452 181.685C500.634 181.685 500.808 181.706 500.974 181.749C501.142 181.791 501.29 181.857 501.42 181.947C501.55 182.036 501.653 182.151 501.729 182.292C501.804 182.431 501.842 182.598 501.842 182.793V185H500.981V184.546H500.955C500.903 184.648 500.832 184.739 500.744 184.817C500.656 184.893 500.55 184.954 500.427 184.998C500.303 185.04 500.161 185.062 499.999 185.062ZM500.259 184.435C500.392 184.435 500.51 184.409 500.612 184.357C500.714 184.303 500.795 184.23 500.853 184.139C500.911 184.048 500.94 183.945 500.94 183.83V183.483C500.912 183.501 500.873 183.518 500.823 183.534C500.775 183.548 500.72 183.562 500.659 183.575C500.598 183.586 500.537 183.597 500.476 183.607C500.415 183.615 500.359 183.623 500.31 183.63C500.203 183.646 500.11 183.67 500.031 183.705C499.951 183.739 499.889 183.785 499.845 183.843C499.801 183.9 499.779 183.971 499.779 184.056C499.779 184.18 499.824 184.274 499.913 184.339C500.004 184.403 500.119 184.435 500.259 184.435ZM503.453 183.108V185H502.546V181.727H503.411V182.305H503.449C503.522 182.114 503.643 181.964 503.814 181.853C503.984 181.741 504.191 181.685 504.434 181.685C504.661 181.685 504.859 181.734 505.028 181.834C505.197 181.933 505.328 182.075 505.422 182.26C505.516 182.443 505.563 182.662 505.563 182.916V185H504.655V183.078C504.657 182.878 504.605 182.722 504.502 182.609C504.398 182.496 504.255 182.439 504.074 182.439C503.951 182.439 503.843 182.465 503.75 182.518C503.657 182.57 503.585 182.647 503.532 182.748C503.481 182.847 503.455 182.967 503.453 183.108ZM506.278 185V181.727H507.186V185H506.278ZM506.734 181.305C506.599 181.305 506.483 181.261 506.387 181.171C506.292 181.08 506.244 180.972 506.244 180.845C506.244 180.72 506.292 180.613 506.387 180.523C506.483 180.433 506.599 180.387 506.734 180.387C506.869 180.387 506.984 180.433 507.079 180.523C507.176 180.613 507.224 180.72 507.224 180.845C507.224 180.972 507.176 181.08 507.079 181.171C506.984 181.261 506.869 181.305 506.734 181.305ZM510.636 182.661L509.805 182.712C509.791 182.641 509.76 182.577 509.713 182.52C509.667 182.462 509.605 182.415 509.528 182.381C509.453 182.346 509.363 182.328 509.257 182.328C509.117 182.328 508.998 182.358 508.902 182.418C508.805 182.476 508.757 182.554 508.757 182.652C508.757 182.73 508.788 182.796 508.85 182.85C508.913 182.904 509.02 182.947 509.172 182.98L509.765 183.099C510.083 183.165 510.32 183.27 510.476 183.415C510.632 183.56 510.711 183.75 510.711 183.986C510.711 184.2 510.647 184.388 510.521 184.55C510.396 184.712 510.224 184.839 510.005 184.93C509.788 185.019 509.537 185.064 509.253 185.064C508.82 185.064 508.475 184.974 508.218 184.793C507.962 184.612 507.812 184.364 507.768 184.052L508.661 184.005C508.688 184.137 508.753 184.238 508.857 184.308C508.961 184.376 509.093 184.41 509.255 184.41C509.414 184.41 509.542 184.379 509.639 184.318C509.737 184.256 509.787 184.175 509.788 184.077C509.787 183.995 509.752 183.928 509.684 183.875C509.615 183.821 509.51 183.78 509.368 183.751L508.801 183.638C508.482 183.575 508.244 183.464 508.088 183.306C507.933 183.148 507.855 182.947 507.855 182.703C507.855 182.493 507.912 182.312 508.026 182.16C508.141 182.008 508.302 181.891 508.51 181.808C508.718 181.726 508.963 181.685 509.243 181.685C509.656 181.685 509.981 181.772 510.218 181.947C510.457 182.121 510.596 182.359 510.636 182.661ZM513.023 181.727V182.409H511.052V181.727H513.023ZM511.499 180.943H512.407V183.994C512.407 184.078 512.42 184.143 512.445 184.19C512.471 184.236 512.507 184.268 512.552 184.286C512.599 184.305 512.653 184.314 512.714 184.314C512.757 184.314 512.799 184.31 512.842 184.303C512.884 184.295 512.917 184.288 512.94 184.284L513.083 184.96C513.037 184.974 512.973 184.99 512.891 185.009C512.808 185.028 512.708 185.04 512.59 185.045C512.372 185.053 512.18 185.024 512.015 184.957C511.852 184.891 511.725 184.787 511.634 184.646C511.543 184.506 511.498 184.328 511.499 184.114V180.943ZM514.547 185.062C514.339 185.062 514.153 185.026 513.989 184.953C513.826 184.879 513.697 184.771 513.601 184.627C513.508 184.482 513.461 184.302 513.461 184.086C513.461 183.904 513.494 183.751 513.561 183.628C513.628 183.504 513.719 183.405 513.834 183.33C513.949 183.254 514.079 183.197 514.226 183.159C514.373 183.121 514.528 183.094 514.69 183.078C514.881 183.058 515.034 183.04 515.15 183.023C515.267 183.004 515.351 182.977 515.404 182.942C515.456 182.906 515.483 182.854 515.483 182.784V182.771C515.483 182.636 515.44 182.532 515.355 182.458C515.271 182.384 515.152 182.347 514.997 182.347C514.834 182.347 514.704 182.384 514.607 182.456C514.51 182.527 514.447 182.616 514.415 182.724L513.576 182.656C513.618 182.457 513.702 182.286 513.827 182.141C513.952 181.994 514.113 181.882 514.311 181.804C514.51 181.724 514.74 181.685 515.001 181.685C515.183 181.685 515.357 181.706 515.523 181.749C515.691 181.791 515.839 181.857 515.969 181.947C516.099 182.036 516.202 182.151 516.278 182.292C516.353 182.431 516.39 182.598 516.39 182.793V185H515.53V184.546H515.504C515.452 184.648 515.381 184.739 515.293 184.817C515.205 184.893 515.099 184.954 514.976 184.998C514.852 185.04 514.709 185.062 514.547 185.062ZM514.807 184.435C514.941 184.435 515.059 184.409 515.161 184.357C515.263 184.303 515.344 184.23 515.402 184.139C515.46 184.048 515.489 183.945 515.489 183.83V183.483C515.461 183.501 515.422 183.518 515.372 183.534C515.324 183.548 515.269 183.562 515.208 183.575C515.147 183.586 515.086 183.597 515.025 183.607C514.964 183.615 514.908 183.623 514.858 183.63C514.752 183.646 514.659 183.67 514.579 183.705C514.5 183.739 514.438 183.785 514.394 183.843C514.35 183.9 514.328 183.971 514.328 184.056C514.328 184.18 514.373 184.274 514.462 184.339C514.553 184.403 514.668 184.435 514.807 184.435ZM518.002 183.108V185H517.095V181.727H517.96V182.305H517.998C518.07 182.114 518.192 181.964 518.362 181.853C518.533 181.741 518.74 181.685 518.982 181.685C519.21 181.685 519.408 181.734 519.577 181.834C519.746 181.933 519.877 182.075 519.971 182.26C520.065 182.443 520.112 182.662 520.112 182.916V185H519.204V183.078C519.205 182.878 519.154 182.722 519.051 182.609C518.947 182.496 518.804 182.439 518.622 182.439C518.5 182.439 518.392 182.465 518.298 182.518C518.206 182.57 518.134 182.647 518.081 182.748C518.03 182.847 518.004 182.967 518.002 183.108Z"
                  fill="black"
                ></path>
                <g id="Army_17">
                  <circle
                    id="armycircle_17"
                    cx="503"
                    cy="194"
                    r="5.5"
                    fill={getCircleFill("afghanistan")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("afghanistan")}
                  ></circle>
                  {getArmyNum("afghanistan", "503", "194")}
                </g>
              </g>
            </g>
            <g id="ural">
              <path
                id="ural_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M495.397 150.764C496.457 150.234 495.56 149.228 495.56 147.46C495.56 145.692 495.029 145.515 494.852 144.278C494.676 143.041 494.322 142.687 494.145 141.803C493.969 140.919 495.736 140.035 496.443 138.621C497.151 137.207 496.444 136.677 496.267 135.439C496.09 134.202 494.499 134.202 494.499 134.202L491.317 132.08L489.903 131.373C489.903 131.373 489.726 129.959 489.903 128.368C490.08 126.777 490.963 126.247 491.671 125.009C492.378 123.772 492.378 122.358 492.378 121.474C492.378 120.59 490.61 120.236 490.61 120.236C490.61 120.236 490.61 117.054 490.61 116.17C490.61 115.287 490.61 112.635 490.61 111.397C490.61 110.16 489.903 107.862 489.372 106.978C488.842 106.094 489.903 104.503 489.903 104.503C489.903 104.503 489.019 102.559 488.842 101.675C488.665 100.791 489.903 96.9018 489.903 96.9018L491.847 92.1288L493.085 90.0075C493.085 90.0075 493.085 86.8255 493.615 86.1184C494.145 85.4113 493.969 82.0526 493.969 82.0526C493.969 82.0526 493.262 75.335 492.554 74.8931L493.228 72.5993L492.228 71.7243L491.853 69.2243L489.353 68.5993L489.603 65.2243C489.603 65.2243 491.103 63.7243 491.728 63.7243C492.353 63.7243 490.228 61.5993 489.978 60.7243C489.728 59.8493 489.978 59.4743 490.478 59.2243C490.978 58.9743 490.728 58.2243 490.603 57.2243C490.478 56.2243 490.478 56.0993 490.478 56.0993L491.353 53.5993L494.228 54.5993C494.228 54.5993 494.853 55.5993 495.478 55.7243C496.103 55.8493 496.728 55.7243 497.228 55.7243C497.728 55.7243 497.478 55.8493 498.228 57.3493C498.978 58.8493 498.978 57.3493 500.103 57.5993C501.228 57.8493 501.228 58.9743 501.103 59.7243C500.978 60.4743 500.353 61.0993 499.728 62.2243C499.103 63.3493 499.228 62.9743 498.228 64.0993C497.228 65.2243 499.728 65.9743 499.728 65.9743C499.728 65.9743 499.978 67.4743 500.603 68.3493C501.228 69.2243 500.728 68.5993 501.728 69.0993C502.728 69.5993 501.728 69.9743 501.728 71.3493C501.728 72.7243 502.478 71.5993 502.478 71.5993C502.478 71.5993 502.978 72.2243 503.353 73.4743C503.728 74.7243 503.478 73.9743 504.353 75.8493C505.228 77.7243 505.603 75.7243 505.603 75.7243C505.603 75.7243 506.353 76.3493 506.853 77.3493C507.353 78.3493 509.228 77.9743 509.228 77.9743C509.228 77.9743 510.228 76.9743 510.978 76.3493C511.728 75.7243 511.478 75.9743 512.478 75.5993C513.478 75.2243 512.527 75.746 513.152 77.496C513.777 79.246 513.575 80.554 513.652 81.3225C513.728 82.0911 514.113 82.7829 514.728 82.8597C515.342 82.9366 515.957 83.5514 516.803 84.32C517.648 85.0886 517.648 85.1655 517.956 85.3961C518.263 85.6267 519.647 89.2391 519.647 89.6234C519.647 90.0076 520.185 91.6217 520.261 92.0829C520.338 92.544 520.799 92.0829 521.799 92.0829C522.798 92.0829 523.336 92.6977 523.413 94.0043C523.49 95.3109 523.566 96.2333 523.797 97.1556C524.028 98.0779 523.797 99.2308 523.643 99.9994C523.49 100.768 523.566 101.69 523.72 102.075C523.874 102.459 526.257 103.074 526.564 103.458C526.871 103.842 528.101 104.38 528.409 105.149C528.716 105.918 528.716 106.148 529.023 106.609C529.331 107.07 530.484 107.993 530.791 108.223C531.099 108.454 531.022 109.761 531.406 110.299C531.79 110.837 532.559 111.451 532.866 111.836C533.174 112.22 533.942 114.68 533.481 115.448C533.02 116.217 533.251 117.37 533.02 118.753C532.79 120.137 533.251 119.522 534.711 120.367C536.171 121.213 534.711 120.905 534.788 121.674C534.865 122.442 535.403 122.75 536.094 123.441C536.786 124.133 536.402 124.056 536.479 125.132C536.556 126.208 537.401 126.977 537.939 127.822C538.477 128.668 537.709 128.822 537.247 129.744C536.786 130.666 536.018 130.359 535.019 131.358C534.019 132.357 534.48 133.126 534.48 133.894C534.48 134.663 534.096 136.123 533.404 136.892C532.713 137.66 533.097 135.508 531.944 137.122C530.791 138.737 531.176 140.889 531.329 141.734C531.483 142.579 531.944 142.503 532.252 142.656C532.559 142.81 533.097 142.195 533.712 141.273C534.327 140.351 535.403 140.658 536.018 140.735C536.633 140.812 537.709 141.58 538.323 142.426C538.938 143.271 538.323 145.654 538.247 146.038C538.17 146.422 537.709 147.345 537.632 148.267C537.555 149.189 541.475 149.113 541.475 149.113C541.475 149.113 542.397 151.649 542.781 151.649C543.166 151.649 544.318 151.649 544.549 152.418C544.78 153.186 545.933 155.261 546.701 155.569C547.47 155.876 547.009 156.107 547.009 156.568C547.009 157.029 547.009 157.106 547.931 158.413C548.853 159.719 548.776 162.409 548.776 163.639C548.776 164.869 548.699 164.561 548.546 165.253L546.016 165.458C546.016 165.458 546.668 169.697 546.016 170.023C545.363 170.349 542.211 170.784 542.211 170.784C542.211 170.784 542.103 174.045 541.994 174.588C541.885 175.132 540.363 176.11 540.037 176.654C539.711 177.197 539.385 177.197 539.711 177.849C540.037 178.501 540.255 179.371 540.146 179.806C540.037 180.241 540.69 181.11 539.494 181.328C538.298 181.545 537.755 181.98 537.103 181.436C536.45 180.893 536.233 179.697 535.363 179.262C534.494 178.828 534.168 178.828 534.059 177.958C533.95 177.088 533.624 175.784 533.624 175.784C533.624 175.784 532.537 174.154 531.994 174.154C531.45 174.154 529.277 174.697 528.842 174.371C528.407 174.045 526.342 174.262 525.581 173.61C524.82 172.958 524.711 172.414 523.733 172.849C522.755 173.284 521.016 173.393 521.016 173.393L519.385 172.306C519.385 172.306 518.516 171.98 517.646 171.436C516.777 170.893 516.668 169.588 516.342 169.045C516.016 168.501 515.364 167.632 514.929 167.306C514.494 166.98 514.059 166.328 513.516 165.784C512.972 165.241 512.32 164.915 511.559 164.697C510.798 164.48 510.146 164.371 509.929 163.719C509.711 163.067 509.929 162.523 509.494 162.414C509.059 162.306 507.972 161.871 507.972 161.871C507.972 161.871 507.864 160.349 507.32 160.023C506.777 159.697 505.69 158.828 505.037 158.501C504.385 158.175 503.624 158.067 503.407 157.197C503.19 156.328 502.863 156.001 502.863 156.001C502.863 156.001 501.559 155.132 501.342 154.588C501.124 154.045 500.472 152.958 500.472 152.958L499.059 151.436L497.429 150.893L495.397 150.764Z"
                className={getCountryClass("ural")}
                fill={getFill("ural")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_18">
                <path
                  id="Ural"
                  d="M514.148 116.636H515.07V119.47C515.07 119.788 514.994 120.067 514.842 120.305C514.692 120.544 514.481 120.73 514.21 120.864C513.938 120.996 513.622 121.062 513.261 121.062C512.899 121.062 512.582 120.996 512.311 120.864C512.04 120.73 511.829 120.544 511.678 120.305C511.528 120.067 511.453 119.788 511.453 119.47V116.636H512.375V119.391C512.375 119.558 512.411 119.705 512.484 119.835C512.558 119.964 512.661 120.065 512.795 120.139C512.928 120.213 513.084 120.25 513.261 120.25C513.44 120.25 513.596 120.213 513.728 120.139C513.862 120.065 513.965 119.964 514.037 119.835C514.111 119.705 514.148 119.558 514.148 119.391V116.636ZM515.812 121V117.727H516.692V118.298H516.726C516.786 118.095 516.886 117.942 517.027 117.838C517.168 117.733 517.329 117.68 517.513 117.68C517.558 117.68 517.607 117.683 517.66 117.689C517.712 117.695 517.758 117.702 517.798 117.712V118.518C517.756 118.505 517.697 118.494 517.621 118.484C517.546 118.474 517.477 118.469 517.415 118.469C517.281 118.469 517.162 118.498 517.057 118.556C516.953 118.613 516.871 118.692 516.81 118.795C516.75 118.897 516.72 119.015 516.72 119.148V121H515.812ZM519.107 121.062C518.898 121.062 518.712 121.026 518.549 120.953C518.385 120.879 518.256 120.771 518.161 120.627C518.067 120.482 518.02 120.302 518.02 120.086C518.02 119.904 518.054 119.751 518.12 119.628C518.187 119.504 518.278 119.405 518.393 119.33C518.508 119.254 518.639 119.197 518.785 119.159C518.933 119.121 519.088 119.094 519.25 119.078C519.44 119.058 519.593 119.04 519.71 119.023C519.826 119.004 519.911 118.977 519.964 118.942C520.016 118.906 520.042 118.854 520.042 118.784V118.771C520.042 118.636 520 118.532 519.915 118.458C519.831 118.384 519.711 118.347 519.557 118.347C519.393 118.347 519.263 118.384 519.167 118.456C519.07 118.527 519.006 118.616 518.975 118.724L518.135 118.656C518.178 118.457 518.262 118.286 518.387 118.141C518.512 117.994 518.673 117.882 518.87 117.804C519.069 117.724 519.299 117.685 519.561 117.685C519.743 117.685 519.917 117.706 520.083 117.749C520.25 117.791 520.399 117.857 520.528 117.947C520.659 118.036 520.762 118.151 520.837 118.292C520.912 118.431 520.95 118.598 520.95 118.793V121H520.089V120.546H520.064C520.011 120.648 519.941 120.739 519.853 120.817C519.765 120.893 519.659 120.954 519.535 120.998C519.412 121.04 519.269 121.062 519.107 121.062ZM519.367 120.435C519.5 120.435 519.618 120.409 519.721 120.357C519.823 120.303 519.903 120.23 519.961 120.139C520.02 120.048 520.049 119.945 520.049 119.83V119.483C520.02 119.501 519.981 119.518 519.932 119.534C519.883 119.548 519.829 119.562 519.767 119.575C519.706 119.586 519.645 119.597 519.584 119.607C519.523 119.615 519.468 119.623 519.418 119.63C519.312 119.646 519.218 119.67 519.139 119.705C519.059 119.739 518.998 119.785 518.954 119.843C518.91 119.9 518.888 119.971 518.888 120.056C518.888 120.18 518.932 120.274 519.022 120.339C519.113 120.403 519.228 120.435 519.367 120.435ZM522.562 116.636V121H521.654V116.636H522.562Z"
                  fill="black"
                ></path>
                <g id="Army_18">
                  <circle
                    id="armycircle_18"
                    cx="517"
                    cy="130"
                    r="5.5"
                    fill={getCircleFill("ural")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("ural")}
                  ></circle>
                  {getArmyNum("ural", "517", "130")}
                </g>
              </g>
            </g>
            <g id="siberia">
              <path
                id="siberia_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M513.478 78.4743C514.103 80.2243 514.603 79.2243 515.728 78.4743C516.853 77.7243 515.978 77.8493 516.103 76.3493C516.228 74.8493 515.728 75.0993 515.103 74.3493C514.478 73.5993 514.728 74.2243 513.103 74.2243C511.478 74.2243 511.978 74.4743 510.853 74.5993C509.728 74.7243 510.103 74.5993 508.228 74.2243C506.353 73.8493 507.103 72.8493 507.103 72.0993C507.103 71.3493 506.603 69.9743 506.603 69.9743C506.603 69.9743 505.603 69.5993 505.103 68.5993C504.603 67.5993 505.103 67.4743 505.228 66.9743C505.353 66.4743 505.478 65.8493 505.353 64.3493C505.228 62.8493 504.853 63.8493 504.353 63.0993C503.853 62.3493 504.353 61.8493 504.353 61.8493L505.353 60.8493L507.103 61.4743L508.228 61.8493L510.478 62.5993C510.478 62.5993 510.603 62.8493 512.603 65.0993C514.603 67.3493 513.603 65.3493 515.103 65.4743C516.603 65.5993 516.228 64.8493 516.228 64.8493C516.228 64.8493 514.228 63.8493 514.228 63.3493C514.228 62.8493 514.728 62.0993 514.728 61.4743C514.728 60.8493 514.603 59.4743 514.353 58.9743C514.103 58.4743 513.353 58.0993 512.853 57.5993C512.353 57.0993 511.603 55.7243 511.603 55.7243C511.603 55.7243 511.228 54.9743 512.103 52.4743C512.978 49.9743 513.228 53.3493 513.228 53.3493L513.978 53.7243L515.478 54.9743C515.478 54.9743 516.728 54.7243 517.478 54.4743C518.228 54.2243 519.353 56.2243 519.353 56.2243C519.353 56.2243 521.603 56.4743 522.103 56.4743C522.603 56.4743 523.603 55.0993 523.603 54.0993C523.603 53.0993 521.603 53.9743 521.603 53.9743L518.603 53.3493C518.603 53.3493 514.728 52.2243 513.978 51.2243C513.228 50.2243 514.103 49.7243 514.103 49.7243L516.103 47.2243C516.103 47.2243 517.478 45.8493 518.103 45.8493C518.728 45.8493 521.353 45.8493 521.353 45.8493C521.353 45.8493 522.228 43.7243 522.353 42.0993C522.478 40.4743 524.603 41.5993 524.603 41.5993C524.603 41.5993 526.228 41.0993 526.603 40.5993C526.978 40.0993 529.103 38.5993 532.478 36.5993C535.853 34.5993 535.853 35.4743 537.353 35.3493C538.853 35.2243 540.228 35.2243 540.728 34.9743C541.228 34.7243 542.853 33.5993 543.353 33.3493C543.853 33.0993 546.353 31.8493 546.353 32.4743C546.353 33.0993 546.603 34.4743 546.853 34.9743C547.103 35.4743 548.478 34.3493 550.103 33.0993C551.728 31.8493 551.228 32.0993 551.978 30.9743C552.728 29.8493 553.478 30.5993 554.603 30.7243C555.728 30.8493 555.353 32.5993 555.478 33.3493C555.603 34.0993 557.478 35.4743 558.603 36.2243C559.728 36.9743 562.853 32.4743 563.353 34.8493C563.853 37.2243 566.603 38.0993 566.603 38.8493C566.603 39.5993 565.353 41.0993 564.478 41.8493C563.603 42.5993 562.853 43.4743 562.353 44.5993C561.853 45.7243 562.353 45.3493 562.353 46.3493C562.353 47.3493 561.603 46.5993 560.478 47.3493C559.353 48.0993 559.353 48.3493 558.478 49.3493C557.603 50.3493 557.103 49.8493 556.228 50.2243C555.353 50.5993 555.603 51.7243 555.353 52.5993C555.103 53.4743 555.853 53.3493 555.853 53.3493C555.853 53.3493 557.103 52.4743 557.728 52.0993C558.353 51.7243 560.728 50.4743 561.353 50.0993C561.978 49.7243 563.603 48.3493 564.978 46.8493C566.353 45.3493 568.228 46.0993 569.228 45.8493C570.228 45.5993 570.853 46.2243 570.853 46.2243C570.853 46.2243 572.103 46.3493 573.228 45.7243C574.353 45.0993 577.228 44.4743 577.853 44.4743C578.478 44.4743 580.103 44.7243 580.978 45.4743C581.853 46.2243 583.353 47.2243 584.228 47.8493L585.665 47.7868L585.978 50.3493C585.978 50.8493 585.853 52.3493 586.978 53.4743C588.103 54.5993 588.478 54.0993 588.978 54.5993C589.478 55.0993 588.853 58.3493 588.728 59.0993C588.603 59.8493 588.103 59.8493 587.603 60.7243C587.103 61.5993 587.478 62.0993 587.103 63.5993C586.728 65.0993 586.228 64.4743 585.853 65.9743C585.478 67.4743 585.853 67.3493 586.353 68.3493C586.853 69.3493 586.853 70.2243 586.853 71.7243C586.853 73.2243 586.603 72.3493 585.978 72.4743C585.353 72.5993 584.728 73.0993 583.478 73.2243C582.228 73.3493 580.853 73.8493 580.228 73.0993C579.603 72.3493 578.978 72.2243 576.728 72.4743C574.478 72.7243 576.103 73.4743 575.853 74.4743C575.603 75.4743 574.853 75.3493 573.353 75.5993C571.853 75.8493 572.353 75.9743 572.228 77.5993C572.103 79.2243 573.978 80.2243 574.978 80.5993C575.978 80.9743 576.228 81.2243 576.603 81.8493C576.978 82.4743 578.103 82.2243 579.603 83.5993C581.103 84.9743 579.853 85.2243 578.853 86.2243C577.853 87.2243 579.478 90.7243 580.228 91.2243C580.978 91.7243 581.353 92.4743 581.728 95.4743C582.103 98.4743 583.228 98.7243 583.228 98.7243C583.228 98.7243 584.103 99.2243 584.228 102.349C584.353 105.474 585.103 108.099 585.103 108.099C585.103 108.099 580.98 115.756 582.21 119.137C583.44 122.519 584.977 128.668 583.132 130.82C581.288 132.972 580.366 132.972 579.751 131.742C579.136 130.513 580.058 130.205 577.906 129.898C575.754 129.59 576.061 130.513 574.524 130.82C572.987 131.127 572.372 132.665 571.142 131.435C569.913 130.205 571.142 129.898 569.298 130.513C567.453 131.127 568.375 133.279 566.07 133.741C563.764 134.202 564.071 133.433 563.149 134.97C562.227 136.508 561.766 136.969 561.458 137.737C561.151 138.506 560.536 138.352 561.151 139.736C561.766 141.119 563.303 139.121 563.149 141.888C562.995 144.655 562.688 146.346 562.688 146.346C562.688 146.346 561.612 145.577 561.612 147.422C561.612 149.266 562.38 149.113 562.073 150.65C561.766 152.187 560.997 151.265 561.458 153.109C561.919 154.954 563.149 154.954 563.149 154.954C563.149 154.954 563.456 153.109 564.071 154.646C564.686 156.184 563.918 157.106 564.994 157.567C566.07 158.028 564.994 157.875 566.685 158.489C566.685 158.489 567.376 158.489 567.684 159.412C567.991 160.334 568.837 161.794 567.991 162.947C567.146 164.1 566.454 166.252 567.376 168.327C568.299 170.403 569.913 170.633 569.759 171.863C569.605 173.093 569.375 172.785 569.221 174.476C569.067 176.167 569.375 177.243 568.99 177.935C568.606 178.627 568.375 179.779 567.837 180.01C567.299 180.241 566.454 179.703 565.916 179.395C565.378 179.088 565.762 177.397 564.84 178.089C563.918 178.78 563.764 179.703 562.995 179.241C562.227 178.78 562.304 178.012 561.612 177.858C560.92 177.704 559.537 178.165 560.228 176.859C560.92 175.552 561.766 175.322 561.842 174.476C561.919 173.631 562.304 172.862 561.842 171.94C561.381 171.017 561.074 170.018 560.305 169.865C559.537 169.711 559.537 169.25 558.614 168.404C557.692 167.559 557.615 166.483 556.923 166.713C556.232 166.944 555.079 168.789 553.465 168.481C551.851 168.174 551.236 168.865 550.698 167.789C550.16 166.713 549.929 166.329 549.314 166.175C548.699 166.022 548.392 165.945 548.546 165.253C548.699 164.561 548.776 164.869 548.776 163.639C548.776 162.409 548.853 159.719 547.931 158.413C547.009 157.106 547.009 157.029 547.009 156.568C547.009 156.107 547.47 155.876 546.701 155.569C545.933 155.261 544.78 153.186 544.549 152.418C544.318 151.649 543.166 151.649 542.781 151.649C542.397 151.649 541.475 149.113 541.475 149.113C541.475 149.113 537.555 149.189 537.632 148.267C537.709 147.345 538.17 146.422 538.247 146.038C538.323 145.654 538.938 143.271 538.323 142.426C537.709 141.58 536.632 140.812 536.018 140.735C535.403 140.658 534.327 140.351 533.712 141.273C533.097 142.195 532.559 142.81 532.252 142.656C531.944 142.503 531.483 142.579 531.329 141.734C531.175 140.889 530.791 138.737 531.944 137.122C533.097 135.508 532.713 137.66 533.404 136.892C534.096 136.123 534.48 134.663 534.48 133.894C534.48 133.126 534.019 132.357 535.018 131.358C536.018 130.359 536.786 130.666 537.247 129.744C537.709 128.822 538.477 128.668 537.939 127.822C537.401 126.977 536.556 126.208 536.479 125.132C536.402 124.056 536.786 124.133 536.094 123.441C535.403 122.75 534.865 122.442 534.788 121.674C534.711 120.905 536.171 121.213 534.711 120.367C533.251 119.522 532.79 120.137 533.02 118.753C533.251 117.37 533.02 116.217 533.481 115.448C533.942 114.68 533.174 112.22 532.866 111.836C532.559 111.451 531.79 110.837 531.406 110.299C531.022 109.761 531.099 108.454 530.791 108.223C530.484 107.993 529.331 107.07 529.023 106.609C528.716 106.148 528.716 105.918 528.409 105.149C528.101 104.38 526.871 103.842 526.564 103.458C526.257 103.074 523.874 102.459 523.72 102.075C523.566 101.69 523.49 100.768 523.643 99.9994C523.797 99.2308 524.028 98.0779 523.797 97.1556C523.566 96.2333 523.49 95.3109 523.413 94.0043C523.336 92.6977 522.798 92.0828 521.799 92.0828C520.799 92.0828 520.338 92.544 520.261 92.0828C520.185 91.6217 519.647 90.0076 519.647 89.6233C519.647 89.239 518.263 85.6267 517.956 85.3961C517.648 85.1655 517.648 85.0886 516.803 84.32C515.957 83.5514 515.342 82.9366 514.728 82.8597C514.113 82.7829 513.728 82.0911 513.652 81.3225C513.575 80.5539 513.344 78.6324 513.478 78.4743Z"
                className={getCountryClass("siberia")}
                fill={getFill("siberia")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_19">
                <path
                  id="Siberia"
                  d="M551.478 84.8913C551.461 84.7195 551.388 84.5859 551.258 84.4908C551.129 84.3956 550.954 84.348 550.732 84.348C550.582 84.348 550.454 84.3693 550.351 84.4119C550.247 84.4531 550.168 84.5107 550.112 84.5845C550.058 84.6584 550.031 84.7422 550.031 84.8359C550.028 84.9141 550.045 84.9822 550.08 85.0405C550.117 85.0987 550.168 85.1491 550.231 85.1918C550.295 85.233 550.369 85.2692 550.453 85.3004C550.537 85.3303 550.626 85.3558 550.722 85.3771L551.114 85.4709C551.304 85.5135 551.479 85.5703 551.638 85.6413C551.797 85.7124 551.935 85.7997 552.051 85.9034C552.168 86.0071 552.258 86.1293 552.322 86.2699C552.387 86.4105 552.42 86.5717 552.422 86.7536C552.42 87.0206 552.352 87.2521 552.217 87.4482C552.084 87.6428 551.891 87.794 551.638 87.902C551.386 88.0085 551.083 88.0618 550.728 88.0618C550.376 88.0618 550.069 88.0078 549.807 87.8999C549.547 87.7919 549.344 87.6321 549.198 87.4205C549.053 87.2074 548.977 86.9439 548.97 86.63H549.863C549.873 86.7763 549.915 86.8984 549.989 86.9964C550.064 87.093 550.164 87.1662 550.289 87.2159C550.415 87.2642 550.558 87.2884 550.717 87.2884C550.873 87.2884 551.009 87.2656 551.124 87.2202C551.241 87.1747 551.331 87.1115 551.395 87.0305C551.459 86.9496 551.491 86.8565 551.491 86.7514C551.491 86.6534 551.462 86.571 551.403 86.5043C551.347 86.4375 551.263 86.3807 551.152 86.3338C551.043 86.2869 550.908 86.2443 550.749 86.206L550.274 86.0866C549.906 85.9972 549.616 85.8572 549.403 85.6669C549.19 85.4766 549.084 85.2202 549.085 84.8977C549.084 84.6335 549.154 84.4027 549.296 84.2053C549.44 84.0078 549.636 83.8537 549.886 83.7429C550.136 83.6321 550.42 83.5767 550.739 83.5767C551.062 83.5767 551.345 83.6321 551.587 83.7429C551.829 83.8537 552.018 84.0078 552.153 84.2053C552.288 84.4027 552.358 84.6314 552.362 84.8913H551.478ZM553.025 88V84.7273H553.933V88H553.025ZM553.481 84.3054C553.346 84.3054 553.231 84.2607 553.134 84.1712C553.039 84.0803 552.991 83.9716 552.991 83.8452C552.991 83.7202 553.039 83.6129 553.134 83.5234C553.231 83.4325 553.346 83.3871 553.481 83.3871C553.616 83.3871 553.731 83.4325 553.826 83.5234C553.923 83.6129 553.971 83.7202 553.971 83.8452C553.971 83.9716 553.923 84.0803 553.826 84.1712C553.731 84.2607 553.616 84.3054 553.481 84.3054ZM554.677 88V83.6364H555.585V85.277H555.612C555.652 85.1889 555.71 85.0994 555.785 85.0085C555.862 84.9162 555.961 84.8395 556.083 84.7784C556.207 84.7159 556.36 84.6847 556.544 84.6847C556.782 84.6847 557.002 84.7472 557.204 84.8722C557.406 84.9957 557.567 85.1825 557.688 85.4325C557.809 85.6811 557.869 85.9929 557.869 86.3679C557.869 86.733 557.81 87.0412 557.692 87.2926C557.576 87.5426 557.416 87.7322 557.215 87.8615C557.014 87.9893 556.79 88.0533 556.541 88.0533C556.365 88.0533 556.215 88.0241 556.092 87.9659C555.97 87.9077 555.87 87.8345 555.791 87.7464C555.713 87.657 555.654 87.5668 555.612 87.4759H555.572V88H554.677ZM555.566 86.3636C555.566 86.5582 555.593 86.728 555.647 86.8729C555.701 87.0178 555.779 87.1307 555.881 87.2116C555.983 87.2912 556.108 87.331 556.254 87.331C556.402 87.331 556.527 87.2905 556.629 87.2095C556.731 87.1271 556.809 87.0135 556.861 86.8686C556.915 86.7223 556.942 86.554 556.942 86.3636C556.942 86.1747 556.916 86.0085 556.863 85.8651C556.811 85.7216 556.733 85.6094 556.631 85.5284C556.529 85.4474 556.403 85.407 556.254 85.407C556.106 85.407 555.981 85.446 555.879 85.5241C555.778 85.6023 555.701 85.7131 555.647 85.8565C555.593 86 555.566 86.169 555.566 86.3636ZM559.966 88.0639C559.629 88.0639 559.34 87.9957 559.097 87.8594C558.855 87.7216 558.669 87.527 558.538 87.2756C558.408 87.0227 558.342 86.7237 558.342 86.3786C558.342 86.0419 558.408 85.7464 558.538 85.4922C558.669 85.2379 558.853 85.0398 559.09 84.8977C559.329 84.7557 559.609 84.6847 559.93 84.6847C560.146 84.6847 560.347 84.7195 560.533 84.7891C560.72 84.8572 560.884 84.9602 561.023 85.098C561.163 85.2358 561.273 85.4091 561.351 85.6179C561.429 85.8253 561.468 86.0682 561.468 86.3466V86.5959H558.705V86.0334H560.614C560.614 85.9027 560.585 85.7869 560.528 85.6861C560.472 85.5852 560.393 85.5064 560.292 85.4496C560.193 85.3913 560.077 85.3622 559.945 85.3622C559.807 85.3622 559.685 85.3942 559.578 85.4581C559.473 85.5206 559.391 85.6051 559.331 85.7116C559.271 85.8168 559.241 85.9339 559.239 86.0632V86.598C559.239 86.7599 559.269 86.8999 559.329 87.0178C559.39 87.1357 559.476 87.2266 559.587 87.2905C559.698 87.3544 559.829 87.3864 559.981 87.3864C560.082 87.3864 560.174 87.3722 560.258 87.3438C560.342 87.3153 560.413 87.2727 560.473 87.2159C560.533 87.1591 560.578 87.0895 560.609 87.0071L561.449 87.0625C561.406 87.2642 561.319 87.4403 561.187 87.5909C561.056 87.7401 560.887 87.8565 560.68 87.9403C560.474 88.0227 560.236 88.0639 559.966 88.0639ZM562.06 88V84.7273H562.94V85.2983H562.975C563.034 85.0952 563.134 84.9418 563.275 84.8381C563.416 84.733 563.578 84.6804 563.761 84.6804C563.806 84.6804 563.855 84.6832 563.908 84.6889C563.96 84.6946 564.006 84.7024 564.046 84.7124V85.5178C564.004 85.505 563.945 85.4936 563.869 85.4837C563.794 85.4737 563.725 85.4688 563.663 85.4688C563.529 85.4688 563.41 85.4979 563.305 85.5561C563.201 85.6129 563.119 85.6925 563.058 85.7947C562.998 85.897 562.968 86.0149 562.968 86.1484V88H562.06ZM564.516 88V84.7273H565.423V88H564.516ZM564.972 84.3054C564.837 84.3054 564.721 84.2607 564.624 84.1712C564.529 84.0803 564.481 83.9716 564.481 83.8452C564.481 83.7202 564.529 83.6129 564.624 83.5234C564.721 83.4325 564.837 83.3871 564.972 83.3871C565.106 83.3871 565.222 83.4325 565.317 83.5234C565.413 83.6129 565.462 83.7202 565.462 83.8452C565.462 83.9716 565.413 84.0803 565.317 84.1712C565.222 84.2607 565.106 84.3054 564.972 84.3054ZM567.084 88.0618C566.875 88.0618 566.689 88.0256 566.525 87.9531C566.362 87.8793 566.233 87.7706 566.138 87.6271C566.044 87.4822 565.997 87.3018 565.997 87.0859C565.997 86.9041 566.03 86.7514 566.097 86.6278C566.164 86.5043 566.255 86.4048 566.37 86.3295C566.485 86.2543 566.616 86.1974 566.762 86.1591C566.91 86.1207 567.064 86.0938 567.226 86.0781C567.417 86.0582 567.57 86.0398 567.687 86.0227C567.803 86.0043 567.888 85.9773 567.94 85.9418C567.993 85.9062 568.019 85.8537 568.019 85.7841V85.7713C568.019 85.6364 567.976 85.532 567.891 85.4581C567.807 85.3842 567.688 85.3473 567.533 85.3473C567.37 85.3473 567.24 85.3835 567.143 85.456C567.047 85.527 566.983 85.6165 566.951 85.7244L566.112 85.6562C566.155 85.4574 566.238 85.2855 566.363 85.1406C566.488 84.9943 566.65 84.8821 566.847 84.804C567.046 84.7244 567.276 84.6847 567.537 84.6847C567.719 84.6847 567.893 84.706 568.059 84.7486C568.227 84.7912 568.375 84.8572 568.505 84.9467C568.635 85.0362 568.738 85.1513 568.814 85.2919C568.889 85.4311 568.927 85.598 568.927 85.7926V88H568.066V87.5462H568.04C567.988 87.6484 567.917 87.7386 567.829 87.8168C567.741 87.8935 567.635 87.9538 567.512 87.9979C567.388 88.0405 567.245 88.0618 567.084 88.0618ZM567.343 87.4354C567.477 87.4354 567.595 87.4091 567.697 87.3565C567.799 87.3026 567.88 87.2301 567.938 87.1392C567.996 87.0483 568.025 86.9453 568.025 86.8303V86.483C567.997 86.5014 567.958 86.5185 567.908 86.5341C567.86 86.5483 567.805 86.5618 567.744 86.5746C567.683 86.5859 567.622 86.5966 567.561 86.6065C567.5 86.6151 567.444 86.6229 567.395 86.63C567.288 86.6456 567.195 86.6705 567.116 86.7045C567.036 86.7386 566.974 86.7848 566.93 86.843C566.886 86.8999 566.864 86.9709 566.864 87.0561C566.864 87.1797 566.909 87.2741 566.998 87.3395C567.089 87.4034 567.204 87.4354 567.343 87.4354Z"
                  fill="black"
                ></path>
                <g id="Army_19">
                  <circle
                    id="armycircle_19"
                    cx="559"
                    cy="97"
                    r="5.5"
                    fill={getCircleFill("siberia")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("siberia")}
                  ></circle>
                  {getArmyNum("siberia", "559", "97")}
                </g>
              </g>
            </g>
            <g id="yakutsk">
              <path
                id="yakursk"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M639.728 55.2243C639.228 54.0993 640.478 53.9743 638.603 52.9743C636.728 51.9743 635.978 52.2243 634.853 51.8493C633.728 51.4743 633.978 51.2243 634.478 49.8493C634.978 48.4743 636.603 48.3493 634.353 47.8493C632.103 47.3493 632.228 46.4743 630.603 46.4743C628.978 46.4743 629.353 46.4743 628.478 46.8493C627.603 47.2243 627.478 47.2243 627.103 47.7243C626.728 48.2243 627.478 48.8493 626.603 48.5993C625.728 48.3493 626.228 48.7243 625.353 47.7243C624.478 46.7243 624.728 46.3493 623.603 46.4743C622.478 46.5993 623.353 46.3493 621.728 46.7243C620.103 47.0993 619.603 47.0993 618.478 47.2243C617.353 47.3493 615.478 48.8493 615.478 48.8493C615.478 48.8493 615.603 49.0993 614.228 49.2243C612.853 49.3493 613.728 48.5993 611.853 49.9743C609.978 51.3493 610.853 51.4743 609.353 51.3493C607.853 51.2243 608.603 50.3493 606.978 51.0993C605.353 51.8493 605.228 51.4743 605.228 52.4743C605.228 53.4743 604.228 54.0993 604.228 54.0993C604.228 54.0993 604.228 53.7243 603.853 52.4743C603.478 51.2243 602.978 51.7243 603.103 50.4743C603.228 49.2243 597.853 48.4743 597.103 46.7243C596.353 44.9743 596.478 45.2243 596.228 43.5993C595.978 41.9743 592.978 41.2243 592.478 41.3493C591.978 41.4743 590.603 42.9743 589.978 43.7243C589.353 44.4743 589.103 45.0993 588.103 45.8493C587.239 46.6999 586.433 47.2232 585.665 47.7868L585.978 50.3493C585.978 50.8493 585.853 52.3493 586.978 53.4743C588.103 54.5993 588.478 54.0993 588.978 54.5993C589.478 55.0993 588.853 58.3493 588.728 59.0993C588.603 59.8493 588.103 59.8493 587.603 60.7243C587.103 61.5993 587.478 62.0993 587.103 63.5993C586.728 65.0993 586.228 64.4743 585.853 65.9743C585.478 67.4743 585.853 67.3493 586.353 68.3493C586.853 69.3493 586.853 70.2243 586.853 71.7243C586.853 73.2243 586.603 72.3493 585.978 72.4743C585.353 72.5993 584.728 73.0993 583.478 73.2243C582.228 73.3493 580.853 73.8493 580.228 73.0993C579.603 72.3493 578.978 72.2243 576.728 72.4743C574.478 72.7243 576.103 73.4743 575.853 74.4743C575.603 75.4743 574.853 75.3493 573.353 75.5993C571.853 75.8493 572.353 75.9743 572.228 77.5993C572.103 79.2243 573.978 80.2243 574.978 80.5993C575.978 80.9743 576.228 81.2243 576.603 81.8493C576.978 82.4743 578.103 82.2243 579.603 83.5993C581.103 84.9743 579.853 85.2243 578.853 86.2243C577.853 87.2243 579.478 90.7243 580.228 91.2243C580.978 91.7243 581.353 92.4743 581.728 95.4743C582.103 98.4743 583.228 98.7243 583.228 98.7243C583.228 98.7243 584.103 99.2243 584.228 102.349C584.353 105.474 585.103 108.099 585.103 108.099C585.103 108.099 589.978 106.599 591.228 105.849C592.478 105.099 592.353 104.974 592.728 103.224C593.103 101.474 593.228 98.5993 594.603 98.3493C595.978 98.0993 595.728 100.099 595.728 100.099C595.853 100.849 597.228 100.599 598.728 100.849C599.786 101.026 599.351 100.083 599.135 99.1606C599.044 98.7754 598.992 98.3939 599.103 98.0993C599.478 97.0993 611.398 98.2124 611.398 98.2124C611.839 97.1517 612.635 96.4446 613.961 95.2072C615.287 93.9697 614.226 91.76 614.314 91.3181C614.403 90.8762 616.082 89.4619 616.878 86.4567C617.673 83.4515 618.645 85.6612 618.645 85.6612C618.645 85.6612 620.678 83.8935 621.385 82.656C622.093 81.4186 625.982 81.5954 626.424 81.7722C626.866 81.9489 626.6 83.7167 627.219 84.9541C627.838 86.1916 627.484 85.4845 628.545 85.3961C629.606 85.3077 630.313 84.9541 631.285 84.9541C632.257 84.9541 631.815 86.3684 632.257 86.5451C632.699 86.7219 634.29 86.5451 634.732 86.4567C635.174 86.3683 636.146 85.6612 636.765 85.1309C637.384 84.6006 636.942 82.8328 637.03 82.0373C637.119 81.2418 638.002 80.9767 638.268 80.3579C638.533 79.7392 638.268 78.0598 638.179 77.2644C638.091 76.4689 637.472 75.4966 636.853 75.3198C636.235 75.143 633.76 74.9663 632.788 74.8779C631.815 74.7895 631.815 70.1049 632.257 67.0997C632.699 64.0945 632.434 64.8016 632.876 64.2713C633.318 63.7409 634.82 63.4758 635.351 63.4758C635.881 63.4758 636.588 62.3267 636.677 61.4428C636.765 60.5589 637.472 60.7357 637.826 59.8518C638.179 58.968 639.328 59.4099 640.566 59.2331C641.803 59.0564 641.008 57.7305 641.008 56.3163L639.728 55.2243Z"
                className={getCountryClass("yakutsk")}
                fill={getFill("yakutsk")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_20">
                <path
                  id="Yakutsk"
                  d="M596.337 62.6364H597.371L598.366 64.5156H598.408L599.403 62.6364H600.437L598.845 65.4574V67H597.929V65.4574L596.337 62.6364ZM601.224 67.0618C601.015 67.0618 600.829 67.0256 600.666 66.9531C600.503 66.8793 600.373 66.7706 600.278 66.6271C600.184 66.4822 600.138 66.3018 600.138 66.0859C600.138 65.9041 600.171 65.7514 600.238 65.6278C600.304 65.5043 600.395 65.4048 600.51 65.3295C600.625 65.2543 600.756 65.1974 600.902 65.1591C601.05 65.1207 601.205 65.0938 601.367 65.0781C601.557 65.0582 601.711 65.0398 601.827 65.0227C601.944 65.0043 602.028 64.9773 602.081 64.9418C602.133 64.9062 602.16 64.8537 602.16 64.7841V64.7713C602.16 64.6364 602.117 64.532 602.032 64.4581C601.948 64.3842 601.829 64.3473 601.674 64.3473C601.51 64.3473 601.38 64.3835 601.284 64.456C601.187 64.527 601.123 64.6165 601.092 64.7244L600.253 64.6562C600.295 64.4574 600.379 64.2855 600.504 64.1406C600.629 63.9943 600.79 63.8821 600.988 63.804C601.187 63.7244 601.417 63.6847 601.678 63.6847C601.86 63.6847 602.034 63.706 602.2 63.7486C602.368 63.7912 602.516 63.8572 602.645 63.9467C602.776 64.0362 602.879 64.1513 602.954 64.2919C603.03 64.4311 603.067 64.598 603.067 64.7926V67H602.206V66.5462H602.181C602.128 66.6484 602.058 66.7386 601.97 66.8168C601.882 66.8935 601.776 66.9538 601.652 66.9979C601.529 67.0405 601.386 67.0618 601.224 67.0618ZM601.484 66.4354C601.618 66.4354 601.736 66.4091 601.838 66.3565C601.94 66.3026 602.02 66.2301 602.079 66.1392C602.137 66.0483 602.166 65.9453 602.166 65.8303V65.483C602.138 65.5014 602.098 65.5185 602.049 65.5341C602 65.5483 601.946 65.5618 601.885 65.5746C601.824 65.5859 601.763 65.5966 601.701 65.6065C601.64 65.6151 601.585 65.6229 601.535 65.63C601.429 65.6456 601.336 65.6705 601.256 65.7045C601.177 65.7386 601.115 65.7848 601.071 65.843C601.027 65.8999 601.005 65.9709 601.005 66.0561C601.005 66.1797 601.049 66.2741 601.139 66.3395C601.23 66.4034 601.345 66.4354 601.484 66.4354ZM604.594 66.0582L604.596 64.9695H604.728L605.776 63.7273H606.818L605.41 65.3722H605.195L604.594 66.0582ZM603.771 67V62.6364H604.679V67H603.771ZM605.817 67L604.854 65.5746L605.459 64.9332L606.88 67H605.817ZM609.362 65.6065V63.7273H610.27V67H609.399V66.4055H609.364C609.291 66.5973 609.168 66.7514 608.996 66.8679C608.825 66.9844 608.617 67.0426 608.372 67.0426C608.153 67.0426 607.96 66.9929 607.794 66.8935C607.628 66.794 607.498 66.6527 607.404 66.4695C607.312 66.2862 607.265 66.0668 607.264 65.8111V63.7273H608.171V65.6491C608.173 65.8423 608.225 65.995 608.327 66.1072C608.429 66.2195 608.566 66.2756 608.738 66.2756C608.847 66.2756 608.95 66.2507 609.045 66.201C609.14 66.1499 609.217 66.0746 609.275 65.9751C609.335 65.8757 609.364 65.7528 609.362 65.6065ZM612.737 63.7273V64.4091H610.766V63.7273H612.737ZM611.213 62.9432H612.121V65.9943C612.121 66.0781 612.134 66.1435 612.159 66.1903C612.185 66.2358 612.22 66.2678 612.266 66.2862C612.313 66.3047 612.367 66.3139 612.428 66.3139C612.47 66.3139 612.513 66.3104 612.556 66.3033C612.598 66.2947 612.631 66.2884 612.654 66.2841L612.796 66.9595C612.751 66.9737 612.687 66.9901 612.605 67.0085C612.522 67.0284 612.422 67.0405 612.304 67.0447C612.085 67.0533 611.894 67.0241 611.729 66.9574C611.566 66.8906 611.438 66.7869 611.348 66.6463C611.257 66.5057 611.212 66.3281 611.213 66.1136V62.9432ZM616.01 64.6605L615.179 64.7116C615.165 64.6406 615.134 64.5767 615.087 64.5199C615.041 64.4616 614.979 64.4155 614.902 64.3814C614.827 64.3459 614.737 64.3281 614.631 64.3281C614.491 64.3281 614.372 64.358 614.276 64.4176C614.179 64.4759 614.131 64.554 614.131 64.652C614.131 64.7301 614.162 64.7962 614.225 64.8501C614.287 64.9041 614.394 64.9474 614.546 64.9801L615.139 65.0994C615.457 65.1648 615.694 65.2699 615.85 65.4148C616.006 65.5597 616.085 65.75 616.085 65.9858C616.085 66.2003 616.021 66.3885 615.895 66.5504C615.77 66.7124 615.598 66.8388 615.379 66.9297C615.162 67.0192 614.911 67.0639 614.627 67.0639C614.194 67.0639 613.849 66.9737 613.592 66.7933C613.336 66.6115 613.186 66.3643 613.142 66.0518L614.035 66.005C614.062 66.1371 614.127 66.2379 614.231 66.3075C614.335 66.3757 614.467 66.4098 614.629 66.4098C614.788 66.4098 614.916 66.3793 615.013 66.3182C615.111 66.2557 615.161 66.1754 615.162 66.0774C615.161 65.995 615.126 65.9276 615.058 65.875C614.989 65.821 614.884 65.7798 614.742 65.7514L614.176 65.6385C613.856 65.5746 613.618 65.4638 613.462 65.3061C613.307 65.1484 613.229 64.9474 613.229 64.7031C613.229 64.4929 613.286 64.3118 613.4 64.1598C613.515 64.0078 613.676 63.8906 613.884 63.8082C614.092 63.7259 614.337 63.6847 614.617 63.6847C615.03 63.6847 615.355 63.772 615.592 63.9467C615.831 64.1214 615.97 64.3594 616.01 64.6605ZM617.479 66.0582L617.481 64.9695H617.613L618.661 63.7273H619.703L618.295 65.3722H618.079L617.479 66.0582ZM616.656 67V62.6364H617.564V67H616.656ZM618.702 67L617.739 65.5746L618.344 64.9332L619.765 67H618.702Z"
                  fill="black"
                ></path>
                <g id="Army_20">
                  <circle
                    id="armycircle_20"
                    cx="608"
                    cy="76"
                    r="5.5"
                    fill={getCircleFill("yakutsk")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("yakutsk")}
                  ></circle>
                  {getArmyNum("yakutsk", "608", "76")}
                </g>
              </g>
            </g>
            <g id="irkutsk">
              <path
                id="irkutsk_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M637.03 156.46C637.295 158.405 636.942 157.433 636.942 157.433C636.942 157.433 636.04 158.349 634.915 158.037C633.79 157.724 633.04 157.349 632.915 156.474C632.79 155.599 631.665 155.162 631.665 155.162C631.665 155.162 630.103 155.099 630.04 154.599C629.978 154.099 629.728 153.724 629.54 152.162C629.353 150.599 629.478 150.224 628.853 150.224C628.228 150.224 627.478 150.349 627.228 150.099C626.978 149.849 626.665 149.662 626.603 148.849C626.54 148.037 626.478 147.224 626.103 147.099C625.728 146.974 625.103 146.662 624.728 146.662C624.353 146.662 623.103 146.912 622.978 146.412C622.853 145.912 622.728 145.224 622.853 144.724C622.978 144.224 623.165 143.912 623.165 143.474C623.165 143.037 622.915 142.037 622.915 142.037C622.915 142.037 622.478 142.037 622.04 141.662C621.603 141.287 621.603 140.724 620.978 140.599C620.353 140.474 619.978 140.287 619.415 140.912C618.853 141.537 618.478 142.099 618.165 142.224C617.853 142.349 615.978 142.537 615.353 142.537C614.728 142.537 613.79 142.162 613.79 142.162L613.353 141.662C613.353 141.662 612.478 141.349 612.478 141.724C612.478 142.099 612.79 142.474 612.478 142.974C612.165 143.474 612.353 143.474 611.665 144.037C610.978 144.599 610.54 144.724 610.478 145.162C610.415 145.599 610.415 145.787 610.79 146.224C611.165 146.662 611.353 146.537 611.54 147.099C611.728 147.662 611.79 147.787 611.79 148.412C611.79 149.037 611.853 149.912 611.415 150.287C610.978 150.662 610.853 150.599 610.54 151.412C610.228 152.224 609.978 152.349 609.79 152.724C609.603 153.099 609.353 153.287 609.728 154.037C610.103 154.787 610.478 155.287 610.728 155.599C610.978 155.912 611.29 156.412 611.04 157.224C610.79 158.037 610.728 158.474 610.228 158.974C609.728 159.474 609.29 160.537 608.915 160.974C608.54 161.412 608.665 161.912 608.04 161.599C607.415 161.287 606.978 160.724 606.915 160.474C606.853 160.224 606.79 159.974 606.603 159.224C606.415 158.474 606.165 157.537 606.04 157.287C605.915 157.037 604.326 156.195 603.929 156.991C603.531 157.786 603.664 158.537 603.045 158.803C602.426 159.068 602.294 159.068 602.028 159.466C601.763 159.863 601.012 160.968 600.437 160.836C599.863 160.703 599.73 160.57 598.802 160.438C597.874 160.305 597.123 159.996 596.725 160.57C596.327 161.145 595.311 161.985 594.604 161.719C593.897 161.454 592.969 160.924 592.748 160.703C592.527 160.482 591.157 159.863 590.45 159.952C589.742 160.04 589.742 160.217 588.372 160.128C587.002 160.04 585.677 159.51 584.793 159.51C583.909 159.51 581.611 158.361 580.904 158.493C580.196 158.626 580.329 158.626 579.578 158.935C578.826 159.245 578.296 158.758 577.987 159.289C577.677 159.819 577.677 160.57 576.749 160.438C575.821 160.305 575.335 160.305 574.982 159.952C574.628 159.598 574.363 159.068 574.363 159.068C574.363 159.068 573.788 158.847 573.435 158.935C573.081 159.024 572.153 158.935 572.153 158.935C572.153 158.935 571.358 158.14 571.181 158.095C571.004 158.051 570.253 157.609 569.943 157.654C569.634 157.698 568.308 157.919 568.308 157.919C568.308 157.919 566.364 158.051 566.685 158.489C564.994 157.875 566.07 158.028 564.994 157.567C563.918 157.106 564.686 156.184 564.071 154.646C563.456 153.109 563.149 154.954 563.149 154.954C563.149 154.954 561.919 154.954 561.458 153.109C560.997 151.265 561.766 152.187 562.073 150.65C562.38 149.113 561.612 149.266 561.612 147.422C561.612 145.577 562.688 146.346 562.688 146.346C562.688 146.346 562.995 144.655 563.149 141.888C563.303 139.121 561.766 141.119 561.151 139.736C560.536 138.352 561.151 138.506 561.458 137.737C561.766 136.969 562.227 136.508 563.149 134.97C564.071 133.433 563.764 134.202 566.07 133.741C568.376 133.28 567.453 131.127 569.298 130.513C571.142 129.898 569.913 130.205 571.142 131.435C572.372 132.665 572.987 131.127 574.524 130.82C576.061 130.513 575.754 129.59 577.906 129.898C580.058 130.205 579.136 130.513 579.751 131.742C580.366 132.972 581.288 132.972 583.133 130.82C584.977 128.668 583.44 122.519 582.21 119.137C580.98 115.756 585.103 108.099 585.103 108.099C585.103 108.099 589.978 106.599 591.228 105.849C592.478 105.099 592.353 104.974 592.728 103.224C593.103 101.474 593.228 98.5993 594.603 98.3493C595.978 98.0993 595.728 100.099 595.728 100.099C595.853 100.849 597.228 100.599 598.728 100.849C599.786 101.026 599.351 100.083 599.135 99.1606C599.044 98.7754 598.992 98.3939 599.103 98.0993C599.478 97.0993 611.398 98.2124 611.398 98.2124C610.956 99.273 611.044 100.687 611.309 101.129C611.574 101.571 612.723 104.046 612.37 106.079C612.016 108.112 611.486 114.211 611.751 115.36C612.016 116.509 612.105 119.337 612.9 120.133C613.696 120.928 614.049 121.547 614.403 122.254C614.756 122.961 618.38 124.11 618.999 125.613C619.618 127.115 619.264 127.469 620.325 128.088C621.385 128.706 622.358 130.032 622.446 131.27C622.535 132.507 622.534 134.363 623.418 134.098C624.302 133.833 625.275 132.595 625.628 132.242C625.982 131.888 627.307 131.446 628.457 131.888C629.606 132.33 629.871 132.33 631.02 132.154C632.169 131.977 633.229 132.33 633.229 132.33C633.229 132.33 634.113 133.656 634.202 134.363C634.29 135.07 633.76 135.601 635.351 135.512C636.942 135.424 637.295 135.335 637.472 137.103C637.649 138.871 638.621 139.843 638.621 139.843C638.621 139.843 638.886 141.699 638.798 142.141C638.71 142.583 638.091 143.644 638.356 144.793C638.621 145.942 639.24 147.091 638.71 147.887C638.179 148.682 637.295 150.45 637.295 151.157C637.295 151.864 637.119 153.72 637.295 154.339C637.472 154.958 636.765 154.516 637.03 156.46Z"
                className={getCountryClass("irkutsk")}
                fill={getFill("irkutsk")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_21">
                <path
                  id="Irkutsk"
                  d="M589.045 125.636V130H588.122V125.636H589.045ZM589.787 130V126.727H590.667V127.298H590.701C590.761 127.095 590.861 126.942 591.002 126.838C591.142 126.733 591.304 126.68 591.487 126.68C591.533 126.68 591.582 126.683 591.634 126.689C591.687 126.695 591.733 126.702 591.773 126.712V127.518C591.73 127.505 591.671 127.494 591.596 127.484C591.521 127.474 591.452 127.469 591.389 127.469C591.256 127.469 591.136 127.498 591.031 127.556C590.928 127.613 590.845 127.692 590.784 127.795C590.725 127.897 590.695 128.015 590.695 128.148V130H589.787ZM593.065 129.058L593.067 127.969H593.199L594.247 126.727H595.289L593.881 128.372H593.665L593.065 129.058ZM592.242 130V125.636H593.15V130H592.242ZM594.288 130L593.324 128.575L593.93 127.933L595.351 130H594.288ZM597.833 128.607V126.727H598.741V130H597.869V129.406H597.835C597.761 129.597 597.638 129.751 597.467 129.868C597.296 129.984 597.088 130.043 596.842 130.043C596.623 130.043 596.431 129.993 596.265 129.893C596.099 129.794 595.969 129.653 595.875 129.469C595.783 129.286 595.736 129.067 595.734 128.811V126.727H596.642V128.649C596.643 128.842 596.695 128.995 596.797 129.107C596.9 129.219 597.037 129.276 597.209 129.276C597.318 129.276 597.42 129.251 597.516 129.201C597.611 129.15 597.687 129.075 597.746 128.975C597.805 128.876 597.834 128.753 597.833 128.607ZM601.207 126.727V127.409H599.237V126.727H601.207ZM599.684 125.943H600.592V128.994C600.592 129.078 600.604 129.143 600.63 129.19C600.656 129.236 600.691 129.268 600.737 129.286C600.783 129.305 600.837 129.314 600.899 129.314C600.941 129.314 600.984 129.31 601.026 129.303C601.069 129.295 601.102 129.288 601.124 129.284L601.267 129.96C601.222 129.974 601.158 129.99 601.075 130.009C600.993 130.028 600.893 130.04 600.775 130.045C600.556 130.053 600.364 130.024 600.2 129.957C600.036 129.891 599.909 129.787 599.818 129.646C599.727 129.506 599.683 129.328 599.684 129.114V125.943ZM604.481 127.661L603.65 127.712C603.636 127.641 603.605 127.577 603.558 127.52C603.511 127.462 603.449 127.415 603.373 127.381C603.297 127.346 603.207 127.328 603.102 127.328C602.962 127.328 602.843 127.358 602.746 127.418C602.65 127.476 602.601 127.554 602.601 127.652C602.601 127.73 602.633 127.796 602.695 127.85C602.758 127.904 602.865 127.947 603.017 127.98L603.609 128.099C603.927 128.165 604.165 128.27 604.321 128.415C604.477 128.56 604.555 128.75 604.555 128.986C604.555 129.2 604.492 129.388 604.366 129.55C604.241 129.712 604.069 129.839 603.85 129.93C603.633 130.019 603.382 130.064 603.098 130.064C602.665 130.064 602.32 129.974 602.062 129.793C601.807 129.612 601.657 129.364 601.613 129.052L602.506 129.005C602.533 129.137 602.598 129.238 602.702 129.308C602.805 129.376 602.938 129.41 603.1 129.41C603.259 129.41 603.387 129.379 603.484 129.318C603.582 129.256 603.631 129.175 603.633 129.077C603.631 128.995 603.597 128.928 603.528 128.875C603.46 128.821 603.355 128.78 603.213 128.751L602.646 128.638C602.327 128.575 602.089 128.464 601.932 128.306C601.778 128.148 601.7 127.947 601.7 127.703C601.7 127.493 601.757 127.312 601.871 127.16C601.986 127.008 602.147 126.891 602.354 126.808C602.563 126.726 602.807 126.685 603.087 126.685C603.501 126.685 603.826 126.772 604.063 126.947C604.302 127.121 604.441 127.359 604.481 127.661ZM605.949 129.058L605.951 127.969H606.084L607.132 126.727H608.174L606.765 128.372H606.55L605.949 129.058ZM605.127 130V125.636H606.035V130H605.127ZM607.172 130L606.209 128.575L606.814 127.933L608.236 130H607.172Z"
                  fill="black"
                ></path>
                <g id="Army_21">
                  <circle
                    id="armycircle_21"
                    cx="598"
                    cy="139"
                    r="5.5"
                    fill={getCircleFill("irkutsk")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("irkutsk")}
                  ></circle>
                  {getArmyNum("irkutsk", "598", "139")}
                </g>
              </g>
            </g>
            <g id="mongolia">
              <path
                id="mongolia_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M566.685 158.489C566.685 158.489 567.376 158.489 567.684 159.412C567.991 160.334 568.837 161.794 567.991 162.947C567.146 164.1 566.454 166.252 567.376 168.327C568.299 170.403 569.913 170.633 569.759 171.863C569.605 173.093 569.375 172.785 569.221 174.476C569.067 176.167 569.375 177.243 568.984 177.955C568.79 178.912 567.837 180.01 567.837 180.01C567.837 180.01 568.971 181.916 569.59 182.093C570.209 182.27 570.739 188.545 570.739 188.545C570.739 188.545 571.711 187.927 571.976 188.722C572.241 189.518 572.595 190.843 572.595 190.843C572.595 190.843 573.921 191.639 573.921 192.081C573.921 192.523 573.832 193.583 574.186 193.76C574.54 193.937 575.954 194.556 575.954 194.556L576.307 195.882C576.307 195.882 576.484 197.031 577.014 197.119C577.545 197.207 577.81 197.031 578.517 197.384C579.224 197.738 579.401 197.826 580.02 197.826C580.638 197.826 580.904 197.738 580.904 198.268C580.904 198.798 580.815 199.682 581.169 199.771C581.522 199.859 582.406 199.947 582.406 199.947C582.406 199.947 582.671 200.478 583.025 200.831C583.378 201.185 584.439 201.273 584.616 201.627C584.793 201.98 584.881 202.599 584.969 202.953C585.058 203.306 584.704 204.102 586.03 204.19C587.356 204.278 595.046 203.129 595.046 203.129L595.576 204.013C595.576 204.013 596.106 204.544 596.725 204.72C597.344 204.897 598.493 204.455 599.465 204.897C600.437 205.339 601.233 205.604 601.675 205.604C602.117 205.604 603.001 205.604 603.001 205.604C603.001 205.604 603.266 206.842 603.708 206.93C604.15 207.018 605.917 206.311 605.917 206.311C605.917 206.311 606.271 205.781 606.801 205.869C607.332 205.958 607.42 204.72 608.392 204.632C609.365 204.544 609.895 204.544 610.248 204.544C610.602 204.544 612.723 203.483 612.812 204.367C612.9 205.251 612.989 205.781 613.43 206.311C613.872 206.842 615.11 207.195 615.552 207.195C615.994 207.195 616.966 206.577 617.585 206.223C618.203 205.869 618.469 205.516 619.264 205.693C620.06 205.869 620.855 206.4 621.209 206.577C621.562 206.753 621.739 206.753 622.8 207.107C623.86 207.46 625.275 207.372 625.275 207.372C625.275 207.372 627.838 207.637 628.738 207.97C629.165 208.224 631.04 208.912 631.728 208.849C632.728 208.349 632.603 209.349 633.978 207.849C635.353 206.349 634.478 207.599 635.853 205.599C637.228 203.599 639.478 203.349 636.978 203.099C634.478 202.849 634.853 203.599 633.978 202.724C633.103 201.849 633.853 201.599 632.353 201.724C630.853 201.849 630.853 202.099 630.478 201.599C630.103 201.099 631.228 200.724 629.353 200.724C627.478 200.724 628.103 201.474 626.603 200.599C625.103 199.724 624.978 200.099 625.103 199.099C625.228 198.099 625.228 197.224 626.228 196.974C627.228 196.724 626.978 196.974 627.603 196.474C628.228 195.974 628.603 195.849 628.603 195.099C628.603 194.349 629.978 193.974 630.353 192.974C630.728 191.974 630.728 190.474 631.478 190.474C632.228 190.474 632.228 190.349 632.853 192.099C633.478 193.849 631.978 194.599 633.728 194.724C635.478 194.849 636.478 194.974 637.228 194.849C637.978 194.724 637.478 194.974 638.353 195.974C639.228 196.974 639.103 197.474 639.978 198.099C640.853 198.724 640.978 199.849 640.978 199.849C640.978 199.849 640.978 200.474 642.103 200.224C643.228 199.974 644.978 199.974 644.978 199.974C644.978 199.974 644.478 199.349 645.103 201.474C645.728 203.599 646.103 203.099 646.103 204.974C646.103 206.849 645.228 207.849 646.103 208.474C646.978 209.099 647.978 209.349 647.978 209.349C647.978 209.349 650.603 206.849 650.853 205.724C651.103 204.599 651.853 204.224 651.728 203.349C651.603 202.474 651.353 203.099 651.853 201.974C652.353 200.849 652.353 198.849 652.353 198.849C652.353 198.849 651.853 198.724 651.353 198.474C650.853 198.224 650.603 198.349 650.353 196.974C650.103 195.599 650.603 195.599 649.728 195.224C648.853 194.849 648.478 194.224 648.228 193.474C647.978 192.724 648.103 192.224 647.478 192.099C646.853 191.974 646.978 191.849 645.603 190.849C644.228 189.849 644.478 190.349 643.478 189.724C642.478 189.099 642.228 188.724 642.228 187.849C642.228 186.974 641.978 186.724 642.603 186.099C643.228 185.474 643.603 186.849 643.728 184.599C643.853 182.349 643.103 182.224 644.228 179.974C645.353 177.724 645.103 176.849 645.978 176.099C646.54 175.662 646.415 176.099 648.071 174.349C648.167 174.403 648.167 174.492 647.195 174.315C646.223 174.138 646.046 172.282 644.808 172.193C643.571 172.105 642.775 171.398 642.51 170.426C642.245 169.453 641.361 166.625 639.417 166.713C637.472 166.802 637.119 164.238 635.351 162.117C633.583 159.996 637.472 160.173 637.472 159.466C637.472 158.758 637.207 159.377 636.942 157.433C636.942 157.433 636.04 158.349 634.915 158.037C633.79 157.724 633.04 157.349 632.915 156.474C632.79 155.599 631.665 155.162 631.665 155.162C631.665 155.162 630.103 155.099 630.04 154.599C629.978 154.099 629.728 153.724 629.54 152.162C629.353 150.599 629.478 150.224 628.853 150.224C628.228 150.224 627.478 150.349 627.228 150.099C626.978 149.849 626.665 149.662 626.603 148.849C626.54 148.037 626.478 147.224 626.103 147.099C625.728 146.974 625.103 146.662 624.728 146.662C624.353 146.662 623.103 146.912 622.978 146.412C622.853 145.912 622.728 145.224 622.853 144.724C622.978 144.224 623.165 143.912 623.165 143.474C623.165 143.037 622.915 142.037 622.915 142.037C622.915 142.037 622.478 142.037 622.04 141.662C621.603 141.287 621.603 140.724 620.978 140.599C620.353 140.474 619.978 140.287 619.415 140.912C618.853 141.537 618.478 142.099 618.165 142.224C617.853 142.349 615.978 142.537 615.353 142.537C614.728 142.537 613.79 142.162 613.79 142.162L613.353 141.662C613.353 141.662 612.478 141.349 612.478 141.724C612.478 142.099 612.79 142.474 612.478 142.974C612.165 143.474 612.353 143.474 611.665 144.037C610.978 144.599 610.54 144.724 610.478 145.162C610.415 145.599 610.415 145.787 610.79 146.224C611.165 146.662 611.353 146.537 611.54 147.099C611.728 147.662 611.79 147.787 611.79 148.412C611.79 149.037 611.853 149.912 611.415 150.287C610.978 150.662 610.853 150.599 610.54 151.412C610.228 152.224 609.978 152.349 609.79 152.724C609.603 153.099 609.353 153.287 609.728 154.037C610.103 154.787 610.478 155.287 610.728 155.599C610.978 155.912 611.29 156.412 611.04 157.224C610.79 158.037 610.728 158.474 610.228 158.974C609.728 159.474 609.29 160.537 608.915 160.974C608.54 161.412 608.665 161.912 608.04 161.599C607.415 161.287 606.978 160.724 606.915 160.474C606.853 160.224 606.79 159.974 606.603 159.224C606.415 158.474 606.165 157.537 606.04 157.287C605.915 157.037 604.326 156.195 603.929 156.991C603.531 157.786 603.664 158.537 603.045 158.803C602.426 159.068 602.294 159.068 602.028 159.466C601.763 159.863 601.012 160.968 600.437 160.836C599.863 160.703 599.73 160.57 598.802 160.438C597.874 160.305 597.123 159.996 596.725 160.57C596.327 161.145 595.311 161.985 594.604 161.719C593.897 161.454 592.969 160.924 592.748 160.703C592.527 160.482 591.157 159.863 590.45 159.952C589.742 160.04 589.742 160.217 588.372 160.128C587.002 160.04 585.677 159.51 584.793 159.51C583.909 159.51 581.611 158.361 580.904 158.493C580.196 158.626 580.329 158.626 579.578 158.935C578.826 159.245 578.296 158.758 577.987 159.289C577.677 159.819 577.677 160.57 576.749 160.438C575.821 160.305 575.335 160.305 574.982 159.952C574.628 159.598 574.363 159.068 574.363 159.068C574.363 159.068 573.788 158.847 573.435 158.935C573.081 159.024 572.153 158.935 572.153 158.935C572.153 158.935 571.358 158.14 571.181 158.095C571.004 158.051 570.253 157.609 569.943 157.654C569.634 157.698 568.308 157.919 568.308 157.919C568.308 157.919 566.364 158.051 566.685 158.489Z"
                className={getCountryClass("mongolia")}
                fill={getFill("mongolia")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_22">
                <path
                  id="Mongolia"
                  d="M598.815 166.636H599.953L601.154 169.568H601.205L602.407 166.636H603.545V171H602.65V168.16H602.614L601.485 170.979H600.875L599.746 168.149H599.71V171H598.815V166.636ZM605.767 171.064C605.436 171.064 605.15 170.994 604.908 170.853C604.668 170.711 604.483 170.513 604.352 170.261C604.221 170.006 604.156 169.712 604.156 169.376C604.156 169.038 604.221 168.743 604.352 168.49C604.483 168.236 604.668 168.038 604.908 167.898C605.15 167.756 605.436 167.685 605.767 167.685C606.098 167.685 606.383 167.756 606.623 167.898C606.865 168.038 607.051 168.236 607.181 168.49C607.312 168.743 607.377 169.038 607.377 169.376C607.377 169.712 607.312 170.006 607.181 170.261C607.051 170.513 606.865 170.711 606.623 170.853C606.383 170.994 606.098 171.064 605.767 171.064ZM605.771 170.361C605.922 170.361 606.047 170.318 606.148 170.233C606.249 170.146 606.325 170.028 606.376 169.879C606.429 169.73 606.455 169.56 606.455 169.37C606.455 169.18 606.429 169.01 606.376 168.861C606.325 168.712 606.249 168.594 606.148 168.507C606.047 168.42 605.922 168.377 605.771 168.377C605.619 168.377 605.491 168.42 605.387 168.507C605.285 168.594 605.208 168.712 605.155 168.861C605.104 169.01 605.078 169.18 605.078 169.37C605.078 169.56 605.104 169.73 605.155 169.879C605.208 170.028 605.285 170.146 605.387 170.233C605.491 170.318 605.619 170.361 605.771 170.361ZM608.875 169.108V171H607.968V167.727H608.833V168.305H608.871C608.944 168.114 609.065 167.964 609.235 167.853C609.406 167.741 609.613 167.685 609.855 167.685C610.083 167.685 610.281 167.734 610.45 167.834C610.619 167.933 610.75 168.075 610.844 168.26C610.938 168.443 610.985 168.662 610.985 168.916V171H610.077V169.078C610.078 168.878 610.027 168.722 609.924 168.609C609.82 168.496 609.677 168.439 609.495 168.439C609.373 168.439 609.265 168.465 609.172 168.518C609.079 168.57 609.007 168.647 608.954 168.748C608.903 168.847 608.877 168.967 608.875 169.108ZM613.175 172.295C612.881 172.295 612.628 172.255 612.418 172.174C612.209 172.094 612.043 171.986 611.92 171.848C611.796 171.71 611.716 171.555 611.679 171.384L612.518 171.271C612.544 171.336 612.584 171.397 612.64 171.454C612.695 171.511 612.768 171.556 612.859 171.59C612.952 171.626 613.064 171.643 613.196 171.643C613.393 171.643 613.556 171.595 613.684 171.499C613.813 171.403 613.878 171.244 613.878 171.019V170.42H613.839C613.8 170.511 613.74 170.597 613.66 170.678C613.581 170.759 613.479 170.825 613.354 170.876C613.229 170.928 613.079 170.953 612.906 170.953C612.66 170.953 612.437 170.896 612.235 170.783C612.035 170.668 611.875 170.492 611.756 170.256C611.638 170.019 611.579 169.719 611.579 169.357C611.579 168.987 611.639 168.677 611.76 168.428C611.881 168.18 612.041 167.994 612.241 167.87C612.443 167.746 612.664 167.685 612.904 167.685C613.087 167.685 613.241 167.716 613.364 167.778C613.488 167.839 613.587 167.916 613.662 168.009C613.739 168.099 613.798 168.189 613.839 168.277H613.873V167.727H614.775V171.032C614.775 171.31 614.706 171.543 614.57 171.731C614.434 171.918 614.245 172.059 614.003 172.153C613.763 172.248 613.487 172.295 613.175 172.295ZM613.194 170.271C613.34 170.271 613.464 170.235 613.564 170.163C613.667 170.089 613.745 169.984 613.799 169.847C613.854 169.71 613.882 169.545 613.882 169.353C613.882 169.161 613.855 168.995 613.801 168.854C613.747 168.712 613.669 168.602 613.567 168.524C613.464 168.446 613.34 168.407 613.194 168.407C613.045 168.407 612.919 168.447 612.817 168.528C612.714 168.608 612.637 168.719 612.584 168.861C612.532 169.003 612.506 169.167 612.506 169.353C612.506 169.542 612.532 169.705 612.584 169.843C612.638 169.979 612.716 170.085 612.817 170.161C612.919 170.234 613.045 170.271 613.194 170.271ZM616.976 171.064C616.645 171.064 616.358 170.994 616.117 170.853C615.877 170.711 615.692 170.513 615.561 170.261C615.43 170.006 615.365 169.712 615.365 169.376C615.365 169.038 615.43 168.743 615.561 168.49C615.692 168.236 615.877 168.038 616.117 167.898C616.358 167.756 616.645 167.685 616.976 167.685C617.307 167.685 617.592 167.756 617.832 167.898C618.074 168.038 618.26 168.236 618.39 168.49C618.521 168.743 618.586 169.038 618.586 169.376C618.586 169.712 618.521 170.006 618.39 170.261C618.26 170.513 618.074 170.711 617.832 170.853C617.592 170.994 617.307 171.064 616.976 171.064ZM616.98 170.361C617.131 170.361 617.256 170.318 617.357 170.233C617.458 170.146 617.534 170.028 617.585 169.879C617.638 169.73 617.664 169.56 617.664 169.37C617.664 169.18 617.638 169.01 617.585 168.861C617.534 168.712 617.458 168.594 617.357 168.507C617.256 168.42 617.131 168.377 616.98 168.377C616.828 168.377 616.7 168.42 616.596 168.507C616.494 168.594 616.417 168.712 616.364 168.861C616.313 169.01 616.287 169.18 616.287 169.37C616.287 169.56 616.313 169.73 616.364 169.879C616.417 170.028 616.494 170.146 616.596 170.233C616.7 170.318 616.828 170.361 616.98 170.361ZM620.084 166.636V171H619.177V166.636H620.084ZM620.811 171V167.727H621.719V171H620.811ZM621.267 167.305C621.132 167.305 621.017 167.261 620.92 167.171C620.825 167.08 620.777 166.972 620.777 166.845C620.777 166.72 620.825 166.613 620.92 166.523C621.017 166.433 621.132 166.387 621.267 166.387C621.402 166.387 621.517 166.433 621.613 166.523C621.709 166.613 621.757 166.72 621.757 166.845C621.757 166.972 621.709 167.08 621.613 167.171C621.517 167.261 621.402 167.305 621.267 167.305ZM623.379 171.062C623.171 171.062 622.985 171.026 622.821 170.953C622.658 170.879 622.529 170.771 622.433 170.627C622.34 170.482 622.293 170.302 622.293 170.086C622.293 169.904 622.326 169.751 622.393 169.628C622.46 169.504 622.551 169.405 622.666 169.33C622.781 169.254 622.911 169.197 623.058 169.159C623.205 169.121 623.36 169.094 623.522 169.078C623.713 169.058 623.866 169.04 623.982 169.023C624.099 169.004 624.183 168.977 624.236 168.942C624.289 168.906 624.315 168.854 624.315 168.784V168.771C624.315 168.636 624.272 168.532 624.187 168.458C624.103 168.384 623.984 168.347 623.829 168.347C623.666 168.347 623.536 168.384 623.439 168.456C623.343 168.527 623.279 168.616 623.247 168.724L622.408 168.656C622.45 168.457 622.534 168.286 622.659 168.141C622.784 167.994 622.945 167.882 623.143 167.804C623.342 167.724 623.572 167.685 623.833 167.685C624.015 167.685 624.189 167.706 624.355 167.749C624.523 167.791 624.671 167.857 624.801 167.947C624.931 168.036 625.034 168.151 625.11 168.292C625.185 168.431 625.222 168.598 625.222 168.793V171H624.362V170.546H624.336C624.284 170.648 624.213 170.739 624.125 170.817C624.037 170.893 623.931 170.954 623.808 170.998C623.684 171.04 623.541 171.062 623.379 171.062ZM623.639 170.435C623.773 170.435 623.891 170.409 623.993 170.357C624.095 170.303 624.176 170.23 624.234 170.139C624.292 170.048 624.321 169.945 624.321 169.83V169.483C624.293 169.501 624.254 169.518 624.204 169.534C624.156 169.548 624.101 169.562 624.04 169.575C623.979 169.586 623.918 169.597 623.857 169.607C623.796 169.615 623.74 169.623 623.691 169.63C623.584 169.646 623.491 169.67 623.411 169.705C623.332 169.739 623.27 169.785 623.226 169.843C623.182 169.9 623.16 169.971 623.16 170.056C623.16 170.18 623.205 170.274 623.294 170.339C623.385 170.403 623.5 170.435 623.639 170.435Z"
                  fill="black"
                ></path>
                <g id="Army_22">
                  <circle
                    id="armycircle_22"
                    cx="612"
                    cy="180"
                    r="5.5"
                    fill={getCircleFill("mongolia")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("mongolia")}
                  ></circle>
                  {getArmyNum("mongolia", "612", "180")}
                </g>
              </g>
            </g>
            <g id="kamchatka">
              <path
                id="kamchatka_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M647.978 174.349C648.978 173.599 648.728 174.474 649.603 172.599C650.478 170.724 650.228 170.099 650.853 169.474C651.478 168.849 652.853 166.599 652.728 164.974C652.603 163.349 652.103 163.474 652.478 161.974C652.853 160.474 652.978 160.474 653.228 158.474C653.478 156.474 652.978 156.724 653.603 154.349C654.228 151.974 654.353 151.474 653.978 150.599C653.603 149.724 653.353 148.724 653.353 147.224C653.353 145.724 653.478 144.474 653.353 143.974C653.228 143.474 653.103 142.974 652.728 141.599C652.353 140.224 651.353 139.224 651.353 139.224C651.353 139.224 651.103 140.224 650.603 138.599C650.103 136.974 650.228 137.474 649.978 136.474C649.728 135.474 648.978 136.974 649.353 133.599C649.728 130.224 649.603 129.099 649.603 129.099C649.603 129.099 649.478 125.724 647.228 125.724C644.978 125.724 644.228 126.349 643.978 124.474C643.728 122.599 642.728 122.224 641.228 121.974C639.728 121.724 639.478 121.974 638.728 121.599C637.978 121.224 638.353 120.974 637.103 120.974C635.853 120.974 636.603 121.474 634.853 120.974C633.103 120.474 633.103 121.724 632.853 120.474C632.603 119.224 632.728 118.349 634.478 115.599C636.228 112.849 636.103 112.224 636.353 110.849C636.603 109.474 635.103 110.099 637.353 108.099C639.603 106.099 638.978 105.474 641.603 105.474C644.228 105.474 644.603 105.474 646.478 104.599C648.353 103.724 646.853 102.724 649.103 103.724C651.353 104.724 651.103 105.724 652.353 104.599C653.603 103.474 653.978 102.724 654.603 102.724C655.228 102.724 657.603 104.099 657.603 104.099C657.603 104.099 658.603 104.599 659.478 104.349C660.353 104.099 661.103 105.974 661.978 104.224C662.853 102.474 662.478 101.974 661.603 101.474C660.728 100.974 659.728 103.224 660.228 100.224C660.728 97.2243 661.228 96.0993 660.853 95.0993C660.478 94.0993 657.853 90.5993 660.978 92.7243C664.103 94.8493 663.353 95.2243 664.478 95.8493C665.603 96.4743 665.103 96.4743 665.478 98.8493C665.853 101.224 669.603 100.724 669.103 103.724C668.603 106.724 668.603 107.599 668.353 108.849C668.103 110.099 666.728 109.224 667.103 114.349C667.478 119.474 667.853 128.599 672.353 132.599C676.853 136.599 677.978 137.099 678.603 135.349C679.228 133.599 679.853 132.849 679.478 130.849C679.103 128.849 678.103 128.099 678.853 126.724C679.603 125.349 680.228 124.474 680.353 123.349C680.478 122.224 680.728 121.349 680.603 120.099C680.478 118.849 680.603 117.349 680.353 116.349C680.103 115.349 679.853 113.724 679.728 112.724C679.603 111.724 678.603 109.974 678.228 109.099C677.853 108.224 676.728 106.474 676.478 105.224C676.228 103.974 675.728 103.474 676.978 101.724C678.228 99.9743 675.853 98.9743 678.728 99.3493C681.603 99.7243 681.478 100.099 682.978 99.8493C684.478 99.5993 685.978 100.474 686.478 98.7243C686.978 96.9743 686.603 97.2243 687.478 95.9743C688.353 94.7243 688.728 94.9743 689.728 93.4743C690.728 91.9743 689.228 91.4743 691.728 89.4743C694.228 87.4743 695.728 86.7243 696.353 85.9743C696.978 85.2243 698.228 84.8493 697.228 83.8493C696.228 82.8493 696.103 81.9743 694.728 81.0993C693.353 80.2243 692.603 79.5993 691.978 79.4743C691.353 79.3493 690.478 79.0993 691.103 78.5993C691.728 78.0993 692.728 77.2243 693.728 77.2243C694.728 77.2243 694.728 78.2243 696.228 77.4743C697.728 76.7243 698.353 76.2243 699.353 76.9743C700.353 77.7243 699.728 77.0993 700.478 78.5993C701.228 80.0993 699.728 79.5993 701.728 80.7243C703.728 81.8493 705.603 82.0993 706.228 82.0993C706.853 82.0993 706.478 82.8493 707.978 81.9743C709.478 81.0993 709.228 81.4743 710.228 80.0993C711.228 78.7243 711.853 78.4743 711.478 76.7243C711.103 74.9743 710.478 73.8493 710.478 73.3493L709.353 71.4743C709.353 71.4743 709.353 70.5993 707.603 70.5993C705.853 70.5993 704.853 70.7243 704.853 70.0993C704.853 69.4743 705.353 68.3493 704.228 68.3493C703.103 68.3493 702.478 67.3493 701.728 68.2243C700.978 69.0993 700.478 70.0993 699.603 69.5993C698.728 69.0993 697.728 67.8493 697.728 67.8493C697.728 67.8493 697.978 66.5993 697.603 66.0993C697.228 65.5993 696.103 64.4743 696.103 64.4743L694.478 63.7243C694.478 63.7243 691.103 60.3493 689.853 60.2243C688.603 60.0993 687.478 60.3493 687.103 59.3493C686.728 58.3493 688.853 58.3493 685.728 57.8493C682.603 57.3493 682.478 57.8493 681.478 56.4743C680.478 55.0993 681.853 54.7243 679.353 54.5993C676.853 54.4743 675.728 54.8493 673.603 53.9743C671.478 53.0993 671.478 52.2243 670.478 53.2243C669.478 54.2243 669.978 54.3493 668.603 55.4743C667.228 56.5993 667.978 57.5993 665.853 57.5993C663.728 57.5993 664.103 57.8493 662.853 57.3493C661.603 56.8493 661.853 56.4743 660.353 56.3493C658.853 56.2243 659.228 56.3493 657.728 56.4743C656.228 56.5993 657.478 57.4743 655.103 56.3493C652.728 55.2243 652.728 54.9743 650.978 54.0993C649.228 53.2243 648.728 52.9743 647.853 52.9743C646.978 52.9743 643.353 52.5993 642.353 53.4743C642.353 53.4743 641.008 54.9021 641.008 56.3163C641.008 57.7305 641.803 59.0564 640.566 59.2331C639.984 59.3163 639.421 59.2626 638.952 59.2743C638.424 59.2874 638.013 59.3836 637.826 59.8518C637.472 60.7357 636.765 60.5589 636.677 61.4428C636.588 62.3267 635.881 63.4758 635.351 63.4758C634.82 63.4758 633.318 63.7409 632.876 64.2713C632.434 64.8016 632.699 64.0945 632.257 67.0997C631.815 70.1049 631.815 74.7895 632.788 74.8779C633.76 74.9663 636.235 75.143 636.853 75.3198C637.472 75.4966 638.091 76.4689 638.179 77.2644C638.268 78.0598 638.533 79.7392 638.268 80.3579C638.002 80.9767 637.119 81.2418 637.03 82.0373C636.942 82.8328 637.384 84.6006 636.765 85.1309C636.146 85.6612 635.174 86.3683 634.732 86.4567C634.29 86.5451 632.699 86.7219 632.257 86.5451C631.815 86.3684 632.257 84.9541 631.285 84.9541C630.313 84.9541 629.605 85.3077 628.545 85.3961C627.484 85.4845 627.838 86.1916 627.219 84.9541C626.6 83.7167 626.865 81.9489 626.423 81.7722C625.982 81.5954 622.093 81.4186 621.385 82.656C620.678 83.8935 618.645 85.6612 618.645 85.6612C618.645 85.6612 617.673 83.4515 616.878 86.4567C616.082 89.4619 614.403 90.8762 614.314 91.3181C614.226 91.76 615.287 93.9697 613.961 95.2072C612.635 96.4446 611.839 97.1517 611.397 98.2124C610.956 99.273 611.044 100.687 611.309 101.129C611.574 101.571 612.723 104.046 612.37 106.079C612.016 108.112 611.486 114.211 611.751 115.36C612.016 116.509 612.105 119.337 612.9 120.133C613.696 120.928 614.049 121.547 614.403 122.254C614.756 122.961 618.38 124.11 618.999 125.613C619.618 127.115 619.264 127.469 620.325 128.088C621.385 128.706 622.358 130.032 622.446 131.27C622.534 132.507 622.534 134.363 623.418 134.098C624.302 133.833 625.274 132.595 625.628 132.242C625.982 131.888 627.307 131.446 628.456 131.888C629.606 132.33 629.871 132.33 631.02 132.154C632.169 131.977 633.229 132.33 633.229 132.33C633.229 132.33 634.113 133.656 634.202 134.363C634.29 135.07 633.76 135.601 635.351 135.512C636.942 135.424 637.295 135.335 637.472 137.103C637.649 138.871 638.621 139.843 638.621 139.843C638.621 139.843 638.886 141.699 638.798 142.141C638.71 142.583 638.091 143.644 638.356 144.793C638.621 145.942 639.24 147.091 638.71 147.887C638.179 148.682 637.295 150.45 637.295 151.157C637.295 151.864 637.119 153.72 637.295 154.339C637.472 154.958 636.765 154.516 637.03 156.46C637.295 158.405 637.472 158.758 637.472 159.466C637.472 160.173 633.583 159.996 635.351 162.117C637.118 164.238 637.472 166.802 639.417 166.713C641.361 166.625 642.245 169.453 642.51 170.426C642.775 171.398 643.571 172.105 644.808 172.193C646.046 172.282 646.223 174.138 647.195 174.315C648.167 174.492 648.167 174.403 647.978 174.349Z"
                className={getCountryClass("kamchatka")}
                fill={getFill("kamchatka")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_23">
                <path
                  id="Kamchatka"
                  d="M652.774 67V62.6364H653.696V64.5604H653.754L655.324 62.6364H656.43L654.811 64.5902L656.449 67H655.346L654.15 65.206L653.696 65.7599V67H652.774ZM657.827 67.0618C657.618 67.0618 657.432 67.0256 657.268 66.9531C657.105 66.8793 656.976 66.7706 656.881 66.6271C656.787 66.4822 656.74 66.3018 656.74 66.0859C656.74 65.9041 656.773 65.7514 656.84 65.6278C656.907 65.5043 656.998 65.4048 657.113 65.3295C657.228 65.2543 657.359 65.1974 657.505 65.1591C657.653 65.1207 657.808 65.0938 657.969 65.0781C658.16 65.0582 658.313 65.0398 658.43 65.0227C658.546 65.0043 658.631 64.9773 658.683 64.9418C658.736 64.9062 658.762 64.8537 658.762 64.7841V64.7713C658.762 64.6364 658.719 64.532 658.634 64.4581C658.55 64.3842 658.431 64.3473 658.276 64.3473C658.113 64.3473 657.983 64.3835 657.886 64.456C657.79 64.527 657.726 64.6165 657.695 64.7244L656.855 64.6562C656.898 64.4574 656.982 64.2855 657.107 64.1406C657.232 63.9943 657.393 63.8821 657.59 63.804C657.789 63.7244 658.019 63.6847 658.281 63.6847C658.462 63.6847 658.636 63.706 658.803 63.7486C658.97 63.7912 659.119 63.8572 659.248 63.9467C659.379 64.0362 659.482 64.1513 659.557 64.2919C659.632 64.4311 659.67 64.598 659.67 64.7926V67H658.809V66.5462H658.783C658.731 66.6484 658.661 66.7386 658.572 66.8168C658.484 66.8935 658.379 66.9538 658.255 66.9979C658.131 67.0405 657.989 67.0618 657.827 67.0618ZM658.087 66.4354C658.22 66.4354 658.338 66.4091 658.44 66.3565C658.543 66.3026 658.623 66.2301 658.681 66.1392C658.739 66.0483 658.768 65.9453 658.768 65.8303V65.483C658.74 65.5014 658.701 65.5185 658.651 65.5341C658.603 65.5483 658.548 65.5618 658.487 65.5746C658.426 65.5859 658.365 65.5966 658.304 65.6065C658.243 65.6151 658.188 65.6229 658.138 65.63C658.031 65.6456 657.938 65.6705 657.859 65.7045C657.779 65.7386 657.717 65.7848 657.673 65.843C657.629 65.8999 657.607 65.9709 657.607 66.0561C657.607 66.1797 657.652 66.2741 657.741 66.3395C657.832 66.4034 657.947 66.4354 658.087 66.4354ZM660.374 67V63.7273H661.239V64.3047H661.277C661.346 64.1129 661.459 63.9616 661.618 63.8509C661.777 63.7401 661.968 63.6847 662.189 63.6847C662.414 63.6847 662.605 63.7408 662.762 63.853C662.92 63.9638 663.025 64.1143 663.078 64.3047H663.112C663.179 64.1172 663.299 63.9673 663.474 63.8551C663.65 63.7415 663.858 63.6847 664.098 63.6847C664.404 63.6847 664.652 63.782 664.842 63.9766C665.034 64.1697 665.13 64.4439 665.13 64.799V67H664.224V64.978C664.224 64.7962 664.176 64.6598 664.079 64.5689C663.983 64.478 663.862 64.4325 663.717 64.4325C663.552 64.4325 663.424 64.4851 663.331 64.5902C663.239 64.6939 663.193 64.831 663.193 65.0014V67H662.313V64.9588C662.313 64.7983 662.267 64.6705 662.174 64.5753C662.083 64.4801 661.963 64.4325 661.814 64.4325C661.713 64.4325 661.623 64.4581 661.542 64.5092C661.462 64.5589 661.399 64.6293 661.352 64.7202C661.305 64.8097 661.282 64.9148 661.282 65.0355V67H660.374ZM667.325 67.0639C666.99 67.0639 666.702 66.9929 666.46 66.8509C666.22 66.7074 666.036 66.5085 665.906 66.2543C665.778 66 665.714 65.7074 665.714 65.3764C665.714 65.0412 665.779 64.7472 665.908 64.4943C666.039 64.2401 666.224 64.0419 666.464 63.8999C666.705 63.7564 666.99 63.6847 667.321 63.6847C667.607 63.6847 667.857 63.7365 668.071 63.8402C668.286 63.9439 668.455 64.0895 668.58 64.277C668.705 64.4645 668.774 64.6847 668.787 64.9375H667.93C667.906 64.7741 667.842 64.6428 667.739 64.5433C667.636 64.4425 667.502 64.392 667.336 64.392C667.195 64.392 667.072 64.4304 666.967 64.5071C666.864 64.5824 666.783 64.6925 666.724 64.8374C666.666 64.9822 666.637 65.1577 666.637 65.3636C666.637 65.5724 666.665 65.75 666.722 65.8963C666.781 66.0426 666.862 66.1541 666.967 66.2308C667.072 66.3075 667.195 66.3459 667.336 66.3459C667.44 66.3459 667.533 66.3246 667.615 66.282C667.699 66.2393 667.768 66.1776 667.822 66.0966C667.877 66.0142 667.913 65.9155 667.93 65.8004H668.787C668.773 66.0504 668.705 66.2706 668.582 66.4609C668.462 66.6499 668.295 66.7976 668.082 66.9041C667.869 67.0107 667.616 67.0639 667.325 67.0639ZM670.276 65.108V67H669.368V62.6364H670.25V64.3047H670.289C670.362 64.1115 670.482 63.9602 670.646 63.8509C670.811 63.7401 671.018 63.6847 671.267 63.6847C671.494 63.6847 671.692 63.7344 671.861 63.8338C672.031 63.9318 672.164 64.0732 672.257 64.2578C672.352 64.4411 672.399 64.6605 672.398 64.9162V67H671.49V65.0781C671.492 64.8764 671.441 64.7195 671.337 64.6072C671.235 64.495 671.091 64.4389 670.906 64.4389C670.783 64.4389 670.673 64.4652 670.578 64.5178C670.485 64.5703 670.411 64.647 670.357 64.7479C670.304 64.8473 670.277 64.9673 670.276 65.108ZM674.045 67.0618C673.837 67.0618 673.651 67.0256 673.487 66.9531C673.324 66.8793 673.195 66.7706 673.099 66.6271C673.006 66.4822 672.959 66.3018 672.959 66.0859C672.959 65.9041 672.992 65.7514 673.059 65.6278C673.126 65.5043 673.217 65.4048 673.332 65.3295C673.447 65.2543 673.577 65.1974 673.724 65.1591C673.871 65.1207 674.026 65.0938 674.188 65.0781C674.379 65.0582 674.532 65.0398 674.648 65.0227C674.765 65.0043 674.849 64.9773 674.902 64.9418C674.955 64.9062 674.981 64.8537 674.981 64.7841V64.7713C674.981 64.6364 674.938 64.532 674.853 64.4581C674.769 64.3842 674.65 64.3473 674.495 64.3473C674.332 64.3473 674.202 64.3835 674.105 64.456C674.009 64.527 673.945 64.6165 673.913 64.7244L673.074 64.6562C673.116 64.4574 673.2 64.2855 673.325 64.1406C673.45 63.9943 673.612 63.8821 673.809 63.804C674.008 63.7244 674.238 63.6847 674.499 63.6847C674.681 63.6847 674.855 63.706 675.021 63.7486C675.189 63.7912 675.337 63.8572 675.467 63.9467C675.597 64.0362 675.7 64.1513 675.776 64.2919C675.851 64.4311 675.888 64.598 675.888 64.7926V67H675.028V66.5462H675.002C674.95 66.6484 674.879 66.7386 674.791 66.8168C674.703 66.8935 674.597 66.9538 674.474 66.9979C674.35 67.0405 674.207 67.0618 674.045 67.0618ZM674.305 66.4354C674.439 66.4354 674.557 66.4091 674.659 66.3565C674.761 66.3026 674.842 66.2301 674.9 66.1392C674.958 66.0483 674.987 65.9453 674.987 65.8303V65.483C674.959 65.5014 674.92 65.5185 674.87 65.5341C674.822 65.5483 674.767 65.5618 674.706 65.5746C674.645 65.5859 674.584 65.5966 674.523 65.6065C674.462 65.6151 674.406 65.6229 674.357 65.63C674.25 65.6456 674.157 65.6705 674.077 65.7045C673.998 65.7386 673.936 65.7848 673.892 65.843C673.848 65.8999 673.826 65.9709 673.826 66.0561C673.826 66.1797 673.871 66.2741 673.96 66.3395C674.051 66.4034 674.166 66.4354 674.305 66.4354ZM678.333 63.7273V64.4091H676.363V63.7273H678.333ZM676.81 62.9432H677.718V65.9943C677.718 66.0781 677.73 66.1435 677.756 66.1903C677.782 66.2358 677.817 66.2678 677.863 66.2862C677.909 66.3047 677.963 66.3139 678.025 66.3139C678.067 66.3139 678.11 66.3104 678.152 66.3033C678.195 66.2947 678.228 66.2884 678.25 66.2841L678.393 66.9595C678.348 66.9737 678.284 66.9901 678.201 67.0085C678.119 67.0284 678.019 67.0405 677.901 67.0447C677.682 67.0533 677.49 67.0241 677.326 66.9574C677.162 66.8906 677.035 66.7869 676.944 66.6463C676.853 66.5057 676.809 66.3281 676.81 66.1136V62.9432ZM679.817 66.0582L679.82 64.9695H679.952L681 63.7273H682.042L680.634 65.3722H680.418L679.817 66.0582ZM678.995 67V62.6364H679.903V67H678.995ZM681.04 67L680.077 65.5746L680.683 64.9332L682.104 67H681.04ZM683.42 67.0618C683.212 67.0618 683.026 67.0256 682.862 66.9531C682.699 66.8793 682.57 66.7706 682.474 66.6271C682.381 66.4822 682.334 66.3018 682.334 66.0859C682.334 65.9041 682.367 65.7514 682.434 65.6278C682.501 65.5043 682.592 65.4048 682.707 65.3295C682.822 65.2543 682.952 65.1974 683.099 65.1591C683.246 65.1207 683.401 65.0938 683.563 65.0781C683.754 65.0582 683.907 65.0398 684.023 65.0227C684.14 65.0043 684.224 64.9773 684.277 64.9418C684.33 64.9062 684.356 64.8537 684.356 64.7841V64.7713C684.356 64.6364 684.313 64.532 684.228 64.4581C684.144 64.3842 684.025 64.3473 683.87 64.3473C683.707 64.3473 683.577 64.3835 683.48 64.456C683.384 64.527 683.32 64.6165 683.288 64.7244L682.449 64.6562C682.491 64.4574 682.575 64.2855 682.7 64.1406C682.825 63.9943 682.987 63.8821 683.184 63.804C683.383 63.7244 683.613 63.6847 683.874 63.6847C684.056 63.6847 684.23 63.706 684.396 63.7486C684.564 63.7912 684.712 63.8572 684.842 63.9467C684.972 64.0362 685.075 64.1513 685.151 64.2919C685.226 64.4311 685.263 64.598 685.263 64.7926V67H684.403V66.5462H684.377C684.325 66.6484 684.254 66.7386 684.166 66.8168C684.078 66.8935 683.972 66.9538 683.849 66.9979C683.725 67.0405 683.582 67.0618 683.42 67.0618ZM683.68 66.4354C683.814 66.4354 683.932 66.4091 684.034 66.3565C684.136 66.3026 684.217 66.2301 684.275 66.1392C684.333 66.0483 684.362 65.9453 684.362 65.8303V65.483C684.334 65.5014 684.295 65.5185 684.245 65.5341C684.197 65.5483 684.142 65.5618 684.081 65.5746C684.02 65.5859 683.959 65.5966 683.898 65.6065C683.837 65.6151 683.781 65.6229 683.732 65.63C683.625 65.6456 683.532 65.6705 683.452 65.7045C683.373 65.7386 683.311 65.7848 683.267 65.843C683.223 65.8999 683.201 65.9709 683.201 66.0561C683.201 66.1797 683.246 66.2741 683.335 66.3395C683.426 66.4034 683.541 66.4354 683.68 66.4354Z"
                  fill="black"
                ></path>
                <g id="Army_23">
                  <circle
                    id="armycircle_23"
                    cx="669"
                    cy="76"
                    r="5.5"
                    fill={getCircleFill("kamchatka")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("kamchatka")}
                  ></circle>
                  {getArmyNum("kamchatka", "669", "76")}
                </g>
              </g>
            </g>
            <g id="japan">
              <path
                id="japan_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M659.039 220.1C659.039 218.862 659.569 215.681 658.862 215.504C658.155 215.327 658.155 214.797 656.918 214.973C655.68 215.15 654.266 214.443 654.266 214.443C654.266 214.443 653.912 213.206 656.034 211.968C658.155 210.731 659.392 210.024 659.392 210.024L658.332 209.317C658.332 209.317 656.034 209.14 657.094 208.433C658.155 207.726 658.332 206.842 659.216 205.781C660.1 204.72 662.221 199.24 663.458 197.119C664.696 194.998 667.524 195.705 667.524 195.705L669.469 190.755C669.469 190.755 667.878 187.043 670.529 185.805C673.181 184.568 673.358 185.982 674.065 182.977C674.772 179.972 676.893 180.502 677.247 179.441C677.6 178.381 677.954 178.381 677.424 176.613C676.893 174.845 675.479 173.254 675.479 173.254C675.479 173.254 674.772 170.602 674.772 169.188C674.772 167.774 674.418 165.476 675.656 164.946C676.893 164.415 674.595 161.587 674.595 161.587C674.595 161.587 675.302 160.526 674.418 159.819C673.535 159.112 673.004 158.228 673.004 157.344C673.004 156.46 673.181 154.162 673.181 154.162C673.181 154.162 674.065 152.748 674.772 152.571C675.479 152.394 676.186 152.748 676.186 150.98C676.186 149.212 675.302 146.561 675.302 146.561C675.302 146.561 671.59 141.081 670.883 140.727C670.176 140.374 670.176 140.02 670.706 138.959C671.236 137.899 674.772 143.202 677.247 143.556C679.722 143.909 682.02 143.556 682.02 143.556L684.318 142.495L688.914 142.672C688.914 142.672 690.859 142.849 691.212 144.793C691.566 146.738 694.041 146.03 692.803 147.798C691.566 149.566 691.743 150.45 690.505 150.273C689.268 150.096 689.444 149.212 688.561 149.389C687.677 149.566 686.97 149.389 686.97 151.334C686.97 153.278 688.384 153.455 687.146 155.046C685.909 156.637 686.439 157.344 684.672 157.344C682.904 157.344 681.313 157.167 679.545 157.521C677.777 157.875 676.893 156.637 676.893 158.228C676.893 159.819 676.893 160.173 677.777 160.349C678.661 160.526 679.368 160.349 679.015 161.41C678.661 162.471 677.6 163.178 678.307 163.531C679.015 163.885 679.899 163.001 679.899 163.885L682.904 164.062L683.434 165.829C683.434 165.829 683.788 165.829 684.848 166.006C685.909 166.183 686.616 165.299 686.97 166.537C687.323 167.774 687.853 168.304 687.853 168.304C687.853 168.304 688.384 168.304 688.561 169.542C688.737 170.779 688.914 171.133 688.914 172.017C688.914 172.901 688.03 175.729 688.03 175.729C688.03 175.729 687.323 176.436 687.5 177.85C687.677 179.264 688.384 177.85 688.561 179.618C688.737 181.386 688.737 181.916 688.737 183.154C688.737 184.391 688.561 184.214 689.621 185.098C690.682 185.982 691.035 186.866 691.035 186.866C691.035 186.866 691.919 187.396 691.919 188.634C691.919 189.871 691.919 190.932 691.919 190.932C691.919 190.932 691.389 191.109 690.682 191.109C689.975 191.109 689.091 190.932 689.091 190.932C689.091 190.932 688.914 191.462 688.561 192.7C688.207 193.937 686.616 194.644 686.616 194.644C686.616 194.644 686.616 196.412 685.909 196.589C685.202 196.765 684.671 196.765 683.964 196.942C683.257 197.119 682.727 196.942 682.373 197.826C682.02 198.71 682.373 198.887 681.49 199.064C680.606 199.24 679.722 197.649 679.545 199.947C679.368 202.245 680.782 203.129 679.015 203.66C677.247 204.19 676.186 204.544 676.186 204.544C676.186 204.544 676.54 205.958 675.302 205.604C674.065 205.251 672.651 204.013 672.651 203.129C672.651 202.245 672.474 201.715 672.474 201.715L669.999 203.306C669.999 203.306 670.353 204.19 668.585 204.19C666.817 204.19 666.11 202.245 666.464 204.19C666.817 206.135 667.524 207.549 667.701 208.256C667.878 208.963 668.938 208.433 668.762 209.493C668.585 210.554 668.938 210.554 668.231 211.261C667.524 211.968 666.11 212.145 665.403 212.145C664.696 212.145 664.519 211.968 663.105 212.145C661.691 212.322 660.978 218.974 660.978 218.974L659.728 220.099L659.039 220.1Z"
                className={getCountryClass("japan")}
                fill={getFill("japan")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_24">
                <path
                  id="Japan"
                  d="M694.17 174.636H695.082V177.679C695.082 177.96 695.019 178.205 694.893 178.412C694.768 178.619 694.594 178.779 694.371 178.891C694.148 179.004 693.888 179.06 693.593 179.06C693.33 179.06 693.092 179.013 692.877 178.921C692.664 178.827 692.495 178.685 692.37 178.495C692.245 178.303 692.183 178.062 692.185 177.773H693.103C693.106 177.888 693.129 177.987 693.173 178.069C693.219 178.15 693.28 178.212 693.359 178.256C693.438 178.299 693.532 178.32 693.64 178.32C693.753 178.32 693.849 178.296 693.927 178.248C694.007 178.198 694.067 178.126 694.109 178.031C694.15 177.935 694.17 177.818 694.17 177.679V174.636ZM696.761 179.062C696.552 179.062 696.366 179.026 696.203 178.953C696.04 178.879 695.91 178.771 695.815 178.627C695.722 178.482 695.675 178.302 695.675 178.086C695.675 177.904 695.708 177.751 695.775 177.628C695.842 177.504 695.932 177.405 696.047 177.33C696.163 177.254 696.293 177.197 696.44 177.159C696.587 177.121 696.742 177.094 696.904 177.078C697.094 177.058 697.248 177.04 697.364 177.023C697.481 177.004 697.565 176.977 697.618 176.942C697.67 176.906 697.697 176.854 697.697 176.784V176.771C697.697 176.636 697.654 176.532 697.569 176.458C697.485 176.384 697.366 176.347 697.211 176.347C697.047 176.347 696.918 176.384 696.821 176.456C696.724 176.527 696.66 176.616 696.629 176.724L695.79 176.656C695.832 176.457 695.916 176.286 696.041 176.141C696.166 175.994 696.327 175.882 696.525 175.804C696.724 175.724 696.954 175.685 697.215 175.685C697.397 175.685 697.571 175.706 697.737 175.749C697.905 175.791 698.053 175.857 698.182 175.947C698.313 176.036 698.416 176.151 698.491 176.292C698.567 176.431 698.604 176.598 698.604 176.793V179H697.744V178.546H697.718C697.665 178.648 697.595 178.739 697.507 178.817C697.419 178.893 697.313 178.954 697.19 178.998C697.066 179.04 696.923 179.062 696.761 179.062ZM697.021 178.435C697.155 178.435 697.273 178.409 697.375 178.357C697.477 178.303 697.557 178.23 697.616 178.139C697.674 178.048 697.703 177.945 697.703 177.83V177.483C697.675 177.501 697.636 177.518 697.586 177.534C697.538 177.548 697.483 177.562 697.422 177.575C697.361 177.586 697.3 177.597 697.239 177.607C697.177 177.615 697.122 177.623 697.072 177.63C696.966 177.646 696.873 177.67 696.793 177.705C696.714 177.739 696.652 177.785 696.608 177.843C696.564 177.9 696.542 177.971 696.542 178.056C696.542 178.18 696.587 178.274 696.676 178.339C696.767 178.403 696.882 178.435 697.021 178.435ZM699.309 180.227V175.727H700.203V176.277H700.244C700.284 176.189 700.341 176.099 700.416 176.009C700.493 175.916 700.593 175.839 700.715 175.778C700.838 175.716 700.992 175.685 701.175 175.685C701.414 175.685 701.634 175.747 701.835 175.872C702.037 175.996 702.198 176.183 702.319 176.433C702.44 176.681 702.5 176.993 702.5 177.368C702.5 177.733 702.441 178.041 702.323 178.293C702.207 178.543 702.048 178.732 701.846 178.862C701.646 178.989 701.421 179.053 701.173 179.053C700.997 179.053 700.847 179.024 700.723 178.966C700.601 178.908 700.501 178.835 700.423 178.746C700.345 178.657 700.285 178.567 700.244 178.476H700.216V180.227H699.309ZM700.197 177.364C700.197 177.558 700.224 177.728 700.278 177.873C700.332 178.018 700.41 178.131 700.512 178.212C700.615 178.291 700.739 178.331 700.885 178.331C701.033 178.331 701.158 178.29 701.26 178.21C701.362 178.127 701.44 178.013 701.492 177.869C701.546 177.722 701.573 177.554 701.573 177.364C701.573 177.175 701.547 177.009 701.495 176.865C701.442 176.722 701.365 176.609 701.262 176.528C701.16 176.447 701.034 176.407 700.885 176.407C700.737 176.407 700.612 176.446 700.51 176.524C700.409 176.602 700.332 176.713 700.278 176.857C700.224 177 700.197 177.169 700.197 177.364ZM704.039 179.062C703.83 179.062 703.644 179.026 703.48 178.953C703.317 178.879 703.188 178.771 703.093 178.627C702.999 178.482 702.952 178.302 702.952 178.086C702.952 177.904 702.985 177.751 703.052 177.628C703.119 177.504 703.21 177.405 703.325 177.33C703.44 177.254 703.571 177.197 703.717 177.159C703.865 177.121 704.019 177.094 704.181 177.078C704.372 177.058 704.525 177.04 704.642 177.023C704.758 177.004 704.843 176.977 704.895 176.942C704.948 176.906 704.974 176.854 704.974 176.784V176.771C704.974 176.636 704.931 176.532 704.846 176.458C704.762 176.384 704.643 176.347 704.488 176.347C704.325 176.347 704.195 176.384 704.098 176.456C704.002 176.527 703.938 176.616 703.907 176.724L703.067 176.656C703.11 176.457 703.193 176.286 703.318 176.141C703.443 175.994 703.605 175.882 703.802 175.804C704.001 175.724 704.231 175.685 704.492 175.685C704.674 175.685 704.848 175.706 705.014 175.749C705.182 175.791 705.331 175.857 705.46 175.947C705.59 176.036 705.693 176.151 705.769 176.292C705.844 176.431 705.882 176.598 705.882 176.793V179H705.021V178.546H704.995C704.943 178.648 704.872 178.739 704.784 178.817C704.696 178.893 704.59 178.954 704.467 178.998C704.343 179.04 704.201 179.062 704.039 179.062ZM704.299 178.435C704.432 178.435 704.55 178.409 704.652 178.357C704.755 178.303 704.835 178.23 704.893 178.139C704.951 178.048 704.98 177.945 704.98 177.83V177.483C704.952 177.501 704.913 177.518 704.863 177.534C704.815 177.548 704.76 177.562 704.699 177.575C704.638 177.586 704.577 177.597 704.516 177.607C704.455 177.615 704.399 177.623 704.35 177.63C704.243 177.646 704.15 177.67 704.071 177.705C703.991 177.739 703.929 177.785 703.885 177.843C703.841 177.9 703.819 177.971 703.819 178.056C703.819 178.18 703.864 178.274 703.953 178.339C704.044 178.403 704.159 178.435 704.299 178.435ZM707.494 177.108V179H706.586V175.727H707.451V176.305H707.489C707.562 176.114 707.683 175.964 707.854 175.853C708.024 175.741 708.231 175.685 708.474 175.685C708.701 175.685 708.899 175.734 709.068 175.834C709.237 175.933 709.369 176.075 709.462 176.26C709.556 176.443 709.603 176.662 709.603 176.916V179H708.695V177.078C708.697 176.878 708.646 176.722 708.542 176.609C708.438 176.496 708.295 176.439 708.114 176.439C707.991 176.439 707.883 176.465 707.79 176.518C707.697 176.57 707.625 176.647 707.572 176.748C707.521 176.847 707.495 176.967 707.494 177.108Z"
                  fill="black"
                ></path>
                <g id="Army_24">
                  <circle
                    id="armycircle_24"
                    cx="684"
                    cy="184"
                    r="5.5"
                    fill={getCircleFill("japan")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("japan")}
                  ></circle>
                  {getArmyNum("japan", "684", "184")}
                </g>
              </g>
            </g>
            <g id="west-au">
              <path
                id="western_australia"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M692.096 484.735L692.332 484.465C692.332 484.465 692.331 478.808 692.508 477.394C692.685 475.98 692.155 476.157 691.448 475.096C690.74 474.035 692.331 432.846 692.155 431.962C691.978 431.079 662.279 432.316 662.279 432.316L661.69 394.579L659.569 393.341C659.569 393.341 657.978 392.28 657.094 391.75C656.21 391.22 655.503 393.695 654.796 394.048C654.089 394.402 651.968 395.639 651.968 395.639C651.968 395.639 651.437 397.407 651.084 398.644C650.73 399.882 649.139 398.821 647.195 399.528C645.25 400.235 647.018 400.235 646.488 402.003C645.957 403.771 645.957 402.18 644.366 402.18C642.775 402.18 643.659 402.887 642.599 404.301C641.538 405.715 641.361 404.655 639.947 405.892C638.533 407.13 639.593 407.13 638.71 408.897C637.826 410.665 637.649 409.781 636.588 410.488C635.527 411.196 633.76 412.963 632.699 414.024C631.638 415.085 631.108 414.554 628.987 414.378C626.865 414.201 628.103 414.378 626.512 414.554C624.921 414.731 625.274 415.792 624.214 416.676C623.153 417.56 622.623 417.913 621.385 419.15C620.148 420.388 620.855 419.681 618.91 419.858C616.966 420.034 617.85 420.034 615.905 421.272C613.961 422.509 615.729 422.863 615.552 424.277C615.375 425.691 615.021 425.691 614.491 426.929C613.961 428.166 614.491 428.52 615.021 429.934C615.552 431.348 616.612 430.464 616.612 430.464C616.612 430.464 616.259 432.586 616.612 433.293C616.966 434 616.436 433.293 614.845 433.293C613.254 433.293 614.138 433.823 614.138 435.06C614.138 436.298 614.138 436.298 614.138 436.298C614.138 436.298 613.607 436.475 613.077 437.535C612.547 438.596 613.077 438.419 613.254 439.657C613.43 440.894 613.607 441.424 614.138 442.662C614.668 443.899 615.198 443.546 616.082 445.49C616.966 447.435 616.436 447.612 616.436 449.379C616.436 451.147 616.436 450.617 616.612 452.915C616.789 455.213 617.85 454.506 617.85 454.506C617.85 454.506 619.087 455.39 619.794 455.92C620.502 456.45 620.502 456.981 620.855 458.748C621.209 460.516 620.325 460.163 619.971 461.223C619.618 462.284 619.971 461.93 619.794 464.052C619.618 466.173 618.911 465.289 618.203 466.173C617.496 467.057 617.673 467.057 617.143 468.471C616.612 469.885 617.143 469.532 618.027 470.239C618.911 470.946 619.971 471.476 621.032 472.36C623.473 475.033 626.095 474.35 629.164 472.714C630.755 471.83 630.047 471.653 631.285 471.123C632.522 470.592 632.169 470.769 632.876 470.416C633.583 470.062 634.113 469.532 635.174 468.471C636.235 467.41 635.528 468.294 636.765 467.587C638.002 466.88 638.179 466.35 640.124 465.643C642.068 464.936 642.599 465.466 642.599 465.466C642.599 465.466 642.599 465.466 644.19 465.466C645.781 465.466 644.897 465.643 645.25 466.35C645.604 467.057 646.664 467.057 647.372 467.057C648.079 467.057 649.139 466.88 650.023 466.527C650.907 466.173 649.846 464.936 649.846 464.229C649.846 463.521 649.846 463.345 650.377 462.107C650.907 460.87 652.498 460.516 653.205 460.516C653.912 460.516 655.68 460.163 656.387 459.456C657.094 458.748 657.448 459.102 658.862 458.925C660.276 458.748 660.099 458.395 661.16 457.334C662.221 456.274 662.221 456.804 664.165 456.804C666.11 456.804 665.226 456.804 667.171 456.804C669.115 456.804 668.938 456.981 670.176 457.157C671.413 457.334 672.12 458.572 673.004 459.102C673.888 459.632 673.358 459.809 673.358 461.223C673.358 462.638 673.534 462.814 674.949 465.289C676.363 467.764 677.07 467.764 677.07 467.764C677.07 467.764 678.307 465.996 679.368 464.405C680.429 462.814 680.252 463.875 681.843 463.345C683.434 462.814 682.373 462.284 682.727 459.986C683.08 457.688 683.788 459.279 685.025 459.456C686.262 459.632 685.025 461.754 684.671 462.991C684.318 464.229 683.611 464.582 682.727 465.466C681.843 466.35 681.843 466.527 680.782 467.764C679.722 469.002 680.252 468.825 680.429 470.239C680.606 471.653 682.373 469.001 683.08 467.941C683.788 466.88 683.788 467.587 684.671 467.764C685.555 467.941 684.848 470.062 684.848 471.123C684.848 472.183 685.025 472.007 685.909 472.537C686.793 473.067 686.793 474.128 686.262 475.542C685.732 476.956 686.262 476.956 686.439 478.017C686.616 479.078 688.561 481.729 689.268 482.437C689.975 483.144 689.798 482.79 690.505 483.144C691.212 483.497 690.859 483.851 692.096 484.735Z"
                className={getCountryClass("west-au")}
                fill={getFill("west-au")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_25">
                <path
                  id="Western Australia"
                  d="M635.916 424L634.668 419.636H635.675L636.398 422.668H636.434L637.231 419.636H638.094L638.888 422.675H638.927L639.649 419.636H640.657L639.408 424H638.509L637.678 421.147H637.644L636.815 424H635.916ZM642.274 424.064C641.937 424.064 641.647 423.996 641.404 423.859C641.163 423.722 640.977 423.527 640.846 423.276C640.715 423.023 640.65 422.724 640.65 422.379C640.65 422.042 640.715 421.746 640.846 421.492C640.977 421.238 641.161 421.04 641.398 420.898C641.637 420.756 641.916 420.685 642.237 420.685C642.453 420.685 642.654 420.719 642.84 420.789C643.028 420.857 643.191 420.96 643.33 421.098C643.471 421.236 643.58 421.409 643.659 421.618C643.737 421.825 643.776 422.068 643.776 422.347V422.596H641.012V422.033H642.921C642.921 421.903 642.893 421.787 642.836 421.686C642.779 421.585 642.7 421.506 642.6 421.45C642.5 421.391 642.384 421.362 642.252 421.362C642.115 421.362 641.992 421.394 641.886 421.458C641.781 421.521 641.698 421.605 641.639 421.712C641.579 421.817 641.548 421.934 641.547 422.063V422.598C641.547 422.76 641.577 422.9 641.637 423.018C641.698 423.136 641.784 423.227 641.894 423.29C642.005 423.354 642.137 423.386 642.289 423.386C642.389 423.386 642.482 423.372 642.566 423.344C642.649 423.315 642.721 423.273 642.781 423.216C642.84 423.159 642.886 423.089 642.917 423.007L643.757 423.062C643.714 423.264 643.627 423.44 643.494 423.591C643.364 423.74 643.195 423.857 642.987 423.94C642.781 424.023 642.544 424.064 642.274 424.064ZM647.091 421.661L646.26 421.712C646.246 421.641 646.215 421.577 646.169 421.52C646.122 421.462 646.06 421.415 645.983 421.381C645.908 421.346 645.818 421.328 645.713 421.328C645.572 421.328 645.453 421.358 645.357 421.418C645.26 421.476 645.212 421.554 645.212 421.652C645.212 421.73 645.243 421.796 645.306 421.85C645.368 421.904 645.475 421.947 645.627 421.98L646.22 422.099C646.538 422.165 646.775 422.27 646.931 422.415C647.088 422.56 647.166 422.75 647.166 422.986C647.166 423.2 647.102 423.388 646.976 423.55C646.851 423.712 646.679 423.839 646.46 423.93C646.243 424.019 645.992 424.064 645.708 424.064C645.275 424.064 644.93 423.974 644.673 423.793C644.417 423.612 644.267 423.364 644.223 423.052L645.116 423.005C645.143 423.137 645.208 423.238 645.312 423.308C645.416 423.376 645.548 423.41 645.71 423.41C645.869 423.41 645.997 423.379 646.094 423.318C646.192 423.256 646.242 423.175 646.243 423.077C646.242 422.995 646.207 422.928 646.139 422.875C646.07 422.821 645.965 422.78 645.823 422.751L645.257 422.638C644.937 422.575 644.699 422.464 644.543 422.306C644.388 422.148 644.311 421.947 644.311 421.703C644.311 421.493 644.367 421.312 644.481 421.16C644.596 421.008 644.757 420.891 644.965 420.808C645.173 420.726 645.418 420.685 645.698 420.685C646.111 420.685 646.436 420.772 646.673 420.947C646.912 421.121 647.051 421.359 647.091 421.661ZM649.478 420.727V421.409H647.507V420.727H649.478ZM647.955 419.943H648.862V422.994C648.862 423.078 648.875 423.143 648.901 423.19C648.926 423.236 648.962 423.268 649.007 423.286C649.054 423.305 649.108 423.314 649.169 423.314C649.212 423.314 649.254 423.31 649.297 423.303C649.339 423.295 649.372 423.288 649.395 423.284L649.538 423.96C649.492 423.974 649.428 423.99 649.346 424.009C649.263 424.028 649.163 424.04 649.045 424.045C648.827 424.053 648.635 424.024 648.47 423.957C648.307 423.891 648.18 423.787 648.089 423.646C647.998 423.506 647.953 423.328 647.955 423.114V419.943ZM651.526 424.064C651.189 424.064 650.899 423.996 650.656 423.859C650.415 423.722 650.229 423.527 650.098 423.276C649.967 423.023 649.902 422.724 649.902 422.379C649.902 422.042 649.967 421.746 650.098 421.492C650.229 421.238 650.413 421.04 650.65 420.898C650.888 420.756 651.168 420.685 651.489 420.685C651.705 420.685 651.906 420.719 652.092 420.789C652.28 420.857 652.443 420.96 652.582 421.098C652.723 421.236 652.832 421.409 652.911 421.618C652.989 421.825 653.028 422.068 653.028 422.347V422.596H650.264V422.033H652.173C652.173 421.903 652.145 421.787 652.088 421.686C652.031 421.585 651.952 421.506 651.852 421.45C651.752 421.391 651.636 421.362 651.504 421.362C651.366 421.362 651.244 421.394 651.138 421.458C651.033 421.521 650.95 421.605 650.891 421.712C650.831 421.817 650.8 421.934 650.799 422.063V422.598C650.799 422.76 650.829 422.9 650.888 423.018C650.95 423.136 651.036 423.227 651.146 423.29C651.257 423.354 651.388 423.386 651.54 423.386C651.641 423.386 651.734 423.372 651.817 423.344C651.901 423.315 651.973 423.273 652.033 423.216C652.092 423.159 652.138 423.089 652.169 423.007L653.009 423.062C652.966 423.264 652.879 423.44 652.746 423.591C652.616 423.74 652.447 423.857 652.239 423.94C652.033 424.023 651.795 424.064 651.526 424.064ZM653.62 424V420.727H654.5V421.298H654.534C654.594 421.095 654.694 420.942 654.835 420.838C654.975 420.733 655.137 420.68 655.32 420.68C655.366 420.68 655.415 420.683 655.467 420.689C655.52 420.695 655.566 420.702 655.606 420.712V421.518C655.563 421.505 655.504 421.494 655.429 421.484C655.354 421.474 655.285 421.469 655.222 421.469C655.089 421.469 654.969 421.498 654.864 421.556C654.761 421.613 654.678 421.692 654.617 421.795C654.558 421.897 654.528 422.015 654.528 422.148V424H653.62ZM656.983 422.108V424H656.075V420.727H656.94V421.305H656.979C657.051 421.114 657.172 420.964 657.343 420.853C657.513 420.741 657.72 420.685 657.963 420.685C658.19 420.685 658.388 420.734 658.557 420.834C658.726 420.933 658.858 421.075 658.952 421.26C659.045 421.443 659.092 421.662 659.092 421.916V424H658.184V422.078C658.186 421.878 658.135 421.722 658.031 421.609C657.927 421.496 657.785 421.439 657.603 421.439C657.481 421.439 657.373 421.465 657.279 421.518C657.187 421.57 657.114 421.647 657.062 421.748C657.01 421.847 656.984 421.967 656.983 422.108ZM634.875 431H633.886L635.392 426.636H636.581L638.085 431H637.097L636.004 427.634H635.97L634.875 431ZM634.813 429.285H637.148V430.005H634.813V429.285ZM640.692 429.607V427.727H641.6V431H640.729V430.406H640.695C640.621 430.597 640.498 430.751 640.326 430.868C640.155 430.984 639.947 431.043 639.702 431.043C639.483 431.043 639.29 430.993 639.124 430.893C638.958 430.794 638.828 430.653 638.734 430.469C638.642 430.286 638.595 430.067 638.594 429.811V427.727H639.501V429.649C639.503 429.842 639.555 429.995 639.657 430.107C639.759 430.219 639.896 430.276 640.068 430.276C640.177 430.276 640.28 430.251 640.375 430.201C640.47 430.15 640.547 430.075 640.605 429.975C640.665 429.876 640.694 429.753 640.692 429.607ZM645.049 428.661L644.218 428.712C644.204 428.641 644.173 428.577 644.127 428.52C644.08 428.462 644.018 428.415 643.941 428.381C643.866 428.346 643.776 428.328 643.671 428.328C643.53 428.328 643.411 428.358 643.315 428.418C643.218 428.476 643.17 428.554 643.17 428.652C643.17 428.73 643.201 428.796 643.264 428.85C643.326 428.904 643.433 428.947 643.585 428.98L644.178 429.099C644.496 429.165 644.733 429.27 644.889 429.415C645.046 429.56 645.124 429.75 645.124 429.986C645.124 430.2 645.06 430.388 644.934 430.55C644.809 430.712 644.637 430.839 644.418 430.93C644.201 431.019 643.95 431.064 643.666 431.064C643.233 431.064 642.888 430.974 642.631 430.793C642.375 430.612 642.225 430.364 642.181 430.052L643.074 430.005C643.101 430.137 643.166 430.238 643.27 430.308C643.374 430.376 643.506 430.41 643.668 430.41C643.828 430.41 643.955 430.379 644.052 430.318C644.15 430.256 644.2 430.175 644.201 430.077C644.2 429.995 644.165 429.928 644.097 429.875C644.028 429.821 643.923 429.78 643.781 429.751L643.215 429.638C642.895 429.575 642.657 429.464 642.501 429.306C642.346 429.148 642.269 428.947 642.269 428.703C642.269 428.493 642.325 428.312 642.439 428.16C642.554 428.008 642.715 427.891 642.923 427.808C643.131 427.726 643.376 427.685 643.656 427.685C644.069 427.685 644.394 427.772 644.631 427.947C644.87 428.121 645.009 428.359 645.049 428.661ZM647.436 427.727V428.409H645.465V427.727H647.436ZM645.913 426.943H646.82V429.994C646.82 430.078 646.833 430.143 646.859 430.19C646.884 430.236 646.92 430.268 646.965 430.286C647.012 430.305 647.066 430.314 647.127 430.314C647.17 430.314 647.212 430.31 647.255 430.303C647.297 430.295 647.33 430.288 647.353 430.284L647.496 430.96C647.45 430.974 647.386 430.99 647.304 431.009C647.222 431.028 647.121 431.04 647.003 431.045C646.785 431.053 646.593 431.024 646.428 430.957C646.265 430.891 646.138 430.787 646.047 430.646C645.956 430.506 645.911 430.328 645.913 430.114V426.943ZM648.027 431V427.727H648.907V428.298H648.941C649.001 428.095 649.101 427.942 649.242 427.838C649.382 427.733 649.544 427.68 649.728 427.68C649.773 427.68 649.822 427.683 649.875 427.689C649.927 427.695 649.973 427.702 650.013 427.712V428.518C649.97 428.505 649.911 428.494 649.836 428.484C649.761 428.474 649.692 428.469 649.63 428.469C649.496 428.469 649.377 428.498 649.272 428.556C649.168 428.613 649.085 428.692 649.024 428.795C648.965 428.897 648.935 429.015 648.935 429.148V431H648.027ZM651.322 431.062C651.113 431.062 650.927 431.026 650.764 430.953C650.6 430.879 650.471 430.771 650.376 430.627C650.282 430.482 650.235 430.302 650.235 430.086C650.235 429.904 650.269 429.751 650.335 429.628C650.402 429.504 650.493 429.405 650.608 429.33C650.723 429.254 650.854 429.197 651 429.159C651.148 429.121 651.303 429.094 651.465 429.078C651.655 429.058 651.808 429.04 651.925 429.023C652.041 429.004 652.126 428.977 652.178 428.942C652.231 428.906 652.257 428.854 652.257 428.784V428.771C652.257 428.636 652.215 428.532 652.129 428.458C652.046 428.384 651.926 428.347 651.771 428.347C651.608 428.347 651.478 428.384 651.381 428.456C651.285 428.527 651.221 428.616 651.19 428.724L650.35 428.656C650.393 428.457 650.477 428.286 650.602 428.141C650.727 427.994 650.888 427.882 651.085 427.804C651.284 427.724 651.514 427.685 651.776 427.685C651.957 427.685 652.131 427.706 652.298 427.749C652.465 427.791 652.614 427.857 652.743 427.947C652.874 428.036 652.977 428.151 653.052 428.292C653.127 428.431 653.165 428.598 653.165 428.793V431H652.304V430.546H652.278C652.226 430.648 652.156 430.739 652.068 430.817C651.979 430.893 651.874 430.954 651.75 430.998C651.627 431.04 651.484 431.062 651.322 431.062ZM651.582 430.435C651.715 430.435 651.833 430.409 651.935 430.357C652.038 430.303 652.118 430.23 652.176 430.139C652.234 430.048 652.264 429.945 652.264 429.83V429.483C652.235 429.501 652.196 429.518 652.146 429.534C652.098 429.548 652.043 429.562 651.982 429.575C651.921 429.586 651.86 429.597 651.799 429.607C651.738 429.615 651.683 429.623 651.633 429.63C651.526 429.646 651.433 429.67 651.354 429.705C651.274 429.739 651.212 429.785 651.168 429.843C651.124 429.9 651.102 429.971 651.102 430.056C651.102 430.18 651.147 430.274 651.237 430.339C651.328 430.403 651.443 430.435 651.582 430.435ZM654.777 426.636V431H653.869V426.636H654.777ZM655.504 431V427.727H656.411V431H655.504ZM655.96 427.305C655.825 427.305 655.709 427.261 655.612 427.171C655.517 427.08 655.47 426.972 655.47 426.845C655.47 426.72 655.517 426.613 655.612 426.523C655.709 426.433 655.825 426.387 655.96 426.387C656.095 426.387 656.21 426.433 656.305 426.523C656.402 426.613 656.45 426.72 656.45 426.845C656.45 426.972 656.402 427.08 656.305 427.171C656.21 427.261 656.095 427.305 655.96 427.305ZM658.072 431.062C657.863 431.062 657.677 431.026 657.514 430.953C657.35 430.879 657.221 430.771 657.126 430.627C657.032 430.482 656.985 430.302 656.985 430.086C656.985 429.904 657.019 429.751 657.085 429.628C657.152 429.504 657.243 429.405 657.358 429.33C657.473 429.254 657.604 429.197 657.75 429.159C657.898 429.121 658.053 429.094 658.215 429.078C658.405 429.058 658.558 429.04 658.675 429.023C658.791 429.004 658.876 428.977 658.928 428.942C658.981 428.906 659.007 428.854 659.007 428.784V428.771C659.007 428.636 658.965 428.532 658.879 428.458C658.796 428.384 658.676 428.347 658.521 428.347C658.358 428.347 658.228 428.384 658.131 428.456C658.035 428.527 657.971 428.616 657.94 428.724L657.1 428.656C657.143 428.457 657.227 428.286 657.352 428.141C657.477 427.994 657.638 427.882 657.835 427.804C658.034 427.724 658.264 427.685 658.526 427.685C658.707 427.685 658.881 427.706 659.048 427.749C659.215 427.791 659.364 427.857 659.493 427.947C659.624 428.036 659.727 428.151 659.802 428.292C659.877 428.431 659.915 428.598 659.915 428.793V431H659.054V430.546H659.028C658.976 430.648 658.906 430.739 658.818 430.817C658.729 430.893 658.624 430.954 658.5 430.998C658.377 431.04 658.234 431.062 658.072 431.062ZM658.332 430.435C658.465 430.435 658.583 430.409 658.685 430.357C658.788 430.303 658.868 430.23 658.926 430.139C658.984 430.048 659.014 429.945 659.014 429.83V429.483C658.985 429.501 658.946 429.518 658.896 429.534C658.848 429.548 658.793 429.562 658.732 429.575C658.671 429.586 658.61 429.597 658.549 429.607C658.488 429.615 658.433 429.623 658.383 429.63C658.276 429.646 658.183 429.67 658.104 429.705C658.024 429.739 657.962 429.785 657.918 429.843C657.874 429.9 657.852 429.971 657.852 430.056C657.852 430.18 657.897 430.274 657.987 430.339C658.078 430.403 658.193 430.435 658.332 430.435Z"
                  fill="black"
                ></path>
                <g id="Army_25">
                  <circle
                    id="armycircle_25"
                    cx="647"
                    cy="439"
                    r="5.5"
                    fill={getCircleFill("west-au")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("west-au")}
                  ></circle>
                  {getArmyNum("west-au", "647", "439")}
                </g>
              </g>
            </g>
            <g id="east-au">
              <path
                id="eastern_australia"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M661.69 394.579C661.69 394.579 661.867 395.109 662.398 392.988C662.928 390.866 662.574 389.806 663.281 388.215C663.989 386.624 664.342 386.8 665.756 386.093C667.171 385.386 667.524 385.033 667.878 384.325C668.231 383.618 669.292 383.442 670.353 383.618C671.413 383.795 671.944 384.325 672.827 383.088C673.711 381.851 673.535 381.497 674.418 381.851C675.302 382.204 674.772 382.204 676.009 382.558C677.247 382.911 678.484 383.442 680.959 382.911C683.434 382.381 683.611 381.144 683.788 382.558C683.964 383.972 683.964 384.149 684.848 384.149C685.732 384.149 685.732 384.325 685.202 385.386C684.671 386.447 685.025 385.74 683.611 387.684C682.197 389.629 681.49 389.806 681.313 391.22C681.136 392.634 681.49 393.518 681.49 393.518C681.49 393.518 680.782 395.462 682.02 395.462C683.257 395.462 683.434 394.932 685.025 394.755C686.616 394.579 688.03 394.402 688.207 395.993C688.384 397.584 689.444 400.589 690.505 400.766C691.566 400.943 691.566 401.296 693.334 400.942C695.101 400.589 695.808 401.473 695.985 399.882C696.162 398.291 696.162 397.937 696.162 396.7C696.162 395.462 694.394 397.407 696.692 393.871C698.99 390.336 699.521 392.634 698.99 388.745C698.46 384.856 697.399 385.209 698.283 382.735C699.167 380.26 698.814 380.26 699.344 380.436C699.344 380.436 700.935 380.26 701.112 382.735C701.288 385.209 701.996 387.331 701.996 388.391C701.996 389.452 702.703 393.341 702.703 393.341C702.703 393.341 703.94 394.755 704.647 394.225C705.354 393.695 706.415 393.518 706.415 392.28C706.415 391.043 706.769 389.629 707.122 390.336C707.476 391.043 708.536 391.573 708.536 392.634C708.536 393.695 708.36 394.755 708.536 395.816C708.713 396.877 709.774 397.937 709.774 397.937C709.774 397.937 710.127 400.059 710.127 400.766C710.127 401.473 710.481 402.003 710.127 403.771C709.774 405.539 709.774 405.715 709.951 407.306C710.127 408.897 710.304 409.605 711.011 409.781C711.718 409.958 711.718 409.958 712.425 409.958C713.133 409.958 713.309 409.251 713.84 410.135C714.37 411.019 714.547 411.549 715.784 411.726C717.022 411.903 718.082 411.726 718.082 411.726C718.082 411.726 718.613 412.61 718.613 413.67C718.613 414.731 718.436 415.085 718.789 416.499C719.143 417.913 719.143 418.09 720.027 418.267C720.911 418.443 721.441 418.62 721.441 418.62C721.441 418.62 721.618 419.504 721.618 420.918C721.618 422.332 721.971 423.216 721.971 423.216L723.386 424.277C723.386 424.277 723.739 425.161 724.446 426.045C725.153 426.929 725.86 427.105 725.86 427.105C725.86 427.105 726.391 428.166 726.568 429.05C726.744 429.934 726.214 429.404 727.275 430.641C728.335 431.878 728.512 432.232 728.512 433.293C728.512 434.353 729.396 435.06 729.042 436.475C728.689 437.889 728.866 438.419 728.689 440.187C728.512 441.955 728.866 439.833 728.512 442.839C728.159 445.844 728.335 446.728 728.159 447.788C727.982 448.849 727.628 447.965 727.451 449.91C727.275 451.854 727.098 453.445 727.098 453.445C727.098 453.445 725.86 455.213 724.977 455.213C724.093 455.213 722.502 454.506 722.502 455.39C722.502 456.274 721.618 456.981 722.855 457.334C724.093 457.688 724.446 456.627 724.446 457.865C724.446 459.102 724.093 459.456 723.032 460.339C721.971 461.223 721.971 461.047 720.734 461.754C719.497 462.461 720.204 461.4 719.32 463.698C718.436 465.996 718.613 465.996 717.906 466.88C717.198 467.764 717.022 467.764 716.668 468.825C716.314 469.885 716.315 470.239 716.315 471.476C716.315 472.714 715.961 473.244 715.961 473.244C715.961 473.244 714.547 474.658 714.547 475.896C714.547 477.133 715.431 477.664 714.724 478.547C714.016 479.431 714.723 479.431 713.133 479.608C711.542 479.785 710.834 479.785 710.834 479.785L708.36 480.315C708.36 480.315 708.006 479.255 707.122 479.785C706.238 480.315 706.592 480.138 705.885 481.022C705.178 481.906 705.001 481.906 704.117 482.437C703.233 482.967 704.117 483.144 703.587 484.028C703.056 484.911 702.88 485.795 701.819 485.265C700.758 484.735 700.405 484.911 700.051 483.851C699.697 482.79 700.228 482.613 698.46 482.083C696.692 481.553 696.516 481.553 696.516 481.553C696.516 481.553 695.985 481.906 695.632 482.79C695.278 483.674 695.808 484.028 694.571 484.558C693.334 485.088 693.334 485.619 692.096 484.735L692.332 484.465C692.332 484.465 692.332 478.808 692.508 477.394C692.685 475.98 692.155 476.157 691.448 475.096C690.741 474.035 692.331 432.846 692.155 431.963C691.978 431.079 662.279 432.316 662.279 432.316L661.69 394.579Z"
                className={getCountryClass("east-au")}
                fill={getFill("east-au")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_26">
                <path
                  id="Eastern australia"
                  d="M673.082 407V402.636H676.023V403.397H674.005V404.437H675.871V405.197H674.005V406.239H676.031V407H673.082ZM677.672 407.062C677.464 407.062 677.278 407.026 677.114 406.953C676.951 406.879 676.822 406.771 676.726 406.627C676.633 406.482 676.586 406.302 676.586 406.086C676.586 405.904 676.619 405.751 676.686 405.628C676.753 405.504 676.844 405.405 676.959 405.33C677.074 405.254 677.204 405.197 677.351 405.159C677.498 405.121 677.653 405.094 677.815 405.078C678.006 405.058 678.159 405.04 678.275 405.023C678.392 405.004 678.476 404.977 678.529 404.942C678.581 404.906 678.608 404.854 678.608 404.784V404.771C678.608 404.636 678.565 404.532 678.48 404.458C678.396 404.384 678.277 404.347 678.122 404.347C677.959 404.347 677.829 404.384 677.732 404.456C677.635 404.527 677.572 404.616 677.54 404.724L676.701 404.656C676.743 404.457 676.827 404.286 676.952 404.141C677.077 403.994 677.238 403.882 677.436 403.804C677.635 403.724 677.865 403.685 678.126 403.685C678.308 403.685 678.482 403.706 678.648 403.749C678.816 403.791 678.964 403.857 679.094 403.947C679.224 404.036 679.327 404.151 679.403 404.292C679.478 404.431 679.515 404.598 679.515 404.793V407H678.655V406.546H678.629C678.577 406.648 678.506 406.739 678.418 406.817C678.33 406.893 678.224 406.954 678.101 406.998C677.977 407.04 677.834 407.062 677.672 407.062ZM677.932 406.435C678.066 406.435 678.184 406.409 678.286 406.357C678.388 406.303 678.469 406.23 678.527 406.139C678.585 406.048 678.614 405.945 678.614 405.83V405.483C678.586 405.501 678.547 405.518 678.497 405.534C678.449 405.548 678.394 405.562 678.333 405.575C678.272 405.586 678.211 405.597 678.15 405.607C678.089 405.615 678.033 405.623 677.983 405.63C677.877 405.646 677.784 405.67 677.704 405.705C677.625 405.739 677.563 405.785 677.519 405.843C677.475 405.9 677.453 405.971 677.453 406.056C677.453 406.18 677.498 406.274 677.587 406.339C677.678 406.403 677.793 406.435 677.932 406.435ZM682.943 404.661L682.112 404.712C682.097 404.641 682.067 404.577 682.02 404.52C681.973 404.462 681.911 404.415 681.835 404.381C681.759 404.346 681.669 404.328 681.564 404.328C681.423 404.328 681.305 404.358 681.208 404.418C681.112 404.476 681.063 404.554 681.063 404.652C681.063 404.73 681.095 404.796 681.157 404.85C681.22 404.904 681.327 404.947 681.479 404.98L682.071 405.099C682.389 405.165 682.627 405.27 682.783 405.415C682.939 405.56 683.017 405.75 683.017 405.986C683.017 406.2 682.954 406.388 682.828 406.55C682.703 406.712 682.531 406.839 682.312 406.93C682.095 407.019 681.844 407.064 681.56 407.064C681.127 407.064 680.781 406.974 680.524 406.793C680.269 406.612 680.119 406.364 680.075 406.052L680.968 406.005C680.994 406.137 681.06 406.238 681.164 406.308C681.267 406.376 681.4 406.41 681.562 406.41C681.721 406.41 681.849 406.379 681.945 406.318C682.044 406.256 682.093 406.175 682.095 406.077C682.093 405.995 682.058 405.928 681.99 405.875C681.922 405.821 681.817 405.78 681.675 405.751L681.108 405.638C680.789 405.575 680.551 405.464 680.394 405.306C680.24 405.148 680.162 404.947 680.162 404.703C680.162 404.493 680.219 404.312 680.333 404.16C680.448 404.008 680.609 403.891 680.816 403.808C681.025 403.726 681.269 403.685 681.549 403.685C681.963 403.685 682.288 403.772 682.525 403.947C682.764 404.121 682.903 404.359 682.943 404.661ZM685.33 403.727V404.409H683.359V403.727H685.33ZM683.806 402.943H684.714V405.994C684.714 406.078 684.727 406.143 684.752 406.19C684.778 406.236 684.813 406.268 684.859 406.286C684.906 406.305 684.96 406.314 685.021 406.314C685.063 406.314 685.106 406.31 685.148 406.303C685.191 406.295 685.224 406.288 685.246 406.284L685.389 406.96C685.344 406.974 685.28 406.99 685.197 407.009C685.115 407.028 685.015 407.04 684.897 407.045C684.678 407.053 684.487 407.024 684.322 406.957C684.158 406.891 684.031 406.787 683.94 406.646C683.849 406.506 683.805 406.328 683.806 406.114V402.943ZM687.377 407.064C687.04 407.064 686.751 406.996 686.508 406.859C686.266 406.722 686.08 406.527 685.95 406.276C685.819 406.023 685.754 405.724 685.754 405.379C685.754 405.042 685.819 404.746 685.95 404.492C686.08 404.238 686.264 404.04 686.501 403.898C686.74 403.756 687.02 403.685 687.341 403.685C687.557 403.685 687.758 403.719 687.944 403.789C688.131 403.857 688.295 403.96 688.434 404.098C688.575 404.236 688.684 404.409 688.762 404.618C688.84 404.825 688.879 405.068 688.879 405.347V405.596H686.116V405.033H688.025C688.025 404.903 687.996 404.787 687.94 404.686C687.883 404.585 687.804 404.506 687.703 404.45C687.604 404.391 687.488 404.362 687.356 404.362C687.218 404.362 687.096 404.394 686.989 404.458C686.884 404.521 686.802 404.605 686.742 404.712C686.683 404.817 686.652 404.934 686.651 405.063V405.598C686.651 405.76 686.68 405.9 686.74 406.018C686.801 406.136 686.887 406.227 686.998 406.29C687.109 406.354 687.24 406.386 687.392 406.386C687.493 406.386 687.585 406.372 687.669 406.344C687.753 406.315 687.825 406.273 687.884 406.216C687.944 406.159 687.989 406.089 688.021 406.007L688.86 406.062C688.817 406.264 688.73 406.44 688.598 406.591C688.467 406.74 688.298 406.857 688.091 406.94C687.885 407.023 687.647 407.064 687.377 407.064ZM689.472 407V403.727H690.352V404.298H690.386C690.445 404.095 690.545 403.942 690.686 403.838C690.827 403.733 690.989 403.68 691.172 403.68C691.217 403.68 691.266 403.683 691.319 403.689C691.371 403.695 691.418 403.702 691.457 403.712V404.518C691.415 404.505 691.356 404.494 691.281 404.484C691.205 404.474 691.136 404.469 691.074 404.469C690.94 404.469 690.821 404.498 690.716 404.556C690.612 404.613 690.53 404.692 690.469 404.795C690.409 404.897 690.379 405.015 690.379 405.148V407H689.472ZM692.834 405.108V407H691.927V403.727H692.792V404.305H692.83C692.903 404.114 693.024 403.964 693.194 403.853C693.365 403.741 693.572 403.685 693.814 403.685C694.042 403.685 694.24 403.734 694.409 403.834C694.578 403.933 694.709 404.075 694.803 404.26C694.897 404.443 694.944 404.662 694.944 404.916V407H694.036V405.078C694.037 404.878 693.986 404.722 693.883 404.609C693.779 404.496 693.636 404.439 693.454 404.439C693.332 404.439 693.224 404.465 693.131 404.518C693.038 404.57 692.966 404.647 692.913 404.748C692.862 404.847 692.836 404.967 692.834 405.108ZM672.543 414.062C672.334 414.062 672.148 414.026 671.984 413.953C671.821 413.879 671.692 413.771 671.597 413.627C671.503 413.482 671.456 413.302 671.456 413.086C671.456 412.904 671.489 412.751 671.556 412.628C671.623 412.504 671.714 412.405 671.829 412.33C671.944 412.254 672.074 412.197 672.221 412.159C672.369 412.121 672.523 412.094 672.685 412.078C672.876 412.058 673.029 412.04 673.146 412.023C673.262 412.004 673.347 411.977 673.399 411.942C673.452 411.906 673.478 411.854 673.478 411.784V411.771C673.478 411.636 673.435 411.532 673.35 411.458C673.266 411.384 673.147 411.347 672.992 411.347C672.829 411.347 672.699 411.384 672.602 411.456C672.506 411.527 672.442 411.616 672.41 411.724L671.571 411.656C671.614 411.457 671.697 411.286 671.822 411.141C671.947 410.994 672.109 410.882 672.306 410.804C672.505 410.724 672.735 410.685 672.996 410.685C673.178 410.685 673.352 410.706 673.518 410.749C673.686 410.791 673.834 410.857 673.964 410.947C674.094 411.036 674.197 411.151 674.273 411.292C674.348 411.431 674.386 411.598 674.386 411.793V414H673.525V413.546H673.499C673.447 413.648 673.376 413.739 673.288 413.817C673.2 413.893 673.094 413.954 672.971 413.998C672.847 414.04 672.704 414.062 672.543 414.062ZM672.802 413.435C672.936 413.435 673.054 413.409 673.156 413.357C673.258 413.303 673.339 413.23 673.397 413.139C673.455 413.048 673.484 412.945 673.484 412.83V412.483C673.456 412.501 673.417 412.518 673.367 412.534C673.319 412.548 673.264 412.562 673.203 412.575C673.142 412.586 673.081 412.597 673.02 412.607C672.959 412.615 672.903 412.623 672.854 412.63C672.747 412.646 672.654 412.67 672.574 412.705C672.495 412.739 672.433 412.785 672.389 412.843C672.345 412.9 672.323 412.971 672.323 413.056C672.323 413.18 672.368 413.274 672.457 413.339C672.548 413.403 672.663 413.435 672.802 413.435ZM677.188 412.607V410.727H678.096V414H677.225V413.406H677.191C677.117 413.597 676.994 413.751 676.822 413.868C676.652 413.984 676.443 414.043 676.198 414.043C675.979 414.043 675.786 413.993 675.62 413.893C675.454 413.794 675.324 413.653 675.23 413.469C675.138 413.286 675.091 413.067 675.09 412.811V410.727H675.997V412.649C675.999 412.842 676.051 412.995 676.153 413.107C676.255 413.219 676.392 413.276 676.564 413.276C676.674 413.276 676.776 413.251 676.871 413.201C676.966 413.15 677.043 413.075 677.101 412.975C677.161 412.876 677.19 412.753 677.188 412.607ZM681.545 411.661L680.714 411.712C680.7 411.641 680.669 411.577 680.623 411.52C680.576 411.462 680.514 411.415 680.437 411.381C680.362 411.346 680.272 411.328 680.167 411.328C680.026 411.328 679.907 411.358 679.811 411.418C679.714 411.476 679.666 411.554 679.666 411.652C679.666 411.73 679.697 411.796 679.76 411.85C679.822 411.904 679.929 411.947 680.081 411.98L680.674 412.099C680.992 412.165 681.229 412.27 681.385 412.415C681.542 412.56 681.62 412.75 681.62 412.986C681.62 413.2 681.557 413.388 681.43 413.55C681.305 413.712 681.133 413.839 680.915 413.93C680.697 414.019 680.446 414.064 680.162 414.064C679.729 414.064 679.384 413.974 679.127 413.793C678.871 413.612 678.721 413.364 678.677 413.052L679.57 413.005C679.597 413.137 679.662 413.238 679.766 413.308C679.87 413.376 680.003 413.41 680.165 413.41C680.324 413.41 680.451 413.379 680.548 413.318C680.646 413.256 680.696 413.175 680.697 413.077C680.696 412.995 680.661 412.928 680.593 412.875C680.525 412.821 680.419 412.78 680.277 412.751L679.711 412.638C679.391 412.575 679.153 412.464 678.997 412.306C678.842 412.148 678.765 411.947 678.765 411.703C678.765 411.493 678.821 411.312 678.935 411.16C679.05 411.008 679.211 410.891 679.419 410.808C679.628 410.726 679.872 410.685 680.152 410.685C680.565 410.685 680.89 410.772 681.128 410.947C681.366 411.121 681.505 411.359 681.545 411.661ZM683.932 410.727V411.409H681.961V410.727H683.932ZM682.409 409.943H683.316V412.994C683.316 413.078 683.329 413.143 683.355 413.19C683.38 413.236 683.416 413.268 683.461 413.286C683.508 413.305 683.562 413.314 683.623 413.314C683.666 413.314 683.708 413.31 683.751 413.303C683.794 413.295 683.826 413.288 683.849 413.284L683.992 413.96C683.946 413.974 683.882 413.99 683.8 414.009C683.718 414.028 683.617 414.04 683.5 414.045C683.281 414.053 683.089 414.024 682.924 413.957C682.761 413.891 682.634 413.787 682.543 413.646C682.452 413.506 682.407 413.328 682.409 413.114V409.943ZM684.523 414V410.727H685.403V411.298H685.437C685.497 411.095 685.597 410.942 685.738 410.838C685.878 410.733 686.04 410.68 686.224 410.68C686.269 410.68 686.318 410.683 686.371 410.689C686.423 410.695 686.469 410.702 686.509 410.712V411.518C686.467 411.505 686.408 411.494 686.332 411.484C686.257 411.474 686.188 411.469 686.126 411.469C685.992 411.469 685.873 411.498 685.768 411.556C685.664 411.613 685.582 411.692 685.521 411.795C685.461 411.897 685.431 412.015 685.431 412.148V414H684.523ZM687.818 414.062C687.609 414.062 687.423 414.026 687.26 413.953C687.096 413.879 686.967 413.771 686.872 413.627C686.778 413.482 686.731 413.302 686.731 413.086C686.731 412.904 686.765 412.751 686.831 412.628C686.898 412.504 686.989 412.405 687.104 412.33C687.219 412.254 687.35 412.197 687.496 412.159C687.644 412.121 687.799 412.094 687.961 412.078C688.151 412.058 688.304 412.04 688.421 412.023C688.537 412.004 688.622 411.977 688.674 411.942C688.727 411.906 688.753 411.854 688.753 411.784V411.771C688.753 411.636 688.711 411.532 688.625 411.458C688.542 411.384 688.422 411.347 688.267 411.347C688.104 411.347 687.974 411.384 687.878 411.456C687.781 411.527 687.717 411.616 687.686 411.724L686.846 411.656C686.889 411.457 686.973 411.286 687.098 411.141C687.223 410.994 687.384 410.882 687.581 410.804C687.78 410.724 688.01 410.685 688.272 410.685C688.454 410.685 688.628 410.706 688.794 410.749C688.961 410.791 689.11 410.857 689.239 410.947C689.37 411.036 689.473 411.151 689.548 411.292C689.623 411.431 689.661 411.598 689.661 411.793V414H688.8V413.546H688.775C688.722 413.648 688.652 413.739 688.564 413.817C688.476 413.893 688.37 413.954 688.246 413.998C688.123 414.04 687.98 414.062 687.818 414.062ZM688.078 413.435C688.211 413.435 688.329 413.409 688.432 413.357C688.534 413.303 688.614 413.23 688.672 413.139C688.731 413.048 688.76 412.945 688.76 412.83V412.483C688.731 412.501 688.692 412.518 688.642 412.534C688.594 412.548 688.54 412.562 688.478 412.575C688.417 412.586 688.356 412.597 688.295 412.607C688.234 412.615 688.179 412.623 688.129 412.63C688.022 412.646 687.929 412.67 687.85 412.705C687.77 412.739 687.709 412.785 687.665 412.843C687.62 412.9 687.598 412.971 687.598 413.056C687.598 413.18 687.643 413.274 687.733 413.339C687.824 413.403 687.939 413.435 688.078 413.435ZM691.273 409.636V414H690.365V409.636H691.273ZM692 414V410.727H692.908V414H692ZM692.456 410.305C692.321 410.305 692.205 410.261 692.109 410.171C692.013 410.08 691.966 409.972 691.966 409.845C691.966 409.72 692.013 409.613 692.109 409.523C692.205 409.433 692.321 409.387 692.456 409.387C692.591 409.387 692.706 409.433 692.801 409.523C692.898 409.613 692.946 409.72 692.946 409.845C692.946 409.972 692.898 410.08 692.801 410.171C692.706 410.261 692.591 410.305 692.456 410.305ZM694.568 414.062C694.359 414.062 694.173 414.026 694.01 413.953C693.846 413.879 693.717 413.771 693.622 413.627C693.528 413.482 693.481 413.302 693.481 413.086C693.481 412.904 693.515 412.751 693.581 412.628C693.648 412.504 693.739 412.405 693.854 412.33C693.969 412.254 694.1 412.197 694.246 412.159C694.394 412.121 694.549 412.094 694.711 412.078C694.901 412.058 695.054 412.04 695.171 412.023C695.287 412.004 695.372 411.977 695.424 411.942C695.477 411.906 695.503 411.854 695.503 411.784V411.771C695.503 411.636 695.461 411.532 695.375 411.458C695.292 411.384 695.172 411.347 695.017 411.347C694.854 411.347 694.724 411.384 694.628 411.456C694.531 411.527 694.467 411.616 694.436 411.724L693.596 411.656C693.639 411.457 693.723 411.286 693.848 411.141C693.973 410.994 694.134 410.882 694.331 410.804C694.53 410.724 694.76 410.685 695.022 410.685C695.204 410.685 695.378 410.706 695.544 410.749C695.711 410.791 695.86 410.857 695.989 410.947C696.12 411.036 696.223 411.151 696.298 411.292C696.373 411.431 696.411 411.598 696.411 411.793V414H695.55V413.546H695.525C695.472 413.648 695.402 413.739 695.314 413.817C695.226 413.893 695.12 413.954 694.996 413.998C694.873 414.04 694.73 414.062 694.568 414.062ZM694.828 413.435C694.961 413.435 695.079 413.409 695.182 413.357C695.284 413.303 695.364 413.23 695.422 413.139C695.481 413.048 695.51 412.945 695.51 412.83V412.483C695.481 412.501 695.442 412.518 695.392 412.534C695.344 412.548 695.29 412.562 695.228 412.575C695.167 412.586 695.106 412.597 695.045 412.607C694.984 412.615 694.929 412.623 694.879 412.63C694.772 412.646 694.679 412.67 694.6 412.705C694.52 412.739 694.459 412.785 694.415 412.843C694.37 412.9 694.348 412.971 694.348 413.056C694.348 413.18 694.393 413.274 694.483 413.339C694.574 413.403 694.689 413.435 694.828 413.435Z"
                  fill="black"
                ></path>
                <g id="Army_26">
                  <circle
                    id="armycircle_26"
                    cx="684"
                    cy="422"
                    r="5.5"
                    fill={getCircleFill("east-au")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("east-au")}
                  ></circle>
                  {getArmyNum("east-au", "684", "422")}
                </g>
              </g>
            </g>
            <g id="new-guinea">
              <path
                id="new_guinea"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M662.353 340.349C662.353 340.349 662.853 337.599 663.853 336.849C664.853 336.099 664.103 335.849 664.103 334.599C664.103 333.349 663.103 332.099 664.353 331.849C665.603 331.599 665.853 331.849 667.603 331.599C669.353 331.349 671.103 330.349 671.103 330.349L672.603 331.849C672.603 331.849 673.353 332.599 675.603 332.599C677.853 332.599 678.603 333.599 679.603 335.349C680.603 337.099 680.103 337.849 682.853 339.599C685.603 341.349 688.353 342.099 689.853 342.599C691.353 343.099 692.603 343.849 692.353 345.349C692.103 346.849 693.853 347.599 691.853 348.099C691.853 348.099 697.576 350.561 698.283 352.152C698.99 353.743 700.228 354.45 698.814 355.334C697.399 356.218 695.808 355.511 695.985 356.572C696.162 357.632 697.223 358.339 697.576 359.577C697.93 360.814 699.167 361.521 699.167 362.935C699.167 364.35 698.814 365.234 700.228 366.117C701.642 367.001 701.819 367.001 701.819 368.062C701.819 369.123 701.819 370.537 701.819 370.537C701.819 370.537 700.758 371.598 698.99 371.598C697.223 371.598 696.339 370.183 695.632 370.183C694.925 370.183 693.157 369.83 693.157 369.83C693.157 369.83 691.919 364.88 688.384 363.996C684.848 363.112 684.848 362.582 684.848 363.289C684.848 363.996 686.086 365.587 684.672 366.117C683.257 366.648 682.55 366.648 681.666 366.648C680.782 366.648 684.672 368.239 680.252 368.062C675.833 367.885 675.479 366.294 673.535 367.532C671.59 368.769 665.756 363.819 665.756 363.819C665.756 363.819 663.105 363.996 663.105 362.582C663.105 361.168 662.398 360.991 663.282 359.754C664.165 358.516 664.165 358.339 664.165 356.925C664.165 355.511 664.519 355.157 664.519 353.743C664.519 352.329 665.403 351.799 664.165 351.268C662.928 350.738 661.867 350.384 661.691 349.147C661.514 347.909 661.514 347.733 660.63 347.733C659.746 347.733 660.63 347.909 659.216 347.909C657.801 347.909 656.741 348.97 655.503 347.379C654.266 345.788 654.089 345.788 651.791 345.788C649.493 345.788 644.543 349.147 648.432 345.788C652.321 342.429 653.028 342.253 653.028 342.253C653.028 342.253 648.963 342.253 648.786 340.838C648.609 339.424 648.255 337.126 647.372 336.773C646.488 336.419 645.427 335.889 645.781 334.651C646.134 333.414 646.841 328.994 650.377 329.171C653.912 329.348 654.619 330.762 655.68 331.292C656.741 331.823 658.685 329.878 659.039 331.646C659.392 333.414 659.039 336.419 659.039 336.419C659.039 336.419 660.276 337.303 660.63 339.071L662.353 340.349Z"
                className={getCountryClass("new-guinea")}
                fill={getFill("new-guinea")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_27">
                <path
                  id="New Guinea"
                  d="M669.49 333.636V338H668.693L666.795 335.254H666.763V338H665.84V333.636H666.65L668.533 336.381H668.572V333.636H669.49ZM671.727 338.064C671.39 338.064 671.1 337.996 670.857 337.859C670.616 337.722 670.43 337.527 670.299 337.276C670.169 337.023 670.103 336.724 670.103 336.379C670.103 336.042 670.169 335.746 670.299 335.492C670.43 335.238 670.614 335.04 670.851 334.898C671.09 334.756 671.369 334.685 671.691 334.685C671.906 334.685 672.107 334.719 672.294 334.789C672.481 334.857 672.644 334.96 672.784 335.098C672.924 335.236 673.034 335.409 673.112 335.618C673.19 335.825 673.229 336.068 673.229 336.347V336.596H670.465V336.033H672.374C672.374 335.903 672.346 335.787 672.289 335.686C672.232 335.585 672.154 335.506 672.053 335.45C671.953 335.391 671.838 335.362 671.705 335.362C671.568 335.362 671.445 335.394 671.339 335.458C671.234 335.521 671.151 335.605 671.092 335.712C671.032 335.817 671.002 335.934 671 336.063V336.598C671 336.76 671.03 336.9 671.09 337.018C671.151 337.136 671.237 337.227 671.347 337.29C671.458 337.354 671.59 337.386 671.742 337.386C671.843 337.386 671.935 337.372 672.019 337.344C672.102 337.315 672.174 337.273 672.234 337.216C672.294 337.159 672.339 337.089 672.37 337.007L673.21 337.062C673.167 337.264 673.08 337.44 672.948 337.591C672.817 337.74 672.648 337.857 672.441 337.94C672.235 338.023 671.997 338.064 671.727 338.064ZM674.443 338L673.553 334.727H674.471L674.978 336.926H675.008L675.536 334.727H676.438L676.975 336.913H677.002L677.501 334.727H678.417L677.529 338H676.568L676.005 335.942H675.965L675.402 338H674.443ZM664.907 342.047C664.878 341.943 664.836 341.852 664.782 341.772C664.728 341.691 664.662 341.623 664.584 341.567C664.507 341.511 664.419 341.467 664.319 341.438C664.221 341.408 664.113 341.393 663.993 341.393C663.77 341.393 663.574 341.448 663.405 341.559C663.238 341.67 663.107 341.831 663.013 342.043C662.92 342.253 662.873 342.51 662.873 342.814C662.873 343.118 662.919 343.376 663.011 343.589C663.104 343.803 663.234 343.965 663.403 344.077C663.572 344.188 663.772 344.244 664.002 344.244C664.211 344.244 664.389 344.207 664.537 344.133C664.686 344.058 664.8 343.952 664.878 343.815C664.957 343.679 664.997 343.518 664.997 343.332L665.184 343.359H664.059V342.665H665.885V343.214C665.885 343.598 665.805 343.928 665.643 344.203C665.481 344.477 665.258 344.689 664.974 344.838C664.689 344.986 664.364 345.06 663.998 345.06C663.589 345.06 663.229 344.969 662.92 344.789C662.61 344.607 662.368 344.349 662.195 344.016C662.023 343.68 661.937 343.283 661.937 342.822C661.937 342.469 661.988 342.153 662.091 341.876C662.194 341.598 662.339 341.362 662.525 341.169C662.711 340.976 662.928 340.829 663.175 340.728C663.422 340.627 663.69 340.577 663.979 340.577C664.226 340.577 664.456 340.613 664.669 340.685C664.882 340.756 665.071 340.857 665.236 340.988C665.402 341.119 665.537 341.274 665.643 341.455C665.748 341.634 665.815 341.831 665.845 342.047H664.907ZM668.66 343.607V341.727H669.568V345H668.696V344.406H668.662C668.588 344.597 668.466 344.751 668.294 344.868C668.123 344.984 667.915 345.043 667.669 345.043C667.451 345.043 667.258 344.993 667.092 344.893C666.926 344.794 666.796 344.653 666.702 344.469C666.61 344.286 666.563 344.067 666.561 343.811V341.727H667.469V343.649C667.471 343.842 667.522 343.995 667.625 344.107C667.727 344.219 667.864 344.276 668.036 344.276C668.145 344.276 668.248 344.251 668.343 344.201C668.438 344.15 668.515 344.075 668.573 343.975C668.632 343.876 668.662 343.753 668.66 343.607ZM670.294 345V341.727H671.202V345H670.294ZM670.75 341.305C670.615 341.305 670.499 341.261 670.403 341.171C670.307 341.08 670.26 340.972 670.26 340.845C670.26 340.72 670.307 340.613 670.403 340.523C670.499 340.433 670.615 340.387 670.75 340.387C670.885 340.387 671 340.433 671.095 340.523C671.192 340.613 671.24 340.72 671.24 340.845C671.24 340.972 671.192 341.08 671.095 341.171C671 341.261 670.885 341.305 670.75 341.305ZM672.836 343.108V345H671.929V341.727H672.794V342.305H672.832C672.904 342.114 673.026 341.964 673.196 341.853C673.367 341.741 673.574 341.685 673.816 341.685C674.044 341.685 674.242 341.734 674.411 341.834C674.58 341.933 674.711 342.075 674.805 342.26C674.899 342.443 674.946 342.662 674.946 342.916V345H674.038V343.078C674.039 342.878 673.988 342.722 673.885 342.609C673.781 342.496 673.638 342.439 673.456 342.439C673.334 342.439 673.226 342.465 673.132 342.518C673.04 342.57 672.968 342.647 672.915 342.748C672.864 342.847 672.838 342.967 672.836 343.108ZM677.153 345.064C676.816 345.064 676.526 344.996 676.283 344.859C676.042 344.722 675.856 344.527 675.725 344.276C675.594 344.023 675.529 343.724 675.529 343.379C675.529 343.042 675.594 342.746 675.725 342.492C675.856 342.238 676.04 342.04 676.277 341.898C676.515 341.756 676.795 341.685 677.116 341.685C677.332 341.685 677.533 341.719 677.719 341.789C677.907 341.857 678.07 341.96 678.209 342.098C678.35 342.236 678.459 342.409 678.537 342.618C678.616 342.825 678.655 343.068 678.655 343.347V343.596H675.891V343.033H677.8C677.8 342.903 677.772 342.787 677.715 342.686C677.658 342.585 677.579 342.506 677.479 342.45C677.379 342.391 677.263 342.362 677.131 342.362C676.993 342.362 676.871 342.394 676.765 342.458C676.66 342.521 676.577 342.605 676.518 342.712C676.458 342.817 676.427 342.934 676.426 343.063V343.598C676.426 343.76 676.456 343.9 676.515 344.018C676.577 344.136 676.662 344.227 676.773 344.29C676.884 344.354 677.015 344.386 677.167 344.386C677.268 344.386 677.361 344.372 677.444 344.344C677.528 344.315 677.6 344.273 677.66 344.216C677.719 344.159 677.765 344.089 677.796 344.007L678.635 344.062C678.593 344.264 678.506 344.44 678.373 344.591C678.243 344.74 678.074 344.857 677.866 344.94C677.66 345.023 677.422 345.064 677.153 345.064ZM680.18 345.062C679.971 345.062 679.785 345.026 679.622 344.953C679.459 344.879 679.329 344.771 679.234 344.627C679.14 344.482 679.094 344.302 679.094 344.086C679.094 343.904 679.127 343.751 679.194 343.628C679.26 343.504 679.351 343.405 679.466 343.33C679.581 343.254 679.712 343.197 679.858 343.159C680.006 343.121 680.161 343.094 680.323 343.078C680.513 343.058 680.667 343.04 680.783 343.023C680.9 343.004 680.984 342.977 681.037 342.942C681.089 342.906 681.116 342.854 681.116 342.784V342.771C681.116 342.636 681.073 342.532 680.988 342.458C680.904 342.384 680.785 342.347 680.63 342.347C680.466 342.347 680.336 342.384 680.24 342.456C680.143 342.527 680.079 342.616 680.048 342.724L679.209 342.656C679.251 342.457 679.335 342.286 679.46 342.141C679.585 341.994 679.746 341.882 679.944 341.804C680.143 341.724 680.373 341.685 680.634 341.685C680.816 341.685 680.99 341.706 681.156 341.749C681.324 341.791 681.472 341.857 681.601 341.947C681.732 342.036 681.835 342.151 681.91 342.292C681.986 342.431 682.023 342.598 682.023 342.793V345H681.162V344.546H681.137C681.084 344.648 681.014 344.739 680.926 344.817C680.838 344.893 680.732 344.954 680.608 344.998C680.485 345.04 680.342 345.062 680.18 345.062ZM680.44 344.435C680.574 344.435 680.692 344.409 680.794 344.357C680.896 344.303 680.976 344.23 681.035 344.139C681.093 344.048 681.122 343.945 681.122 343.83V343.483C681.094 343.501 681.055 343.518 681.005 343.534C680.956 343.548 680.902 343.562 680.841 343.575C680.78 343.586 680.719 343.597 680.657 343.607C680.596 343.615 680.541 343.623 680.491 343.63C680.385 343.646 680.292 343.67 680.212 343.705C680.133 343.739 680.071 343.785 680.027 343.843C679.983 343.9 679.961 343.971 679.961 344.056C679.961 344.18 680.006 344.274 680.095 344.339C680.186 344.403 680.301 344.435 680.44 344.435Z"
                  fill="black"
                ></path>
                <g id="Army_27">
                  <circle
                    id="armycircle_27"
                    cx="680"
                    cy="351"
                    r="5.5"
                    fill={getCircleFill("new-guinea")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("new-guinea")}
                  ></circle>
                  {getArmyNum("new-guinea", "680", "351")}
                </g>
              </g>
            </g>
            <g id="indonesia">
              <path
                id="indonesia_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M607.728 396.224C608.603 397.599 608.103 397.849 610.103 397.849C612.103 397.849 613.353 397.474 614.478 397.724C615.603 397.974 615.103 398.349 616.353 398.224C617.603 398.099 618.728 397.349 619.728 397.224C620.728 397.099 621.978 396.974 622.728 397.224C623.478 397.474 624.603 398.349 625.978 398.474C627.353 398.599 630.478 398.599 630.978 398.724C631.478 398.849 633.103 400.099 633.853 399.224C634.603 398.349 634.853 398.599 635.103 397.224C635.353 395.849 635.353 395.099 634.478 394.849C633.603 394.599 634.228 394.099 632.103 393.974C629.978 393.849 629.353 393.599 628.728 393.349C628.103 393.099 627.103 392.099 626.353 391.849C625.603 391.599 623.478 390.724 622.103 390.724C620.728 390.724 617.978 390.474 616.603 390.474C615.228 390.474 614.978 389.849 613.478 390.974C611.978 392.099 610.728 392.599 609.853 393.224C608.978 393.849 609.228 393.349 608.853 394.599C608.478 395.849 608.103 396.474 607.728 396.224ZM631.103 388.099C631.603 386.349 631.228 386.599 631.353 385.099C631.478 383.599 631.853 383.974 632.478 382.974C633.103 381.974 632.728 380.349 633.853 382.224C634.978 384.099 634.603 384.849 635.978 385.974C637.353 387.099 637.603 388.349 638.728 387.224C639.853 386.099 641.978 384.974 640.728 383.599C639.478 382.224 638.728 383.599 638.603 380.349C638.478 377.099 638.353 375.974 637.478 376.099C636.603 376.224 635.853 377.474 635.728 375.724C635.603 373.974 635.103 371.849 636.478 371.724C637.853 371.599 639.228 372.474 640.103 370.849C640.978 369.224 641.978 368.724 640.353 368.474C638.728 368.224 637.478 367.974 636.603 368.099C635.728 368.224 635.103 368.224 635.228 367.474C635.353 366.724 634.353 365.974 636.103 365.974C637.853 365.974 637.478 366.349 639.103 366.224C640.728 366.099 642.353 365.224 642.853 364.724C643.353 364.224 643.978 361.974 644.728 361.474C645.478 360.974 645.978 360.599 645.853 359.974C645.728 359.349 645.478 358.849 644.728 358.599C643.978 358.349 642.728 358.099 642.353 358.599C641.978 359.099 641.103 360.474 640.228 360.849C639.353 361.224 635.103 360.974 634.103 361.474C633.103 361.974 632.228 362.599 631.603 362.974C630.978 363.349 629.603 363.974 629.853 365.474C630.103 366.974 630.103 368.224 630.103 368.849C630.103 369.474 628.853 371.224 628.603 371.849C628.353 372.474 628.728 374.349 628.353 375.224C627.978 376.099 627.728 375.599 627.728 376.849C627.728 378.099 627.478 378.349 627.853 379.224C628.228 380.099 628.853 380.099 628.478 381.349C628.103 382.599 627.478 381.849 627.978 383.224C628.478 384.599 629.103 384.099 629.228 385.349C629.353 386.599 628.978 387.099 629.228 388.099C629.478 389.099 631.228 388.224 631.103 388.099ZM620.603 381.724C620.603 381.724 620.353 380.474 622.478 378.349C624.603 376.224 625.228 376.099 625.228 373.974C625.228 371.849 625.103 371.974 624.103 370.974C623.103 369.974 621.728 369.349 622.978 367.849C624.228 366.349 624.103 365.974 625.728 365.599C627.353 365.224 628.978 362.849 629.103 361.974C629.228 361.099 629.353 360.599 628.978 359.474C628.603 358.349 627.603 356.349 627.478 354.974C627.353 353.599 627.228 352.599 627.353 351.599C627.478 350.599 628.353 350.599 629.478 349.224C630.603 347.849 630.853 348.474 630.853 346.474C630.853 344.474 630.728 341.974 630.103 341.474C629.478 340.974 629.228 341.224 627.853 340.724C626.478 340.224 625.853 338.974 623.978 337.849C622.103 336.724 620.853 336.599 620.478 337.224C620.103 337.849 620.853 335.724 620.103 338.849C619.353 341.974 619.478 342.724 618.603 343.349C617.728 343.974 616.353 344.349 615.978 345.599C615.603 346.849 616.978 347.724 614.978 349.849C612.978 351.974 609.353 355.974 606.728 356.474C604.103 356.974 602.228 357.599 602.228 358.474C602.228 359.349 603.353 360.474 603.103 361.474C602.853 362.474 601.103 363.474 601.353 363.974C601.603 364.474 602.228 363.974 602.728 365.099C603.228 366.224 603.228 369.724 603.228 369.724L605.603 372.349C605.603 372.349 603.853 374.974 604.728 375.724C605.603 376.474 605.978 376.599 606.978 377.724C607.978 378.849 609.228 380.099 610.728 380.224C612.228 380.349 613.103 381.099 614.228 381.599C615.353 382.099 615.728 381.599 617.103 381.474C618.478 381.349 620.978 381.849 620.603 381.724ZM596.99 364.703L597.697 362.935C597.697 362.935 597.874 364.88 598.051 365.941C598.228 367.001 597.697 368.416 598.228 369.123C598.758 369.83 598.404 370.183 598.228 371.244C598.051 372.305 598.935 374.072 598.935 374.072L600.228 375.599L601.603 375.849C601.603 375.849 602.228 376.724 602.478 377.349C602.728 377.974 603.603 378.349 603.603 378.349C603.603 378.349 603.603 379.724 603.603 380.599C603.603 381.474 602.603 381.974 603.728 382.224C604.853 382.474 606.228 382.474 606.978 382.474C607.728 382.474 607.478 382.849 607.978 383.849C608.478 384.849 608.978 384.974 609.103 386.349C609.228 387.724 609.228 388.724 608.728 389.349C608.228 389.974 608.603 390.474 607.978 391.224C607.353 391.974 606.353 392.099 605.603 392.224C604.853 392.349 604.603 392.349 604.353 393.224C604.103 394.099 605.978 394.974 603.603 394.849C601.228 394.724 601.353 395.349 600.853 394.099C600.353 392.849 601.728 392.349 599.978 391.724C598.228 391.099 599.728 393.599 597.103 390.099C594.478 386.599 593.603 388.974 593.228 385.849C592.853 382.724 591.728 381.974 590.228 379.599C588.728 377.224 588.103 375.599 586.853 375.224C585.603 374.849 585.103 376.349 584.478 374.724C583.853 373.099 583.853 373.974 583.853 372.099C583.853 370.224 583.728 370.349 582.853 368.599C581.978 366.849 581.853 366.974 581.353 365.099C580.853 363.224 581.103 364.099 578.853 361.224C576.603 358.349 576.353 358.099 574.353 356.599C572.353 355.099 571.853 354.849 571.978 352.849C572.103 350.849 570.728 348.849 571.978 348.474C573.228 348.099 573.478 347.724 574.728 348.474C575.978 349.224 576.103 350.099 577.103 350.349C578.103 350.599 578.728 350.474 579.478 350.474C580.228 350.474 579.978 349.474 581.228 350.974C582.478 352.474 582.728 352.474 583.353 353.849C583.978 355.224 583.978 355.724 584.603 356.474C585.228 357.224 585.728 357.224 586.353 356.849C586.978 356.474 587.603 355.349 587.978 356.099C588.353 356.849 588.353 357.224 588.603 357.724C588.853 358.224 589.603 356.599 589.603 358.724C589.603 360.849 588.853 361.849 589.978 361.099C591.103 360.349 592.228 359.599 592.228 359.599C592.228 359.599 592.103 359.224 592.603 360.474C593.103 361.724 593.228 362.849 594.353 363.349C595.478 363.849 595.853 363.849 595.853 363.849L596.99 364.703Z"
                className={getCountryClass("indonesia")}
                fill={getFill("indonesia")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_28">
                <path
                  id="Indonesia"
                  d="M585.946 348.636V353H585.024V348.636H585.946ZM587.596 351.108V353H586.688V349.727H587.553V350.305H587.592C587.664 350.114 587.786 349.964 587.956 349.853C588.127 349.741 588.333 349.685 588.576 349.685C588.803 349.685 589.002 349.734 589.171 349.834C589.34 349.933 589.471 350.075 589.565 350.26C589.659 350.443 589.705 350.662 589.705 350.916V353H588.798V351.078C588.799 350.878 588.748 350.722 588.644 350.609C588.541 350.496 588.398 350.439 588.216 350.439C588.094 350.439 587.986 350.465 587.892 350.518C587.8 350.57 587.727 350.647 587.675 350.748C587.624 350.847 587.597 350.967 587.596 351.108ZM591.627 353.053C591.378 353.053 591.153 352.989 590.951 352.862C590.751 352.732 590.592 352.543 590.474 352.293C590.358 352.041 590.299 351.733 590.299 351.368C590.299 350.993 590.36 350.681 590.48 350.433C590.601 350.183 590.762 349.996 590.962 349.872C591.164 349.747 591.385 349.685 591.625 349.685C591.808 349.685 591.961 349.716 592.083 349.778C592.206 349.839 592.306 349.916 592.381 350.009C592.458 350.099 592.516 350.189 592.556 350.277H592.583V348.636H593.489V353H592.594V352.476H592.556C592.513 352.567 592.453 352.657 592.375 352.746C592.298 352.835 592.198 352.908 592.074 352.966C591.952 353.024 591.803 353.053 591.627 353.053ZM591.914 352.331C592.061 352.331 592.184 352.291 592.285 352.212C592.387 352.131 592.466 352.018 592.52 351.873C592.575 351.728 592.603 351.558 592.603 351.364C592.603 351.169 592.576 351 592.522 350.857C592.468 350.713 592.39 350.602 592.287 350.524C592.185 350.446 592.061 350.407 591.914 350.407C591.765 350.407 591.64 350.447 591.537 350.528C591.435 350.609 591.358 350.722 591.305 350.865C591.252 351.009 591.226 351.175 591.226 351.364C591.226 351.554 591.252 351.722 591.305 351.869C591.359 352.013 591.436 352.127 591.537 352.21C591.64 352.29 591.765 352.331 591.914 352.331ZM595.714 353.064C595.383 353.064 595.097 352.994 594.855 352.853C594.615 352.711 594.43 352.513 594.299 352.261C594.169 352.006 594.103 351.712 594.103 351.376C594.103 351.038 594.169 350.743 594.299 350.49C594.43 350.236 594.615 350.038 594.855 349.898C595.097 349.756 595.383 349.685 595.714 349.685C596.045 349.685 596.33 349.756 596.57 349.898C596.812 350.038 596.998 350.236 597.129 350.49C597.259 350.743 597.325 351.038 597.325 351.376C597.325 351.712 597.259 352.006 597.129 352.261C596.998 352.513 596.812 352.711 596.57 352.853C596.33 352.994 596.045 353.064 595.714 353.064ZM595.718 352.361C595.869 352.361 595.994 352.318 596.095 352.233C596.196 352.146 596.272 352.028 596.323 351.879C596.376 351.73 596.402 351.56 596.402 351.37C596.402 351.18 596.376 351.01 596.323 350.861C596.272 350.712 596.196 350.594 596.095 350.507C595.994 350.42 595.869 350.377 595.718 350.377C595.566 350.377 595.438 350.42 595.335 350.507C595.232 350.594 595.155 350.712 595.102 350.861C595.051 351.01 595.026 351.18 595.026 351.37C595.026 351.56 595.051 351.73 595.102 351.879C595.155 352.028 595.232 352.146 595.335 352.233C595.438 352.318 595.566 352.361 595.718 352.361ZM598.823 351.108V353H597.915V349.727H598.78V350.305H598.818C598.891 350.114 599.012 349.964 599.183 349.853C599.353 349.741 599.56 349.685 599.803 349.685C600.03 349.685 600.228 349.734 600.397 349.834C600.566 349.933 600.698 350.075 600.791 350.26C600.885 350.443 600.932 350.662 600.932 350.916V353H600.024V351.078C600.026 350.878 599.975 350.722 599.871 350.609C599.767 350.496 599.624 350.439 599.443 350.439C599.32 350.439 599.213 350.465 599.119 350.518C599.026 350.57 598.954 350.647 598.901 350.748C598.85 350.847 598.824 350.967 598.823 351.108ZM603.139 353.064C602.802 353.064 602.512 352.996 602.27 352.859C602.028 352.722 601.842 352.527 601.711 352.276C601.581 352.023 601.515 351.724 601.515 351.379C601.515 351.042 601.581 350.746 601.711 350.492C601.842 350.238 602.026 350.04 602.263 349.898C602.502 349.756 602.782 349.685 603.103 349.685C603.319 349.685 603.52 349.719 603.706 349.789C603.893 349.857 604.056 349.96 604.196 350.098C604.336 350.236 604.446 350.409 604.524 350.618C604.602 350.825 604.641 351.068 604.641 351.347V351.596H601.877V351.033H603.787C603.787 350.903 603.758 350.787 603.701 350.686C603.645 350.585 603.566 350.506 603.465 350.45C603.365 350.391 603.25 350.362 603.118 350.362C602.98 350.362 602.858 350.394 602.751 350.458C602.646 350.521 602.564 350.605 602.504 350.712C602.444 350.817 602.414 350.934 602.412 351.063V351.598C602.412 351.76 602.442 351.9 602.502 352.018C602.563 352.136 602.649 352.227 602.76 352.29C602.87 352.354 603.002 352.386 603.154 352.386C603.255 352.386 603.347 352.372 603.431 352.344C603.515 352.315 603.586 352.273 603.646 352.216C603.706 352.159 603.751 352.089 603.782 352.007L604.622 352.062C604.579 352.264 604.492 352.44 604.36 352.591C604.229 352.74 604.06 352.857 603.853 352.94C603.647 353.023 603.409 353.064 603.139 353.064ZM607.956 350.661L607.125 350.712C607.111 350.641 607.081 350.577 607.034 350.52C606.987 350.462 606.925 350.415 606.848 350.381C606.773 350.346 606.683 350.328 606.578 350.328C606.437 350.328 606.319 350.358 606.222 350.418C606.125 350.476 606.077 350.554 606.077 350.652C606.077 350.73 606.108 350.796 606.171 350.85C606.233 350.904 606.341 350.947 606.493 350.98L607.085 351.099C607.403 351.165 607.64 351.27 607.797 351.415C607.953 351.56 608.031 351.75 608.031 351.986C608.031 352.2 607.968 352.388 607.841 352.55C607.716 352.712 607.544 352.839 607.326 352.93C607.108 353.019 606.858 353.064 606.574 353.064C606.14 353.064 605.795 352.974 605.538 352.793C605.282 352.612 605.132 352.364 605.088 352.052L605.981 352.005C606.008 352.137 606.074 352.238 606.177 352.308C606.281 352.376 606.414 352.41 606.576 352.41C606.735 352.41 606.863 352.379 606.959 352.318C607.057 352.256 607.107 352.175 607.108 352.077C607.107 351.995 607.072 351.928 607.004 351.875C606.936 351.821 606.831 351.78 606.689 351.751L606.122 351.638C605.802 351.575 605.564 351.464 605.408 351.306C605.253 351.148 605.176 350.947 605.176 350.703C605.176 350.493 605.233 350.312 605.346 350.16C605.461 350.008 605.623 349.891 605.83 349.808C606.039 349.726 606.283 349.685 606.563 349.685C606.976 349.685 607.301 349.772 607.539 349.947C607.777 350.121 607.917 350.359 607.956 350.661ZM608.602 353V349.727H609.51V353H608.602ZM609.058 349.305C608.923 349.305 608.808 349.261 608.711 349.171C608.616 349.08 608.568 348.972 608.568 348.845C608.568 348.72 608.616 348.613 608.711 348.523C608.808 348.433 608.923 348.387 609.058 348.387C609.193 348.387 609.308 348.433 609.404 348.523C609.5 348.613 609.548 348.72 609.548 348.845C609.548 348.972 609.5 349.08 609.404 349.171C609.308 349.261 609.193 349.305 609.058 349.305ZM611.17 353.062C610.962 353.062 610.776 353.026 610.612 352.953C610.449 352.879 610.32 352.771 610.224 352.627C610.131 352.482 610.084 352.302 610.084 352.086C610.084 351.904 610.117 351.751 610.184 351.628C610.251 351.504 610.342 351.405 610.457 351.33C610.572 351.254 610.702 351.197 610.849 351.159C610.996 351.121 611.151 351.094 611.313 351.078C611.504 351.058 611.657 351.04 611.773 351.023C611.89 351.004 611.974 350.977 612.027 350.942C612.08 350.906 612.106 350.854 612.106 350.784V350.771C612.106 350.636 612.063 350.532 611.978 350.458C611.894 350.384 611.775 350.347 611.62 350.347C611.457 350.347 611.327 350.384 611.23 350.456C611.134 350.527 611.07 350.616 611.038 350.724L610.199 350.656C610.241 350.457 610.325 350.286 610.45 350.141C610.575 349.994 610.737 349.882 610.934 349.804C611.133 349.724 611.363 349.685 611.624 349.685C611.806 349.685 611.98 349.706 612.146 349.749C612.314 349.791 612.462 349.857 612.592 349.947C612.722 350.036 612.825 350.151 612.901 350.292C612.976 350.431 613.013 350.598 613.013 350.793V353H612.153V352.546H612.127C612.075 352.648 612.004 352.739 611.916 352.817C611.828 352.893 611.722 352.954 611.599 352.998C611.475 353.04 611.332 353.062 611.17 353.062ZM611.43 352.435C611.564 352.435 611.682 352.409 611.784 352.357C611.886 352.303 611.967 352.23 612.025 352.139C612.083 352.048 612.112 351.945 612.112 351.83V351.483C612.084 351.501 612.045 351.518 611.995 351.534C611.947 351.548 611.892 351.562 611.831 351.575C611.77 351.586 611.709 351.597 611.648 351.607C611.587 351.615 611.531 351.623 611.482 351.63C611.375 351.646 611.282 351.67 611.202 351.705C611.123 351.739 611.061 351.785 611.017 351.843C610.973 351.9 610.951 351.971 610.951 352.056C610.951 352.18 610.996 352.274 611.085 352.339C611.176 352.403 611.291 352.435 611.43 352.435Z"
                  fill="black"
                ></path>
                <g id="Army_28">
                  <circle
                    id="armycircle_28"
                    cx="618"
                    cy="365"
                    r="5.5"
                    fill={getCircleFill("indonesia")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("indonesia")}
                  ></circle>
                  {getArmyNum("indonesia", "618", "365")}
                </g>
              </g>
            </g>
            <g id="china">
              <path
                id="china_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M631.728 208.849C630.728 209.349 631.603 209.349 631.603 209.974C631.603 210.599 632.478 210.224 632.478 211.099C632.478 211.974 632.728 211.849 633.228 212.099C633.728 212.349 633.353 212.849 633.353 214.224C633.353 215.599 633.478 214.849 634.478 215.099C635.478 215.349 634.978 215.474 635.228 216.974C635.478 218.474 636.228 217.474 636.728 217.474C637.228 217.474 637.228 217.724 637.603 218.474C637.978 219.224 637.603 218.974 636.353 219.724C635.103 220.474 637.603 220.599 638.978 220.974C640.353 221.349 639.853 222.974 639.603 224.349C639.353 225.724 640.228 225.474 641.103 226.974C641.978 228.474 641.228 229.349 640.228 231.724C639.228 234.099 640.728 233.349 641.853 233.474C642.978 233.599 642.728 236.849 641.978 238.474C641.228 240.099 642.103 239.974 642.103 242.099C642.103 244.224 641.728 244.599 641.478 246.224C641.228 247.849 641.103 247.599 640.478 248.599C639.853 249.599 640.228 250.599 640.228 252.224C640.228 253.849 638.603 253.849 637.478 254.099C636.353 254.349 636.853 254.224 636.978 255.349C637.103 256.474 636.478 256.724 635.478 257.724C634.478 258.724 634.978 257.974 634.353 259.599C633.728 261.224 634.228 260.474 632.853 261.724C631.478 262.974 631.478 263.599 631.478 263.599C631.478 263.599 631.478 264.724 631.228 265.974C630.978 267.224 630.103 266.224 629.603 266.099C629.103 265.974 628.228 266.724 627.853 267.474C627.478 268.224 625.978 268.599 624.728 269.849C623.478 271.099 624.853 270.099 625.228 270.974C625.603 271.849 624.353 272.474 623.728 272.974C623.103 273.474 622.603 274.724 621.603 275.349C620.603 275.974 619.808 273.268 618.199 272.827C618.464 272.761 616.643 270.704 617.258 270.397C617.873 270.089 616.336 268.706 616.336 268.706C616.336 268.706 616.336 267.86 615.875 267.86C615.413 267.86 615.413 267.707 615.26 267.246C615.106 266.784 614.568 266.707 614.568 266.707C614.568 266.707 613.723 266.631 613.723 266.093C613.723 265.555 613.723 265.401 613.723 264.632C613.723 263.864 613.415 263.095 613.031 263.095C612.647 263.095 611.186 262.941 611.186 262.941C611.186 262.941 610.571 261.788 610.187 261.712C609.803 261.635 609.034 261.481 608.727 261.712C608.419 261.942 607.727 262.48 607.651 262.941C607.574 263.403 606.498 264.325 606.498 264.325C606.498 264.325 606.882 264.863 606.037 265.017C605.191 265.17 603.27 265.093 602.885 265.17C602.501 265.247 601.809 266.707 601.809 267.169C601.809 267.63 602.117 268.936 601.118 269.09C600.118 269.244 598.351 269.013 597.813 268.398C597.275 267.784 595.814 265.708 595.046 265.785C594.277 265.862 592.817 263.864 592.894 263.556C592.97 263.249 593.508 263.095 592.586 262.557C591.664 262.019 591.433 262.25 591.126 261.327C590.818 260.405 590.665 258.945 590.28 258.637C589.896 258.33 589.512 258.176 588.743 257.792C587.975 257.407 587.667 256.485 587.129 256.331C586.591 256.178 586.437 256.255 586.13 256.793C585.823 257.331 585.131 258.484 585.131 258.484L583.901 259.406C583.901 259.406 583.517 258.868 582.825 259.79C582.825 259.79 580.289 252.796 579.904 252.412C579.52 252.027 570.143 251.874 570.066 252.181C569.989 252.489 568.913 253.949 568.452 253.949C567.991 253.949 566.761 252.642 566.761 252.642C566.761 252.642 567.146 249.03 566.838 248.646C566.531 248.261 563.918 247.262 563.61 247.416C563.303 247.569 562.688 249.568 562.227 249.568C561.766 249.568 558.537 247.8 558.23 246.57C557.923 245.341 558.845 245.341 557.461 245.264C556.078 245.187 557.154 246.647 555.079 246.186C553.004 245.725 552.773 245.417 552.466 245.11C552.158 244.803 551.236 243.65 550.16 243.65C549.084 243.65 546.932 242.497 546.778 242.112C546.624 241.728 546.24 241.267 545.932 240.883C545.625 240.498 545.625 239.192 545.164 238.808C544.703 238.423 543.089 239.73 542.704 239.807C542.32 239.884 541.013 239.346 541.244 238.577C541.475 237.808 541.859 236.809 542.32 236.579C542.781 236.348 543.704 235.579 543.78 235.041C543.857 234.503 544.165 234.273 544.318 233.043C544.472 231.813 543.78 228.969 543.627 228.047C543.473 227.125 543.473 224.281 543.473 224.281C543.473 224.281 543.55 223.205 543.55 222.898C543.55 222.59 543.78 221.898 543.78 221.898C543.78 221.898 542.397 222.283 542.09 222.36C541.782 222.436 538.708 222.436 538.4 222.436C538.093 222.436 536.402 221.514 536.325 221.207C536.248 220.899 536.095 219.132 535.941 218.824C535.787 218.517 535.71 217.441 535.403 217.748L534.019 219.746L534.096 219.9C532.175 220.899 531.099 220.515 531.016 220.349C531.016 219.48 531.342 219.154 531.342 218.175C531.342 217.197 530.472 214.48 530.472 214.48C530.472 214.48 529.711 213.284 529.059 213.067C528.407 212.849 527.429 211.762 527.429 211.762C527.429 211.762 526.668 209.697 526.668 208.828C526.668 207.958 527.103 204.371 527.646 204.262C528.19 204.154 529.711 203.175 530.581 203.175C531.45 203.175 532.863 203.284 533.298 202.958C533.733 202.632 534.494 198.501 534.929 197.414C535.363 196.328 535.581 195.458 536.342 195.567C537.103 195.675 538.516 195.567 538.407 193.719C538.298 191.871 538.081 188.284 537.32 187.088C536.559 185.893 536.016 185.675 536.45 184.588C536.885 183.501 537.429 183.175 537.429 183.175C537.34 182.999 537.211 181.654 537.157 181.545C537.755 181.98 538.298 181.545 539.494 181.328C540.69 181.11 540.037 180.241 540.146 179.806C540.255 179.371 540.037 178.501 539.711 177.849C539.385 177.197 539.711 177.197 540.037 176.654C540.363 176.11 541.885 175.132 541.994 174.588C542.103 174.045 542.211 170.784 542.211 170.784C542.211 170.784 545.363 170.349 546.016 170.023C546.668 169.697 546.016 165.458 546.016 165.458L548.546 165.253C548.392 165.945 548.699 166.022 549.314 166.175C549.929 166.329 550.16 166.713 550.698 167.789C551.236 168.865 551.851 168.174 553.465 168.481C555.079 168.789 556.232 166.944 556.923 166.713C557.615 166.483 557.692 167.559 558.614 168.404C559.537 169.25 559.537 169.711 560.305 169.865C561.074 170.018 561.381 171.017 561.842 171.94C562.304 172.862 561.919 173.631 561.842 174.476C561.766 175.322 560.92 175.552 560.228 176.859C559.537 178.165 560.92 177.704 561.612 177.858C562.304 178.012 562.227 178.78 562.995 179.241C563.764 179.703 563.918 178.78 564.84 178.089C565.762 177.397 565.378 179.088 565.916 179.395C566.454 179.703 567.299 180.241 567.837 180.01C567.837 180.01 568.971 181.916 569.59 182.093C570.209 182.27 570.739 188.545 570.739 188.545C570.739 188.545 571.711 187.927 571.976 188.722C572.241 189.518 572.595 190.843 572.595 190.843C572.595 190.843 573.921 191.639 573.921 192.081C573.921 192.523 573.832 193.583 574.186 193.76C574.54 193.937 575.954 194.556 575.954 194.556L576.307 195.882C576.307 195.882 576.484 197.031 577.014 197.119C577.545 197.207 577.81 197.031 578.517 197.384C579.224 197.738 579.401 197.826 580.02 197.826C580.638 197.826 580.904 197.738 580.904 198.268C580.904 198.798 580.815 199.682 581.169 199.771C581.522 199.859 582.406 199.947 582.406 199.947C582.406 199.947 582.671 200.478 583.025 200.831C583.378 201.185 584.439 201.273 584.616 201.627C584.793 201.98 584.881 202.599 584.969 202.953C585.058 203.306 584.704 204.102 586.03 204.19C587.356 204.278 595.046 203.129 595.046 203.129L595.576 204.013C595.576 204.013 596.106 204.544 596.725 204.72C597.344 204.897 598.493 204.455 599.465 204.897C600.437 205.339 601.233 205.604 601.675 205.604C602.117 205.604 603.001 205.604 603.001 205.604C603.001 205.604 603.266 206.842 603.708 206.93C604.15 207.018 605.917 206.311 605.917 206.311C605.917 206.311 606.271 205.781 606.801 205.869C607.332 205.958 607.42 204.72 608.392 204.632C609.365 204.544 609.895 204.544 610.248 204.544C610.602 204.544 612.723 203.483 612.812 204.367C612.9 205.251 612.989 205.781 613.43 206.311C613.872 206.842 615.11 207.195 615.552 207.195C615.994 207.195 616.966 206.577 617.585 206.223C618.203 205.869 618.469 205.516 619.264 205.693C620.06 205.869 620.855 206.4 621.209 206.577C621.562 206.753 621.739 206.753 622.8 207.107C623.86 207.46 625.275 207.372 625.275 207.372C625.275 207.372 627.838 207.637 628.81 207.902C630.489 209.14 631.197 209.051 631.728 208.849Z"
                className={getCountryClass("china")}
                fill={getFill("china")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_29">
                <path
                  id="China"
                  d="M589.678 216.164H588.744C588.727 216.043 588.693 215.936 588.64 215.842C588.587 215.747 588.52 215.666 588.438 215.599C588.355 215.533 588.26 215.482 588.152 215.446C588.046 215.411 587.93 215.393 587.805 215.393C587.579 215.393 587.382 215.449 587.215 215.561C587.047 215.672 586.917 215.834 586.825 216.047C586.732 216.259 586.686 216.516 586.686 216.818C586.686 217.129 586.732 217.391 586.825 217.602C586.918 217.814 587.049 217.974 587.217 218.082C587.384 218.19 587.578 218.244 587.798 218.244C587.922 218.244 588.036 218.227 588.141 218.195C588.248 218.162 588.342 218.114 588.425 218.052C588.507 217.988 588.575 217.911 588.629 217.82C588.685 217.729 588.723 217.625 588.744 217.509L589.678 217.513C589.653 217.713 589.593 217.906 589.497 218.092C589.401 218.277 589.273 218.442 589.111 218.589C588.95 218.734 588.759 218.849 588.536 218.934C588.314 219.018 588.063 219.06 587.783 219.06C587.394 219.06 587.046 218.972 586.739 218.795C586.434 218.619 586.193 218.364 586.015 218.031C585.839 217.697 585.751 217.293 585.751 216.818C585.751 216.342 585.84 215.938 586.019 215.604C586.198 215.27 586.441 215.016 586.748 214.841C587.055 214.665 587.4 214.577 587.783 214.577C588.036 214.577 588.271 214.612 588.487 214.683C588.704 214.754 588.896 214.858 589.064 214.994C589.232 215.129 589.368 215.295 589.473 215.491C589.58 215.687 589.648 215.911 589.678 216.164ZM591.23 217.108V219H590.322V214.636H591.204V216.305H591.243C591.316 216.112 591.436 215.96 591.601 215.851C591.765 215.74 591.972 215.685 592.221 215.685C592.448 215.685 592.646 215.734 592.815 215.834C592.986 215.932 593.118 216.073 593.211 216.258C593.307 216.441 593.353 216.661 593.352 216.916V219H592.444V217.078C592.446 216.876 592.395 216.719 592.291 216.607C592.189 216.495 592.045 216.439 591.861 216.439C591.737 216.439 591.628 216.465 591.532 216.518C591.439 216.57 591.365 216.647 591.311 216.748C591.258 216.847 591.231 216.967 591.23 217.108ZM594.066 219V215.727H594.974V219H594.066ZM594.522 215.305C594.387 215.305 594.272 215.261 594.175 215.171C594.08 215.08 594.032 214.972 594.032 214.845C594.032 214.72 594.08 214.613 594.175 214.523C594.272 214.433 594.387 214.387 594.522 214.387C594.657 214.387 594.772 214.433 594.867 214.523C594.964 214.613 595.012 214.72 595.012 214.845C595.012 214.972 594.964 215.08 594.867 215.171C594.772 215.261 594.657 215.305 594.522 215.305ZM596.609 217.108V219H595.701V215.727H596.566V216.305H596.604C596.677 216.114 596.798 215.964 596.969 215.853C597.139 215.741 597.346 215.685 597.589 215.685C597.816 215.685 598.014 215.734 598.183 215.834C598.352 215.933 598.484 216.075 598.578 216.26C598.671 216.443 598.718 216.662 598.718 216.916V219H597.81V217.078C597.812 216.878 597.761 216.722 597.657 216.609C597.553 216.496 597.411 216.439 597.229 216.439C597.107 216.439 596.999 216.465 596.905 216.518C596.813 216.57 596.74 216.647 596.688 216.748C596.636 216.847 596.61 216.967 596.609 217.108ZM600.367 219.062C600.158 219.062 599.972 219.026 599.809 218.953C599.645 218.879 599.516 218.771 599.421 218.627C599.327 218.482 599.28 218.302 599.28 218.086C599.28 217.904 599.313 217.751 599.38 217.628C599.447 217.504 599.538 217.405 599.653 217.33C599.768 217.254 599.899 217.197 600.045 217.159C600.193 217.121 600.348 217.094 600.509 217.078C600.7 217.058 600.853 217.04 600.97 217.023C601.086 217.004 601.171 216.977 601.223 216.942C601.276 216.906 601.302 216.854 601.302 216.784V216.771C601.302 216.636 601.259 216.532 601.174 216.458C601.09 216.384 600.971 216.347 600.816 216.347C600.653 216.347 600.523 216.384 600.426 216.456C600.33 216.527 600.266 216.616 600.235 216.724L599.395 216.656C599.438 216.457 599.522 216.286 599.647 216.141C599.772 215.994 599.933 215.882 600.13 215.804C600.329 215.724 600.559 215.685 600.821 215.685C601.002 215.685 601.176 215.706 601.343 215.749C601.51 215.791 601.659 215.857 601.788 215.947C601.919 216.036 602.022 216.151 602.097 216.292C602.172 216.431 602.21 216.598 602.21 216.793V219H601.349V218.546H601.323C601.271 218.648 601.201 218.739 601.112 218.817C601.024 218.893 600.919 218.954 600.795 218.998C600.671 219.04 600.529 219.062 600.367 219.062ZM600.627 218.435C600.76 218.435 600.878 218.409 600.98 218.357C601.083 218.303 601.163 218.23 601.221 218.139C601.279 218.048 601.309 217.945 601.309 217.83V217.483C601.28 217.501 601.241 217.518 601.191 217.534C601.143 217.548 601.088 217.562 601.027 217.575C600.966 217.586 600.905 217.597 600.844 217.607C600.783 217.615 600.728 217.623 600.678 217.63C600.571 217.646 600.478 217.67 600.399 217.705C600.319 217.739 600.257 217.785 600.213 217.843C600.169 217.9 600.147 217.971 600.147 218.056C600.147 218.18 600.192 218.274 600.282 218.339C600.372 218.403 600.487 218.435 600.627 218.435Z"
                  fill="black"
                ></path>
                <g id="Army_29">
                  <circle
                    id="armycircle_29"
                    cx="594"
                    cy="228"
                    r="5.5"
                    fill={getCircleFill("china")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("china")}
                  ></circle>
                  {getArmyNum("china", "594", "228")}
                </g>
              </g>
            </g>
            <g id="siam">
              <path
                id="siam_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M617.978 272.849C616.103 272.474 618.353 270.974 614.728 270.474C611.103 269.974 611.353 279.599 611.603 280.599C611.853 281.599 612.853 282.099 615.103 281.849C617.353 281.599 616.853 281.849 617.353 284.099C617.853 286.349 617.103 288.099 617.103 288.099C617.103 288.099 617.853 287.849 619.103 287.349C620.353 286.849 622.103 288.099 622.853 291.599C623.603 295.099 623.853 295.099 625.103 297.099C626.353 299.099 626.103 300.099 626.603 302.849C627.103 305.599 626.103 308.849 625.853 310.599C625.603 312.349 622.353 315.849 622.353 316.849C622.353 317.849 619.103 320.349 618.853 321.349C618.603 322.349 617.353 320.599 617.353 320.599C617.353 320.599 616.103 317.099 615.603 316.099C615.103 315.099 614.353 314.599 614.353 314.599L614.603 312.349C614.603 312.349 613.353 311.599 612.353 311.599C611.353 311.599 611.353 310.599 611.353 310.599L609.103 308.849C609.103 308.849 608.853 308.599 607.603 308.349C606.353 308.099 606.603 308.349 606.353 309.349C606.103 310.349 605.603 310.349 604.353 311.599C603.103 312.849 604.853 312.349 606.103 313.599C607.353 314.849 606.853 314.349 606.853 316.349C606.853 318.349 606.853 319.099 608.603 323.849C610.353 328.599 610.103 325.599 610.103 325.599C610.103 325.599 610.603 326.349 610.603 327.599C610.603 328.849 609.603 328.849 609.603 328.849C609.603 328.849 607.853 329.099 606.353 328.849C604.853 328.599 605.853 328.349 603.353 325.099C600.853 321.849 600.853 321.599 599.853 320.849C598.853 320.099 600.103 319.099 599.853 317.849C599.603 316.599 599.853 314.849 599.103 313.849C598.353 312.849 598.353 312.349 597.853 310.599C597.353 308.849 597.853 307.349 598.103 305.849C598.353 304.349 596.853 304.099 596.603 302.099C596.353 300.099 596.103 300.349 596.103 300.349C596.103 300.349 591.603 297.599 590.853 298.599C590.103 299.599 588.853 296.599 588.853 296.599C588.853 296.599 585.603 297.599 585.353 296.099C585.103 294.599 578.603 287.849 578.353 286.099C578.103 284.349 578.103 282.599 576.853 282.349C575.603 282.099 574.728 279.349 574.728 279.349L573.853 277.224C573.58 273.852 574.066 273.608 574.37 273.317C575.293 273.241 575.754 273.394 575.985 272.395C576.215 271.396 576.984 270.397 577.522 270.166C578.06 269.936 578.213 267.553 578.213 267.553L579.981 266.938C579.981 266.938 580.442 263.018 581.134 262.326C581.826 261.635 582.825 259.79 582.825 259.79C583.517 258.868 583.901 259.406 583.901 259.406L585.131 258.484C585.131 258.484 585.823 257.331 586.13 256.793C586.437 256.255 586.591 256.178 587.129 256.331C587.667 256.485 587.975 257.407 588.743 257.792C589.512 258.176 589.896 258.33 590.28 258.637C590.665 258.945 590.818 260.405 591.126 261.327C591.433 262.25 591.664 262.019 592.586 262.557C593.509 263.095 592.97 263.249 592.894 263.556C592.817 263.864 594.277 265.862 595.046 265.785C595.814 265.708 597.275 267.784 597.813 268.398C598.351 269.013 600.118 269.244 601.118 269.09C602.117 268.936 601.809 267.63 601.809 267.169C601.809 266.707 602.501 265.247 602.885 265.17C603.27 265.093 605.191 265.17 606.037 265.017C606.882 264.863 606.498 264.325 606.498 264.325C606.498 264.325 607.574 263.403 607.651 262.941C607.728 262.48 608.419 261.942 608.727 261.712C609.034 261.481 609.803 261.635 610.187 261.712C610.571 261.788 611.186 262.941 611.186 262.941C611.186 262.941 612.647 263.095 613.031 263.095C613.415 263.095 613.723 263.864 613.723 264.632C613.723 265.401 613.723 265.555 613.723 266.093C613.723 266.631 614.568 266.707 614.568 266.707C614.568 266.707 615.106 266.784 615.26 267.246C615.413 267.707 615.413 267.86 615.875 267.86C616.336 267.86 616.336 268.706 616.336 268.706C616.336 268.706 617.873 270.089 617.258 270.397C616.643 270.704 617.978 272.849 617.978 272.849Z"
                className={getCountryClass("siam")}
                fill={getFill("siam")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_30">
                <path
                  id="Siam"
                  d="M595.487 274.891C595.47 274.719 595.396 274.586 595.267 274.491C595.138 274.396 594.963 274.348 594.741 274.348C594.59 274.348 594.463 274.369 594.36 274.412C594.256 274.453 594.176 274.511 594.121 274.585C594.067 274.658 594.04 274.742 594.04 274.836C594.037 274.914 594.053 274.982 594.089 275.04C594.126 275.099 594.176 275.149 594.24 275.192C594.304 275.233 594.378 275.269 594.462 275.3C594.546 275.33 594.635 275.356 594.73 275.377L595.122 275.471C595.313 275.513 595.487 275.57 595.646 275.641C595.806 275.712 595.943 275.8 596.06 275.903C596.176 276.007 596.267 276.129 596.33 276.27C596.396 276.411 596.429 276.572 596.431 276.754C596.429 277.021 596.361 277.252 596.226 277.448C596.093 277.643 595.899 277.794 595.646 277.902C595.395 278.009 595.092 278.062 594.737 278.062C594.384 278.062 594.078 278.008 593.816 277.9C593.556 277.792 593.353 277.632 593.207 277.42C593.062 277.207 592.986 276.944 592.979 276.63H593.872C593.882 276.776 593.923 276.898 593.997 276.996C594.073 277.093 594.173 277.166 594.298 277.216C594.424 277.264 594.567 277.288 594.726 277.288C594.882 277.288 595.018 277.266 595.133 277.22C595.249 277.175 595.34 277.112 595.404 277.031C595.468 276.95 595.499 276.857 595.499 276.751C595.499 276.653 595.47 276.571 595.412 276.504C595.355 276.437 595.271 276.381 595.161 276.334C595.051 276.287 594.917 276.244 594.758 276.206L594.283 276.087C593.915 275.997 593.624 275.857 593.411 275.667C593.198 275.477 593.093 275.22 593.094 274.898C593.093 274.634 593.163 274.403 593.305 274.205C593.448 274.008 593.645 273.854 593.895 273.743C594.145 273.632 594.429 273.577 594.747 273.577C595.071 273.577 595.354 273.632 595.595 273.743C595.838 273.854 596.027 274.008 596.162 274.205C596.297 274.403 596.367 274.631 596.371 274.891H595.487ZM597.034 278V274.727H597.942V278H597.034ZM597.49 274.305C597.355 274.305 597.239 274.261 597.143 274.171C597.048 274.08 597 273.972 597 273.845C597 273.72 597.048 273.613 597.143 273.523C597.239 273.433 597.355 273.387 597.49 273.387C597.625 273.387 597.74 273.433 597.835 273.523C597.932 273.613 597.98 273.72 597.98 273.845C597.98 273.972 597.932 274.08 597.835 274.171C597.74 274.261 597.625 274.305 597.49 274.305ZM599.602 278.062C599.393 278.062 599.207 278.026 599.044 277.953C598.881 277.879 598.751 277.771 598.656 277.627C598.562 277.482 598.515 277.302 598.515 277.086C598.515 276.904 598.549 276.751 598.616 276.628C598.682 276.504 598.773 276.405 598.888 276.33C599.003 276.254 599.134 276.197 599.28 276.159C599.428 276.121 599.583 276.094 599.745 276.078C599.935 276.058 600.089 276.04 600.205 276.023C600.322 276.004 600.406 275.977 600.459 275.942C600.511 275.906 600.537 275.854 600.537 275.784V275.771C600.537 275.636 600.495 275.532 600.41 275.458C600.326 275.384 600.206 275.347 600.052 275.347C599.888 275.347 599.758 275.384 599.662 275.456C599.565 275.527 599.501 275.616 599.47 275.724L598.631 275.656C598.673 275.457 598.757 275.286 598.882 275.141C599.007 274.994 599.168 274.882 599.366 274.804C599.564 274.724 599.795 274.685 600.056 274.685C600.238 274.685 600.412 274.706 600.578 274.749C600.746 274.791 600.894 274.857 601.023 274.947C601.154 275.036 601.257 275.151 601.332 275.292C601.407 275.431 601.445 275.598 601.445 275.793V278H600.584V277.546H600.559C600.506 277.648 600.436 277.739 600.348 277.817C600.26 277.893 600.154 277.954 600.03 277.998C599.907 278.04 599.764 278.062 599.602 278.062ZM599.862 277.435C599.996 277.435 600.113 277.409 600.216 277.357C600.318 277.303 600.398 277.23 600.456 277.139C600.515 277.048 600.544 276.945 600.544 276.83V276.483C600.515 276.501 600.476 276.518 600.427 276.534C600.378 276.548 600.324 276.562 600.263 276.575C600.202 276.586 600.14 276.597 600.079 276.607C600.018 276.615 599.963 276.623 599.913 276.63C599.807 276.646 599.714 276.67 599.634 276.705C599.555 276.739 599.493 276.785 599.449 276.843C599.405 276.9 599.383 276.971 599.383 277.056C599.383 277.18 599.427 277.274 599.517 277.339C599.608 277.403 599.723 277.435 599.862 277.435ZM602.149 278V274.727H603.014V275.305H603.053C603.121 275.113 603.235 274.962 603.394 274.851C603.553 274.74 603.743 274.685 603.965 274.685C604.189 274.685 604.38 274.741 604.538 274.853C604.695 274.964 604.801 275.114 604.853 275.305H604.887C604.954 275.117 605.075 274.967 605.249 274.855C605.426 274.741 605.634 274.685 605.874 274.685C606.179 274.685 606.427 274.782 606.617 274.977C606.809 275.17 606.905 275.444 606.905 275.799V278H605.999V275.978C605.999 275.796 605.951 275.66 605.855 275.569C605.758 275.478 605.637 275.433 605.492 275.433C605.328 275.433 605.199 275.485 605.107 275.59C605.014 275.694 604.968 275.831 604.968 276.001V278H604.088V275.959C604.088 275.798 604.042 275.67 603.95 275.575C603.859 275.48 603.739 275.433 603.59 275.433C603.489 275.433 603.398 275.458 603.317 275.509C603.237 275.559 603.174 275.629 603.127 275.72C603.08 275.81 603.057 275.915 603.057 276.036V278H602.149Z"
                  fill="black"
                ></path>
                <g id="Army_30">
                  <circle
                    id="armycircle_30"
                    cx="600"
                    cy="287"
                    r="5.5"
                    fill={getCircleFill("siam")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("siam")}
                  ></circle>
                  {getArmyNum("siam", "600", "287")}
                </g>
              </g>
            </g>
            <g id="gb">
              <path
                id="great_britain"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M296.116 179.088C296.116 179.088 295.763 179.618 294.349 179.618C292.934 179.618 292.758 179.441 291.874 179.972C290.99 180.502 289.929 180.679 289.045 180.855C288.161 181.032 287.101 182.093 287.101 182.093C287.101 182.093 287.101 182.8 285.863 183.154C284.626 183.507 284.803 183.33 283.565 183.33C282.328 183.33 282.681 182.27 282.504 181.563C282.504 181.563 278.353 181.974 279.603 181.224C280.853 180.474 281.853 180.974 280.978 180.349C280.103 179.724 278.728 179.599 280.228 179.349C281.728 179.099 282.103 179.349 282.103 178.849C282.103 178.349 281.103 179.474 282.103 177.849C283.103 176.224 283.353 176.224 283.978 175.724C284.603 175.224 284.228 173.724 285.103 173.974C285.978 174.224 286.978 174.474 286.978 174.474L287.478 173.474C287.478 173.474 284.353 173.349 284.103 172.849C284.103 172.849 282.478 171.724 281.978 171.724C281.478 171.724 280.353 171.849 280.728 171.349C281.103 170.849 281.853 169.349 281.853 169.349C281.853 169.349 280.228 168.099 280.853 167.599C281.478 167.099 281.603 167.224 281.603 166.349C281.603 165.474 280.478 165.349 281.728 164.099C282.978 162.849 283.228 163.099 284.103 162.349C284.978 161.599 284.978 161.474 285.603 162.099C286.228 162.724 286.228 163.724 287.353 162.349C288.478 160.974 288.603 160.224 288.603 160.224C288.603 160.224 288.103 160.349 289.978 159.349C291.853 158.349 290.353 157.474 293.103 157.849C295.853 158.224 295.353 158.349 295.978 158.224C296.603 158.099 296.978 156.474 297.353 157.849C297.728 159.224 296.853 159.474 298.603 159.974C300.353 160.474 301.103 160.224 300.603 161.099C300.103 161.974 299.978 161.849 300.478 162.599C300.978 163.349 301.353 163.724 301.353 164.349C301.353 164.974 300.978 165.474 300.103 165.849C299.228 166.224 299.353 165.724 298.228 166.849C297.103 167.974 296.478 167.724 296.478 167.724C296.478 167.724 296.228 167.099 295.478 167.599C294.728 168.099 295.103 168.849 293.978 168.099C292.853 167.349 291.478 167.349 291.478 167.349C291.478 167.349 290.978 167.349 291.103 168.099C291.228 168.849 291.853 171.349 291.853 171.349C291.853 171.349 292.978 173.349 292.603 174.224C292.228 175.099 290.353 175.599 291.978 175.724C293.603 175.849 293.478 175.474 293.478 176.599C293.478 177.724 293.478 178.349 294.478 178.224C295.478 178.099 296.228 179.224 296.116 179.088ZM308.314 168.128C307.784 167.509 308.049 167.597 307.872 166.979C307.695 166.36 307.96 166.271 307.96 165.653C307.96 165.034 308.049 164.769 308.314 163.973C308.579 163.178 306.9 162.471 306.9 161.852C306.9 161.233 305.839 160.438 305.662 160.084C305.485 159.731 304.955 159.289 304.336 159.377C303.718 159.466 303.718 159.819 303.011 160.173C302.303 160.526 302.303 159.996 301.773 159.554C301.243 159.112 301.331 158.582 301.331 157.609C301.331 156.637 301.42 157.079 301.773 156.637C302.127 156.195 302.215 156.284 302.745 155.665C303.276 155.046 303.011 155.223 303.011 154.604C303.011 153.985 303.011 153.455 302.745 152.748C302.48 152.041 301.773 152.571 301.508 151.864C301.243 151.157 301.154 151.334 300.712 151.069C300.271 150.803 300.094 150.98 299.121 150.892C298.149 150.803 298.856 150.273 298.768 149.92C298.68 149.566 298.68 149.389 298.503 148.417C298.326 147.445 297.884 148.152 297.354 148.24C296.823 148.329 296.647 148.329 296.47 147.445C296.293 146.561 296.47 146.914 296.381 146.472C296.293 146.03 296.205 146.03 295.586 145.058C294.967 144.086 295.674 144.616 296.381 144.086C297.089 143.556 297 143.29 297.619 142.849C298.238 142.407 297.619 142.23 297.442 141.523C297.265 140.816 296.912 140.639 296.912 140.639C296.912 140.639 296.293 140.816 295.232 140.816C294.172 140.816 294.26 140.639 293.73 139.932C293.199 139.225 293.818 139.225 294.614 138.606C295.409 137.987 295.144 137.634 295.94 136.75C296.735 135.866 297.177 135.954 298.149 135.777C299.122 135.601 298.68 135.07 299.121 134.01C299.563 132.949 299.74 132.772 300.005 132.154C300.271 131.535 300.801 130.739 300.978 129.59C301.154 128.441 302.603 130.349 305.603 129.349C308.603 128.349 308.603 129.349 308.603 129.349C308.603 129.349 310.103 131.849 307.603 132.849C305.103 133.849 306.603 137.849 306.603 137.849L307.342 137.899C307.342 137.899 308.226 137.192 308.933 137.103C309.64 137.015 309.551 137.457 310.435 137.457C311.319 137.457 311.142 136.926 312.203 136.219C313.264 135.512 312.998 137.015 312.998 137.634C312.998 138.252 314.413 140.02 314.413 140.02L314.059 140.639C314.059 140.639 313.44 140.992 313.44 141.965C313.44 142.937 313.175 142.672 312.998 143.114C312.822 143.556 312.468 143.556 312.026 143.821C311.584 144.086 312.115 144.263 312.291 145.147C312.468 146.03 312.203 145.589 311.761 145.677C311.319 145.765 310.877 145.765 310.524 146.384C310.17 147.003 310.435 147.091 309.905 147.798C309.375 148.505 309.463 148.24 308.314 148.594C307.165 148.947 307.695 148.947 307.96 150.273C308.225 151.599 309.109 149.831 310.7 149.654C312.291 149.478 311.938 149.654 312.998 149.654C314.059 149.654 313.617 149.743 314.324 150.273C315.031 150.803 314.501 151.069 314.855 151.687C315.208 152.306 315.562 151.953 316.004 152.571C316.446 153.19 316.004 153.809 316.004 154.693C316.004 155.576 316.004 155.488 316.004 155.488C316.004 155.488 317.064 158.67 318.479 159.466C319.893 160.261 319.362 160.261 319.981 160.791C320.6 161.322 321.749 164.238 322.102 164.68C322.456 165.122 322.456 165.476 322.633 167.067C322.81 168.658 322.633 168.304 322.456 168.923C322.279 169.542 322.191 169.453 321.926 170.426C321.661 171.398 321.926 171.575 321.926 171.928C321.926 172.282 322.456 172.547 324.224 171.663C325.992 170.779 325.284 171.044 326.434 170.691C327.583 170.337 327.317 170.249 328.378 170.514C329.439 170.779 329.262 170.956 330.234 171.928C331.206 172.901 330.588 173.077 330.853 173.784C331.118 174.492 330.765 174.403 330.499 175.11C330.234 175.817 330.234 175.729 329.792 176.613C329.35 177.497 329.615 177.32 329.262 177.85C328.908 178.381 328.643 178.115 327.583 178.381C326.522 178.646 326.699 179.264 326.168 179.795C325.638 180.325 325.815 180.502 325.726 180.944C325.638 181.386 326.168 182.181 326.168 182.181C326.168 182.181 326.964 182.535 327.406 182.977C327.848 183.419 327.671 183.772 327.141 184.656C326.61 185.54 326.433 185.098 325.373 185.54C324.312 185.982 323.959 185.54 322.898 185.452C321.837 185.363 321.926 185.805 320.423 186.336C318.92 186.866 319.009 186.424 317.86 186.336C316.711 186.247 316.799 186.247 315.65 186.336C314.501 186.424 314.589 186.778 313.264 187.573C311.938 188.369 312.468 187.573 312.026 187.219C311.584 186.866 311.319 186.778 310.7 186.159C310.082 185.54 310.082 185.805 309.551 185.982C309.021 186.159 307.872 188.192 307.076 188.545C306.281 188.899 306.193 188.722 305.044 188.722C303.894 188.722 304.248 188.722 303.718 188.81C303.187 188.899 302.834 189.783 302.127 190.578C301.42 191.374 301.596 190.843 300.271 191.02C298.945 191.197 299.033 190.932 298.856 190.578C298.68 190.225 299.033 190.225 299.475 189.606C299.917 188.987 300.713 187.838 301.243 186.954C301.773 186.07 302.038 186.512 303.364 185.717C304.69 184.921 303.629 185.363 304.248 184.037C304.867 182.712 304.955 182.712 306.281 182.27C306.281 182.27 306.853 181.099 305.728 180.474C304.603 179.849 304.103 180.099 302.978 179.599C301.853 179.099 300.978 179.349 301.228 178.662C302.353 177.349 302.603 176.724 302.978 176.099C303.353 175.474 303.103 174.849 303.603 174.849C304.103 174.849 304.353 175.099 304.978 174.724C305.603 174.349 305.728 174.099 305.728 173.349C305.728 172.599 305.603 172.349 305.853 171.599C306.103 170.849 306.853 170.224 306.228 169.724C305.603 169.224 306.103 169.349 305.353 169.099C304.603 168.849 304.103 168.349 304.103 168.349L304.353 167.349L304.54 165.599C304.54 165.599 304.728 165.724 305.978 166.224C307.228 166.724 307.978 168.349 307.978 168.349C308.243 168.822 308.629 168.809 308.314 168.128Z"
                className={getCountryClass("gb")}
                fill={getFill("gb")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_31">
                <path
                  id="Great Britain"
                  d="M316.327 156.047C316.298 155.943 316.256 155.852 316.202 155.772C316.148 155.691 316.082 155.623 316.004 155.567C315.927 155.511 315.839 155.467 315.739 155.438C315.641 155.408 315.533 155.393 315.413 155.393C315.19 155.393 314.994 155.448 314.825 155.559C314.658 155.67 314.527 155.831 314.433 156.043C314.339 156.253 314.293 156.51 314.293 156.814C314.293 157.118 314.339 157.376 314.431 157.589C314.523 157.803 314.654 157.965 314.823 158.077C314.992 158.188 315.192 158.244 315.422 158.244C315.631 158.244 315.809 158.207 315.957 158.133C316.106 158.058 316.219 157.952 316.298 157.815C316.377 157.679 316.417 157.518 316.417 157.332L316.604 157.359H315.479V156.665H317.305V157.214C317.305 157.598 317.224 157.928 317.062 158.203C316.901 158.477 316.678 158.689 316.393 158.838C316.109 158.986 315.784 159.06 315.418 159.06C315.009 159.06 314.649 158.969 314.339 158.789C314.03 158.607 313.788 158.349 313.615 158.016C313.443 157.68 313.357 157.283 313.357 156.822C313.357 156.469 313.408 156.153 313.511 155.876C313.614 155.598 313.759 155.362 313.945 155.169C314.131 154.976 314.348 154.829 314.595 154.728C314.842 154.627 315.11 154.577 315.398 154.577C315.646 154.577 315.876 154.613 316.089 154.685C316.302 154.756 316.491 154.857 316.656 154.988C316.822 155.119 316.957 155.274 317.062 155.455C317.168 155.634 317.235 155.831 317.265 156.047H316.327ZM317.981 159V155.727H318.861V156.298H318.895C318.955 156.095 319.055 155.942 319.196 155.838C319.336 155.733 319.498 155.68 319.682 155.68C319.727 155.68 319.776 155.683 319.829 155.689C319.881 155.695 319.927 155.702 319.967 155.712V156.518C319.925 156.505 319.866 156.494 319.79 156.484C319.715 156.474 319.646 156.469 319.584 156.469C319.45 156.469 319.331 156.498 319.226 156.556C319.122 156.613 319.04 156.692 318.979 156.795C318.919 156.897 318.889 157.015 318.889 157.148V159H317.981ZM321.776 159.064C321.439 159.064 321.149 158.996 320.906 158.859C320.665 158.722 320.479 158.527 320.348 158.276C320.217 158.023 320.152 157.724 320.152 157.379C320.152 157.042 320.217 156.746 320.348 156.492C320.479 156.238 320.663 156.04 320.9 155.898C321.138 155.756 321.418 155.685 321.739 155.685C321.955 155.685 322.156 155.719 322.342 155.789C322.53 155.857 322.693 155.96 322.832 156.098C322.973 156.236 323.082 156.409 323.161 156.618C323.239 156.825 323.278 157.068 323.278 157.347V157.596H320.514V157.033H322.423C322.423 156.903 322.395 156.787 322.338 156.686C322.281 156.585 322.202 156.506 322.102 156.45C322.002 156.391 321.886 156.362 321.754 156.362C321.616 156.362 321.494 156.394 321.388 156.458C321.283 156.521 321.2 156.605 321.141 156.712C321.081 156.817 321.05 156.934 321.049 157.063V157.598C321.049 157.76 321.079 157.9 321.138 158.018C321.2 158.136 321.286 158.227 321.396 158.29C321.507 158.354 321.638 158.386 321.79 158.386C321.891 158.386 321.984 158.372 322.067 158.344C322.151 158.315 322.223 158.273 322.283 158.216C322.342 158.159 322.388 158.089 322.419 158.007L323.259 158.062C323.216 158.264 323.129 158.44 322.996 158.591C322.866 158.74 322.697 158.857 322.489 158.94C322.283 159.023 322.045 159.064 321.776 159.064ZM324.803 159.062C324.594 159.062 324.408 159.026 324.245 158.953C324.082 158.879 323.952 158.771 323.857 158.627C323.763 158.482 323.717 158.302 323.717 158.086C323.717 157.904 323.75 157.751 323.817 157.628C323.884 157.504 323.974 157.405 324.089 157.33C324.205 157.254 324.335 157.197 324.482 157.159C324.629 157.121 324.784 157.094 324.946 157.078C325.136 157.058 325.29 157.04 325.406 157.023C325.523 157.004 325.607 156.977 325.66 156.942C325.712 156.906 325.739 156.854 325.739 156.784V156.771C325.739 156.636 325.696 156.532 325.611 156.458C325.527 156.384 325.408 156.347 325.253 156.347C325.089 156.347 324.96 156.384 324.863 156.456C324.766 156.527 324.702 156.616 324.671 156.724L323.832 156.656C323.874 156.457 323.958 156.286 324.083 156.141C324.208 155.994 324.369 155.882 324.567 155.804C324.766 155.724 324.996 155.685 325.257 155.685C325.439 155.685 325.613 155.706 325.779 155.749C325.947 155.791 326.095 155.857 326.224 155.947C326.355 156.036 326.458 156.151 326.533 156.292C326.609 156.431 326.646 156.598 326.646 156.793V159H325.786V158.546H325.76C325.707 158.648 325.637 158.739 325.549 158.817C325.461 158.893 325.355 158.954 325.232 158.998C325.108 159.04 324.965 159.062 324.803 159.062ZM325.063 158.435C325.197 158.435 325.315 158.409 325.417 158.357C325.519 158.303 325.599 158.23 325.658 158.139C325.716 158.048 325.745 157.945 325.745 157.83V157.483C325.717 157.501 325.678 157.518 325.628 157.534C325.58 157.548 325.525 157.562 325.464 157.575C325.403 157.586 325.342 157.597 325.281 157.607C325.219 157.615 325.164 157.623 325.114 157.63C325.008 157.646 324.915 157.67 324.835 157.705C324.756 157.739 324.694 157.785 324.65 157.843C324.606 157.9 324.584 157.971 324.584 158.056C324.584 158.18 324.629 158.274 324.718 158.339C324.809 158.403 324.924 158.435 325.063 158.435ZM329.091 155.727V156.409H327.12V155.727H329.091ZM327.568 154.943H328.475V157.994C328.475 158.078 328.488 158.143 328.514 158.19C328.539 158.236 328.575 158.268 328.62 158.286C328.667 158.305 328.721 158.314 328.782 158.314C328.825 158.314 328.868 158.31 328.91 158.303C328.953 158.295 328.985 158.288 329.008 158.284L329.151 158.96C329.105 158.974 329.042 158.99 328.959 159.009C328.877 159.028 328.777 159.04 328.659 159.045C328.44 159.053 328.248 159.024 328.083 158.957C327.92 158.891 327.793 158.787 327.702 158.646C327.611 158.506 327.566 158.328 327.568 158.114V154.943ZM331.088 159V154.636H332.835C333.156 154.636 333.424 154.684 333.639 154.779C333.853 154.874 334.014 155.006 334.122 155.175C334.23 155.343 334.284 155.536 334.284 155.755C334.284 155.925 334.25 156.075 334.182 156.205C334.114 156.332 334.02 156.437 333.901 156.52C333.783 156.601 333.648 156.658 333.496 156.692V156.735C333.662 156.742 333.818 156.789 333.963 156.876C334.109 156.962 334.227 157.084 334.318 157.24C334.409 157.395 334.455 157.58 334.455 157.794C334.455 158.026 334.397 158.232 334.282 158.414C334.169 158.594 334 158.737 333.777 158.842C333.554 158.947 333.279 159 332.953 159H331.088ZM332.011 158.246H332.763C333.02 158.246 333.208 158.197 333.325 158.099C333.443 157.999 333.502 157.867 333.502 157.702C333.502 157.582 333.473 157.475 333.415 157.383C333.357 157.29 333.274 157.218 333.166 157.165C333.059 157.113 332.932 157.087 332.784 157.087H332.011V158.246ZM332.011 156.462H332.695C332.821 156.462 332.933 156.44 333.031 156.396C333.131 156.351 333.209 156.287 333.266 156.205C333.324 156.122 333.353 156.023 333.353 155.908C333.353 155.751 333.297 155.624 333.185 155.527C333.074 155.43 332.916 155.382 332.712 155.382H332.011V156.462ZM335.038 159V155.727H335.918V156.298H335.952C336.012 156.095 336.112 155.942 336.252 155.838C336.393 155.733 336.555 155.68 336.738 155.68C336.784 155.68 336.833 155.683 336.885 155.689C336.938 155.695 336.984 155.702 337.024 155.712V156.518C336.981 156.505 336.922 156.494 336.847 156.484C336.772 156.474 336.703 156.469 336.64 156.469C336.507 156.469 336.387 156.498 336.282 156.556C336.179 156.613 336.096 156.692 336.035 156.795C335.975 156.897 335.946 157.015 335.946 157.148V159H335.038ZM337.493 159V155.727H338.401V159H337.493ZM337.949 155.305C337.814 155.305 337.698 155.261 337.602 155.171C337.507 155.08 337.459 154.972 337.459 154.845C337.459 154.72 337.507 154.613 337.602 154.523C337.698 154.433 337.814 154.387 337.949 154.387C338.084 154.387 338.199 154.433 338.294 154.523C338.391 154.613 338.439 154.72 338.439 154.845C338.439 154.972 338.391 155.08 338.294 155.171C338.199 155.261 338.084 155.305 337.949 155.305ZM340.869 155.727V156.409H338.898V155.727H340.869ZM339.345 154.943H340.253V157.994C340.253 158.078 340.266 158.143 340.291 158.19C340.317 158.236 340.352 158.268 340.398 158.286C340.445 158.305 340.499 158.314 340.56 158.314C340.602 158.314 340.645 158.31 340.688 158.303C340.73 158.295 340.763 158.288 340.786 158.284L340.928 158.96C340.883 158.974 340.819 158.99 340.737 159.009C340.654 159.028 340.554 159.04 340.436 159.045C340.217 159.053 340.026 159.024 339.861 158.957C339.697 158.891 339.57 158.787 339.479 158.646C339.388 158.506 339.344 158.328 339.345 158.114V154.943ZM342.393 159.062C342.184 159.062 341.998 159.026 341.835 158.953C341.672 158.879 341.542 158.771 341.447 158.627C341.353 158.482 341.306 158.302 341.306 158.086C341.306 157.904 341.34 157.751 341.407 157.628C341.473 157.504 341.564 157.405 341.679 157.33C341.794 157.254 341.925 157.197 342.071 157.159C342.219 157.121 342.374 157.094 342.536 157.078C342.726 157.058 342.88 157.04 342.996 157.023C343.113 157.004 343.197 156.977 343.25 156.942C343.302 156.906 343.328 156.854 343.328 156.784V156.771C343.328 156.636 343.286 156.532 343.201 156.458C343.117 156.384 342.998 156.347 342.843 156.347C342.679 156.347 342.549 156.384 342.453 156.456C342.356 156.527 342.292 156.616 342.261 156.724L341.422 156.656C341.464 156.457 341.548 156.286 341.673 156.141C341.798 155.994 341.959 155.882 342.157 155.804C342.355 155.724 342.586 155.685 342.847 155.685C343.029 155.685 343.203 155.706 343.369 155.749C343.537 155.791 343.685 155.857 343.814 155.947C343.945 156.036 344.048 156.151 344.123 156.292C344.199 156.431 344.236 156.598 344.236 156.793V159H343.375V158.546H343.35C343.297 158.648 343.227 158.739 343.139 158.817C343.051 158.893 342.945 158.954 342.821 158.998C342.698 159.04 342.555 159.062 342.393 159.062ZM342.653 158.435C342.787 158.435 342.904 158.409 343.007 158.357C343.109 158.303 343.189 158.23 343.248 158.139C343.306 158.048 343.335 157.945 343.335 157.83V157.483C343.306 157.501 343.267 157.518 343.218 157.534C343.169 157.548 343.115 157.562 343.054 157.575C342.993 157.586 342.931 157.597 342.87 157.607C342.809 157.615 342.754 157.623 342.704 157.63C342.598 157.646 342.505 157.67 342.425 157.705C342.346 157.739 342.284 157.785 342.24 157.843C342.196 157.9 342.174 157.971 342.174 158.056C342.174 158.18 342.218 158.274 342.308 158.339C342.399 158.403 342.514 158.435 342.653 158.435ZM344.94 159V155.727H345.848V159H344.94ZM345.396 155.305C345.261 155.305 345.146 155.261 345.049 155.171C344.954 155.08 344.906 154.972 344.906 154.845C344.906 154.72 344.954 154.613 345.049 154.523C345.146 154.433 345.261 154.387 345.396 154.387C345.531 154.387 345.646 154.433 345.741 154.523C345.838 154.613 345.886 154.72 345.886 154.845C345.886 154.972 345.838 155.08 345.741 155.171C345.646 155.261 345.531 155.305 345.396 155.305ZM347.483 157.108V159H346.575V155.727H347.44V156.305H347.479C347.551 156.114 347.672 155.964 347.843 155.853C348.013 155.741 348.22 155.685 348.463 155.685C348.69 155.685 348.888 155.734 349.057 155.834C349.226 155.933 349.358 156.075 349.452 156.26C349.545 156.443 349.592 156.662 349.592 156.916V159H348.684V157.078C348.686 156.878 348.635 156.722 348.531 156.609C348.427 156.496 348.285 156.439 348.103 156.439C347.981 156.439 347.873 156.465 347.779 156.518C347.687 156.57 347.614 156.647 347.562 156.748C347.51 156.847 347.484 156.967 347.483 157.108Z"
                  fill="black"
                ></path>
                <g id="Army_31">
                  <circle
                    id="armycircle_31"
                    cx="317"
                    cy="171"
                    r="5.5"
                    fill={getCircleFill("gb")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("gb")}
                  ></circle>
                  {getArmyNum("gb", "317", "171")}
                </g>
              </g>
            </g>
            <g id="iceland">
              <path
                id="iceland_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M303.603 97.3493C303.603 97.3493 305.603 99.2243 306.103 98.2243C306.603 97.2243 305.478 95.9743 306.978 97.0993C308.478 98.2243 308.353 97.8493 308.853 98.4743C309.353 99.0993 312.353 96.9743 311.228 98.9743C310.103 100.974 309.353 101.724 310.103 101.599C310.853 101.474 309.978 100.849 310.978 102.099C311.978 103.349 311.853 104.349 313.228 103.224L314.478 99.3493C314.478 99.3493 317.978 99.4743 317.728 100.724C317.478 101.974 316.603 101.849 318.478 100.849C320.353 99.8493 319.353 98.0993 320.603 99.2243C321.853 100.349 322.478 101.474 322.978 100.349C323.478 99.2243 321.853 97.9743 323.353 98.2243C324.853 98.4743 324.978 99.8493 325.853 98.2243C326.728 96.5993 325.728 95.7243 327.103 95.9743C328.478 96.2243 327.853 96.5993 328.853 95.7243C329.853 94.8493 329.603 93.9743 330.603 94.8493C331.603 95.7243 331.603 96.0993 331.603 96.0993C331.603 96.0993 333.603 96.3493 334.103 96.5993C334.603 96.8493 333.853 95.5993 334.353 97.5993C334.853 99.5993 334.978 100.224 335.603 99.9743C336.228 99.7243 336.603 98.8493 336.603 100.474C336.603 102.099 335.478 102.599 336.978 102.349C338.478 102.099 338.853 101.974 338.978 103.099C339.103 104.224 339.728 105.099 339.728 105.099C339.728 105.099 339.853 105.974 339.728 106.474C339.603 106.974 339.353 107.224 339.603 107.849C339.853 108.474 340.103 109.474 339.603 109.724C339.103 109.974 338.353 110.474 337.478 110.599C336.603 110.724 336.103 111.349 335.853 111.974C335.603 112.599 336.603 112.224 335.478 113.599C334.353 114.974 334.728 115.224 333.978 115.474C333.228 115.724 332.353 116.224 332.353 116.224L328.978 116.724L328.228 115.349C328.228 115.349 327.728 114.224 327.228 114.724C326.728 115.224 327.353 116.224 326.853 116.349C326.353 116.474 325.103 114.224 325.103 115.224C325.103 116.224 325.728 117.974 325.728 117.974C325.728 117.974 325.853 119.474 325.228 119.724C324.603 119.974 324.603 120.724 322.978 120.849C321.353 120.974 321.228 121.724 320.353 121.849C319.478 121.974 319.228 123.724 317.603 122.474C315.978 121.224 311.478 119.224 310.603 119.474C309.728 119.724 309.353 120.099 307.603 119.599C305.853 119.099 305.103 120.224 304.728 119.474C304.353 118.724 304.228 119.849 304.603 118.099C304.978 116.349 306.603 115.474 306.603 115.474C306.603 115.474 307.228 115.099 307.103 114.474C306.978 113.849 307.103 113.599 306.353 113.474C305.603 113.349 305.853 112.974 305.478 111.974C305.103 110.974 304.728 111.099 303.728 111.349C302.728 111.599 302.478 112.724 301.353 111.474C300.228 110.224 299.728 110.474 300.228 109.724C300.728 108.974 300.603 108.724 301.853 108.474C303.103 108.224 303.228 109.474 303.728 107.974C304.228 106.474 304.728 105.849 304.728 105.849C304.728 105.849 304.228 105.599 303.353 105.724C302.478 105.849 302.728 106.849 301.728 104.849C300.728 102.849 299.603 102.849 299.603 102.849C299.603 102.849 299.353 102.849 299.978 101.849C300.603 100.849 301.228 100.849 301.853 99.8493C302.478 98.8493 301.353 97.9743 302.228 97.0993C303.103 96.2243 303.353 96.8493 303.353 96.8493L303.603 97.3493Z"
                className={getCountryClass("iceland")}
                fill={getFill("iceland")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_32">
                <path
                  id="Iceland"
                  d="M313.576 98.6364V103H312.654V98.6364H313.576ZM315.797 103.064C315.462 103.064 315.173 102.993 314.932 102.851C314.692 102.707 314.507 102.509 314.378 102.254C314.25 102 314.186 101.707 314.186 101.376C314.186 101.041 314.251 100.747 314.38 100.494C314.511 100.24 314.696 100.042 314.936 99.8999C315.176 99.7564 315.462 99.6847 315.793 99.6847C316.078 99.6847 316.328 99.7365 316.543 99.8402C316.757 99.9439 316.927 100.089 317.052 100.277C317.177 100.464 317.246 100.685 317.259 100.938H316.402C316.378 100.774 316.314 100.643 316.21 100.543C316.108 100.442 315.974 100.392 315.808 100.392C315.667 100.392 315.544 100.43 315.439 100.507C315.335 100.582 315.254 100.692 315.196 100.837C315.138 100.982 315.109 101.158 315.109 101.364C315.109 101.572 315.137 101.75 315.194 101.896C315.252 102.043 315.334 102.154 315.439 102.231C315.544 102.308 315.667 102.346 315.808 102.346C315.911 102.346 316.004 102.325 316.087 102.282C316.171 102.239 316.239 102.178 316.293 102.097C316.349 102.014 316.385 101.915 316.402 101.8H317.259C317.244 102.05 317.176 102.271 317.054 102.461C316.933 102.65 316.766 102.798 316.553 102.904C316.34 103.011 316.088 103.064 315.797 103.064ZM319.331 103.064C318.995 103.064 318.705 102.996 318.462 102.859C318.22 102.722 318.034 102.527 317.904 102.276C317.773 102.023 317.708 101.724 317.708 101.379C317.708 101.042 317.773 100.746 317.904 100.492C318.034 100.238 318.218 100.04 318.456 99.8977C318.694 99.7557 318.974 99.6847 319.295 99.6847C319.511 99.6847 319.712 99.7195 319.898 99.7891C320.085 99.8572 320.249 99.9602 320.388 100.098C320.529 100.236 320.638 100.409 320.716 100.618C320.794 100.825 320.833 101.068 320.833 101.347V101.596H318.07V101.033H319.979C319.979 100.903 319.951 100.787 319.894 100.686C319.837 100.585 319.758 100.506 319.657 100.45C319.558 100.391 319.442 100.362 319.31 100.362C319.172 100.362 319.05 100.394 318.943 100.458C318.838 100.521 318.756 100.605 318.696 100.712C318.637 100.817 318.606 100.934 318.605 101.063V101.598C318.605 101.76 318.634 101.9 318.694 102.018C318.755 102.136 318.841 102.227 318.952 102.29C319.063 102.354 319.194 102.386 319.346 102.386C319.447 102.386 319.539 102.372 319.623 102.344C319.707 102.315 319.779 102.273 319.838 102.216C319.898 102.159 319.943 102.089 319.975 102.007L320.814 102.062C320.772 102.264 320.684 102.44 320.552 102.591C320.421 102.74 320.252 102.857 320.045 102.94C319.839 103.023 319.601 103.064 319.331 103.064ZM322.333 98.6364V103H321.426V98.6364H322.333ZM323.994 103.062C323.785 103.062 323.599 103.026 323.435 102.953C323.272 102.879 323.143 102.771 323.048 102.627C322.954 102.482 322.907 102.302 322.907 102.086C322.907 101.904 322.94 101.751 323.007 101.628C323.074 101.504 323.165 101.405 323.28 101.33C323.395 101.254 323.526 101.197 323.672 101.159C323.82 101.121 323.975 101.094 324.136 101.078C324.327 101.058 324.48 101.04 324.597 101.023C324.713 101.004 324.798 100.977 324.85 100.942C324.903 100.906 324.929 100.854 324.929 100.784V100.771C324.929 100.636 324.886 100.532 324.801 100.458C324.717 100.384 324.598 100.347 324.443 100.347C324.28 100.347 324.15 100.384 324.053 100.456C323.957 100.527 323.893 100.616 323.862 100.724L323.022 100.656C323.065 100.457 323.149 100.286 323.274 100.141C323.399 99.9943 323.56 99.8821 323.757 99.804C323.956 99.7244 324.186 99.6847 324.448 99.6847C324.629 99.6847 324.803 99.706 324.97 99.7486C325.137 99.7912 325.286 99.8572 325.415 99.9467C325.546 100.036 325.649 100.151 325.724 100.292C325.799 100.431 325.837 100.598 325.837 100.793V103H324.976V102.546H324.95C324.898 102.648 324.828 102.739 324.739 102.817C324.651 102.893 324.546 102.954 324.422 102.998C324.298 103.04 324.156 103.062 323.994 103.062ZM324.254 102.435C324.387 102.435 324.505 102.409 324.607 102.357C324.71 102.303 324.79 102.23 324.848 102.139C324.906 102.048 324.935 101.945 324.935 101.83V101.483C324.907 101.501 324.868 101.518 324.818 101.534C324.77 101.548 324.715 101.562 324.654 101.575C324.593 101.586 324.532 101.597 324.471 101.607C324.41 101.615 324.354 101.623 324.305 101.63C324.198 101.646 324.105 101.67 324.026 101.705C323.946 101.739 323.884 101.785 323.84 101.843C323.796 101.9 323.774 101.971 323.774 102.056C323.774 102.18 323.819 102.274 323.908 102.339C323.999 102.403 324.114 102.435 324.254 102.435ZM327.449 101.108V103H326.541V99.7273H327.406V100.305H327.444C327.517 100.114 327.638 99.9638 327.809 99.853C327.979 99.7408 328.186 99.6847 328.429 99.6847C328.656 99.6847 328.854 99.7344 329.023 99.8338C329.192 99.9332 329.324 100.075 329.417 100.26C329.511 100.443 329.558 100.662 329.558 100.916V103H328.65V101.078C328.652 100.878 328.601 100.722 328.497 100.609C328.393 100.496 328.25 100.439 328.069 100.439C327.946 100.439 327.839 100.465 327.745 100.518C327.652 100.57 327.58 100.647 327.527 100.748C327.476 100.847 327.45 100.967 327.449 101.108ZM331.479 103.053C331.231 103.053 331.006 102.989 330.804 102.862C330.604 102.732 330.445 102.543 330.327 102.293C330.21 102.041 330.152 101.733 330.152 101.368C330.152 100.993 330.212 100.681 330.333 100.433C330.454 100.183 330.614 99.9957 330.815 99.8722C331.016 99.7472 331.237 99.6847 331.477 99.6847C331.66 99.6847 331.813 99.7159 331.935 99.7784C332.059 99.8395 332.158 99.9162 332.234 100.009C332.31 100.099 332.369 100.189 332.408 100.277H332.436V98.6364H333.342V103H332.447V102.476H332.408C332.366 102.567 332.305 102.657 332.227 102.746C332.15 102.835 332.05 102.908 331.927 102.966C331.805 103.024 331.655 103.053 331.479 103.053ZM331.767 102.331C331.913 102.331 332.037 102.291 332.138 102.212C332.24 102.131 332.318 102.018 332.372 101.873C332.427 101.728 332.455 101.558 332.455 101.364C332.455 101.169 332.428 101 332.374 100.857C332.32 100.713 332.242 100.602 332.14 100.524C332.038 100.446 331.913 100.407 331.767 100.407C331.618 100.407 331.492 100.447 331.39 100.528C331.288 100.609 331.21 100.722 331.158 100.865C331.105 101.009 331.079 101.175 331.079 101.364C331.079 101.554 331.105 101.722 331.158 101.869C331.212 102.013 331.289 102.127 331.39 102.21C331.492 102.29 331.618 102.331 331.767 102.331Z"
                  fill="black"
                ></path>
                <g id="Army_32">
                  <circle
                    id="armycircle_32"
                    cx="322"
                    cy="109"
                    r="5.5"
                    fill={getCircleFill("iceland")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("iceland")}
                  ></circle>
                  {getArmyNum("iceland", "322", "109")}
                </g>
              </g>
            </g>
            <g id="western-us">
              <path
                id="western_united_states"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M155.844 149.124C154.978 149.599 155.978 185.724 155.478 186.224C154.978 186.724 144.103 186.599 143.603 186.849C143.103 187.099 142.728 187.724 142.603 188.599C142.478 189.474 142.603 192.599 142.478 193.974C142.353 195.349 140.603 193.974 140.103 194.224C139.603 194.474 136.228 195.724 136.228 196.349C136.228 196.974 135.478 200.349 135.478 200.974C135.478 201.599 134.478 207.099 134.478 207.099C134.478 207.099 132.728 207.599 132.228 207.849C131.728 208.099 129.853 208.099 129.353 208.724C128.853 209.349 129.478 211.224 129.478 211.224C129.478 211.224 131.228 211.474 130.853 212.224C130.478 212.974 131.728 217.599 131.603 217.349C131.478 217.099 128.228 217.349 127.228 217.474C126.228 217.599 124.978 216.599 124.603 216.099C124.228 215.599 123.853 214.974 122.728 214.974C121.603 214.974 119.353 212.224 118.728 211.724C118.103 211.224 110.353 211.724 109.353 211.724C108.353 211.724 106.978 209.349 106.978 209.349L103.103 207.224C103.103 207.224 96.4776 207.224 95.3526 207.349C94.2276 207.474 93.6026 203.974 93.6026 203.974C93.1026 201.849 92.8526 202.349 92.8526 200.474C92.8526 198.599 89.9776 194.974 88.6026 192.974C87.2276 190.974 87.2276 185.599 87.4776 184.224C87.7276 182.849 87.2276 177.849 88.1026 175.724C88.9776 173.599 88.9776 170.599 89.6026 167.724C90.2276 164.849 89.4776 165.474 90.9776 161.849C92.4776 158.224 92.3526 160.599 92.6026 157.474C92.8526 154.349 93.8526 156.224 93.9776 153.599C94.1026 150.974 94.6026 149.724 93.7276 148.474C93.7276 148.474 93.4776 149.224 94.4776 149.474C95.4776 149.724 151.978 150.099 155.844 149.124Z"
                className={getCountryClass("western-us")}
                fill={getFill("western-us")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_33">
                <path
                  id="Western U/S"
                  d="M105.569 171L104.32 166.636H105.328L106.05 169.668H106.086L106.883 166.636H107.746L108.541 169.675H108.579L109.301 166.636H110.309L109.061 171H108.162L107.331 168.147H107.297L106.468 171H105.569ZM111.926 171.064C111.589 171.064 111.3 170.996 111.057 170.859C110.815 170.722 110.629 170.527 110.498 170.276C110.368 170.023 110.302 169.724 110.302 169.379C110.302 169.042 110.368 168.746 110.498 168.492C110.629 168.238 110.813 168.04 111.05 167.898C111.289 167.756 111.569 167.685 111.89 167.685C112.106 167.685 112.307 167.719 112.493 167.789C112.68 167.857 112.844 167.96 112.983 168.098C113.123 168.236 113.233 168.409 113.311 168.618C113.389 168.825 113.428 169.068 113.428 169.347V169.596H110.665V169.033H112.574C112.574 168.903 112.545 168.787 112.488 168.686C112.432 168.585 112.353 168.506 112.252 168.45C112.153 168.391 112.037 168.362 111.905 168.362C111.767 168.362 111.645 168.394 111.538 168.458C111.433 168.521 111.351 168.605 111.291 168.712C111.231 168.817 111.201 168.934 111.199 169.063V169.598C111.199 169.76 111.229 169.9 111.289 170.018C111.35 170.136 111.436 170.227 111.547 170.29C111.657 170.354 111.789 170.386 111.941 170.386C112.042 170.386 112.134 170.372 112.218 170.344C112.302 170.315 112.373 170.273 112.433 170.216C112.493 170.159 112.538 170.089 112.569 170.007L113.409 170.062C113.366 170.264 113.279 170.44 113.147 170.591C113.016 170.74 112.847 170.857 112.64 170.94C112.434 171.023 112.196 171.064 111.926 171.064ZM116.743 168.661L115.912 168.712C115.898 168.641 115.868 168.577 115.821 168.52C115.774 168.462 115.712 168.415 115.635 168.381C115.56 168.346 115.47 168.328 115.365 168.328C115.224 168.328 115.106 168.358 115.009 168.418C114.912 168.476 114.864 168.554 114.864 168.652C114.864 168.73 114.895 168.796 114.958 168.85C115.02 168.904 115.128 168.947 115.28 168.98L115.872 169.099C116.19 169.165 116.427 169.27 116.584 169.415C116.74 169.56 116.818 169.75 116.818 169.986C116.818 170.2 116.755 170.388 116.628 170.55C116.503 170.712 116.331 170.839 116.113 170.93C115.895 171.019 115.645 171.064 115.361 171.064C114.927 171.064 114.582 170.974 114.325 170.793C114.069 170.612 113.92 170.364 113.876 170.052L114.768 170.005C114.795 170.137 114.861 170.238 114.964 170.308C115.068 170.376 115.201 170.41 115.363 170.41C115.522 170.41 115.65 170.379 115.746 170.318C115.844 170.256 115.894 170.175 115.895 170.077C115.894 169.995 115.859 169.928 115.791 169.875C115.723 169.821 115.618 169.78 115.476 169.751L114.909 169.638C114.589 169.575 114.351 169.464 114.195 169.306C114.04 169.148 113.963 168.947 113.963 168.703C113.963 168.493 114.02 168.312 114.133 168.16C114.248 168.008 114.41 167.891 114.617 167.808C114.826 167.726 115.07 167.685 115.35 167.685C115.763 167.685 116.089 167.772 116.326 167.947C116.564 168.121 116.704 168.359 116.743 168.661ZM119.13 167.727V168.409H117.159V167.727H119.13ZM117.607 166.943H118.515V169.994C118.515 170.078 118.527 170.143 118.553 170.19C118.578 170.236 118.614 170.268 118.659 170.286C118.706 170.305 118.76 170.314 118.821 170.314C118.864 170.314 118.907 170.31 118.949 170.303C118.992 170.295 119.025 170.288 119.047 170.284L119.19 170.96C119.145 170.974 119.081 170.99 118.998 171.009C118.916 171.028 118.816 171.04 118.698 171.045C118.479 171.053 118.287 171.024 118.123 170.957C117.959 170.891 117.832 170.787 117.741 170.646C117.65 170.506 117.605 170.328 117.607 170.114V166.943ZM121.178 171.064C120.841 171.064 120.551 170.996 120.309 170.859C120.067 170.722 119.881 170.527 119.75 170.276C119.62 170.023 119.554 169.724 119.554 169.379C119.554 169.042 119.62 168.746 119.75 168.492C119.881 168.238 120.065 168.04 120.302 167.898C120.541 167.756 120.821 167.685 121.142 167.685C121.358 167.685 121.559 167.719 121.745 167.789C121.932 167.857 122.096 167.96 122.235 168.098C122.375 168.236 122.485 168.409 122.563 168.618C122.641 168.825 122.68 169.068 122.68 169.347V169.596H119.917V169.033H121.826C121.826 168.903 121.797 168.787 121.74 168.686C121.684 168.585 121.605 168.506 121.504 168.45C121.404 168.391 121.289 168.362 121.157 168.362C121.019 168.362 120.897 168.394 120.79 168.458C120.685 168.521 120.603 168.605 120.543 168.712C120.483 168.817 120.453 168.934 120.451 169.063V169.598C120.451 169.76 120.481 169.9 120.541 170.018C120.602 170.136 120.688 170.227 120.799 170.29C120.909 170.354 121.041 170.386 121.193 170.386C121.294 170.386 121.386 170.372 121.47 170.344C121.554 170.315 121.625 170.273 121.685 170.216C121.745 170.159 121.79 170.089 121.821 170.007L122.661 170.062C122.618 170.264 122.531 170.44 122.399 170.591C122.268 170.74 122.099 170.857 121.892 170.94C121.686 171.023 121.448 171.064 121.178 171.064ZM123.272 171V167.727H124.152V168.298H124.186C124.246 168.095 124.346 167.942 124.487 167.838C124.627 167.733 124.789 167.68 124.973 167.68C125.018 167.68 125.067 167.683 125.12 167.689C125.172 167.695 125.218 167.702 125.258 167.712V168.518C125.216 168.505 125.157 168.494 125.081 168.484C125.006 168.474 124.937 168.469 124.875 168.469C124.741 168.469 124.622 168.498 124.517 168.556C124.413 168.613 124.331 168.692 124.27 168.795C124.21 168.897 124.18 169.015 124.18 169.148V171H123.272ZM126.635 169.108V171H125.727V167.727H126.593V168.305H126.631C126.703 168.114 126.825 167.964 126.995 167.853C127.166 167.741 127.372 167.685 127.615 167.685C127.843 167.685 128.041 167.734 128.21 167.834C128.379 167.933 128.51 168.075 128.604 168.26C128.698 168.443 128.744 168.662 128.744 168.916V171H127.837V169.078C127.838 168.878 127.787 168.722 127.683 168.609C127.58 168.496 127.437 168.439 127.255 168.439C127.133 168.439 127.025 168.465 126.931 168.518C126.839 168.57 126.767 168.647 126.714 168.748C126.663 168.847 126.637 168.967 126.635 169.108ZM133.561 166.636H134.483V169.47C134.483 169.788 134.407 170.067 134.256 170.305C134.105 170.544 133.894 170.73 133.623 170.864C133.351 170.996 133.035 171.062 132.675 171.062C132.312 171.062 131.996 170.996 131.724 170.864C131.453 170.73 131.242 170.544 131.091 170.305C130.941 170.067 130.866 169.788 130.866 169.47V166.636H131.788V169.391C131.788 169.558 131.824 169.705 131.897 169.835C131.971 169.964 132.074 170.065 132.208 170.139C132.341 170.213 132.497 170.25 132.675 170.25C132.854 170.25 133.009 170.213 133.141 170.139C133.275 170.065 133.378 169.964 133.45 169.835C133.524 169.705 133.561 169.558 133.561 169.391V166.636ZM136.786 166.432L135.38 171.656H134.598L136.004 166.432H136.786ZM139.608 167.891C139.591 167.719 139.518 167.586 139.388 167.491C139.259 167.396 139.084 167.348 138.862 167.348C138.711 167.348 138.584 167.369 138.481 167.412C138.377 167.453 138.297 167.511 138.242 167.585C138.188 167.658 138.161 167.742 138.161 167.836C138.158 167.914 138.175 167.982 138.21 168.04C138.247 168.099 138.297 168.149 138.361 168.192C138.425 168.233 138.499 168.269 138.583 168.3C138.667 168.33 138.756 168.356 138.851 168.377L139.243 168.471C139.434 168.513 139.608 168.57 139.768 168.641C139.927 168.712 140.064 168.8 140.181 168.903C140.297 169.007 140.388 169.129 140.452 169.27C140.517 169.411 140.55 169.572 140.552 169.754C140.55 170.021 140.482 170.252 140.347 170.448C140.214 170.643 140.02 170.794 139.768 170.902C139.516 171.009 139.213 171.062 138.858 171.062C138.506 171.062 138.199 171.008 137.937 170.9C137.677 170.792 137.474 170.632 137.328 170.42C137.183 170.207 137.107 169.944 137.1 169.63H137.993C138.003 169.776 138.045 169.898 138.118 169.996C138.194 170.093 138.294 170.166 138.419 170.216C138.545 170.264 138.688 170.288 138.847 170.288C139.003 170.288 139.139 170.266 139.254 170.22C139.371 170.175 139.461 170.112 139.525 170.031C139.589 169.95 139.621 169.857 139.621 169.751C139.621 169.653 139.591 169.571 139.533 169.504C139.476 169.437 139.393 169.381 139.282 169.334C139.172 169.287 139.038 169.244 138.879 169.206L138.404 169.087C138.036 168.997 137.746 168.857 137.532 168.667C137.319 168.477 137.214 168.22 137.215 167.898C137.214 167.634 137.284 167.403 137.426 167.205C137.569 167.008 137.766 166.854 138.016 166.743C138.266 166.632 138.55 166.577 138.868 166.577C139.192 166.577 139.475 166.632 139.716 166.743C139.959 166.854 140.148 167.008 140.283 167.205C140.418 167.403 140.488 167.631 140.492 167.891H139.608Z"
                  fill="black"
                ></path>
                <g id="Army_33">
                  <circle
                    id="armycircle_33"
                    cx="122"
                    cy="181"
                    r="5.5"
                    fill={getCircleFill("western-us")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("western-us")}
                  ></circle>
                  {getArmyNum("western-us", "122", "181")}
                </g>
              </g>
            </g>
            <g id="ontario">
              <path
                id="ontario_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M162.65 104.488C161.943 106.963 161.589 113.68 161.589 113.68L163.357 115.095C163.357 115.095 164.771 117.569 166.539 119.337C168.307 121.105 169.367 124.641 172.196 123.933C175.024 123.226 176.085 126.408 176.085 126.408L178.206 124.994C178.206 124.994 180.328 123.757 180.681 124.464C181.035 125.171 183.156 125.878 183.156 125.878C183.156 125.878 185.277 124.64 187.222 124.464C189.166 124.287 187.575 126.055 187.575 126.055L183.51 127.999C183.51 127.999 184.393 130.651 185.454 130.297C186.515 129.944 187.045 134.363 185.808 135.247C184.57 136.131 186.161 137.899 186.161 137.899L186.868 140.374L188.813 141.788L189.343 144.086H189.166C188.459 146.03 188.106 163.001 188.106 163.001C188.106 163.001 189.166 161.587 189.873 161.41C190.581 161.233 191.641 162.824 192.348 163.001C193.055 163.178 192.702 161.587 193.409 160.88C194.116 160.173 194.293 160.88 195 161.41C195.707 161.94 195.53 161.41 196.591 161.233C197.652 161.056 197.652 164.062 197.652 164.946C197.652 165.829 195.884 166.36 195.884 166.36C195.884 166.36 193.409 167.244 192.348 167.067C191.288 166.89 190.05 168.481 189.343 169.365C188.636 170.249 187.222 169.719 186.338 170.072C185.454 170.426 185.984 171.31 186.161 172.547C186.338 173.784 182.272 176.966 181.388 176.083C180.504 175.199 179.09 173.784 177.499 172.901C175.908 172.017 177.853 170.249 178.56 169.011C179.267 167.774 178.737 164.946 177.676 162.117C176.615 159.289 176.438 158.228 175.908 157.521C175.378 156.814 174.14 154.869 173.61 152.571C173.08 150.273 170.782 154.162 168.307 153.455C165.832 152.748 162.473 154.516 162.473 154.516C162.473 154.516 162.827 149.566 162.12 149.212C161.412 148.859 142.321 149.566 142.321 149.566C142.321 149.566 142.321 149.036 142.321 146.738C142.321 144.439 146.21 101.306 146.21 101.306L164.594 101.836L162.65 104.488Z"
                className={getCountryClass("ontario")}
                fill={getFill("ontario")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_34">
                <g id="Army_34">
                  <circle
                    id="armycircle_34"
                    cx="165"
                    cy="136"
                    r="5.5"
                    fill={getCircleFill("ontario")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("ontario")}
                  ></circle>
                  {getArmyNum("ontario", "165", "136")}
                </g>
                <path
                  id="Ontario"
                  d="M158.385 124.818C158.385 125.294 158.295 125.699 158.115 126.033C157.936 126.366 157.691 126.621 157.382 126.798C157.074 126.972 156.727 127.06 156.342 127.06C155.954 127.06 155.606 126.972 155.298 126.795C154.99 126.619 154.746 126.364 154.567 126.031C154.388 125.697 154.299 125.293 154.299 124.818C154.299 124.342 154.388 123.938 154.567 123.604C154.746 123.27 154.99 123.016 155.298 122.841C155.606 122.665 155.954 122.577 156.342 122.577C156.727 122.577 157.074 122.665 157.382 122.841C157.691 123.016 157.936 123.27 158.115 123.604C158.295 123.938 158.385 124.342 158.385 124.818ZM157.45 124.818C157.45 124.51 157.404 124.25 157.311 124.038C157.221 123.827 157.092 123.666 156.926 123.557C156.76 123.447 156.565 123.393 156.342 123.393C156.119 123.393 155.924 123.447 155.758 123.557C155.592 123.666 155.463 123.827 155.37 124.038C155.279 124.25 155.234 124.51 155.234 124.818C155.234 125.126 155.279 125.386 155.37 125.598C155.463 125.81 155.592 125.97 155.758 126.08C155.924 126.189 156.119 126.244 156.342 126.244C156.565 126.244 156.76 126.189 156.926 126.08C157.092 125.97 157.221 125.81 157.311 125.598C157.404 125.386 157.45 125.126 157.45 124.818ZM159.959 125.108V127H159.052V123.727H159.917V124.305H159.955C160.028 124.114 160.149 123.964 160.319 123.853C160.49 123.741 160.697 123.685 160.939 123.685C161.167 123.685 161.365 123.734 161.534 123.834C161.703 123.933 161.834 124.075 161.928 124.26C162.022 124.443 162.069 124.662 162.069 124.916V127H161.161V125.078C161.162 124.878 161.111 124.722 161.008 124.609C160.904 124.496 160.761 124.439 160.579 124.439C160.457 124.439 160.349 124.465 160.256 124.518C160.163 124.57 160.091 124.647 160.038 124.748C159.987 124.847 159.961 124.967 159.959 125.108ZM164.525 123.727V124.409H162.554V123.727H164.525ZM163.001 122.943H163.909V125.994C163.909 126.078 163.922 126.143 163.947 126.19C163.973 126.236 164.009 126.268 164.054 126.286C164.101 126.305 164.155 126.314 164.216 126.314C164.259 126.314 164.301 126.31 164.344 126.303C164.386 126.295 164.419 126.288 164.442 126.284L164.585 126.96C164.539 126.974 164.475 126.99 164.393 127.009C164.31 127.028 164.21 127.04 164.092 127.045C163.874 127.053 163.682 127.024 163.517 126.957C163.354 126.891 163.227 126.787 163.136 126.646C163.045 126.506 163 126.328 163.001 126.114V122.943ZM166.049 127.062C165.841 127.062 165.654 127.026 165.491 126.953C165.328 126.879 165.199 126.771 165.103 126.627C165.01 126.482 164.963 126.302 164.963 126.086C164.963 125.904 164.996 125.751 165.063 125.628C165.13 125.504 165.221 125.405 165.336 125.33C165.451 125.254 165.581 125.197 165.728 125.159C165.875 125.121 166.03 125.094 166.192 125.078C166.382 125.058 166.536 125.04 166.652 125.023C166.769 125.004 166.853 124.977 166.906 124.942C166.958 124.906 166.985 124.854 166.985 124.784V124.771C166.985 124.636 166.942 124.532 166.857 124.458C166.773 124.384 166.654 124.347 166.499 124.347C166.336 124.347 166.206 124.384 166.109 124.456C166.012 124.527 165.949 124.616 165.917 124.724L165.078 124.656C165.12 124.457 165.204 124.286 165.329 124.141C165.454 123.994 165.615 123.882 165.813 123.804C166.012 123.724 166.242 123.685 166.503 123.685C166.685 123.685 166.859 123.706 167.025 123.749C167.193 123.791 167.341 123.857 167.471 123.947C167.601 124.036 167.704 124.151 167.779 124.292C167.855 124.431 167.892 124.598 167.892 124.793V127H167.032V126.546H167.006C166.953 126.648 166.883 126.739 166.795 126.817C166.707 126.893 166.601 126.954 166.478 126.998C166.354 127.04 166.211 127.062 166.049 127.062ZM166.309 126.435C166.443 126.435 166.561 126.409 166.663 126.357C166.765 126.303 166.846 126.23 166.904 126.139C166.962 126.048 166.991 125.945 166.991 125.83V125.483C166.963 125.501 166.924 125.518 166.874 125.534C166.826 125.548 166.771 125.562 166.71 125.575C166.649 125.586 166.588 125.597 166.527 125.607C166.466 125.615 166.41 125.623 166.36 125.63C166.254 125.646 166.161 125.67 166.081 125.705C166.002 125.739 165.94 125.785 165.896 125.843C165.852 125.9 165.83 125.971 165.83 126.056C165.83 126.18 165.875 126.274 165.964 126.339C166.055 126.403 166.17 126.435 166.309 126.435ZM168.597 127V123.727H169.477V124.298H169.511C169.57 124.095 169.67 123.942 169.811 123.838C169.952 123.733 170.114 123.68 170.297 123.68C170.342 123.68 170.391 123.683 170.444 123.689C170.496 123.695 170.543 123.702 170.582 123.712V124.518C170.54 124.505 170.481 124.494 170.406 124.484C170.33 124.474 170.261 124.469 170.199 124.469C170.065 124.469 169.946 124.498 169.841 124.556C169.737 124.613 169.655 124.692 169.594 124.795C169.534 124.897 169.504 125.015 169.504 125.148V127H168.597ZM171.052 127V123.727H171.959V127H171.052ZM171.508 123.305C171.373 123.305 171.257 123.261 171.16 123.171C171.065 123.08 171.018 122.972 171.018 122.845C171.018 122.72 171.065 122.613 171.16 122.523C171.257 122.433 171.373 122.387 171.508 122.387C171.643 122.387 171.758 122.433 171.853 122.523C171.949 122.613 171.998 122.72 171.998 122.845C171.998 122.972 171.949 123.08 171.853 123.171C171.758 123.261 171.643 123.305 171.508 123.305ZM174.165 127.064C173.834 127.064 173.548 126.994 173.306 126.853C173.066 126.711 172.881 126.513 172.75 126.261C172.62 126.006 172.554 125.712 172.554 125.376C172.554 125.038 172.62 124.743 172.75 124.49C172.881 124.236 173.066 124.038 173.306 123.898C173.548 123.756 173.834 123.685 174.165 123.685C174.496 123.685 174.782 123.756 175.022 123.898C175.263 124.038 175.449 124.236 175.58 124.49C175.711 124.743 175.776 125.038 175.776 125.376C175.776 125.712 175.711 126.006 175.58 126.261C175.449 126.513 175.263 126.711 175.022 126.853C174.782 126.994 174.496 127.064 174.165 127.064ZM174.169 126.361C174.32 126.361 174.446 126.318 174.547 126.233C174.647 126.146 174.723 126.028 174.775 125.879C174.827 125.73 174.853 125.56 174.853 125.37C174.853 125.18 174.827 125.01 174.775 124.861C174.723 124.712 174.647 124.594 174.547 124.507C174.446 124.42 174.32 124.377 174.169 124.377C174.017 124.377 173.89 124.42 173.786 124.507C173.684 124.594 173.606 124.712 173.554 124.861C173.502 125.01 173.477 125.18 173.477 125.37C173.477 125.56 173.502 125.73 173.554 125.879C173.606 126.028 173.684 126.146 173.786 126.233C173.89 126.318 174.017 126.361 174.169 126.361Z"
                  fill="black"
                ></path>
              </g>
            </g>
            <g id="quebec">
              <path
                id="quebec_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M189.343 144.086C189.343 144.086 190.05 140.374 191.288 139.49C192.525 138.606 193.232 133.833 192.702 132.772C192.172 131.712 191.288 131.358 191.995 129.767C192.702 128.176 192.348 125.524 194.116 126.055C195.884 126.585 197.652 126.408 198.005 125.171C198.359 123.933 197.828 123.933 198.005 122.873C198.182 121.812 199.066 121.459 199.773 121.282C200.48 121.105 201.01 121.635 200.48 119.16C199.95 116.686 200.48 117.746 199.773 115.978C199.066 114.211 199.596 115.271 198.889 113.68C198.182 112.089 197.652 109.614 199.419 109.438C201.187 109.261 199.243 107.14 200.48 106.609C201.718 106.079 204.016 106.786 203.485 104.665C202.955 102.543 200.303 98.3008 202.071 98.124C203.839 97.9472 206.353 98.8493 206.353 98.8493L212.603 99.2243C212.603 99.2243 211.978 101.599 213.853 101.849C215.728 102.099 215.978 103.224 216.603 103.599C217.228 103.974 218.228 104.849 217.978 105.349C217.728 105.849 217.728 106.349 217.853 107.224C217.978 108.099 218.603 109.349 218.103 109.599C217.603 109.849 217.103 110.599 217.228 111.599C217.353 112.599 217.728 114.099 217.728 114.099C217.728 114.099 218.728 115.474 219.978 114.849C221.228 114.224 220.853 113.724 222.478 112.974C224.103 112.224 224.103 113.849 225.103 112.224C226.103 110.599 225.978 110.349 226.228 109.724C226.478 109.099 227.728 107.474 228.728 107.974C229.728 108.474 228.411 112.973 229.471 114.564C230.532 116.155 231.978 113.974 232.103 114.724C232.228 115.474 232.353 116.349 232.478 116.974C232.603 117.599 231.728 118.099 232.478 119.099C233.228 120.099 233.353 120.349 233.228 121.099C233.103 121.849 233.603 122.474 233.603 122.474C233.603 122.474 234.978 121.224 235.603 122.724C236.228 124.224 235.728 125.099 236.853 125.099C237.978 125.099 239.228 126.849 239.228 126.849L239.728 129.474L242.603 127.474L245.353 128.349C245.353 128.349 241.54 130.099 242.29 131.912C243.04 133.724 246.915 129.787 246.853 132.224C246.79 134.662 246.353 137.162 245.415 137.287C244.478 137.412 242.978 138.224 242.853 138.787C242.728 139.349 240.978 140.474 239.853 140.724C238.728 140.974 240.478 141.974 238.103 142.349C235.728 142.724 234.978 142.599 234.478 142.599C233.978 142.599 233.978 143.099 233.353 144.224C232.728 145.349 233.228 145.724 232.603 146.224C231.978 146.724 234.853 146.224 230.978 147.099C227.103 147.974 226.478 148.224 226.478 148.224C226.478 148.224 226.228 148.599 224.978 148.599C223.728 148.599 223.228 147.974 223.228 147.974C223.228 147.974 222.978 147.349 221.228 147.349C219.478 147.349 217.853 148.974 217.853 148.974C217.853 148.974 217.353 149.599 216.353 149.724C215.353 149.849 213.978 151.099 213.978 151.099C213.978 151.099 212.603 151.474 212.978 152.974C213.353 154.474 214.728 155.849 215.603 154.849C216.478 153.849 217.853 149.849 219.728 150.224C221.603 150.599 224.103 151.349 223.603 154.099C223.103 156.849 222.978 156.349 223.353 157.724C223.728 159.099 224.603 159.849 224.478 161.099C224.353 162.349 223.228 161.974 224.603 163.099C225.978 164.224 227.478 165.974 227.978 164.349C228.478 162.724 229.103 161.599 229.728 161.849C230.353 162.099 232.103 161.349 230.853 163.849C229.603 166.349 229.853 166.474 228.728 167.224C227.603 167.974 227.728 165.974 225.728 168.974C225.759 169.277 223.903 169.984 223.373 169.807C222.842 169.63 222.577 168.835 222.312 167.774C222.047 166.713 220.809 166.89 219.218 166.802C217.627 166.713 219.13 163.089 219.572 161.145C220.014 159.2 216.494 157.122 215.521 156.945C214.549 156.768 213.473 156.814 212.766 157.521C212.059 158.228 211.263 158.493 210.91 158.758C210.556 159.024 211.263 162.913 211.263 162.913C211.263 162.913 211.087 162.736 209.496 163.708C207.905 164.68 197.652 164.946 197.652 164.946C197.652 164.062 197.652 161.056 196.591 161.233C195.53 161.41 195.707 161.94 195 161.41C194.293 160.88 194.116 160.173 193.409 160.88C192.702 161.587 193.055 163.178 192.348 163.001C191.641 162.824 190.581 161.233 189.873 161.41C189.166 161.587 188.106 163.001 188.106 163.001C188.106 163.001 188.459 146.03 189.166 144.086H189.343Z"
                className={getCountryClass("quebec")}
                fill={getFill("quebec")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_35">
                <path
                  id="Quebec"
                  d="M208.559 121.483H209.344L209.738 121.99L210.126 122.442L210.856 123.358H209.996L209.493 122.74L209.235 122.374L208.559 121.483ZM210.922 120.818C210.922 121.294 210.832 121.699 210.652 122.033C210.473 122.366 210.229 122.621 209.919 122.798C209.611 122.972 209.264 123.06 208.879 123.06C208.491 123.06 208.143 122.972 207.835 122.795C207.527 122.619 207.283 122.364 207.104 122.031C206.925 121.697 206.836 121.293 206.836 120.818C206.836 120.342 206.925 119.938 207.104 119.604C207.283 119.27 207.527 119.016 207.835 118.841C208.143 118.665 208.491 118.577 208.879 118.577C209.264 118.577 209.611 118.665 209.919 118.841C210.229 119.016 210.473 119.27 210.652 119.604C210.832 119.938 210.922 120.342 210.922 120.818ZM209.987 120.818C209.987 120.51 209.941 120.25 209.849 120.038C209.758 119.827 209.629 119.666 209.463 119.557C209.297 119.447 209.102 119.393 208.879 119.393C208.656 119.393 208.461 119.447 208.295 119.557C208.129 119.666 208 119.827 207.907 120.038C207.817 120.25 207.771 120.51 207.771 120.818C207.771 121.126 207.817 121.386 207.907 121.598C208 121.81 208.129 121.97 208.295 122.08C208.461 122.189 208.656 122.244 208.879 122.244C209.102 122.244 209.297 122.189 209.463 122.08C209.629 121.97 209.758 121.81 209.849 121.598C209.941 121.386 209.987 121.126 209.987 120.818ZM213.688 121.607V119.727H214.595V123H213.724V122.406H213.69C213.616 122.597 213.493 122.751 213.321 122.868C213.151 122.984 212.942 123.043 212.697 123.043C212.478 123.043 212.286 122.993 212.119 122.893C211.953 122.794 211.823 122.653 211.729 122.469C211.637 122.286 211.59 122.067 211.589 121.811V119.727H212.496V121.649C212.498 121.842 212.55 121.995 212.652 122.107C212.754 122.219 212.891 122.276 213.063 122.276C213.173 122.276 213.275 122.251 213.37 122.201C213.465 122.15 213.542 122.075 213.6 121.975C213.66 121.876 213.689 121.753 213.688 121.607ZM216.813 123.064C216.476 123.064 216.186 122.996 215.943 122.859C215.702 122.722 215.516 122.527 215.385 122.276C215.254 122.023 215.189 121.724 215.189 121.379C215.189 121.042 215.254 120.746 215.385 120.492C215.516 120.238 215.7 120.04 215.937 119.898C216.176 119.756 216.455 119.685 216.776 119.685C216.992 119.685 217.193 119.719 217.379 119.789C217.567 119.857 217.73 119.96 217.869 120.098C218.01 120.236 218.119 120.409 218.198 120.618C218.276 120.825 218.315 121.068 218.315 121.347V121.596H215.551V121.033H217.46C217.46 120.903 217.432 120.787 217.375 120.686C217.318 120.585 217.24 120.506 217.139 120.45C217.039 120.391 216.923 120.362 216.791 120.362C216.654 120.362 216.531 120.394 216.425 120.458C216.32 120.521 216.237 120.605 216.178 120.712C216.118 120.817 216.088 120.934 216.086 121.063V121.598C216.086 121.76 216.116 121.9 216.176 122.018C216.237 122.136 216.323 122.227 216.433 122.29C216.544 122.354 216.676 122.386 216.828 122.386C216.928 122.386 217.021 122.372 217.105 122.344C217.188 122.315 217.26 122.273 217.32 122.216C217.379 122.159 217.425 122.089 217.456 122.007L218.296 122.062C218.253 122.264 218.166 122.44 218.034 122.591C217.903 122.74 217.734 122.857 217.526 122.94C217.32 123.023 217.083 123.064 216.813 123.064ZM218.924 123V118.636H219.832V120.277H219.86C219.899 120.189 219.957 120.099 220.032 120.009C220.109 119.916 220.208 119.839 220.33 119.778C220.454 119.716 220.607 119.685 220.791 119.685C221.029 119.685 221.249 119.747 221.451 119.872C221.653 119.996 221.814 120.183 221.935 120.433C222.056 120.681 222.116 120.993 222.116 121.368C222.116 121.733 222.057 122.041 221.939 122.293C221.823 122.543 221.664 122.732 221.462 122.862C221.262 122.989 221.037 123.053 220.789 123.053C220.612 123.053 220.463 123.024 220.339 122.966C220.217 122.908 220.117 122.835 220.039 122.746C219.96 122.657 219.901 122.567 219.86 122.476H219.819V123H218.924ZM219.813 121.364C219.813 121.558 219.84 121.728 219.894 121.873C219.948 122.018 220.026 122.131 220.128 122.212C220.23 122.291 220.355 122.331 220.501 122.331C220.649 122.331 220.774 122.29 220.876 122.21C220.978 122.127 221.056 122.013 221.108 121.869C221.162 121.722 221.189 121.554 221.189 121.364C221.189 121.175 221.163 121.009 221.11 120.865C221.058 120.722 220.98 120.609 220.878 120.528C220.776 120.447 220.65 120.407 220.501 120.407C220.353 120.407 220.228 120.446 220.126 120.524C220.025 120.602 219.948 120.713 219.894 120.857C219.84 121 219.813 121.169 219.813 121.364ZM224.213 123.064C223.876 123.064 223.587 122.996 223.344 122.859C223.102 122.722 222.916 122.527 222.786 122.276C222.655 122.023 222.589 121.724 222.589 121.379C222.589 121.042 222.655 120.746 222.786 120.492C222.916 120.238 223.1 120.04 223.337 119.898C223.576 119.756 223.856 119.685 224.177 119.685C224.393 119.685 224.594 119.719 224.78 119.789C224.967 119.857 225.131 119.96 225.27 120.098C225.411 120.236 225.52 120.409 225.598 120.618C225.676 120.825 225.715 121.068 225.715 121.347V121.596H222.952V121.033H224.861C224.861 120.903 224.832 120.787 224.776 120.686C224.719 120.585 224.64 120.506 224.539 120.45C224.44 120.391 224.324 120.362 224.192 120.362C224.054 120.362 223.932 120.394 223.825 120.458C223.72 120.521 223.638 120.605 223.578 120.712C223.518 120.817 223.488 120.934 223.487 121.063V121.598C223.487 121.76 223.516 121.9 223.576 122.018C223.637 122.136 223.723 122.227 223.834 122.29C223.945 122.354 224.076 122.386 224.228 122.386C224.329 122.386 224.421 122.372 224.505 122.344C224.589 122.315 224.661 122.273 224.72 122.216C224.78 122.159 224.825 122.089 224.857 122.007L225.696 122.062C225.653 122.264 225.566 122.44 225.434 122.591C225.303 122.74 225.134 122.857 224.927 122.94C224.721 123.023 224.483 123.064 224.213 123.064ZM227.786 123.064C227.451 123.064 227.163 122.993 226.921 122.851C226.681 122.707 226.496 122.509 226.367 122.254C226.239 122 226.175 121.707 226.175 121.376C226.175 121.041 226.24 120.747 226.369 120.494C226.5 120.24 226.685 120.042 226.925 119.9C227.165 119.756 227.451 119.685 227.782 119.685C228.067 119.685 228.317 119.737 228.532 119.84C228.746 119.944 228.916 120.089 229.041 120.277C229.166 120.464 229.235 120.685 229.248 120.938H228.391C228.367 120.774 228.303 120.643 228.2 120.543C228.097 120.442 227.963 120.392 227.797 120.392C227.656 120.392 227.533 120.43 227.428 120.507C227.325 120.582 227.244 120.692 227.185 120.837C227.127 120.982 227.098 121.158 227.098 121.364C227.098 121.572 227.126 121.75 227.183 121.896C227.241 122.043 227.323 122.154 227.428 122.231C227.533 122.308 227.656 122.346 227.797 122.346C227.901 122.346 227.994 122.325 228.076 122.282C228.16 122.239 228.229 122.178 228.283 122.097C228.338 122.014 228.374 121.915 228.391 121.8H229.248C229.234 122.05 229.165 122.271 229.043 122.461C228.923 122.65 228.756 122.798 228.543 122.904C228.33 123.011 228.077 123.064 227.786 123.064Z"
                  fill="black"
                ></path>
                <g id="Army_35">
                  <circle
                    id="armycircle_35"
                    cx="218"
                    cy="132"
                    r="5.5"
                    fill={getCircleFill("quebec")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("quebec")}
                  ></circle>
                  {getArmyNum("quebec", "218", "132")}
                </g>
              </g>
            </g>
            <g id="eastern-us">
              <path
                id="eastern_united_states"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M155.844 149.124L162.12 149.212C162.827 149.566 162.473 154.516 162.473 154.516C162.473 154.516 165.832 152.748 168.307 153.455C170.782 154.162 173.08 150.273 173.61 152.571C174.14 154.869 175.378 156.814 175.908 157.521C176.438 158.228 176.615 159.289 177.676 162.117C178.737 164.946 179.267 167.774 178.56 169.011C177.853 170.249 175.908 172.017 177.499 172.901C179.09 173.784 180.504 175.199 181.388 176.083C182.272 176.966 186.338 173.784 186.161 172.547C185.984 171.31 185.454 170.426 186.338 170.072C187.222 169.719 188.636 170.249 189.343 169.365C190.05 168.481 191.288 166.89 192.348 167.067C193.409 167.244 195.884 166.36 195.884 166.36C195.884 166.36 197.652 165.829 197.652 164.946C197.652 164.946 207.905 164.68 209.496 163.708C211.087 162.736 211.263 162.913 211.263 162.913C211.263 162.913 210.556 159.024 210.91 158.758C211.263 158.493 212.059 158.228 212.766 157.521C213.473 156.814 214.549 156.768 215.521 156.945C216.494 157.122 220.014 159.2 219.572 161.145C219.13 163.089 217.627 166.713 219.218 166.802C220.809 166.89 222.047 166.713 222.312 167.774C222.577 168.835 222.842 169.63 223.373 169.807C223.903 169.984 225.759 169.277 225.728 168.974C225.696 168.672 224.978 170.037 224.29 171.287C223.603 172.537 222.603 173.474 222.603 173.474C220.478 174.349 220.103 177.099 219.353 175.974C218.603 174.849 217.603 174.849 218.478 173.224C219.353 171.599 219.978 171.849 219.728 170.349C219.478 168.849 220.478 168.724 219.228 168.599C217.978 168.474 218.603 168.474 217.103 168.974C215.603 169.474 215.728 167.849 214.478 169.849C213.228 171.849 212.853 171.724 211.978 172.224C211.103 172.724 211.478 173.349 210.853 174.099C210.228 174.849 209.978 175.224 209.478 175.849C208.978 176.474 208.853 176.474 208.853 177.849C208.853 179.224 209.978 181.474 209.978 181.474C209.978 181.474 209.353 183.224 208.603 183.599C207.853 183.974 207.728 182.724 204.478 186.474C201.228 190.224 201.603 190.599 199.603 191.474C197.603 192.349 197.853 192.474 197.728 192.974C197.603 193.474 196.228 194.099 196.978 195.224C197.728 196.349 196.978 196.599 198.103 197.099C199.228 197.599 200.353 196.599 200.228 198.224C200.103 199.849 198.853 201.474 196.853 202.724C194.853 203.974 192.228 207.849 189.603 208.474C186.978 209.099 185.853 209.974 185.978 211.224C186.103 212.474 185.978 213.974 184.603 213.974C183.228 213.974 184.103 214.599 184.103 217.599C184.103 220.599 184.353 221.474 184.978 222.599C185.603 223.724 185.853 223.724 185.853 225.474C185.853 227.224 185.853 228.474 185.728 228.974C185.603 229.474 186.728 229.349 184.853 230.474C182.978 231.599 181.353 232.224 180.603 230.349C179.853 228.474 178.353 228.974 178.228 227.474C178.103 225.974 178.728 222.349 178.728 222.349C178.728 222.349 176.853 221.849 176.603 220.849C176.353 219.849 175.603 217.474 175.103 217.099C174.603 216.724 173.603 215.849 172.603 216.349C171.603 216.849 169.853 217.849 169.228 217.724C168.603 217.599 170.103 217.849 166.603 216.849C163.103 215.849 161.478 215.349 159.978 215.224C158.478 215.099 154.978 215.099 154.353 215.224C153.728 215.349 147.728 216.724 146.978 216.724C146.228 216.724 140.978 217.974 139.603 219.099C138.228 220.224 138.353 222.099 136.853 222.724C135.353 223.349 134.853 223.599 134.853 223.599C134.853 223.599 133.353 225.349 133.228 226.349C133.103 227.349 131.853 229.099 131.228 229.474C130.603 229.849 130.478 229.724 130.853 230.849C130.853 230.849 128.853 229.599 128.853 228.724C128.853 227.849 130.353 226.724 130.728 225.099C131.103 223.474 131.853 221.974 131.853 221.099C131.853 220.224 131.728 217.599 131.728 217.599C131.728 217.599 130.478 212.974 130.853 212.224C131.228 211.474 129.478 211.224 129.478 211.224C129.478 211.224 128.853 209.349 129.353 208.724C129.853 208.099 131.728 208.099 132.228 207.849C132.728 207.599 134.478 207.099 134.478 207.099C134.478 207.099 135.478 201.599 135.478 200.974C135.478 200.349 136.228 196.974 136.228 196.349C136.228 195.724 139.603 194.474 140.103 194.224C140.603 193.974 142.353 195.349 142.478 193.974C142.603 192.599 142.478 189.474 142.603 188.599C142.728 187.724 143.103 187.099 143.603 186.849C144.103 186.599 154.978 186.724 155.478 186.224C155.978 185.724 154.978 149.599 155.844 149.124Z"
                className={getCountryClass("eastern-us")}
                fill={getFill("eastern-us")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_36">
                <path
                  id="Eastern U.S"
                  d="M161.443 184V179.636H164.383V180.397H162.365V181.437H164.232V182.197H162.365V183.239H164.392V184H161.443ZM166.033 184.062C165.824 184.062 165.638 184.026 165.475 183.953C165.311 183.879 165.182 183.771 165.087 183.627C164.993 183.482 164.946 183.302 164.946 183.086C164.946 182.904 164.979 182.751 165.046 182.628C165.113 182.504 165.204 182.405 165.319 182.33C165.434 182.254 165.565 182.197 165.711 182.159C165.859 182.121 166.014 182.094 166.176 182.078C166.366 182.058 166.519 182.04 166.636 182.023C166.752 182.004 166.837 181.977 166.889 181.942C166.942 181.906 166.968 181.854 166.968 181.784V181.771C166.968 181.636 166.926 181.532 166.84 181.458C166.756 181.384 166.637 181.347 166.482 181.347C166.319 181.347 166.189 181.384 166.092 181.456C165.996 181.527 165.932 181.616 165.901 181.724L165.061 181.656C165.104 181.457 165.188 181.286 165.313 181.141C165.438 180.994 165.599 180.882 165.796 180.804C165.995 180.724 166.225 180.685 166.487 180.685C166.668 180.685 166.842 180.706 167.009 180.749C167.176 180.791 167.325 180.857 167.454 180.947C167.585 181.036 167.688 181.151 167.763 181.292C167.838 181.431 167.876 181.598 167.876 181.793V184H167.015V183.546H166.989C166.937 183.648 166.867 183.739 166.778 183.817C166.69 183.893 166.585 183.954 166.461 183.998C166.337 184.04 166.195 184.062 166.033 184.062ZM166.293 183.435C166.426 183.435 166.544 183.409 166.646 183.357C166.749 183.303 166.829 183.23 166.887 183.139C166.945 183.048 166.975 182.945 166.975 182.83V182.483C166.946 182.501 166.907 182.518 166.857 182.534C166.809 182.548 166.754 182.562 166.693 182.575C166.632 182.586 166.571 182.597 166.51 182.607C166.449 182.615 166.394 182.623 166.344 182.63C166.237 182.646 166.144 182.67 166.065 182.705C165.985 182.739 165.923 182.785 165.879 182.843C165.835 182.9 165.813 182.971 165.813 183.056C165.813 183.18 165.858 183.274 165.948 183.339C166.038 183.403 166.153 183.435 166.293 183.435ZM171.303 181.661L170.472 181.712C170.458 181.641 170.427 181.577 170.38 181.52C170.334 181.462 170.272 181.415 170.195 181.381C170.12 181.346 170.03 181.328 169.924 181.328C169.784 181.328 169.665 181.358 169.569 181.418C169.472 181.476 169.424 181.554 169.424 181.652C169.424 181.73 169.455 181.796 169.517 181.85C169.58 181.904 169.687 181.947 169.839 181.98L170.432 182.099C170.75 182.165 170.987 182.27 171.143 182.415C171.299 182.56 171.378 182.75 171.378 182.986C171.378 183.2 171.314 183.388 171.188 183.55C171.063 183.712 170.891 183.839 170.672 183.93C170.455 184.019 170.204 184.064 169.92 184.064C169.487 184.064 169.142 183.974 168.885 183.793C168.629 183.612 168.479 183.364 168.435 183.052L169.328 183.005C169.355 183.137 169.42 183.238 169.524 183.308C169.628 183.376 169.76 183.41 169.922 183.41C170.081 183.41 170.209 183.379 170.306 183.318C170.404 183.256 170.454 183.175 170.455 183.077C170.454 182.995 170.419 182.928 170.351 182.875C170.282 182.821 170.177 182.78 170.035 182.751L169.468 182.638C169.149 182.575 168.911 182.464 168.755 182.306C168.6 182.148 168.522 181.947 168.522 181.703C168.522 181.493 168.579 181.312 168.693 181.16C168.808 181.008 168.969 180.891 169.177 180.808C169.385 180.726 169.63 180.685 169.91 180.685C170.323 180.685 170.648 180.772 170.885 180.947C171.124 181.121 171.263 181.359 171.303 181.661ZM173.69 180.727V181.409H171.719V180.727H173.69ZM172.166 179.943H173.074V182.994C173.074 183.078 173.087 183.143 173.112 183.19C173.138 183.236 173.174 183.268 173.219 183.286C173.266 183.305 173.32 183.314 173.381 183.314C173.424 183.314 173.466 183.31 173.509 183.303C173.551 183.295 173.584 183.288 173.607 183.284L173.75 183.96C173.704 183.974 173.64 183.99 173.558 184.009C173.475 184.028 173.375 184.04 173.257 184.045C173.039 184.053 172.847 184.024 172.682 183.957C172.519 183.891 172.392 183.787 172.301 183.646C172.21 183.506 172.165 183.328 172.166 183.114V179.943ZM175.737 184.064C175.401 184.064 175.111 183.996 174.868 183.859C174.627 183.722 174.441 183.527 174.31 183.276C174.179 183.023 174.114 182.724 174.114 182.379C174.114 182.042 174.179 181.746 174.31 181.492C174.441 181.238 174.625 181.04 174.862 180.898C175.1 180.756 175.38 180.685 175.701 180.685C175.917 180.685 176.118 180.719 176.304 180.789C176.492 180.857 176.655 180.96 176.794 181.098C176.935 181.236 177.044 181.409 177.122 181.618C177.201 181.825 177.24 182.068 177.24 182.347V182.596H174.476V182.033H176.385C176.385 181.903 176.357 181.787 176.3 181.686C176.243 181.585 176.164 181.506 176.063 181.45C175.964 181.391 175.848 181.362 175.716 181.362C175.578 181.362 175.456 181.394 175.35 181.458C175.245 181.521 175.162 181.605 175.103 181.712C175.043 181.817 175.012 181.934 175.011 182.063V182.598C175.011 182.76 175.041 182.9 175.1 183.018C175.161 183.136 175.247 183.227 175.358 183.29C175.469 183.354 175.6 183.386 175.752 183.386C175.853 183.386 175.946 183.372 176.029 183.344C176.113 183.315 176.185 183.273 176.245 183.216C176.304 183.159 176.35 183.089 176.381 183.007L177.22 183.062C177.178 183.264 177.09 183.44 176.958 183.591C176.828 183.74 176.659 183.857 176.451 183.94C176.245 184.023 176.007 184.064 175.737 184.064ZM177.832 184V180.727H178.712V181.298H178.746C178.806 181.095 178.906 180.942 179.046 180.838C179.187 180.733 179.349 180.68 179.532 180.68C179.578 180.68 179.627 180.683 179.679 180.689C179.732 180.695 179.778 180.702 179.818 180.712V181.518C179.775 181.505 179.716 181.494 179.641 181.484C179.566 181.474 179.497 181.469 179.434 181.469C179.301 181.469 179.181 181.498 179.076 181.556C178.973 181.613 178.89 181.692 178.829 181.795C178.769 181.897 178.74 182.015 178.74 182.148V184H177.832ZM181.195 182.108V184H180.287V180.727H181.152V181.305H181.19C181.263 181.114 181.384 180.964 181.555 180.853C181.725 180.741 181.932 180.685 182.175 180.685C182.402 180.685 182.6 180.734 182.769 180.834C182.938 180.933 183.07 181.075 183.163 181.26C183.257 181.443 183.304 181.662 183.304 181.916V184H182.396V182.078C182.398 181.878 182.347 181.722 182.243 181.609C182.139 181.496 181.997 181.439 181.815 181.439C181.693 181.439 181.585 181.465 181.491 181.518C181.399 181.57 181.326 181.647 181.274 181.748C181.222 181.847 181.196 181.967 181.195 182.108ZM188.12 179.636H189.043V182.47C189.043 182.788 188.967 183.067 188.815 183.305C188.665 183.544 188.454 183.73 188.182 183.864C187.911 183.996 187.595 184.062 187.234 184.062C186.872 184.062 186.555 183.996 186.284 183.864C186.013 183.73 185.802 183.544 185.651 183.305C185.5 183.067 185.425 182.788 185.425 182.47V179.636H186.348V182.391C186.348 182.558 186.384 182.705 186.456 182.835C186.53 182.964 186.634 183.065 186.767 183.139C186.901 183.213 187.057 183.25 187.234 183.25C187.413 183.25 187.569 183.213 187.701 183.139C187.834 183.065 187.937 182.964 188.01 182.835C188.084 182.705 188.12 182.558 188.12 182.391V179.636ZM190.111 184.055C189.97 184.055 189.849 184.006 189.748 183.906C189.649 183.805 189.599 183.685 189.599 183.544C189.599 183.405 189.649 183.286 189.748 183.186C189.849 183.087 189.97 183.037 190.111 183.037C190.247 183.037 190.366 183.087 190.468 183.186C190.571 183.286 190.622 183.405 190.622 183.544C190.622 183.638 190.598 183.724 190.549 183.802C190.503 183.879 190.441 183.94 190.364 183.987C190.287 184.033 190.203 184.055 190.111 184.055ZM193.751 180.891C193.734 180.719 193.661 180.586 193.532 180.491C193.403 180.396 193.227 180.348 193.006 180.348C192.855 180.348 192.728 180.369 192.624 180.412C192.521 180.453 192.441 180.511 192.386 180.585C192.332 180.658 192.305 180.742 192.305 180.836C192.302 180.914 192.318 180.982 192.354 181.04C192.391 181.099 192.441 181.149 192.505 181.192C192.569 181.233 192.643 181.269 192.726 181.3C192.81 181.33 192.9 181.356 192.995 181.377L193.387 181.471C193.577 181.513 193.752 181.57 193.911 181.641C194.07 181.712 194.208 181.8 194.324 181.903C194.441 182.007 194.531 182.129 194.595 182.27C194.66 182.411 194.694 182.572 194.695 182.754C194.694 183.021 194.626 183.252 194.491 183.448C194.357 183.643 194.164 183.794 193.911 183.902C193.66 184.009 193.356 184.062 193.001 184.062C192.649 184.062 192.342 184.008 192.081 183.9C191.821 183.792 191.618 183.632 191.472 183.42C191.327 183.207 191.251 182.944 191.244 182.63H192.136C192.146 182.776 192.188 182.898 192.262 182.996C192.337 183.093 192.437 183.166 192.562 183.216C192.689 183.264 192.832 183.288 192.991 183.288C193.147 183.288 193.283 183.266 193.398 183.22C193.514 183.175 193.604 183.112 193.668 183.031C193.732 182.95 193.764 182.857 193.764 182.751C193.764 182.653 193.735 182.571 193.677 182.504C193.62 182.437 193.536 182.381 193.425 182.334C193.316 182.287 193.182 182.244 193.023 182.206L192.547 182.087C192.18 181.997 191.889 181.857 191.676 181.667C191.463 181.477 191.357 181.22 191.359 180.898C191.357 180.634 191.427 180.403 191.57 180.205C191.713 180.008 191.91 179.854 192.16 179.743C192.41 179.632 192.694 179.577 193.012 179.577C193.336 179.577 193.619 179.632 193.86 179.743C194.103 179.854 194.292 180.008 194.427 180.205C194.562 180.403 194.631 180.631 194.636 180.891H193.751Z"
                  fill="black"
                ></path>
                <g id="Army_36">
                  <circle
                    id="armycircle_36"
                    cx="178"
                    cy="194"
                    r="5.5"
                    fill={getCircleFill("eastern-us")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("eastern-us")}
                  ></circle>
                  {getArmyNum("eastern-us", "178", "194")}
                </g>
              </g>
            </g>
            <g id="central-am">
              <path
                id="central_america"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M93.6026 203.974C93.6026 203.974 94.2276 207.474 95.3526 207.349C96.4776 207.224 103.103 207.224 103.103 207.224L106.978 209.349C106.978 209.349 108.353 211.724 109.353 211.724C110.353 211.724 118.103 211.224 118.728 211.724C119.353 212.224 121.603 214.974 122.728 214.974C123.853 214.974 124.228 215.599 124.603 216.099C124.978 216.599 126.228 217.599 127.228 217.474C128.228 217.349 131.478 217.099 131.665 217.474C131.728 217.599 131.853 220.224 131.853 221.099C131.853 221.974 131.103 223.474 130.728 225.099C130.353 226.724 128.853 227.849 128.853 228.724C128.853 229.599 130.853 230.849 130.853 230.849C130.352 233.642 129.966 236.319 131.103 237.474L131.228 239.724L132.728 242.349C132.728 242.349 134.978 245.599 137.853 244.724C140.728 243.849 139.353 244.474 141.728 243.349C144.103 242.224 143.353 244.599 144.603 242.099C145.853 239.599 144.978 239.349 146.353 238.849C147.728 238.349 146.978 237.849 148.728 238.349C150.478 238.849 148.853 238.974 151.103 239.099C153.353 239.224 153.603 236.724 153.353 239.599C153.103 242.474 152.853 242.599 152.603 243.349C152.353 244.099 152.978 243.224 152.103 244.849C151.228 246.474 150.728 246.599 150.103 246.974C149.478 247.349 149.103 247.599 149.103 248.724C149.103 249.849 149.353 250.724 148.228 251.224C147.103 251.724 145.978 251.099 146.228 252.474C146.478 253.849 146.103 254.224 147.103 254.849C148.103 255.474 148.853 255.599 149.478 256.724C150.103 257.849 150.353 259.224 150.103 259.724C149.853 260.224 149.978 261.849 149.228 262.224C148.478 262.599 147.478 262.349 147.478 263.974C147.478 265.599 148.228 266.849 147.478 267.224C146.728 267.599 145.478 266.724 145.228 267.599C144.978 268.474 144.853 269.224 144.728 269.974C144.603 270.724 143.978 270.849 143.978 271.349C143.978 271.849 143.978 271.599 143.978 272.974C143.978 274.349 143.103 275.224 144.353 275.474C145.603 275.724 146.228 276.099 146.853 275.724C147.478 275.349 148.228 275.224 148.728 274.849C149.228 274.474 149.978 273.474 150.728 273.474C151.478 273.474 152.978 273.849 152.978 273.849C152.978 273.849 153.728 275.724 153.603 276.349C153.478 276.974 153.978 276.849 153.853 278.349C153.728 279.849 153.728 280.974 153.478 281.474C153.228 281.974 152.853 282.474 152.603 282.974C152.353 283.474 152.603 283.474 152.353 284.224C152.103 284.974 152.478 286.099 151.853 285.599C151.228 285.099 151.603 285.099 151.228 284.599C150.853 284.099 150.603 283.474 149.853 282.224C149.103 280.974 149.228 281.724 147.728 280.974C146.228 280.224 146.353 279.349 145.353 279.849C144.353 280.349 144.728 281.224 143.603 280.474C142.478 279.724 142.103 279.724 141.478 278.724C140.853 277.724 140.978 277.849 140.603 277.099C140.228 276.349 139.228 276.849 139.228 275.474C139.228 274.099 139.603 273.849 139.228 273.099C138.853 272.349 138.478 271.974 138.228 271.349C137.978 270.724 137.853 271.224 137.853 269.974C137.853 268.724 137.853 267.849 137.853 267.349C137.853 266.849 137.353 264.849 137.353 264.849L136.728 263.599C136.728 263.599 136.603 263.474 136.103 262.724C135.603 261.974 135.603 262.349 135.228 261.099C134.853 259.849 133.978 258.349 133.728 257.349C133.478 256.349 132.103 255.099 127.978 253.599C123.853 252.099 124.103 251.724 120.603 250.974C117.103 250.224 115.853 249.599 115.853 248.099C115.853 246.599 115.853 246.099 114.978 245.599C114.103 245.099 113.228 244.974 113.603 244.099C113.978 243.224 114.603 243.099 115.228 241.974C115.853 240.849 115.978 240.599 115.978 239.724C115.978 238.849 116.353 238.724 114.978 238.099C113.603 237.474 110.853 235.099 110.853 235.099C110.853 235.099 112.478 234.724 108.978 235.224C105.478 235.724 105.228 237.724 104.228 236.474C103.228 235.224 104.978 230.849 103.728 230.224C102.478 229.599 102.603 230.474 101.853 228.849C101.103 227.224 101.728 225.849 101.353 224.474C100.978 223.099 101.353 225.224 100.353 220.599C99.3526 215.974 101.228 217.224 98.9776 214.599C96.7276 211.974 93.9776 212.224 93.7276 210.099C93.7276 210.099 93.7901 204.474 93.6026 203.974Z"
                className={getCountryClass("central-am")}
                fill={getFill("central-am")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_37">
                <path
                  id="Central America"
                  d="M111.41 216.164H110.477C110.46 216.043 110.425 215.936 110.372 215.842C110.32 215.747 110.252 215.666 110.17 215.599C110.088 215.533 109.992 215.482 109.884 215.446C109.778 215.411 109.662 215.393 109.537 215.393C109.311 215.393 109.115 215.449 108.947 215.561C108.779 215.672 108.649 215.834 108.557 216.047C108.465 216.259 108.419 216.516 108.419 216.818C108.419 217.129 108.465 217.391 108.557 217.602C108.651 217.814 108.782 217.974 108.949 218.082C109.117 218.19 109.311 218.244 109.531 218.244C109.654 218.244 109.769 218.227 109.874 218.195C109.98 218.162 110.075 218.114 110.157 218.052C110.24 217.988 110.308 217.911 110.362 217.82C110.417 217.729 110.456 217.625 110.477 217.509L111.41 217.513C111.386 217.713 111.326 217.906 111.229 218.092C111.134 218.277 111.005 218.442 110.843 218.589C110.683 218.734 110.491 218.849 110.268 218.934C110.046 219.018 109.796 219.06 109.516 219.06C109.127 219.06 108.779 218.972 108.472 218.795C108.166 218.619 107.925 218.364 107.747 218.031C107.571 217.697 107.483 217.293 107.483 216.818C107.483 216.342 107.573 215.938 107.752 215.604C107.931 215.27 108.174 215.016 108.48 214.841C108.787 214.665 109.132 214.577 109.516 214.577C109.769 214.577 110.003 214.612 110.219 214.683C110.436 214.754 110.629 214.858 110.796 214.994C110.964 215.129 111.1 215.295 111.206 215.491C111.312 215.687 111.38 215.911 111.41 216.164ZM113.546 219.064C113.209 219.064 112.92 218.996 112.677 218.859C112.435 218.722 112.249 218.527 112.119 218.276C111.988 218.023 111.922 217.724 111.922 217.379C111.922 217.042 111.988 216.746 112.119 216.492C112.249 216.238 112.433 216.04 112.67 215.898C112.909 215.756 113.189 215.685 113.51 215.685C113.726 215.685 113.927 215.719 114.113 215.789C114.3 215.857 114.464 215.96 114.603 216.098C114.744 216.236 114.853 216.409 114.931 216.618C115.009 216.825 115.048 217.068 115.048 217.347V217.596H112.285V217.033H114.194C114.194 216.903 114.165 216.787 114.109 216.686C114.052 216.585 113.973 216.506 113.872 216.45C113.773 216.391 113.657 216.362 113.525 216.362C113.387 216.362 113.265 216.394 113.158 216.458C113.053 216.521 112.971 216.605 112.911 216.712C112.851 216.817 112.821 216.934 112.82 217.063V217.598C112.82 217.76 112.849 217.9 112.909 218.018C112.97 218.136 113.056 218.227 113.167 218.29C113.278 218.354 113.409 218.386 113.561 218.386C113.662 218.386 113.754 218.372 113.838 218.344C113.922 218.315 113.994 218.273 114.053 218.216C114.113 218.159 114.158 218.089 114.19 218.007L115.029 218.062C114.986 218.264 114.899 218.44 114.767 218.591C114.636 218.74 114.467 218.857 114.26 218.94C114.054 219.023 113.816 219.064 113.546 219.064ZM116.548 217.108V219H115.641V215.727H116.506V216.305H116.544C116.616 216.114 116.738 215.964 116.908 215.853C117.079 215.741 117.285 215.685 117.528 215.685C117.756 215.685 117.954 215.734 118.123 215.834C118.292 215.933 118.423 216.075 118.517 216.26C118.611 216.443 118.658 216.662 118.658 216.916V219H117.75V217.078C117.751 216.878 117.7 216.722 117.597 216.609C117.493 216.496 117.35 216.439 117.168 216.439C117.046 216.439 116.938 216.465 116.844 216.518C116.752 216.57 116.68 216.647 116.627 216.748C116.576 216.847 116.55 216.967 116.548 217.108ZM121.114 215.727V216.409H119.143V215.727H121.114ZM119.59 214.943H120.498V217.994C120.498 218.078 120.511 218.143 120.536 218.19C120.562 218.236 120.597 218.268 120.643 218.286C120.69 218.305 120.744 218.314 120.805 218.314C120.847 218.314 120.89 218.31 120.933 218.303C120.975 218.295 121.008 218.288 121.031 218.284L121.173 218.96C121.128 218.974 121.064 218.99 120.982 219.009C120.899 219.028 120.799 219.04 120.681 219.045C120.462 219.053 120.271 219.024 120.106 218.957C119.943 218.891 119.815 218.787 119.725 218.646C119.634 218.506 119.589 218.328 119.59 218.114V214.943ZM121.705 219V215.727H122.585V216.298H122.619C122.679 216.095 122.779 215.942 122.919 215.838C123.06 215.733 123.222 215.68 123.405 215.68C123.451 215.68 123.5 215.683 123.552 215.689C123.605 215.695 123.651 215.702 123.691 215.712V216.518C123.648 216.505 123.589 216.494 123.514 216.484C123.439 216.474 123.37 216.469 123.307 216.469C123.174 216.469 123.054 216.498 122.949 216.556C122.846 216.613 122.763 216.692 122.702 216.795C122.642 216.897 122.613 217.015 122.613 217.148V219H121.705ZM125 219.062C124.791 219.062 124.605 219.026 124.441 218.953C124.278 218.879 124.149 218.771 124.054 218.627C123.96 218.482 123.913 218.302 123.913 218.086C123.913 217.904 123.946 217.751 124.013 217.628C124.08 217.504 124.171 217.405 124.286 217.33C124.401 217.254 124.532 217.197 124.678 217.159C124.826 217.121 124.98 217.094 125.142 217.078C125.333 217.058 125.486 217.04 125.603 217.023C125.719 217.004 125.804 216.977 125.856 216.942C125.909 216.906 125.935 216.854 125.935 216.784V216.771C125.935 216.636 125.892 216.532 125.807 216.458C125.723 216.384 125.604 216.347 125.449 216.347C125.286 216.347 125.156 216.384 125.059 216.456C124.963 216.527 124.899 216.616 124.867 216.724L124.028 216.656C124.071 216.457 124.154 216.286 124.279 216.141C124.404 215.994 124.566 215.882 124.763 215.804C124.962 215.724 125.192 215.685 125.453 215.685C125.635 215.685 125.809 215.706 125.975 215.749C126.143 215.791 126.291 215.857 126.421 215.947C126.551 216.036 126.654 216.151 126.73 216.292C126.805 216.431 126.843 216.598 126.843 216.793V219H125.982V218.546H125.956C125.904 218.648 125.833 218.739 125.745 218.817C125.657 218.893 125.551 218.954 125.428 218.998C125.304 219.04 125.161 219.062 125 219.062ZM125.259 218.435C125.393 218.435 125.511 218.409 125.613 218.357C125.715 218.303 125.796 218.23 125.854 218.139C125.912 218.048 125.941 217.945 125.941 217.83V217.483C125.913 217.501 125.874 217.518 125.824 217.534C125.776 217.548 125.721 217.562 125.66 217.575C125.599 217.586 125.538 217.597 125.477 217.607C125.416 217.615 125.36 217.623 125.311 217.63C125.204 217.646 125.111 217.67 125.032 217.705C124.952 217.739 124.89 217.785 124.846 217.843C124.802 217.9 124.78 217.971 124.78 218.056C124.78 218.18 124.825 218.274 124.914 218.339C125.005 218.403 125.12 218.435 125.259 218.435ZM128.454 214.636V219H127.547V214.636H128.454ZM106.812 226H105.823L107.33 221.636H108.519L110.023 226H109.034L107.941 222.634H107.907L106.812 226ZM106.75 224.285H109.085V225.005H106.75V224.285ZM110.531 226V222.727H111.396V223.305H111.435C111.503 223.113 111.616 222.962 111.775 222.851C111.935 222.74 112.125 222.685 112.347 222.685C112.571 222.685 112.762 222.741 112.92 222.853C113.077 222.964 113.182 223.114 113.235 223.305H113.269C113.336 223.117 113.457 222.967 113.631 222.855C113.807 222.741 114.016 222.685 114.256 222.685C114.561 222.685 114.809 222.782 114.999 222.977C115.191 223.17 115.287 223.444 115.287 223.799V226H114.381V223.978C114.381 223.796 114.333 223.66 114.236 223.569C114.14 223.478 114.019 223.433 113.874 223.433C113.709 223.433 113.581 223.485 113.489 223.59C113.396 223.694 113.35 223.831 113.35 224.001V226H112.47V223.959C112.47 223.798 112.424 223.67 112.332 223.575C112.241 223.48 112.121 223.433 111.972 223.433C111.871 223.433 111.78 223.458 111.699 223.509C111.619 223.559 111.556 223.629 111.509 223.72C111.462 223.81 111.439 223.915 111.439 224.036V226H110.531ZM117.495 226.064C117.159 226.064 116.869 225.996 116.626 225.859C116.384 225.722 116.198 225.527 116.068 225.276C115.937 225.023 115.872 224.724 115.872 224.379C115.872 224.042 115.937 223.746 116.068 223.492C116.198 223.238 116.382 223.04 116.62 222.898C116.858 222.756 117.138 222.685 117.459 222.685C117.675 222.685 117.876 222.719 118.062 222.789C118.25 222.857 118.413 222.96 118.552 223.098C118.693 223.236 118.802 223.409 118.88 223.618C118.958 223.825 118.997 224.068 118.997 224.347V224.596H116.234V224.033H118.143C118.143 223.903 118.115 223.787 118.058 223.686C118.001 223.585 117.922 223.506 117.821 223.45C117.722 223.391 117.606 223.362 117.474 223.362C117.336 223.362 117.214 223.394 117.108 223.458C117.002 223.521 116.92 223.605 116.86 223.712C116.801 223.817 116.77 223.934 116.769 224.063V224.598C116.769 224.76 116.799 224.9 116.858 225.018C116.919 225.136 117.005 225.227 117.116 225.29C117.227 225.354 117.358 225.386 117.51 225.386C117.611 225.386 117.703 225.372 117.787 225.344C117.871 225.315 117.943 225.273 118.002 225.216C118.062 225.159 118.108 225.089 118.139 225.007L118.978 225.062C118.936 225.264 118.848 225.44 118.716 225.591C118.585 225.74 118.416 225.857 118.209 225.94C118.003 226.023 117.765 226.064 117.495 226.064ZM119.59 226V222.727H120.47V223.298H120.504C120.563 223.095 120.664 222.942 120.804 222.838C120.945 222.733 121.107 222.68 121.29 222.68C121.335 222.68 121.384 222.683 121.437 222.689C121.49 222.695 121.536 222.702 121.576 222.712V223.518C121.533 223.505 121.474 223.494 121.399 223.484C121.323 223.474 121.255 223.469 121.192 223.469C121.059 223.469 120.939 223.498 120.834 223.556C120.73 223.613 120.648 223.692 120.587 223.795C120.527 223.897 120.497 224.015 120.497 224.148V226H119.59ZM122.045 226V222.727H122.953V226H122.045ZM122.501 222.305C122.366 222.305 122.25 222.261 122.153 222.171C122.058 222.08 122.011 221.972 122.011 221.845C122.011 221.72 122.058 221.613 122.153 221.523C122.25 221.433 122.366 221.387 122.501 221.387C122.636 221.387 122.751 221.433 122.846 221.523C122.943 221.613 122.991 221.72 122.991 221.845C122.991 221.972 122.943 222.08 122.846 222.171C122.751 222.261 122.636 222.305 122.501 222.305ZM125.158 226.064C124.823 226.064 124.535 225.993 124.293 225.851C124.053 225.707 123.869 225.509 123.739 225.254C123.611 225 123.547 224.707 123.547 224.376C123.547 224.041 123.612 223.747 123.741 223.494C123.872 223.24 124.057 223.042 124.297 222.9C124.538 222.756 124.823 222.685 125.154 222.685C125.44 222.685 125.69 222.737 125.904 222.84C126.119 222.944 126.288 223.089 126.413 223.277C126.538 223.464 126.607 223.685 126.62 223.938H125.763C125.739 223.774 125.675 223.643 125.572 223.543C125.469 223.442 125.335 223.392 125.169 223.392C125.028 223.392 124.905 223.43 124.8 223.507C124.697 223.582 124.616 223.692 124.557 223.837C124.499 223.982 124.47 224.158 124.47 224.364C124.47 224.572 124.498 224.75 124.555 224.896C124.614 225.043 124.695 225.154 124.8 225.231C124.905 225.308 125.028 225.346 125.169 225.346C125.273 225.346 125.366 225.325 125.448 225.282C125.532 225.239 125.601 225.178 125.655 225.097C125.71 225.014 125.746 224.915 125.763 224.8H126.62C126.606 225.05 126.538 225.271 126.415 225.461C126.295 225.65 126.128 225.798 125.915 225.904C125.702 226.011 125.449 226.064 125.158 226.064ZM128.134 226.062C127.926 226.062 127.739 226.026 127.576 225.953C127.413 225.879 127.283 225.771 127.188 225.627C127.095 225.482 127.048 225.302 127.048 225.086C127.048 224.904 127.081 224.751 127.148 224.628C127.215 224.504 127.305 224.405 127.421 224.33C127.536 224.254 127.666 224.197 127.813 224.159C127.96 224.121 128.115 224.094 128.277 224.078C128.467 224.058 128.621 224.04 128.737 224.023C128.854 224.004 128.938 223.977 128.991 223.942C129.043 223.906 129.07 223.854 129.07 223.784V223.771C129.07 223.636 129.027 223.532 128.942 223.458C128.858 223.384 128.739 223.347 128.584 223.347C128.421 223.347 128.291 223.384 128.194 223.456C128.097 223.527 128.033 223.616 128.002 223.724L127.163 223.656C127.205 223.457 127.289 223.286 127.414 223.141C127.539 222.994 127.7 222.882 127.898 222.804C128.097 222.724 128.327 222.685 128.588 222.685C128.77 222.685 128.944 222.706 129.11 222.749C129.278 222.791 129.426 222.857 129.555 222.947C129.686 223.036 129.789 223.151 129.864 223.292C129.94 223.431 129.977 223.598 129.977 223.793V226H129.117V225.546H129.091C129.038 225.648 128.968 225.739 128.88 225.817C128.792 225.893 128.686 225.954 128.563 225.998C128.439 226.04 128.296 226.062 128.134 226.062ZM128.394 225.435C128.528 225.435 128.646 225.409 128.748 225.357C128.85 225.303 128.93 225.23 128.989 225.139C129.047 225.048 129.076 224.945 129.076 224.83V224.483C129.048 224.501 129.009 224.518 128.959 224.534C128.911 224.548 128.856 224.562 128.795 224.575C128.734 224.586 128.673 224.597 128.612 224.607C128.551 224.615 128.495 224.623 128.445 224.63C128.339 224.646 128.246 224.67 128.166 224.705C128.087 224.739 128.025 224.785 127.981 224.843C127.937 224.9 127.915 224.971 127.915 225.056C127.915 225.18 127.96 225.274 128.049 225.339C128.14 225.403 128.255 225.435 128.394 225.435Z"
                  fill="black"
                ></path>
                <g id="Army_37">
                  <circle
                    id="armycircle_37"
                    cx="127"
                    cy="238"
                    r="5.5"
                    fill={getCircleFill("central-am")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("central-am")}
                  ></circle>
                  {getArmyNum("central-am", "127", "238")}
                </g>
              </g>
            </g>
            <g id="alberta">
              <path
                id="alberta_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M82.9741 99.5972C82.9741 99.5972 83.0991 99.7222 83.5991 101.222C84.0991 102.722 84.4741 103.722 85.5991 105.722C86.7241 107.722 85.7241 113.722 85.7241 113.722L87.7241 116.472C87.7241 116.472 89.3491 117.222 89.9741 117.347C90.5991 117.472 90.3491 120.597 90.2241 121.847C90.0991 123.097 88.5991 122.472 87.7241 122.722C86.8491 122.972 86.5991 125.097 86.4741 126.347C86.3491 127.597 84.1026 127.099 84.1026 127.099C84.7276 128.349 85.9776 128.474 86.4776 130.724C86.9776 132.974 86.7276 132.224 87.3526 133.099C87.9776 133.974 89.1026 134.099 89.3526 136.099C89.6026 138.099 89.6026 136.974 90.9776 139.599C92.3526 142.224 91.1026 143.349 91.3526 145.724C91.6026 148.099 92.8526 147.224 93.7276 148.474L94.0991 149.847L142.099 149.722L146.099 101.347C146.099 101.347 83.2241 99.5972 82.9741 99.5972Z"
                className={getCountryClass("alberta")}
                fill={getFill("alberta")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_38">
                <path
                  id="Alberta"
                  d="M109.154 117H108.165L109.672 112.636H110.861L112.365 117H111.376L110.283 113.634H110.249L109.154 117ZM109.092 115.285H111.427V116.005H109.092V115.285ZM113.781 112.636V117H112.873V112.636H113.781ZM114.525 117V112.636H115.432V114.277H115.46C115.5 114.189 115.557 114.099 115.633 114.009C115.709 113.916 115.809 113.839 115.931 113.778C116.055 113.716 116.208 113.685 116.391 113.685C116.63 113.685 116.85 113.747 117.052 113.872C117.253 113.996 117.415 114.183 117.535 114.433C117.656 114.681 117.717 114.993 117.717 115.368C117.717 115.733 117.658 116.041 117.54 116.293C117.423 116.543 117.264 116.732 117.062 116.862C116.862 116.989 116.638 117.053 116.389 117.053C116.213 117.053 116.063 117.024 115.94 116.966C115.817 116.908 115.717 116.835 115.639 116.746C115.561 116.657 115.501 116.567 115.46 116.476H115.42V117H114.525ZM115.413 115.364C115.413 115.558 115.44 115.728 115.494 115.873C115.548 116.018 115.626 116.131 115.729 116.212C115.831 116.291 115.955 116.331 116.101 116.331C116.249 116.331 116.374 116.29 116.476 116.21C116.579 116.127 116.656 116.013 116.709 115.869C116.763 115.722 116.79 115.554 116.79 115.364C116.79 115.175 116.763 115.009 116.711 114.865C116.658 114.722 116.581 114.609 116.479 114.528C116.376 114.447 116.251 114.407 116.101 114.407C115.954 114.407 115.829 114.446 115.726 114.524C115.626 114.602 115.548 114.713 115.494 114.857C115.44 115 115.413 115.169 115.413 115.364ZM119.814 117.064C119.477 117.064 119.187 116.996 118.944 116.859C118.703 116.722 118.517 116.527 118.386 116.276C118.255 116.023 118.19 115.724 118.19 115.379C118.19 115.042 118.255 114.746 118.386 114.492C118.517 114.238 118.701 114.04 118.938 113.898C119.177 113.756 119.456 113.685 119.777 113.685C119.993 113.685 120.194 113.719 120.38 113.789C120.568 113.857 120.731 113.96 120.87 114.098C121.011 114.236 121.12 114.409 121.199 114.618C121.277 114.825 121.316 115.068 121.316 115.347V115.596H118.552V115.033H120.461C120.461 114.903 120.433 114.787 120.376 114.686C120.319 114.585 120.241 114.506 120.14 114.45C120.04 114.391 119.924 114.362 119.792 114.362C119.655 114.362 119.532 114.394 119.426 114.458C119.321 114.521 119.238 114.605 119.179 114.712C119.119 114.817 119.089 114.934 119.087 115.063V115.598C119.087 115.76 119.117 115.9 119.177 116.018C119.238 116.136 119.324 116.227 119.434 116.29C119.545 116.354 119.677 116.386 119.829 116.386C119.929 116.386 120.022 116.372 120.106 116.344C120.189 116.315 120.261 116.273 120.321 116.216C120.38 116.159 120.426 116.089 120.457 116.007L121.297 116.062C121.254 116.264 121.167 116.44 121.035 116.591C120.904 116.74 120.735 116.857 120.527 116.94C120.321 117.023 120.084 117.064 119.814 117.064ZM121.908 117V113.727H122.788V114.298H122.822C122.882 114.095 122.982 113.942 123.123 113.838C123.263 113.733 123.425 113.68 123.608 113.68C123.654 113.68 123.703 113.683 123.755 113.689C123.808 113.695 123.854 113.702 123.894 113.712V114.518C123.851 114.505 123.792 114.494 123.717 114.484C123.642 114.474 123.573 114.469 123.51 114.469C123.377 114.469 123.258 114.498 123.152 114.556C123.049 114.613 122.966 114.692 122.905 114.795C122.846 114.897 122.816 115.015 122.816 115.148V117H121.908ZM126.268 113.727V114.409H124.297V113.727H126.268ZM124.745 112.943H125.652V115.994C125.652 116.078 125.665 116.143 125.691 116.19C125.716 116.236 125.752 116.268 125.797 116.286C125.844 116.305 125.898 116.314 125.959 116.314C126.002 116.314 126.044 116.31 126.087 116.303C126.13 116.295 126.162 116.288 126.185 116.284L126.328 116.96C126.282 116.974 126.218 116.99 126.136 117.009C126.054 117.028 125.953 117.04 125.835 117.045C125.617 117.053 125.425 117.024 125.26 116.957C125.097 116.891 124.97 116.787 124.879 116.646C124.788 116.506 124.743 116.328 124.745 116.114V112.943ZM127.793 117.062C127.584 117.062 127.398 117.026 127.234 116.953C127.071 116.879 126.942 116.771 126.847 116.627C126.753 116.482 126.706 116.302 126.706 116.086C126.706 115.904 126.739 115.751 126.806 115.628C126.873 115.504 126.964 115.405 127.079 115.33C127.194 115.254 127.324 115.197 127.471 115.159C127.619 115.121 127.773 115.094 127.935 115.078C128.126 115.058 128.279 115.04 128.396 115.023C128.512 115.004 128.597 114.977 128.649 114.942C128.702 114.906 128.728 114.854 128.728 114.784V114.771C128.728 114.636 128.685 114.532 128.6 114.458C128.516 114.384 128.397 114.347 128.242 114.347C128.079 114.347 127.949 114.384 127.852 114.456C127.756 114.527 127.692 114.616 127.66 114.724L126.821 114.656C126.864 114.457 126.947 114.286 127.072 114.141C127.197 113.994 127.359 113.882 127.556 113.804C127.755 113.724 127.985 113.685 128.246 113.685C128.428 113.685 128.602 113.706 128.768 113.749C128.936 113.791 129.084 113.857 129.214 113.947C129.344 114.036 129.447 114.151 129.523 114.292C129.598 114.431 129.636 114.598 129.636 114.793V117H128.775V116.546H128.749C128.697 116.648 128.626 116.739 128.538 116.817C128.45 116.893 128.344 116.954 128.221 116.998C128.097 117.04 127.954 117.062 127.793 117.062ZM128.052 116.435C128.186 116.435 128.304 116.409 128.406 116.357C128.508 116.303 128.589 116.23 128.647 116.139C128.705 116.048 128.734 115.945 128.734 115.83V115.483C128.706 115.501 128.667 115.518 128.617 115.534C128.569 115.548 128.514 115.562 128.453 115.575C128.392 115.586 128.331 115.597 128.27 115.607C128.209 115.615 128.153 115.623 128.104 115.63C127.997 115.646 127.904 115.67 127.824 115.705C127.745 115.739 127.683 115.785 127.639 115.843C127.595 115.9 127.573 115.971 127.573 116.056C127.573 116.18 127.618 116.274 127.707 116.339C127.798 116.403 127.913 116.435 128.052 116.435Z"
                  fill="black"
                ></path>
                <g id="Army_38">
                  <circle
                    id="armycircle_38"
                    cx="119"
                    cy="126"
                    r="5.5"
                    fill={getCircleFill("alberta")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("alberta")}
                  ></circle>
                  {getArmyNum("alberta", "119", "126")}
                </g>
              </g>
            </g>
            <g id="venezuela">
              <path
                id="venezuela_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M146.978 299.724C148.853 298.474 148.478 295.974 148.478 295.224C148.478 294.474 148.478 293.099 148.478 292.099C148.478 291.099 148.353 290.349 149.478 289.099C150.603 287.849 151.228 286.724 151.228 286.724L152.478 285.599V283.599L153.228 281.349C153.228 281.349 153.728 280.224 153.853 279.724C153.978 279.224 153.603 277.224 153.603 277.224L153.853 275.599L156.978 274.724C156.978 274.724 157.353 275.099 158.353 274.724C159.353 274.349 160.353 273.474 160.353 273.474L162.603 272.224C162.603 272.224 164.103 271.224 164.603 270.724C165.103 270.224 166.853 269.599 166.853 269.599C166.853 269.599 167.728 269.349 168.353 269.349C168.978 269.349 171.103 268.724 171.103 268.724C171.103 268.724 171.228 268.099 171.978 267.599C172.728 267.099 173.228 266.474 173.853 266.349C174.478 266.224 177.853 265.724 177.853 265.724C177.853 265.724 179.103 266.599 179.228 267.849C179.353 269.099 178.853 269.849 179.853 269.724C180.853 269.599 181.853 269.349 182.353 269.099C182.853 268.849 182.603 267.724 183.853 268.599C185.103 269.474 185.228 269.724 185.728 269.724C186.228 269.724 187.603 269.349 187.603 269.349L193.103 271.224C193.103 271.224 194.353 270.974 194.978 270.849C195.603 270.724 198.728 270.474 198.728 270.474C198.728 270.474 200.103 270.849 200.603 271.349C201.103 271.849 204.228 273.724 205.228 275.224C206.228 276.724 207.728 277.224 207.978 277.849C208.228 278.474 209.228 279.099 209.728 279.099C210.228 279.099 210.228 280.099 210.853 280.224C211.478 280.349 212.853 280.349 212.853 280.349C212.853 280.349 212.978 280.849 213.478 281.474C213.978 282.099 215.103 280.849 215.353 282.224C215.603 283.599 215.228 284.349 215.978 284.349C216.728 284.349 217.478 283.849 217.478 283.849L218.728 283.349C218.728 283.349 218.728 282.349 219.728 283.349C220.728 284.349 221.478 284.099 222.353 284.349C223.228 284.599 221.978 285.224 224.103 285.724C226.228 286.224 228.228 286.474 228.728 286.474C229.228 286.474 229.228 284.474 230.978 286.099C232.728 287.724 233.978 288.474 233.978 288.474C233.978 288.474 229.648 292.048 229.118 293.109C228.588 294.169 228.234 296.467 226.997 296.644C225.759 296.821 218.335 297.175 218.335 297.175C218.335 297.175 218.688 299.296 217.627 299.296C216.567 299.296 206.137 298.942 206.137 298.942L204.723 294.7C204.723 294.7 203.485 295.584 203.309 293.816C203.132 292.048 203.132 289.22 203.132 289.22C203.132 289.22 200.48 290.634 198.889 291.164C197.298 291.694 195.884 294.346 194.47 293.816C193.055 293.285 192.348 291.518 191.995 292.932C191.641 294.346 192.172 298.589 191.111 298.942C190.05 299.296 189.697 298.677 188.813 299.738C187.929 300.798 185.542 301.064 184.835 300.445C184.128 299.826 183.598 299.119 182.802 298.854C182.007 298.589 181.565 298.147 180.681 298.058C179.797 297.97 179.62 297.528 178.913 298.324C178.206 299.119 176.704 300.445 176.438 301.152C176.173 301.859 174.759 304.422 175.113 305.395C175.466 306.367 176.88 306.102 176.88 307.87C176.88 309.637 176.35 310.521 175.378 310.786C174.406 311.052 169.544 312.643 169.544 312.643C169.544 312.643 168.749 310.521 168.218 309.991C167.688 309.461 166.716 309.195 166.009 309.019C165.302 308.842 164.152 307.604 163.269 307.693C162.385 307.781 160.087 307.781 159.468 307.074C158.849 306.367 157.789 305.571 156.198 305.483C154.607 305.395 153.899 306.544 152.839 304.864C151.778 303.185 149.834 300.887 149.303 300.798C148.773 300.71 146.298 300.445 146.978 299.724Z"
                className={getCountryClass("venezuela")}
                fill={getFill("venezuela")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_39">
                <path
                  id="Venezuela"
                  d="M168.225 271.636L169.28 274.952H169.32L170.377 271.636H171.4L169.896 276H168.707L167.2 271.636H168.225ZM173.03 276.064C172.694 276.064 172.404 275.996 172.161 275.859C171.92 275.722 171.734 275.527 171.603 275.276C171.472 275.023 171.407 274.724 171.407 274.379C171.407 274.042 171.472 273.746 171.603 273.492C171.734 273.238 171.918 273.04 172.155 272.898C172.393 272.756 172.673 272.685 172.994 272.685C173.21 272.685 173.411 272.719 173.597 272.789C173.785 272.857 173.948 272.96 174.087 273.098C174.228 273.236 174.337 273.409 174.415 273.618C174.494 273.825 174.533 274.068 174.533 274.347V274.596H171.769V274.033H173.678C173.678 273.903 173.65 273.787 173.593 273.686C173.536 273.585 173.457 273.506 173.356 273.45C173.257 273.391 173.141 273.362 173.009 273.362C172.871 273.362 172.749 273.394 172.643 273.458C172.538 273.521 172.455 273.605 172.396 273.712C172.336 273.817 172.305 273.934 172.304 274.063V274.598C172.304 274.76 172.334 274.9 172.393 275.018C172.454 275.136 172.54 275.227 172.651 275.29C172.762 275.354 172.893 275.386 173.045 275.386C173.146 275.386 173.239 275.372 173.322 275.344C173.406 275.315 173.478 275.273 173.538 275.216C173.597 275.159 173.643 275.089 173.674 275.007L174.513 275.062C174.471 275.264 174.383 275.44 174.251 275.591C174.121 275.74 173.952 275.857 173.744 275.94C173.538 276.023 173.3 276.064 173.03 276.064ZM176.033 274.108V276H175.125V272.727H175.99V273.305H176.028C176.101 273.114 176.222 272.964 176.393 272.853C176.563 272.741 176.77 272.685 177.013 272.685C177.24 272.685 177.438 272.734 177.607 272.834C177.776 272.933 177.908 273.075 178.001 273.26C178.095 273.443 178.142 273.662 178.142 273.916V276H177.234V274.078C177.236 273.878 177.185 273.722 177.081 273.609C176.977 273.496 176.834 273.439 176.653 273.439C176.53 273.439 176.422 273.465 176.329 273.518C176.236 273.57 176.164 273.647 176.111 273.748C176.06 273.847 176.034 273.967 176.033 274.108ZM180.349 276.064C180.012 276.064 179.722 275.996 179.479 275.859C179.238 275.722 179.052 275.527 178.921 275.276C178.791 275.023 178.725 274.724 178.725 274.379C178.725 274.042 178.791 273.746 178.921 273.492C179.052 273.238 179.236 273.04 179.473 272.898C179.712 272.756 179.992 272.685 180.313 272.685C180.528 272.685 180.729 272.719 180.916 272.789C181.103 272.857 181.266 272.96 181.406 273.098C181.546 273.236 181.656 273.409 181.734 273.618C181.812 273.825 181.851 274.068 181.851 274.347V274.596H179.087V274.033H180.997C180.997 273.903 180.968 273.787 180.911 273.686C180.854 273.585 180.776 273.506 180.675 273.45C180.575 273.391 180.46 273.362 180.328 273.362C180.19 273.362 180.068 273.394 179.961 273.458C179.856 273.521 179.774 273.605 179.714 273.712C179.654 273.817 179.624 273.934 179.622 274.063V274.598C179.622 274.76 179.652 274.9 179.712 275.018C179.773 275.136 179.859 275.227 179.97 275.29C180.08 275.354 180.212 275.386 180.364 275.386C180.465 275.386 180.557 275.372 180.641 275.344C180.725 275.315 180.796 275.273 180.856 275.216C180.916 275.159 180.961 275.089 180.992 275.007L181.832 275.062C181.789 275.264 181.702 275.44 181.57 275.591C181.439 275.74 181.27 275.857 181.063 275.94C180.857 276.023 180.619 276.064 180.349 276.064ZM182.426 276V275.459L184.028 273.475V273.452H182.482V272.727H185.122V273.317L183.617 275.252V275.276H185.177V276H182.426ZM187.97 274.607V272.727H188.877V276H188.006V275.406H187.972C187.898 275.597 187.775 275.751 187.603 275.868C187.433 275.984 187.225 276.043 186.979 276.043C186.76 276.043 186.568 275.993 186.402 275.893C186.235 275.794 186.105 275.653 186.012 275.469C185.919 275.286 185.872 275.067 185.871 274.811V272.727H186.779V274.649C186.78 274.842 186.832 274.995 186.934 275.107C187.036 275.219 187.174 275.276 187.345 275.276C187.455 275.276 187.557 275.251 187.652 275.201C187.747 275.15 187.824 275.075 187.882 274.975C187.942 274.876 187.971 274.753 187.97 274.607ZM191.095 276.064C190.758 276.064 190.468 275.996 190.226 275.859C189.984 275.722 189.798 275.527 189.667 275.276C189.537 275.023 189.471 274.724 189.471 274.379C189.471 274.042 189.537 273.746 189.667 273.492C189.798 273.238 189.982 273.04 190.219 272.898C190.458 272.756 190.738 272.685 191.059 272.685C191.275 272.685 191.476 272.719 191.662 272.789C191.849 272.857 192.013 272.96 192.152 273.098C192.292 273.236 192.402 273.409 192.48 273.618C192.558 273.825 192.597 274.068 192.597 274.347V274.596H189.834V274.033H191.743C191.743 273.903 191.714 273.787 191.657 273.686C191.601 273.585 191.522 273.506 191.421 273.45C191.321 273.391 191.206 273.362 191.074 273.362C190.936 273.362 190.814 273.394 190.707 273.458C190.602 273.521 190.52 273.605 190.46 273.712C190.4 273.817 190.37 273.934 190.368 274.063V274.598C190.368 274.76 190.398 274.9 190.458 275.018C190.519 275.136 190.605 275.227 190.716 275.29C190.826 275.354 190.958 275.386 191.11 275.386C191.211 275.386 191.303 275.372 191.387 275.344C191.471 275.315 191.542 275.273 191.602 275.216C191.662 275.159 191.707 275.089 191.738 275.007L192.578 275.062C192.535 275.264 192.448 275.44 192.316 275.591C192.185 275.74 192.016 275.857 191.809 275.94C191.603 276.023 191.365 276.064 191.095 276.064ZM194.097 271.636V276H193.189V271.636H194.097ZM195.757 276.062C195.549 276.062 195.362 276.026 195.199 275.953C195.036 275.879 194.907 275.771 194.811 275.627C194.718 275.482 194.671 275.302 194.671 275.086C194.671 274.904 194.704 274.751 194.771 274.628C194.838 274.504 194.929 274.405 195.044 274.33C195.159 274.254 195.289 274.197 195.436 274.159C195.583 274.121 195.738 274.094 195.9 274.078C196.09 274.058 196.244 274.04 196.36 274.023C196.477 274.004 196.561 273.977 196.614 273.942C196.666 273.906 196.693 273.854 196.693 273.784V273.771C196.693 273.636 196.65 273.532 196.565 273.458C196.481 273.384 196.362 273.347 196.207 273.347C196.044 273.347 195.914 273.384 195.817 273.456C195.72 273.527 195.657 273.616 195.625 273.724L194.786 273.656C194.828 273.457 194.912 273.286 195.037 273.141C195.162 272.994 195.323 272.882 195.521 272.804C195.72 272.724 195.95 272.685 196.211 272.685C196.393 272.685 196.567 272.706 196.733 272.749C196.901 272.791 197.049 272.857 197.179 272.947C197.309 273.036 197.412 273.151 197.487 273.292C197.563 273.431 197.6 273.598 197.6 273.793V276H196.74V275.546H196.714C196.661 275.648 196.591 275.739 196.503 275.817C196.415 275.893 196.309 275.954 196.186 275.998C196.062 276.04 195.919 276.062 195.757 276.062ZM196.017 275.435C196.151 275.435 196.269 275.409 196.371 275.357C196.473 275.303 196.554 275.23 196.612 275.139C196.67 275.048 196.699 274.945 196.699 274.83V274.483C196.671 274.501 196.632 274.518 196.582 274.534C196.534 274.548 196.479 274.562 196.418 274.575C196.357 274.586 196.296 274.597 196.235 274.607C196.174 274.615 196.118 274.623 196.068 274.63C195.962 274.646 195.869 274.67 195.789 274.705C195.71 274.739 195.648 274.785 195.604 274.843C195.56 274.9 195.538 274.971 195.538 275.056C195.538 275.18 195.583 275.274 195.672 275.339C195.763 275.403 195.878 275.435 196.017 275.435Z"
                  fill="black"
                ></path>
                <g id="Army_39">
                  <circle
                    id="armycircle_39"
                    cx="182"
                    cy="285"
                    r="5.5"
                    fill={getCircleFill("venezuela")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("venezuela")}
                  ></circle>
                  {getArmyNum("venezuela", "182", "285")}
                </g>
              </g>
            </g>
            <g id="brazil">
              <path
                id="brazil_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M233.978 288.474C233.978 288.474 229.648 292.048 229.118 293.109C228.588 294.169 228.234 296.467 226.997 296.644C225.759 296.821 218.335 297.175 218.335 297.175C218.335 297.175 218.688 299.296 217.627 299.296C216.567 299.296 206.137 298.942 206.137 298.942L204.723 294.7C204.723 294.7 203.485 295.584 203.309 293.816C203.132 292.048 203.132 289.22 203.132 289.22C203.132 289.22 200.48 290.634 198.889 291.164C197.298 291.694 195.884 294.346 194.47 293.816C193.055 293.285 192.348 291.518 191.995 292.932C191.641 294.346 192.172 298.589 191.111 298.942C190.05 299.296 189.697 298.677 188.813 299.738C187.929 300.798 185.542 301.064 184.835 300.445C184.128 299.826 183.598 299.119 182.802 298.854C182.007 298.589 181.565 298.147 180.681 298.058C179.797 297.97 179.62 297.528 178.913 298.324C178.206 299.119 176.704 300.445 176.438 301.152C176.173 301.859 174.759 304.422 175.113 305.395C175.466 306.367 176.88 306.102 176.88 307.87C176.88 309.637 176.35 310.521 175.378 310.786C174.406 311.052 169.544 312.643 169.544 312.643C169.544 312.643 165.478 312.599 165.353 313.224C165.228 313.849 165.478 317.724 164.478 318.474C163.478 319.224 160.728 318.849 160.603 319.849C160.478 320.849 158.478 321.474 159.228 322.849C159.978 324.224 161.353 325.474 162.353 325.474C163.353 325.474 164.603 325.599 164.728 326.599C164.853 327.599 168.353 327.724 169.728 328.474C171.103 329.224 174.603 327.349 174.353 329.474C174.103 331.599 170.478 331.974 170.228 333.349C169.978 334.724 169.853 337.724 172.603 337.599C175.353 337.474 177.853 335.599 179.728 335.224C181.603 334.849 183.478 334.849 183.978 334.349C184.478 333.849 184.853 332.599 185.853 332.474C186.853 332.349 189.228 333.474 189.978 334.724C190.728 335.974 190.853 337.099 192.353 337.224C193.853 337.349 193.353 338.224 194.478 338.724C195.603 339.224 196.603 338.724 197.603 339.349C198.603 339.974 198.603 342.099 200.228 342.099C201.853 342.099 204.103 340.974 204.728 342.224C205.353 343.474 205.978 345.224 206.728 345.974C207.478 346.724 206.978 347.724 207.228 348.474C207.478 349.224 208.978 349.349 210.103 350.224C211.228 351.099 211.353 351.599 211.728 353.349C212.103 355.099 212.978 355.099 213.728 356.599C214.478 358.099 215.728 361.349 215.478 362.474C215.228 363.599 214.478 364.974 215.978 365.849C217.478 366.724 218.103 367.224 218.978 368.599C219.853 369.974 220.478 369.474 221.103 369.974C221.728 370.474 222.103 372.349 222.478 374.974C222.853 377.599 225.728 378.599 225.853 380.349C225.978 382.099 226.103 383.349 225.478 383.474C224.853 383.599 223.603 384.724 223.478 386.474C223.353 388.224 220.103 389.099 220.103 389.099C220.103 389.099 217.978 390.599 218.228 391.599C218.478 392.599 223.228 391.849 223.228 392.474C223.228 393.099 222.478 397.599 222.978 397.724C223.478 397.849 226.728 396.724 227.228 397.349C227.728 397.974 226.603 401.849 226.853 402.224C227.103 402.599 229.978 404.724 230.665 404.162C231.978 403.724 231.228 403.599 231.478 402.849C231.728 402.099 231.728 402.224 232.353 401.349C232.978 400.474 232.603 400.474 232.853 399.724C233.103 398.974 233.478 398.349 233.978 397.849C234.478 397.349 234.728 397.224 234.978 396.474C235.228 395.724 235.103 395.349 235.228 394.099C235.353 392.849 236.853 392.724 238.228 392.224C239.603 391.724 239.478 390.224 239.603 388.974C239.728 387.724 239.228 388.599 239.228 387.224C239.228 385.849 239.103 385.349 238.978 383.974C238.853 382.599 239.103 383.474 239.728 382.849C240.353 382.224 240.353 379.474 241.853 376.349C243.353 373.224 254.353 372.349 254.853 372.224C255.353 372.099 258.228 371.099 258.603 370.599C258.978 370.099 260.228 368.974 261.228 368.474C262.228 367.974 261.603 367.099 261.853 365.974C262.103 364.849 262.353 365.224 262.978 364.974C263.603 364.724 263.478 363.974 264.103 363.099C264.728 362.224 264.103 361.349 264.478 360.599C264.853 359.849 265.978 359.599 266.853 359.224C267.728 358.849 267.228 357.599 267.978 356.849C268.728 356.099 267.978 353.474 267.978 351.849C267.978 350.224 267.978 350.099 268.728 349.099C269.478 348.099 268.478 346.099 268.478 346.099L268.728 344.349C268.728 344.349 268.353 342.349 268.603 341.349C268.853 340.349 269.853 339.849 271.353 338.849C272.853 337.849 271.853 335.599 271.853 335.599V333.849C271.853 333.849 274.103 332.849 275.853 332.849C277.603 332.849 277.603 330.349 279.103 328.849C280.603 327.349 279.853 325.849 280.103 324.599C280.353 325.099 279.853 323.849 279.478 322.724C279.103 321.599 279.353 321.099 279.103 319.349C278.853 317.599 277.853 316.849 276.853 315.849C275.853 314.849 274.478 315.099 273.603 314.849C272.728 314.599 272.228 312.974 271.353 312.724C270.478 312.474 267.103 310.099 265.228 309.849C263.353 309.599 263.228 309.724 262.353 308.724C261.478 307.724 260.978 308.349 260.353 308.349C259.728 308.349 258.728 308.849 257.978 308.349C257.228 307.849 256.853 308.099 255.728 308.099C254.603 308.099 253.603 307.724 253.103 306.849C252.603 305.974 252.603 305.849 251.853 305.474C251.103 305.099 250.228 305.349 249.478 304.974C248.728 304.599 247.853 304.224 247.103 304.099C246.353 303.974 245.478 304.224 244.728 304.099C243.978 303.974 242.228 303.599 241.603 303.599C240.978 303.599 239.103 303.974 238.228 303.974C237.353 303.974 235.853 302.474 234.603 301.974C233.353 301.474 235.728 301.849 237.603 299.599C239.478 297.349 236.853 295.974 236.353 295.099C235.853 294.224 235.728 293.474 234.978 290.849C234.228 288.224 233.978 288.474 233.978 288.474Z"
                className={getCountryClass("brazil")}
                fill={getFill("brazil")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_40">
                <path
                  id="Brazil"
                  d="M229.126 322V317.636H230.873C231.195 317.636 231.462 317.684 231.677 317.779C231.891 317.874 232.052 318.006 232.16 318.175C232.268 318.343 232.322 318.536 232.322 318.755C232.322 318.925 232.288 319.075 232.22 319.205C232.152 319.332 232.058 319.437 231.939 319.52C231.821 319.601 231.686 319.658 231.534 319.692V319.735C231.7 319.742 231.856 319.789 232.001 319.876C232.147 319.962 232.266 320.084 232.356 320.24C232.447 320.395 232.493 320.58 232.493 320.794C232.493 321.026 232.435 321.232 232.32 321.414C232.207 321.594 232.038 321.737 231.815 321.842C231.592 321.947 231.317 322 230.991 322H229.126ZM230.049 321.246H230.801C231.058 321.246 231.246 321.197 231.364 321.099C231.481 320.999 231.54 320.867 231.54 320.702C231.54 320.582 231.511 320.475 231.453 320.383C231.395 320.29 231.312 320.218 231.204 320.165C231.097 320.113 230.97 320.087 230.822 320.087H230.049V321.246ZM230.049 319.462H230.733C230.859 319.462 230.972 319.44 231.07 319.396C231.169 319.351 231.247 319.287 231.304 319.205C231.362 319.122 231.391 319.023 231.391 318.908C231.391 318.751 231.335 318.624 231.223 318.527C231.112 318.43 230.954 318.382 230.75 318.382H230.049V319.462ZM233.076 322V318.727H233.956V319.298H233.99C234.05 319.095 234.15 318.942 234.291 318.838C234.431 318.733 234.593 318.68 234.776 318.68C234.822 318.68 234.871 318.683 234.923 318.689C234.976 318.695 235.022 318.702 235.062 318.712V319.518C235.019 319.505 234.96 319.494 234.885 319.484C234.81 319.474 234.741 319.469 234.678 319.469C234.545 319.469 234.426 319.498 234.32 319.556C234.217 319.613 234.134 319.692 234.073 319.795C234.014 319.897 233.984 320.015 233.984 320.148V322H233.076ZM236.371 322.062C236.162 322.062 235.976 322.026 235.812 321.953C235.649 321.879 235.52 321.771 235.425 321.627C235.331 321.482 235.284 321.302 235.284 321.086C235.284 320.904 235.317 320.751 235.384 320.628C235.451 320.504 235.542 320.405 235.657 320.33C235.772 320.254 235.903 320.197 236.049 320.159C236.197 320.121 236.351 320.094 236.513 320.078C236.704 320.058 236.857 320.04 236.974 320.023C237.09 320.004 237.175 319.977 237.227 319.942C237.28 319.906 237.306 319.854 237.306 319.784V319.771C237.306 319.636 237.263 319.532 237.178 319.458C237.094 319.384 236.975 319.347 236.82 319.347C236.657 319.347 236.527 319.384 236.43 319.456C236.334 319.527 236.27 319.616 236.239 319.724L235.399 319.656C235.442 319.457 235.525 319.286 235.65 319.141C235.775 318.994 235.937 318.882 236.134 318.804C236.333 318.724 236.563 318.685 236.824 318.685C237.006 318.685 237.18 318.706 237.347 318.749C237.514 318.791 237.663 318.857 237.792 318.947C237.922 319.036 238.025 319.151 238.101 319.292C238.176 319.431 238.214 319.598 238.214 319.793V322H237.353V321.546H237.327C237.275 321.648 237.204 321.739 237.116 321.817C237.028 321.893 236.922 321.954 236.799 321.998C236.675 322.04 236.533 322.062 236.371 322.062ZM236.631 321.435C236.764 321.435 236.882 321.409 236.984 321.357C237.087 321.303 237.167 321.23 237.225 321.139C237.283 321.048 237.312 320.945 237.312 320.83V320.483C237.284 320.501 237.245 320.518 237.195 320.534C237.147 320.548 237.092 320.562 237.031 320.575C236.97 320.586 236.909 320.597 236.848 320.607C236.787 320.615 236.731 320.623 236.682 320.63C236.575 320.646 236.482 320.67 236.403 320.705C236.323 320.739 236.261 320.785 236.217 320.843C236.173 320.9 236.151 320.971 236.151 321.056C236.151 321.18 236.196 321.274 236.285 321.339C236.376 321.403 236.491 321.435 236.631 321.435ZM238.901 322V321.459L240.503 319.475V319.452H238.956V318.727H241.596V319.317L240.092 321.252V321.276H241.652V322H238.901ZM242.346 322V318.727H243.253V322H242.346ZM242.802 318.305C242.667 318.305 242.551 318.261 242.454 318.171C242.359 318.08 242.312 317.972 242.312 317.845C242.312 317.72 242.359 317.613 242.454 317.523C242.551 317.433 242.667 317.387 242.802 317.387C242.937 317.387 243.052 317.433 243.147 317.523C243.243 317.613 243.292 317.72 243.292 317.845C243.292 317.972 243.243 318.08 243.147 318.171C243.052 318.261 242.937 318.305 242.802 318.305ZM244.888 317.636V322H243.98V317.636H244.888Z"
                  fill="black"
                ></path>
                <g id="Army_40">
                  <circle
                    id="armycircle_40"
                    cx="237"
                    cy="331"
                    r="5.5"
                    fill={getCircleFill("brazil")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("brazil")}
                  ></circle>
                  {getArmyNum("brazil", "237", "331")}
                </g>
              </g>
            </g>
            <g id="peru">
              <path
                id="peru_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M176.728 357.349C177.603 357.099 177.728 358.974 177.478 359.974C177.228 360.974 177.603 361.974 178.728 363.099C179.853 364.224 181.103 365.474 181.603 366.349C182.103 367.224 183.353 367.974 183.603 368.974C183.853 369.974 184.228 370.974 185.478 371.974C186.728 372.974 187.478 371.849 187.728 371.099C187.978 370.349 187.603 368.599 187.853 366.849C188.103 365.099 190.353 367.099 190.353 367.099C190.353 367.099 191.228 368.974 191.603 369.599C191.978 370.224 193.603 369.974 194.353 369.224C195.103 368.474 195.603 368.599 196.103 368.599C196.603 368.599 197.603 369.599 199.353 369.349C201.103 369.099 201.228 368.974 202.728 370.349C204.228 371.724 202.978 372.474 204.353 373.349C205.728 374.224 205.728 373.349 206.603 373.724C207.478 374.099 206.978 375.224 208.353 376.099C209.728 376.974 213.353 376.224 214.603 376.724C215.853 377.224 214.603 378.349 214.603 379.224C214.603 380.099 214.603 382.474 213.978 382.724C213.353 382.974 212.478 384.724 212.603 386.099C212.728 387.474 215.978 386.099 217.353 385.474C218.728 384.849 219.353 384.974 220.728 383.724C222.103 382.474 225.853 380.349 225.853 380.349C225.728 378.599 222.853 377.599 222.478 374.974C222.103 372.349 221.728 370.474 221.103 369.974C220.478 369.474 219.853 369.974 218.978 368.599C218.103 367.224 217.478 366.724 215.978 365.849C214.478 364.974 215.228 363.599 215.478 362.474C215.728 361.349 214.478 358.099 213.728 356.599C212.978 355.099 212.103 355.099 211.728 353.349C211.353 351.599 211.228 351.099 210.103 350.224C208.978 349.349 207.478 349.224 207.228 348.474C206.978 347.724 207.478 346.724 206.728 345.974C205.978 345.224 205.353 343.474 204.728 342.224C204.103 340.974 201.853 342.099 200.228 342.099C198.603 342.099 198.603 339.974 197.603 339.349C196.603 338.724 195.603 339.224 194.478 338.724C193.353 338.224 193.853 337.349 192.353 337.224C190.853 337.099 190.728 335.974 189.978 334.724C189.228 333.474 186.853 332.349 185.853 332.474C184.853 332.599 184.478 333.849 183.978 334.349C183.478 334.849 181.603 334.849 179.728 335.224C177.853 335.599 175.353 337.474 172.603 337.599C169.853 337.724 169.978 334.724 170.228 333.349C170.478 331.974 174.103 331.599 174.353 329.474C174.603 327.349 171.103 329.224 169.728 328.474C168.353 327.724 164.853 327.599 164.728 326.599C164.603 325.599 163.353 325.474 162.353 325.474C161.353 325.474 159.978 324.224 159.228 322.849C158.478 321.474 160.478 320.849 160.603 319.849C160.728 318.849 163.478 319.224 164.478 318.474C165.478 317.724 165.228 313.849 165.353 313.224C165.478 312.599 169.544 312.643 169.544 312.643C169.544 312.643 168.749 310.521 168.218 309.991C167.688 309.461 166.716 309.195 166.009 309.019C165.302 308.842 164.153 307.604 163.269 307.693C162.385 307.781 160.087 307.781 159.468 307.074C158.849 306.367 157.789 305.571 156.198 305.483C154.607 305.395 153.899 306.544 152.839 304.864C151.778 303.185 149.834 300.887 149.303 300.798C148.773 300.71 146.298 300.445 146.978 299.724C145.103 300.974 145.228 303.474 144.478 305.349C143.728 307.224 143.103 307.974 142.478 309.974C141.853 311.974 142.853 311.474 143.603 313.599C144.353 315.724 143.353 314.599 142.978 315.849C142.603 317.099 142.853 321.099 142.853 321.099C142.853 321.099 143.728 323.724 144.228 324.224C144.728 324.724 146.728 326.974 146.728 326.974C146.728 326.974 146.478 328.599 146.978 330.599C147.478 332.599 148.353 331.849 148.853 332.849C149.353 333.849 151.353 335.974 151.978 336.474C152.603 336.974 153.978 339.099 155.353 339.599C156.728 340.099 155.728 341.974 155.603 342.974C155.478 343.974 156.978 346.224 157.478 347.224C157.978 348.224 158.228 347.474 158.728 348.224C159.228 348.974 160.603 349.974 161.478 350.474C162.353 350.974 163.228 351.099 163.228 351.099C163.228 351.099 164.478 352.224 165.353 352.849C166.228 353.474 167.353 353.724 168.103 353.974C168.853 354.224 170.103 356.974 170.728 357.599C170.728 357.599 173.478 358.724 174.103 358.849C174.728 358.974 175.853 357.474 176.728 357.349Z"
                className={getCountryClass("peru")}
                fill={getFill("peru")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_41">
                <path
                  id="Peru"
                  d="M181.577 341V336.636H183.298C183.629 336.636 183.911 336.7 184.144 336.826C184.377 336.951 184.555 337.125 184.677 337.348C184.8 337.57 184.862 337.825 184.862 338.115C184.862 338.405 184.8 338.661 184.675 338.882C184.55 339.104 184.368 339.276 184.131 339.4C183.895 339.523 183.61 339.585 183.275 339.585H182.177V338.846H183.126C183.303 338.846 183.449 338.815 183.564 338.754C183.681 338.692 183.768 338.606 183.824 338.496C183.883 338.386 183.912 338.259 183.912 338.115C183.912 337.97 183.883 337.844 183.824 337.736C183.768 337.626 183.681 337.542 183.564 337.482C183.448 337.421 183.3 337.391 183.121 337.391H182.499V341H181.577ZM186.883 341.064C186.546 341.064 186.257 340.996 186.014 340.859C185.772 340.722 185.586 340.527 185.455 340.276C185.325 340.023 185.259 339.724 185.259 339.379C185.259 339.042 185.325 338.746 185.455 338.492C185.586 338.238 185.77 338.04 186.007 337.898C186.246 337.756 186.526 337.685 186.847 337.685C187.063 337.685 187.264 337.719 187.45 337.789C187.637 337.857 187.801 337.96 187.94 338.098C188.08 338.236 188.19 338.409 188.268 338.618C188.346 338.825 188.385 339.068 188.385 339.347V339.596H185.622V339.033H187.531C187.531 338.903 187.502 338.787 187.445 338.686C187.389 338.585 187.31 338.506 187.209 338.45C187.11 338.391 186.994 338.362 186.862 338.362C186.724 338.362 186.602 338.394 186.495 338.458C186.39 338.521 186.308 338.605 186.248 338.712C186.188 338.817 186.158 338.934 186.156 339.063V339.598C186.156 339.76 186.186 339.9 186.246 340.018C186.307 340.136 186.393 340.227 186.504 340.29C186.615 340.354 186.746 340.386 186.898 340.386C186.999 340.386 187.091 340.372 187.175 340.344C187.259 340.315 187.33 340.273 187.39 340.216C187.45 340.159 187.495 340.089 187.526 340.007L188.366 340.062C188.323 340.264 188.236 340.44 188.104 340.591C187.973 340.74 187.804 340.857 187.597 340.94C187.391 341.023 187.153 341.064 186.883 341.064ZM188.977 341V337.727H189.857V338.298H189.892C189.951 338.095 190.051 337.942 190.192 337.838C190.333 337.733 190.494 337.68 190.678 337.68C190.723 337.68 190.772 337.683 190.825 337.689C190.877 337.695 190.923 337.702 190.963 337.712V338.518C190.921 338.505 190.862 338.494 190.786 338.484C190.711 338.474 190.642 338.469 190.58 338.469C190.446 338.469 190.327 338.498 190.222 338.556C190.118 338.613 190.036 338.692 189.975 338.795C189.915 338.897 189.885 339.015 189.885 339.148V341H188.977ZM193.531 339.607V337.727H194.439V341H193.567V340.406H193.533C193.46 340.597 193.337 340.751 193.165 340.868C192.994 340.984 192.786 341.043 192.54 341.043C192.322 341.043 192.129 340.993 191.963 340.893C191.797 340.794 191.667 340.653 191.573 340.469C191.481 340.286 191.434 340.067 191.433 339.811V337.727H192.34V339.649C192.342 339.842 192.393 339.995 192.496 340.107C192.598 340.219 192.735 340.276 192.907 340.276C193.016 340.276 193.119 340.251 193.214 340.201C193.309 340.15 193.386 340.075 193.444 339.975C193.504 339.876 193.533 339.753 193.531 339.607Z"
                  fill="black"
                ></path>
                <g id="Army_41">
                  <circle
                    id="armycircle_41"
                    cx="188"
                    cy="350"
                    r="5.5"
                    fill={getCircleFill("peru")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("peru")}
                  ></circle>
                  {getArmyNum("peru", "188", "350")}
                </g>
              </g>
            </g>
            <g id="argentina">
              <path
                id="argentina_2"
                fillRule="evenodd"
                clipRule="evenodd"
                onClick={(e) => countryClick(e)}
                d="M225.853 380.349C225.978 382.099 226.103 383.349 225.478 383.474C224.853 383.599 223.603 384.724 223.478 386.474C223.353 388.224 220.103 389.099 220.103 389.099C220.103 389.099 217.978 390.599 218.228 391.599C218.478 392.599 223.228 391.849 223.228 392.474C223.228 393.099 222.478 397.599 222.978 397.724C223.478 397.849 226.728 396.724 227.228 397.349C227.728 397.974 226.603 401.849 226.853 402.224C227.103 402.599 229.978 404.724 230.634 404.131C229.228 404.474 225.978 405.974 226.603 406.849C227.228 407.724 228.103 407.974 226.603 408.349C225.103 408.724 225.353 408.599 223.853 408.849C222.353 409.099 222.603 408.974 220.978 409.349C219.353 409.724 219.103 410.224 218.103 410.349C217.103 410.474 216.603 410.224 215.978 410.224C215.353 410.224 214.853 410.224 214.853 410.849C214.853 411.474 214.728 411.599 215.353 412.099C215.978 412.599 217.728 413.099 217.853 413.599C217.978 414.099 217.978 414.474 217.978 415.349C217.978 416.224 218.103 416.349 218.603 416.474C219.103 416.599 219.228 416.724 219.353 417.224C219.478 417.724 218.103 419.474 217.353 419.974C216.603 420.474 215.978 421.099 214.228 421.224C212.478 421.349 212.853 421.099 211.728 421.724C210.603 422.349 210.603 422.474 209.353 422.474C208.103 422.474 207.728 422.474 206.478 422.724C205.228 422.974 204.353 423.224 204.353 423.224C204.353 423.224 204.853 423.974 204.978 424.724C205.103 425.474 205.728 425.599 205.228 426.724C204.728 427.849 203.853 428.349 203.478 428.849C203.103 429.349 203.103 429.099 203.103 430.099L200.478 430.474C200.478 430.474 199.603 429.724 199.353 430.849C199.103 431.974 200.353 432.974 200.353 432.974C200.353 432.974 198.603 435.599 198.853 436.224C199.103 436.849 199.728 437.849 199.478 438.349C199.228 438.849 199.353 439.099 198.728 439.599C198.103 440.099 198.603 440.599 198.228 441.099C197.853 441.599 197.478 442.349 196.603 442.724C195.728 443.099 195.478 443.724 195.478 443.724L194.853 444.849C194.853 444.849 194.353 445.474 194.978 446.224C195.603 446.974 196.228 446.474 195.853 447.849C195.478 449.224 195.603 449.599 195.603 449.599C195.603 449.599 196.853 448.224 196.728 451.974C196.603 455.724 195.978 456.599 195.978 456.599C195.978 456.599 195.353 456.474 195.603 457.599C195.853 458.724 196.353 459.724 195.728 460.349C195.103 460.974 195.228 459.974 194.228 461.974C193.228 463.974 194.228 466.724 194.853 467.349C195.478 467.974 195.978 468.099 195.853 469.349C195.728 470.599 195.103 470.724 195.603 471.599C196.103 472.474 197.728 473.099 197.978 473.974C198.228 474.849 197.728 475.474 198.228 476.099C198.728 476.724 199.353 477.224 199.353 477.224C199.353 477.224 199.103 478.224 199.103 479.349C199.103 480.474 198.603 480.349 198.603 481.349C198.603 482.349 198.603 483.599 199.103 482.349C199.603 481.099 199.478 481.099 199.978 480.599C200.478 480.099 202.103 480.099 202.603 480.099C203.103 480.099 203.603 479.349 204.478 479.724C205.353 480.099 205.478 479.724 205.978 480.974C206.478 482.224 206.228 482.474 207.228 482.724C208.228 482.974 209.103 482.849 210.103 482.849C211.103 482.849 211.353 482.099 211.603 483.224C211.853 484.349 213.353 484.724 211.853 485.224C210.353 485.724 210.103 485.224 208.603 485.724C207.103 486.224 207.103 486.224 206.603 486.349C206.103 486.474 206.103 486.849 205.228 487.224C204.353 487.599 204.853 487.974 203.228 487.599C201.603 487.224 202.228 487.724 201.103 486.974C199.978 486.224 199.478 485.849 199.478 485.349C199.478 484.849 198.728 484.349 198.728 484.349L195.853 481.849C195.853 481.849 195.603 481.849 194.478 481.849C193.353 481.849 193.228 481.849 192.478 481.849C191.728 481.849 191.228 481.224 191.228 481.224L189.478 481.287C189.478 481.287 189.04 480.849 189.29 480.287C189.54 479.724 189.54 479.724 189.228 479.662C188.915 479.599 188.04 479.537 187.478 479.349C186.915 479.162 187.478 478.349 187.353 478.099C187.228 477.849 186.04 477.849 185.415 477.787C184.79 477.724 183.915 477.412 183.415 476.787C182.915 476.162 183.04 475.974 181.978 475.099C180.915 474.224 181.228 474.099 180.29 473.787C179.353 473.474 179.04 473.537 178.853 472.787C178.665 472.037 177.915 471.912 177.603 471.162C177.29 470.412 177.603 469.912 176.728 469.349C175.853 468.787 175.665 469.224 175.54 468.037C175.415 466.849 175.728 466.287 175.415 465.662C175.103 465.037 175.29 465.537 174.79 464.787C174.29 464.037 174.04 463.912 173.853 463.037C173.665 462.162 173.665 461.724 173.353 461.162C173.04 460.599 172.478 460.349 172.415 459.724C172.353 459.099 172.353 458.849 172.353 458.287C172.353 457.724 172.54 457.287 172.228 456.037C171.915 454.787 172.103 454.474 171.478 453.724C170.853 452.974 170.79 453.474 170.29 451.849C169.79 450.224 169.228 449.974 169.54 449.162C169.853 448.349 170.04 448.224 170.103 447.599C170.165 446.974 170.54 447.099 170.603 446.224C170.665 445.349 170.665 445.599 170.665 444.412C170.665 443.224 169.915 444.724 170.79 441.474C171.665 438.224 171.665 438.349 171.728 437.599C171.79 436.849 172.978 436.724 172.54 435.412C172.103 434.099 171.853 434.099 171.978 433.224C172.103 432.349 172.603 431.974 172.478 431.537C172.353 431.099 172.54 431.287 172.353 430.787C172.165 430.287 172.853 430.537 172.04 429.912C171.228 429.287 170.978 429.412 170.853 428.474C170.728 427.537 170.728 426.787 170.79 423.099C170.853 419.412 170.603 419.162 171.228 418.099C171.853 417.037 172.165 416.912 172.165 416.037C172.165 415.162 172.665 414.037 172.29 412.974C171.915 411.912 171.603 411.787 171.978 411.162C172.353 410.537 172.665 410.537 172.665 409.787C172.665 409.037 172.665 410.099 172.728 408.474C172.79 406.849 172.29 408.037 172.915 405.912C173.54 403.787 173.79 401.662 173.853 400.599C173.915 399.537 173.978 399.224 173.665 398.599C173.353 397.974 172.915 394.974 172.915 393.974C172.915 392.974 173.103 393.224 173.353 392.224C173.603 391.224 173.665 391.037 173.603 390.724C173.54 390.412 173.603 390.099 173.79 389.287C173.978 388.474 173.603 386.787 174.29 385.037C174.978 383.287 175.165 383.974 174.978 382.724C174.79 381.474 173.353 379.474 173.79 378.099C174.228 376.724 174.665 376.974 174.603 375.162C174.54 373.349 174.353 370.912 174.79 369.912C175.228 368.912 175.478 365.474 175.29 364.662L175.478 364.599C175.853 361.724 174.353 359.224 174.353 359.224C174.353 359.224 175.853 357.599 176.728 357.349C177.603 357.099 177.728 358.974 177.478 359.974C177.228 360.974 177.603 361.974 178.728 363.099C179.853 364.224 181.103 365.474 181.603 366.349C182.103 367.224 183.353 367.974 183.603 368.974C183.853 369.974 184.228 370.974 185.478 371.974C186.728 372.974 187.478 371.849 187.728 371.099C187.978 370.349 187.603 368.599 187.853 366.849C188.103 365.099 190.353 367.099 190.353 367.099C190.353 367.099 191.228 368.974 191.603 369.599C191.978 370.224 193.603 369.974 194.353 369.224C195.103 368.474 195.603 368.599 196.103 368.599C196.603 368.599 197.603 369.599 199.353 369.349C201.103 369.099 201.228 368.974 202.728 370.349C204.228 371.724 202.978 372.474 204.353 373.349C205.728 374.224 205.728 373.349 206.603 373.724C207.478 374.099 206.978 375.224 208.353 376.099C209.728 376.974 213.353 376.224 214.603 376.724C215.853 377.224 214.603 378.349 214.603 379.224C214.603 380.099 214.603 382.474 213.978 382.724C213.353 382.974 212.478 384.724 212.603 386.099C212.728 387.474 215.978 386.099 217.353 385.474C218.728 384.849 219.353 384.974 220.728 383.724C222.103 382.474 225.853 380.349 225.853 380.349Z"
                className={getCountryClass("argentina")}
                fill={getFill("argentina")}
                stroke="black"
                strokeWidth="1.2"
                strokeMiterlimit="4.32165"
              ></path>
              <g id="Country info_42">
                <path
                  id="Argentina"
                  d="M183.588 399H182.6L184.106 394.636H185.295L186.799 399H185.811L184.718 395.634H184.684L183.588 399ZM183.527 397.285H185.862V398.005H183.527V397.285ZM187.308 399V395.727H188.188V396.298H188.222C188.281 396.095 188.381 395.942 188.522 395.838C188.663 395.733 188.825 395.68 189.008 395.68C189.053 395.68 189.102 395.683 189.155 395.689C189.207 395.695 189.254 395.702 189.293 395.712V396.518C189.251 396.505 189.192 396.494 189.116 396.484C189.041 396.474 188.972 396.469 188.91 396.469C188.776 396.469 188.657 396.498 188.552 396.556C188.448 396.613 188.366 396.692 188.305 396.795C188.245 396.897 188.215 397.015 188.215 397.148V399H187.308ZM191.085 400.295C190.791 400.295 190.539 400.255 190.328 400.174C190.119 400.094 189.953 399.986 189.83 399.848C189.706 399.71 189.626 399.555 189.589 399.384L190.428 399.271C190.454 399.336 190.494 399.397 190.55 399.454C190.605 399.511 190.678 399.556 190.769 399.59C190.862 399.626 190.974 399.643 191.106 399.643C191.303 399.643 191.466 399.595 191.594 399.499C191.723 399.403 191.788 399.244 191.788 399.019V398.42H191.749C191.71 398.511 191.65 398.597 191.57 398.678C191.491 398.759 191.389 398.825 191.264 398.876C191.139 398.928 190.99 398.953 190.816 398.953C190.57 398.953 190.347 398.896 190.145 398.783C189.945 398.668 189.785 398.492 189.666 398.256C189.548 398.019 189.489 397.719 189.489 397.357C189.489 396.987 189.549 396.677 189.67 396.428C189.791 396.18 189.951 395.994 190.151 395.87C190.353 395.746 190.574 395.685 190.814 395.685C190.997 395.685 191.151 395.716 191.274 395.778C191.398 395.839 191.497 395.916 191.573 396.009C191.649 396.099 191.708 396.189 191.749 396.277H191.784V395.727H192.685V399.032C192.685 399.31 192.617 399.543 192.48 399.731C192.344 399.918 192.155 400.059 191.914 400.153C191.673 400.248 191.397 400.295 191.085 400.295ZM191.104 398.271C191.25 398.271 191.374 398.235 191.475 398.163C191.577 398.089 191.655 397.984 191.709 397.847C191.764 397.71 191.792 397.545 191.792 397.353C191.792 397.161 191.765 396.995 191.711 396.854C191.657 396.712 191.579 396.602 191.477 396.524C191.374 396.446 191.25 396.407 191.104 396.407C190.955 396.407 190.829 396.447 190.727 396.528C190.624 396.608 190.547 396.719 190.494 396.861C190.442 397.003 190.416 397.167 190.416 397.353C190.416 397.542 190.442 397.705 190.494 397.843C190.548 397.979 190.626 398.085 190.727 398.161C190.829 398.234 190.955 398.271 191.104 398.271ZM194.899 399.064C194.562 399.064 194.272 398.996 194.029 398.859C193.788 398.722 193.602 398.527 193.471 398.276C193.34 398.023 193.275 397.724 193.275 397.379C193.275 397.042 193.34 396.746 193.471 396.492C193.602 396.238 193.786 396.04 194.023 395.898C194.262 395.756 194.541 395.685 194.862 395.685C195.078 395.685 195.279 395.719 195.465 395.789C195.653 395.857 195.816 395.96 195.955 396.098C196.096 396.236 196.205 396.409 196.284 396.618C196.362 396.825 196.401 397.068 196.401 397.347V397.596H193.637V397.033H195.546C195.546 396.903 195.518 396.787 195.461 396.686C195.404 396.585 195.325 396.506 195.225 396.45C195.125 396.391 195.009 396.362 194.877 396.362C194.74 396.362 194.617 396.394 194.511 396.458C194.406 396.521 194.323 396.605 194.264 396.712C194.204 396.817 194.173 396.934 194.172 397.063V397.598C194.172 397.76 194.202 397.9 194.262 398.018C194.323 398.136 194.409 398.227 194.519 398.29C194.63 398.354 194.762 398.386 194.914 398.386C195.014 398.386 195.107 398.372 195.191 398.344C195.274 398.315 195.346 398.273 195.406 398.216C195.465 398.159 195.511 398.089 195.542 398.007L196.382 398.062C196.339 398.264 196.252 398.44 196.119 398.591C195.989 398.74 195.82 398.857 195.612 398.94C195.406 399.023 195.169 399.064 194.899 399.064ZM197.901 397.108V399H196.993V395.727H197.858V396.305H197.896C197.969 396.114 198.09 395.964 198.261 395.853C198.431 395.741 198.638 395.685 198.881 395.685C199.108 395.685 199.306 395.734 199.475 395.834C199.644 395.933 199.776 396.075 199.869 396.26C199.963 396.443 200.01 396.662 200.01 396.916V399H199.102V397.078C199.104 396.878 199.053 396.722 198.949 396.609C198.845 396.496 198.703 396.439 198.521 396.439C198.399 396.439 198.291 396.465 198.197 396.518C198.105 396.57 198.032 396.647 197.98 396.748C197.928 396.847 197.902 396.967 197.901 397.108ZM202.466 395.727V396.409H200.495V395.727H202.466ZM200.943 394.943H201.85V397.994C201.85 398.078 201.863 398.143 201.889 398.19C201.914 398.236 201.95 398.268 201.995 398.286C202.042 398.305 202.096 398.314 202.157 398.314C202.2 398.314 202.243 398.31 202.285 398.303C202.328 398.295 202.36 398.288 202.383 398.284L202.526 398.96C202.48 398.974 202.417 398.99 202.334 399.009C202.252 399.028 202.152 399.04 202.034 399.045C201.815 399.053 201.623 399.024 201.458 398.957C201.295 398.891 201.168 398.787 201.077 398.646C200.986 398.506 200.941 398.328 200.943 398.114V394.943ZM203.058 399V395.727H203.965V399H203.058ZM203.513 395.305C203.379 395.305 203.263 395.261 203.166 395.171C203.071 395.08 203.023 394.972 203.023 394.845C203.023 394.72 203.071 394.613 203.166 394.523C203.263 394.433 203.379 394.387 203.513 394.387C203.648 394.387 203.763 394.433 203.859 394.523C203.955 394.613 204.004 394.72 204.004 394.845C204.004 394.972 203.955 395.08 203.859 395.171C203.763 395.261 203.648 395.305 203.513 395.305ZM205.6 397.108V399H204.692V395.727H205.557V396.305H205.596C205.668 396.114 205.79 395.964 205.96 395.853C206.131 395.741 206.337 395.685 206.58 395.685C206.807 395.685 207.006 395.734 207.175 395.834C207.344 395.933 207.475 396.075 207.569 396.26C207.662 396.443 207.709 396.662 207.709 396.916V399H206.802V397.078C206.803 396.878 206.752 396.722 206.648 396.609C206.545 396.496 206.402 396.439 206.22 396.439C206.098 396.439 205.99 396.465 205.896 396.518C205.804 396.57 205.731 396.647 205.679 396.748C205.628 396.847 205.601 396.967 205.6 397.108ZM209.358 399.062C209.149 399.062 208.963 399.026 208.8 398.953C208.636 398.879 208.507 398.771 208.412 398.627C208.318 398.482 208.271 398.302 208.271 398.086C208.271 397.904 208.305 397.751 208.371 397.628C208.438 397.504 208.529 397.405 208.644 397.33C208.759 397.254 208.89 397.197 209.036 397.159C209.184 397.121 209.339 397.094 209.501 397.078C209.691 397.058 209.844 397.04 209.961 397.023C210.077 397.004 210.162 396.977 210.214 396.942C210.267 396.906 210.293 396.854 210.293 396.784V396.771C210.293 396.636 210.251 396.532 210.165 396.458C210.082 396.384 209.962 396.347 209.808 396.347C209.644 396.347 209.514 396.384 209.418 396.456C209.321 396.527 209.257 396.616 209.226 396.724L208.386 396.656C208.429 396.457 208.513 396.286 208.638 396.141C208.763 395.994 208.924 395.882 209.121 395.804C209.32 395.724 209.55 395.685 209.812 395.685C209.994 395.685 210.168 395.706 210.334 395.749C210.501 395.791 210.65 395.857 210.779 395.947C210.91 396.036 211.013 396.151 211.088 396.292C211.163 396.431 211.201 396.598 211.201 396.793V399H210.34V398.546H210.315C210.262 398.648 210.192 398.739 210.104 398.817C210.016 398.893 209.91 398.954 209.786 398.998C209.663 399.04 209.52 399.062 209.358 399.062ZM209.618 398.435C209.751 398.435 209.869 398.409 209.972 398.357C210.074 398.303 210.154 398.23 210.212 398.139C210.271 398.048 210.3 397.945 210.3 397.83V397.483C210.271 397.501 210.232 397.518 210.183 397.534C210.134 397.548 210.08 397.562 210.018 397.575C209.957 397.586 209.896 397.597 209.835 397.607C209.774 397.615 209.719 397.623 209.669 397.63C209.563 397.646 209.469 397.67 209.39 397.705C209.31 397.739 209.249 397.785 209.205 397.843C209.161 397.9 209.138 397.971 209.138 398.056C209.138 398.18 209.183 398.274 209.273 398.339C209.364 398.403 209.479 398.435 209.618 398.435Z"
                  fill="black"
                ></path>
                <g id="Army_42">
                  <circle
                    id="armycircle_42"
                    cx="197"
                    cy="408"
                    r="5.5"
                    fill={getCircleFill("argentina")}
                    className="pointer-events-none"
                    stroke={getCircleStroke("argentina")}
                  ></circle>
                  {getArmyNum("argentina", "197", "408")}
                </g>
              </g>
            </g>
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_1_2"
            x="315.205"
            y="132.396"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter1_f_1_2"
            x="316.542"
            y="114.614"
            width="14.9222"
            height="20.6616"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter2_f_1_2"
            x="328.455"
            y="113.396"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter3_f_1_2"
            x="329.704"
            y="114.464"
            width="24.849"
            height="15.4617"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter4_f_1_2"
            x="351.705"
            y="126.896"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter5_f_1_2"
            x="352.355"
            y="128.392"
            width="2.54688"
            height="35.3557"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter6_f_1_2"
            x="351.455"
            y="161.146"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter7_f_1_2"
            x="316.394"
            y="133.505"
            width="37.9683"
            height="30.6304"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter8_f_1_2"
            x="316.883"
            y="128.152"
            width="37.4902"
            height="7.33659"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter9_f_1_2"
            x="320.205"
            y="194.521"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter10_f_1_2"
            x="313.776"
            y="183.264"
            width="9.4544"
            height="14.1114"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter11_f_1_2"
            x="312.83"
            y="182.021"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter12_f_1_2"
            x="392.812"
            y="250.71"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter13_f_1_2"
            x="393.814"
            y="252.171"
            width="3.50815"
            height="19.3823"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter14_f_1_2"
            x="394.403"
            y="268.918"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter15_f_1_2"
            x="457.512"
            y="311.344"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter16_f_1_2"
            x="450.461"
            y="312.219"
            width="10.0679"
            height="14.1918"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter17_f_1_2"
            x="449.381"
            y="323.542"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter18_f_1_2"
            x="622.268"
            y="311.167"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter19_f_1_2"
            x="623.466"
            y="312.524"
            width="9.47991"
            height="26.3079"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter20_f_1_2"
            x="629.87"
            y="336.093"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter21_f_1_2"
            x="631.264"
            y="337.458"
            width="20.0473"
            height="6.14003"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter22_f_1_2"
            x="305.484"
            y="309.93"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter23_f_1_2"
            x="281.037"
            y="310.949"
            width="27.1828"
            height="9.48256"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter24_f_1_2"
            x="279.675"
            y="317.354"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter25_f_1_2"
            x="230.205"
            y="59.1465"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter26_f_1_2"
            x="215.743"
            y="60.4555"
            width="17.5211"
            height="38.9789"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter27_f_1_2"
            x="214.705"
            y="96.6465"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter28_f_1_2"
            x="163.408"
            y="59.9944"
            width="69.6912"
            height="52.1511"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter29_f_1_2"
            x="162.205"
            y="109.146"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter30_f_1_2"
            x="194.846"
            y="59.9086"
            width="38.0659"
            height="10.3226"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter31_f_1_2"
            x="193.455"
            y="67.1465"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter32_f_1_2"
            x="301.955"
            y="93.8965"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter33_f_1_2"
            x="282.628"
            y="77.2685"
            width="22.2515"
            height="19.6029"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter34_f_1_2"
            x="281.455"
            y="76.3965"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter35_f_1_2"
            x="653.381"
            y="155.25"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter36_f_1_2"
            x="654.562"
            y="156.365"
            width="24.3622"
            height="20.6054"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter37_f_1_2"
            x="676.008"
            y="173.988"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter38_f_1_2"
            x="645.254"
            y="174.995"
            width="33.433"
            height="7.3869"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter39_f_1_2"
            x="643.835"
            y="179.292"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter40_f_1_2"
            x="653.027"
            y="342.28"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter41_f_1_2"
            x="653.32"
            y="343.772"
            width="2.80388"
            height="48.8414"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter42_f_1_2"
            x="652.32"
            y="390.01"
            width="4.09691"
            height="4.09694"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter43_f_1_2"
            x="642.207"
            y="382.624"
            width="13.0106"
            height="10.3822"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter44_f_1_2"
            x="640.955"
            y="381.646"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter45_f_1_2"
            x="666.705"
            y="378.021"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter46_f_1_2"
            x="653.988"
            y="343.592"
            width="15.7803"
            height="37.2059"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter47_f_1_2"
            x="453.977"
            y="378.342"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter48_f_1_2"
            x="454.963"
            y="379.808"
            width="10.331"
            height="47.0244"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter49_f_1_2"
            x="462.205"
            y="424.146"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter50_f_1_2"
            x="441.169"
            y="425.236"
            width="23.9185"
            height="17.4174"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter51_f_1_2"
            x="439.955"
            y="439.646"
            width="4.09691"
            height="4.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter52_f_1_2"
            x="9.2924"
            y="96.6764"
            width="19.4817"
            height="2.09691"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
          <filter
            id="filter53_f_1_2"
            x="677.858"
            y="99.3281"
            width="44.9456"
            height="2.45044"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              stdDeviation="0.274228"
              result="effect1_foregroundBlur_1_2"
            ></feGaussianBlur>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
