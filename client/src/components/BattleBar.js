import React from "react";

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

const getCountryOwner = (gameData, country) => {
  let playerIndex = gameData.map[country].owner;
  console.log(playerIndex);
  let player = gameData.players.find((p) => p.index == playerIndex);
  return player.name;
};

const getCountryColor = (gameData, country) => {
  let playerIndex = gameData.map[country].owner;
  return indexMapColors.default[playerIndex];
};

const getPercentage = (gameData, attacker = true) => {
  let ongoingBattle = gameData.turn.metadata.ongoingBattle;

  let attackerCountry;
  let defenderCountry;

  attackerCountry = ongoingBattle.attacker;
  defenderCountry = ongoingBattle.defender;

  let attackerArmies = gameData.map[attackerCountry].armies;
  let defenderArmies = gameData.map[defenderCountry].armies;

  let denominator = attackerArmies + defenderArmies;
  let attackerFrac = attackerArmies / denominator;
  let defenderFrac = defenderArmies / denominator;

  let attackerPc = Math.round(attackerFrac * 100000) / 1000;
  let defenderPc = Math.round(defenderFrac * 100000) / 1000;

  attackerPc = `${attackerPc}%`;
  defenderPc = `${defenderPc}%`;

  if (attacker) {
    return attackerPc;
  } else {
    return defenderPc;
  }
};

export default function BattleBar({ gameData }) {
  return (
    <div className="flex flex-row flex-1 w-full my-2">
      <div className="flex flex-row">
        <p className="bg-neutral-700 text-white p-2 rounded-s-lg">
          {getCountryOwner(
            gameData,
            gameData.turn.metadata.ongoingBattle.attacker
          )}
        </p>
      </div>
      <div className="flex-1 relative flex relative justify-between">
        <div
          style={{ width: getPercentage(gameData, true) }}
          className={`duration-100 bg-[${getCountryColor(
            gameData,
            gameData.turn.metadata.ongoingBattle.attacker
          )}]`}
        ></div>
        <div
          style={{ width: getPercentage(gameData, false) }}
          className={`duration-100 bg-[${getCountryColor(
            gameData,
            gameData.turn.metadata.ongoingBattle.defender
          )}]`}
        ></div>
      </div>
      <div>
        <p className="bg-neutral-700 text-white p-2 rounded-e-lg">
          {getCountryOwner(
            gameData,
            gameData.turn.metadata.ongoingBattle.defender
          )}
        </p>
      </div>
    </div>
  );
}
