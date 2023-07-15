import React, { useEffect, useState } from "react";

const loadColors = {
  0: "#CC6761",
  1: "#BB59BD",
  2: "#E1E460",
  3: "#A8E2AA",
  4: "#EDA461",
  5: "#79D0E3",
};

const getPercentage = (startTime, endTime, setTime) => {
  let timeLeft = endTime - Date.now();
  let totalTime = endTime - startTime;

  let pcNum = 1 - timeLeft / totalTime;
  pcNum *= 100;
  pcNum = Math.floor(pcNum * 10000) / 10000;

  let outPc = `${pcNum}%`;

  if (Date.now() < endTime) {
    setTimeout(() => {
      setTime(Date.now());
    }, 100);
  }

  return outPc;
};

const getSecsLeft = (turn) => {
  let timeLeft = turn.end - Date.now();
  timeLeft = Math.round(timeLeft / 1000);

  if (timeLeft < 0) {
    return 0;
  }

  return timeLeft;
};

export default function LoadingBar({ turn }) {
  const [timeState, setTimeState] = useState(Date.now());

  return (
    <div className="bg-white border h-8 border-neutral-500 relative overflow-hidden w-full p-2 rounded-2xl">
      <div className="hidden bg-[#CC6761] bg-[#BB59BD] bg-[#E1E460] bg-[#A8E2AA] bg-[#EDA461] bg-[#79D0E3]"></div>
      <div
        style={{ width: getPercentage(turn.start, turn.end, setTimeState) }}
        className={`duration-75 absolute h-full bg-[${loadColors[turn.player]}] left-0 top-0`}
      ></div>
      <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center">
        <div className="bg-black rounded-lg w-24 opacity-70">
          <p className="text-white text-center py-1">
            {getSecsLeft(turn)} seconds
          </p>
        </div>
      </div>
    </div>
  );
}
