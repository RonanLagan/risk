import React, { useEffect, useRef, useState } from 'react'

import Map from './Map';

export default function GameBoard({gameData, myUid, socket, selectedAttackFrom, selectAttackCountry, setSelectedAttackFrom, setSelectAttackCountry}) {
    return (
    <div className="border border-neutral-400 flex-1 flex relative">
        <Map setSelectAttackCountry={setSelectAttackCountry} socket={socket} gameData={gameData} map={gameData.map} myUid={myUid} setSelectedAttackFrom={setSelectedAttackFrom} selectAttackCountry={selectAttackCountry} selectedAttackFrom={selectedAttackFrom} gameStarted={gameData.countriesChosen}/>
    </div>
  )
}
