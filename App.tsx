
import React, { useState, useCallback } from 'react';
import GameScreen from './components/GameScreen';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [gameId, setGameId] = useState(0); // Used to reset the game state by changing the key

  const handleStart = useCallback(() => {
    setGameState(GameState.Playing);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GameOver);
  }, []);
  
  const handleRestart = useCallback(() => {
    setGameId(prevId => prevId + 1);
    setGameState(GameState.Playing);
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.Start:
        return <StartScreen onStart={handleStart} />;
      case GameState.Playing:
        return <GameScreen key={gameId} onGameOver={handleGameOver} />;
      case GameState.GameOver:
        return <GameOverScreen onRestart={handleRestart} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-mono">
      <div className="w-full max-w-4xl p-4">
        <h1 className="text-4xl text-center text-yellow-400 mb-4 tracking-widest" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          RETRO BATTLE TANK
        </h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
