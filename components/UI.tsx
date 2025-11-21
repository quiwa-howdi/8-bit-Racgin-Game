import React from 'react';
import { GameState, RaceStats } from '../types';

interface UIProps {
  gameState: GameState;
  score: number; 
  onStart: () => void;
  onRestart: () => void;
  lastStats: RaceStats | null;
}

const UI: React.FC<UIProps> = ({ 
  gameState, 
  onStart, 
  onRestart, 
  lastStats, 
}) => {
  
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 z-40 p-4 sm:p-8 text-center">
        <h1 className="text-2xl sm:text-4xl md:text-5xl text-yellow-400 mb-4 sm:mb-8 animate-pulse tracking-widest drop-shadow-[4px_4px_0_rgba(180,83,9,1)]">
          RETRO RACER
        </h1>
        <p className="text-gray-400 mb-6 sm:mb-8 text-[10px] sm:text-xs md:text-sm max-w-md leading-5 sm:leading-6">
          SWIPE OR ARROWS TO STEER.<br/>
          SPEED INCREASES AUTOMATICALLY.<br/>
          HIT HEARTS FOR EXTRA LIVES.<br/>
          SURVIVE AS LONG AS YOU CAN.
        </p>
        <button 
          onClick={onStart}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all font-bold text-sm sm:text-xl"
        >
          INSERT COIN (START)
        </button>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/90 z-40 p-4 sm:p-6 text-center">
        <h2 className="text-4xl sm:text-5xl text-red-600 mb-12 animate-bounce tracking-widest drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
            CRASHED
        </h2>
        
        {lastStats && (
          <div className="flex flex-col items-center mb-16">
             <span className="text-gray-400 text-sm sm:text-base tracking-[0.4em] mb-4 uppercase">Distance Traveled</span>
             <span className="text-5xl sm:text-7xl text-yellow-400 font-bold drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                {Math.floor(lastStats.distance)}<span className="text-2xl sm:text-4xl ml-2 text-yellow-600">m</span>
             </span>
          </div>
        )}

        <button 
          onClick={onRestart}
          className="px-8 sm:px-12 py-4 sm:py-6 bg-blue-600 hover:bg-blue-500 text-white border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all font-bold text-xl sm:text-2xl tracking-wider"
        >
          RETRY
        </button>
      </div>
    );
  }

  return null;
};

export default UI;