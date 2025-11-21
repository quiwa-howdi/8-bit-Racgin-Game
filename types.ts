export enum GameState {
  BOOT = 'BOOT',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'PLAYER' | 'ENEMY' | 'OBSTACLE' | 'HEART';
  color: string;
  speed: number;
  lane?: number; // 0, 1, 2
}

export interface RaceStats {
  score: number;
  distance: number;
  topSpeed: number;
  causeOfDeath: string;
}