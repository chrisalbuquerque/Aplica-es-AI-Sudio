
export enum GameState {
  Start,
  Playing,
  GameOver,
}

export enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

export interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tank extends GameObject {
  direction: Direction;
  color: string;
  isPlayer: boolean;
}

export interface Bullet extends GameObject {
  direction: Direction;
}

export type MapLayout = number[][];
