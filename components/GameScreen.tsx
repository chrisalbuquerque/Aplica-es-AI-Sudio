import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Tank, type Bullet, Direction, type GameObject } from '../types';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_SPEED,
  ENEMY_SPEED,
  BULLET_SPEED,
  PLAYER_LIVES,
  MAX_ENEMIES,
  MAP_LAYOUT,
  PLAYER_SHOOT_COOLDOWN,
  ENEMY_SHOOT_COOLDOWN
} from '../constants';

interface GameScreenProps {
  onGameOver: () => void;
}

const TankSprite: React.FC<{ tank: Tank }> = ({ tank }) => {
    const rotationClasses: Record<Direction, string> = {
        [Direction.Up]: 'rotate-0',
        [Direction.Down]: 'rotate-180',
        [Direction.Left]: '-rotate-90',
        [Direction.Right]: 'rotate-90',
    };

    return (
        <div
            className={`absolute transition-transform duration-100 ${rotationClasses[tank.direction]}`}
            style={{
                left: tank.x,
                top: tank.y,
                width: tank.width,
                height: tank.height,
                backgroundColor: tank.color,
                border: '2px solid rgba(0,0,0,0.5)'
            }}
        >
            {/* Cannon */}
            <div
                className="absolute"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    width: '6px',
                    height: '14px',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
};

const BulletSprite: React.FC<{ bullet: Bullet }> = ({ bullet }) => (
    <div
        className="absolute bg-yellow-300 rounded-full"
        style={{
            left: bullet.x,
            top: bullet.y,
            width: bullet.width,
            height: bullet.height,
            boxShadow: '0 0 5px yellow'
        }}
    />
);

const WallSprite: React.FC<{ x: number; y: number }> = ({ x, y }) => (
    <div
        className="absolute bg-yellow-800"
        style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            border: '2px solid #5a4628'
        }}
    />
);


