import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Entity, RaceStats } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_X, ROAD_WIDTH, LANE_WIDTH, LANE_COUNT,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_COLOR, COLORS, PLAYER_MAX_SPEED 
} from '../constants';

interface GameProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onGameOver: (stats: RaceStats) => void;
}

const Game: React.FC<GameProps> = ({ gameState, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(undefined);
  
  // Game Logic State (Refs for performance in loop)
  const playerRef = useRef<Entity>({
    id: 0,
    x: ROAD_X + LANE_WIDTH, // Center lane
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    type: 'PLAYER',
    color: PLAYER_COLOR,
    speed: 0
  });
  
  const currentLaneRef = useRef<number>(1); // 0: Left, 1: Center, 2: Right

  const entitiesRef = useRef<Entity[]>([]); // Stores Enemies AND Hearts
  const roadOffsetRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const speedRef = useRef<number>(0); // Visual speed based on player movement
  const frameCountRef = useRef<number>(0);

  // Life System
  const livesRef = useRef<number>(1); // Start with 1 life
  const nextHeartDistanceRef = useRef<number>(1000);
  
  // Touch handling state
  const touchStartX = useRef<number | null>(null);

  // Drawing Helpers
  const drawPixelHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const pixelScale = size / 11; // 11x10 grid
    
    const heartMap = [
        "00110001100",
        "01111011110",
        "11111111111",
        "11111111111",
        "11111111111",
        "01111111110",
        "00111111100",
        "00011111000",
        "00001110000",
        "00000100000"
    ];

    ctx.fillStyle = COLORS.HEART;
    heartMap.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            if (row[colIndex] === '1') {
                // Main Red Pixel
                ctx.fillRect(
                    Math.floor(x + colIndex * pixelScale), 
                    Math.floor(y + rowIndex * pixelScale), 
                    Math.ceil(pixelScale), 
                    Math.ceil(pixelScale)
                );
            }
        }
    });

    // Pixel Shine (White)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const shinePixels = [[2, 2], [2, 3], [3, 2]];
    shinePixels.forEach(([c, r]) => {
        ctx.fillRect(
            Math.floor(x + c * pixelScale), 
            Math.floor(y + r * pixelScale), 
            Math.ceil(pixelScale), 
            Math.ceil(pixelScale)
        );
    });
  };

  const drawRect = (ctx: CanvasRenderingContext2D, entity: Entity) => {
    ctx.fillStyle = entity.color;

    if (entity.type === 'HEART') {
        // Draw 8-bit Heart
        drawPixelHeart(ctx, entity.x, entity.y, entity.width);
        return;
    }

    // Simple 8-bit car shape
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    
    // Windows
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(entity.x + 4, entity.y + 10, entity.width - 8, 12); // Windshield
    ctx.fillRect(entity.x + 4, entity.y + 35, entity.width - 8, 8); // Rear window
    
    // Lights
    ctx.fillStyle = entity.type === 'PLAYER' ? '#fcd34d' : '#ef4444'; // Headlights/Taillights
    if (entity.type === 'PLAYER') {
        ctx.fillRect(entity.x + 2, entity.y + 2, 8, 4);
        ctx.fillRect(entity.x + entity.width - 10, entity.y + 2, 8, 4);
    } else {
        ctx.fillRect(entity.x + 2, entity.y + entity.height - 6, 8, 4);
        ctx.fillRect(entity.x + entity.width - 10, entity.y + entity.height - 6, 8, 4);
    }
  };

  const spawnEnemy = () => {
    const lanes = [0, 1, 2];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const x = ROAD_X + (lane * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    const speed = Math.random() * 3 + 2; // Random speed 2-5
    const color = [COLORS.ENEMY_1, COLORS.ENEMY_2, COLORS.ENEMY_3][Math.floor(Math.random() * 3)];
    
    entitiesRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y: -100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      type: 'ENEMY',
      color,
      speed,
      lane
    });
  };

  const spawnHeart = () => {
      const lanes = [0, 1, 2];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      // Center the heart in the lane. Heart is bigger now.
      const size = 55; // Fits 11px grid nicely (5px per pixel)
      const x = ROAD_X + (lane * LANE_WIDTH) + (LANE_WIDTH - size) / 2;
      
      entitiesRef.current.push({
          id: Date.now() + Math.random(),
          x,
          y: -100,
          width: size,
          height: size, // Roughly square for the grid
          type: 'HEART',
          color: COLORS.HEART,
          speed: 0, // Hearts are stationary on the track (relative to road)
          lane
      });
  };

  const checkCollision = (rect1: Entity, rect2: Entity) => {
    // Slightly reduce collision box for better feel
    const buffer = 8; 
    return (
      rect1.x + buffer < rect2.x + rect2.width - buffer &&
      rect1.x + rect1.width - buffer > rect2.x + buffer &&
      rect1.y + buffer < rect2.y + rect2.height - buffer &&
      rect1.y + rect1.height - buffer > rect2.y + buffer
    );
  };

  const resetGame = useCallback(() => {
    currentLaneRef.current = 1; // Center
    playerRef.current = {
      ...playerRef.current,
      x: ROAD_X + LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2,
      speed: 0 // Speed will auto-accelerate
    };
    entitiesRef.current = [];
    scoreRef.current = 0;
    distanceRef.current = 0;
    speedRef.current = 0;
    frameCountRef.current = 0;
    livesRef.current = 1; // Start with 1 life
    nextHeartDistanceRef.current = 1000; // First heart at 1000m
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- UPDATE LOGIC ---
    frameCountRef.current++;

    // Player Lane Logic (Discrete Movement)
    const targetX = ROAD_X + (currentLaneRef.current * LANE_WIDTH) + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    // Fast Lerp for snap feel but smooth visual
    playerRef.current.x += (targetX - playerRef.current.x) * 0.4;
    
    // Auto Speed Logic
    // Base speed is 10. Increased ramp-up: Every 200 frames, speed potential increases.
    const timeSpeedBoost = Math.floor(frameCountRef.current / 200); 
    const targetSpeed = 10 + timeSpeedBoost;
    
    // Smooth acceleration towards target speed
    if (playerRef.current.speed < targetSpeed) {
        playerRef.current.speed += 0.05;
    }
    
    // Cap absolute max speed (22 = 220km/h)
    if (playerRef.current.speed > PLAYER_MAX_SPEED) {
        playerRef.current.speed = PLAYER_MAX_SPEED;
    }

    speedRef.current = playerRef.current.speed;
    
    // Update distance and score
    if (speedRef.current > 0) {
        distanceRef.current += speedRef.current / 10;
        scoreRef.current += Math.floor(speedRef.current);
        roadOffsetRef.current += speedRef.current * 2;
        if (roadOffsetRef.current > 40) roadOffsetRef.current = 0;

        // Check Heart Spawn
        if (distanceRef.current >= nextHeartDistanceRef.current) {
            spawnHeart();
            nextHeartDistanceRef.current += 1000;
        }
    }

    // Spawn Enemies
    // Difficulty scaling: Spawn faster as score increases
    const spawnRate = Math.max(20, 80 - Math.floor(scoreRef.current / 300));
    if (frameCountRef.current % spawnRate === 0 && speedRef.current > 2) {
      spawnEnemy();
    }

    // Update Entities (Enemies + Hearts)
    for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
      let entity = entitiesRef.current[i];
      
      // Relative movement
      // If it's a heart (speed 0), it moves down at player speed.
      // If it's an enemy, it moves down at (playerSpeed - enemySpeed).
      const relativeSpeed = entity.type === 'HEART' 
          ? playerRef.current.speed 
          : (playerRef.current.speed - entity.speed + 2);
          
      entity.y += relativeSpeed;

      // Despawn off-screen
      if (entity.y > CANVAS_HEIGHT) {
        entitiesRef.current.splice(i, 1);
        if (entity.type === 'ENEMY') {
            scoreRef.current += 50; // Bonus for overtaking
        }
      } else if (entity.y < -200) {
          // If we passed it going UP (rare, but possible if player stops)
          entitiesRef.current.splice(i, 1);
      }

      // Collision
      if (checkCollision(playerRef.current, entity)) {
        if (entity.type === 'HEART') {
             // Gain Life
             livesRef.current = Math.min(5, livesRef.current + 1);
             entitiesRef.current.splice(i, 1);
        } else {
             // Hit Enemy
             livesRef.current -= 1;
             entitiesRef.current.splice(i, 1); // Remove enemy so we don't hit it multiple times
             
             if (livesRef.current <= 0) {
                 onGameOver({
                    score: scoreRef.current,
                    distance: distanceRef.current,
                    topSpeed: speedRef.current,
                    causeOfDeath: `Crashed into a ${entity.color === COLORS.ENEMY_1 ? 'Blue' : entity.color === COLORS.ENEMY_2 ? 'Yellow' : 'Purple'} Cruiser`
                 });
                 return; // Stop loop
             }
        }
      }
    }

    // --- DRAW LOGIC ---

    // 1. Background (Grass)
    ctx.fillStyle = COLORS.GRASS;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Road
    ctx.fillStyle = COLORS.ROAD;
    ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, CANVAS_HEIGHT);

    // 3. Lane Markings
    ctx.strokeStyle = COLORS.MARKING;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffsetRef.current;
    
    for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(ROAD_X + (i * LANE_WIDTH), 0);
        ctx.lineTo(ROAD_X + (i * LANE_WIDTH), CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    // Border Lines (Solid)
    ctx.setLineDash([]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ROAD_X, 0);
    ctx.lineTo(ROAD_X, CANVAS_HEIGHT);
    ctx.moveTo(ROAD_X + ROAD_WIDTH, 0);
    ctx.lineTo(ROAD_X + ROAD_WIDTH, CANVAS_HEIGHT);
    ctx.stroke();

    // 4. Entities
    entitiesRef.current.forEach(entity => drawRect(ctx, entity));

    // 5. Player
    drawRect(ctx, playerRef.current);

    // 6. HUD
    // Speed
    ctx.fillStyle = "white";
    ctx.font = "10px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText(`SPEED: ${Math.floor(speedRef.current * 10)}`, 10, 20);
    
    // Distance
    const km = (distanceRef.current / 1000).toFixed(1);
    ctx.textAlign = "right";
    ctx.fillText(`DIST: ${km} KM`, CANVAS_WIDTH - 10, 20);

    // Lives (Hearts) - Use pixel heart for HUD too
    ctx.fillStyle = COLORS.HEART;
    const hudHeartSize = 22;
    const startX = (CANVAS_WIDTH / 2) - ((livesRef.current * (hudHeartSize + 4)) / 2);
    for (let i = 0; i < livesRef.current; i++) {
       drawPixelHeart(ctx, startX + (i * (hudHeartSize + 4)), 10, hudHeartSize);
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, onGameOver]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        resetGame();
        requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop, resetGame]);

  // Input Listeners for Discrete Lane Changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState !== GameState.PLAYING) return;

        if (e.key === 'ArrowLeft' || e.key === 'a') {
            currentLaneRef.current = Math.max(0, currentLaneRef.current - 1);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            currentLaneRef.current = Math.min(LANE_COUNT - 1, currentLaneRef.current + 1);
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  // Touch / Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== GameState.PLAYING || touchStartX.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    const threshold = 40; // px required to switch lane

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
         // Swipe Right
         currentLaneRef.current = Math.min(LANE_COUNT - 1, currentLaneRef.current + 1);
      } else {
         // Swipe Left
         currentLaneRef.current = Math.max(0, currentLaneRef.current - 1);
      }
      // Reset start to current allows dragging across multiple lanes
      touchStartX.current = currentX;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  return (
    <div 
        className="relative w-full h-full bg-black touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            className="block w-full h-full object-fill"
        />
    </div>
  );
};

export default Game;