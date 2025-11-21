export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const LANE_WIDTH = 100;
export const LANE_COUNT = 3;
export const ROAD_WIDTH = LANE_WIDTH * LANE_COUNT;
export const ROAD_X = (CANVAS_WIDTH - ROAD_WIDTH) / 2;

export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 70;
export const PLAYER_COLOR = '#ef4444'; // Red-500
export const PLAYER_ACCEL = 0.2;
export const PLAYER_MAX_SPEED = 22; // 22 * 10 = 220 display speed
export const PLAYER_BRAKE = 0.4;
export const PLAYER_FRICTION = 0.05;

export const COLORS = {
  ROAD: '#4b5563', // Gray-600 (Lighter than before)
  GRASS: '#16a34a', // Green-600 (Brighter/Lighter)
  MARKING: '#f3f4f6', // Gray-100
  ENEMY_1: '#3b82f6', // Blue-500
  ENEMY_2: '#eab308', // Yellow-500
  ENEMY_3: '#a855f7', // Purple-500
  OBSTACLE: '#78350f', // Brown-900
  HEART: '#ef4444', // Red-500 for Heart
};

export const SPAWN_RATE_INITIAL = 100; // Frames
export const SCORE_MULTIPLIER = 10;