const GameScreen: React.FC<GameScreenProps> = ({ onGameOver }) => {
    const [player, setPlayer] = useState<Tank>({
        id: Date.now(),
        x: TILE_SIZE * 2,
        y: TILE_SIZE * (MAP_LAYOUT.length - 2),
        width: TILE_SIZE - 4,
        height: TILE_SIZE - 4,
        direction: Direction.Up,
        color: '#4ade80',
        isPlayer: true
    });
    const [enemies, setEnemies] = useState<Tank[]>([]);
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [lives, setLives] = useState(PLAYER_LIVES);
    const keysPressed = useRef<Record<string, boolean>>({});
    const lastPlayerShot = useRef(0);
    const lastEnemySpawn = useRef(0);
    const enemyMoveTimers = useRef<Record<number, number>>({});
    const enemyShootTimers = useRef<Record<number, number>>({});
    
    const checkCollision = (a: GameObject, b: GameObject) => {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    };

    const isPositionValid = useCallback((x: number, y: number, width: number, height: number, selfId?: number) => {
        // Map boundaries
        if (x < 0 || x + width > MAP_WIDTH || y < 0 || y + height > MAP_HEIGHT) {
            return false;
        }

        // Map walls
        const startCol = Math.floor(x / TILE_SIZE);
        const endCol = Math.floor((x + width) / TILE_SIZE);
        const startRow = Math.floor(y / TILE_SIZE);
        const endRow = Math.floor((y + height) / TILE_SIZE);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (MAP_LAYOUT[row]?.[col] === 1) {
                    return false;
                }
            }
        }
        
        // Other tanks
        const selfRect = { x, y, width, height, id:0 };
        const allTanks = [player, ...enemies];
        for(const tank of allTanks) {
            if (tank.id !== selfId && checkCollision(selfRect, tank)) {
                return false;
            }
        }

        return true;
    }, [player, enemies]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const gameLoop = useCallback(() => {
        const now = Date.now();

        // Player Movement
        setPlayer(prevPlayer => {
            let { x, y, direction } = prevPlayer;
            let speed = PLAYER_SPEED;
            if (keysPressed.current['ArrowUp']) {
                direction = Direction.Up;
                if (isPositionValid(x, y - speed, prevPlayer.width, prevPlayer.height, prevPlayer.id)) y -= speed;
            } else if (keysPressed.current['ArrowDown']) {
                direction = Direction.Down;
                if (isPositionValid(x, y + speed, prevPlayer.width, prevPlayer.height, prevPlayer.id)) y += speed;
            } else if (keysPressed.current['ArrowLeft']) {
                direction = Direction.Left;
                if (isPositionValid(x - speed, y, prevPlayer.width, prevPlayer.height, prevPlayer.id)) x -= speed;
            } else if (keysPressed.current['ArrowRight']) {
                direction = Direction.Right;
                if (isPositionValid(x + speed, y, prevPlayer.width, prevPlayer.height, prevPlayer.id)) x += speed;
            }
            return { ...prevPlayer, x, y, direction };
        });

        // Player Shooting
        if (keysPressed.current[' '] && now - lastPlayerShot.current > PLAYER_SHOOT_COOLDOWN) {
            lastPlayerShot.current = now;
            setPlayer(p => {
                 setBullets(b => [...b, createBullet(p)]);
                 return p;
            });
        }
        
        // Enemy Spawning
        if (enemies.length < MAX_ENEMIES && now - lastEnemySpawn.current > 5000) {
            lastEnemySpawn.current = now;
            setEnemies(prev => {
                const spawnPoints = [
                    { x: TILE_SIZE, y: TILE_SIZE },
                    { x: MAP_WIDTH / 2, y: TILE_SIZE },
                    { x: MAP_WIDTH - TILE_SIZE * 2, y: TILE_SIZE },
                ];
                const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                const newEnemy: Tank = {
                    id: now,
                    ...spawnPoint,
                    width: TILE_SIZE - 4,
                    height: TILE_SIZE - 4,
                    direction: Direction.Down,
                    color: '#f87171',
                    isPlayer: false
                };
                if(isPositionValid(newEnemy.x, newEnemy.y, newEnemy.width, newEnemy.height, newEnemy.id)){
                    return [...prev, newEnemy];
                }
                return prev;
            });
        }
        
        // Enemy Movement & Shooting
        setEnemies(prevEnemies => prevEnemies.map(enemy => {
            let newEnemyState = { ...enemy };

            // Change direction periodically for random movement
            if (!enemyMoveTimers.current[enemy.id] || now - enemyMoveTimers.current[enemy.id] > 2000) {
                enemyMoveTimers.current[enemy.id] = now;
                const directions = Object.values(Direction);
                newEnemyState.direction = directions[Math.floor(Math.random() * directions.length)];
            }
            
            // Attempt to move
            const speed = ENEMY_SPEED;
            let nextX = newEnemyState.x;
            let nextY = newEnemyState.y;

            switch (newEnemyState.direction) {
                case Direction.Up:    nextY -= speed; break;
                case Direction.Down:  nextY += speed; break;
                case Direction.Left:  nextX -= speed; break;
                case Direction.Right: nextX += speed; break;
            }

            // Check for collisions
            if (isPositionValid(nextX, nextY, newEnemyState.width, newEnemyState.height, newEnemyState.id)) {
                // Move is valid, update position
                newEnemyState.x = nextX;
                newEnemyState.y = nextY;
            } else {
                // Blocked, so pick a new direction immediately
                const directions = Object.values(Direction).filter(d => d !== newEnemyState.direction);
                newEnemyState.direction = directions[Math.floor(Math.random() * directions.length)];
                // Reset the timer to allow another random change if it gets stuck in a corridor
                enemyMoveTimers.current[enemy.id] = now;
            }

            // Shoot periodically
            if (!enemyShootTimers.current[enemy.id] || now - enemyShootTimers.current[enemy.id] > ENEMY_SHOOT_COOLDOWN) {
                enemyShootTimers.current[enemy.id] = now;
                setBullets(b => [...b, createBullet(newEnemyState)]);
            }

            return newEnemyState;
        }));

        // Bullet Movement and Collision
        setBullets(prevBullets => {
            const nextBullets: Bullet[] = [];
            const destroyedEnemyIds = new Set<number>();

            for (const bullet of prevBullets) {
                let { x, y } = bullet;
                if (bullet.direction === Direction.Up) y -= BULLET_SPEED;
                if (bullet.direction === Direction.Down) y += BULLET_SPEED;
                if (bullet.direction === Direction.Left) x -= BULLET_SPEED;
                if (bullet.direction === Direction.Right) x += BULLET_SPEED;

                // Check collisions
                let hit = false;
                const newBullet = { ...bullet, x, y };

                // Walls & boundaries
                if (!isPositionValid(x, y, bullet.width, bullet.height)) {
                    hit = true;
                }

                // Tanks
                const ownerTank = bullet.id === player.id ? player : enemies.find(e => e.id === bullet.id);
                
                if (ownerTank?.isPlayer) { // Player bullet
                    for (const enemy of enemies) {
                        if (checkCollision(newBullet, enemy)) {
                            hit = true;
                            destroyedEnemyIds.add(enemy.id);
                            break;
                        }
                    }
                } else { // Enemy bullet
                    if (checkCollision(newBullet, player)) {
                        hit = true;
                        setLives(l => l - 1);
                         setPlayer(p => ({...p, x: TILE_SIZE * 2, y: TILE_SIZE * (MAP_LAYOUT.length - 2), direction: Direction.Up}));
                    }
                }
                
                if (!hit) {
                    nextBullets.push(newBullet);
                }
            }

            if(destroyedEnemyIds.size > 0) {
                setEnemies(prev => prev.filter(e => !destroyedEnemyIds.has(e.id)));
            }

            return nextBullets;
        });

    }, [isPositionValid, player, enemies]);

    const createBullet = (owner: Tank): Bullet => {
        const bulletSize = 8;
        const bulletPos = { x: 0, y: 0 };
        const halfTank = owner.width / 2;
        const halfBullet = bulletSize / 2;

        switch (owner.direction) {
            case Direction.Up:
                bulletPos.x = owner.x + halfTank - halfBullet;
                bulletPos.y = owner.y - bulletSize;
                break;
            case Direction.Down:
                bulletPos.x = owner.x + halfTank - halfBullet;
                bulletPos.y = owner.y + owner.height;
                break;
            case Direction.Left:
                bulletPos.x = owner.x - bulletSize;
                bulletPos.y = owner.y + halfTank - halfBullet;
                break;
            case Direction.Right:
                bulletPos.x = owner.x + owner.width;
                bulletPos.y = owner.y + halfTank - halfBullet;
                break;
        }

        return {
            id: owner.id, // ID of owner
            ...bulletPos,
            width: bulletSize,
            height: bulletSize,
            direction: owner.direction
        };
    };

    useEffect(() => {
        if (lives <= 0) {
            onGameOver();
        }
    }, [lives, onGameOver]);

    useEffect(() => {
        const intervalId = setInterval(gameLoop, 1000 / 60); // 60 FPS
        return () => clearInterval(intervalId);
    }, [gameLoop]);

    return (
        <div className="relative bg-gray-800" style={{ width: MAP_WIDTH, height: MAP_HEIGHT, border: '4px solid #4a5568' }}>
            {/* Render Walls */}
            {MAP_LAYOUT.map((row, y) =>
                row.map((tile, x) => (tile === 1 ? <WallSprite key={`${x}-${y}`} x={x} y={y} /> : null))
            )}
            
            {/* Render UI */}
            <div className="absolute top-2 left-2 text-white text-lg z-10" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                LIVES: {lives}
            </div>
             <div className="absolute top-2 right-2 text-white text-lg z-10" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                ENEMIES: {enemies.length}
            </div>

            {/* Render Game Objects */}
            <TankSprite tank={player} />
            {enemies.map(enemy => <TankSprite key={enemy.id} tank={enemy} />)}
            {bullets.map((bullet, i) => <BulletSprite key={`${bullet.id}-${i}`} bullet={bullet} />)}
        </div>
    );
};

export default GameScreen;
