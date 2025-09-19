
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="text-center bg-black bg-opacity-70 p-10 rounded-lg border-2 border-yellow-400">
      <h2 className="text-3xl text-white mb-6" style={{ fontFamily: "'Press Start 2P', cursive" }}>Instructions</h2>
      <p className="text-lg text-gray-300 mb-2">Arrow Keys: Move Tank</p>
      <p className="text-lg text-gray-300 mb-8">Spacebar: Shoot</p>
      <button
        onClick={onStart}
        className="px-8 py-4 bg-yellow-400 text-gray-900 text-2xl font-bold rounded hover:bg-yellow-300 transition-colors duration-200 animate-pulse"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        START
      </button>
    </div>
  );
};

export default StartScreen;
