
import React from 'react';

interface GameOverScreenProps {
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart }) => {
  return (
    <div className="text-center bg-black bg-opacity-70 p-10 rounded-lg border-2 border-red-500">
      <h2 className="text-5xl text-red-500 mb-8" style={{ fontFamily: "'Press Start 2P', cursive" }}>GAME OVER</h2>
      <button
        onClick={onRestart}
        className="px-8 py-4 bg-gray-300 text-gray-900 text-2xl font-bold rounded hover:bg-white transition-colors duration-200"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        RESTART
      </button>
    </div>
  );
};

export default GameOverScreen;
