/*
2D array representing the dungeon map, each number is a tile type
0 = floor, 1 = wall, 2 = door, 3 = staircase, 5 = chest, 
9 = end, 
*/

const floorImg = new Image();
const wallImg = new Image();
const doorImg = new Image();
const stairsImg = new Image();
const chestImg = new Image();
const exitImg = new Image();

floorImg.src = "images/floor.png";
wallImg.src = "images/walls.png";
doorImg.src = "images/door.png";
stairsImg.src = "images/stairs.png";
chestImg.src = "images/chest.png";
exitImg.src = "images/exit-portal.png";

function generateFloor(
  width: number,
  height: number,
  floorNum: number,
): {
  map: number[][];
  gruntPositions: { x: number; y: number }[];
  playerStart: { x: number; y: number };
} {
  const map: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(1),
  );
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const numRooms = 7;

  // ── place rooms ──
  let attempts = 0;
  while (rooms.length < numRooms && attempts < 200) {
    attempts++;
    const w = Math.floor(Math.random() * 4) + 3;
    const h = Math.floor(Math.random() * 4) + 3;
    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const overlaps = rooms.some(
      (r) =>
        x < r.x + r.w + 1 &&
        x + w + 1 > r.x &&
        y < r.y + r.h + 1 &&
        y + h + 1 > r.y,
    );
    if (overlaps) continue;

    for (let ry = y; ry < y + h; ry++)
      for (let rx = x; rx < x + w; rx++) map[ry][rx] = 0;

    rooms.push({ x, y, w, h });
  }
  // ── sort rooms so first and last are as far apart as possible ──
  if (rooms.length >= 2) {
    // find the two rooms furthest apart
    let maxDist = 0;
    let farA = 0;
    let farB = rooms.length - 1;

    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const dx = rooms[i].x + rooms[i].w / 2 - (rooms[j].x + rooms[j].w / 2);
        const dy = rooms[i].y + rooms[i].h / 2 - (rooms[j].y + rooms[j].h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          maxDist = dist;
          farA = i;
          farB = j;
        }
      }
    }

    // swap so farA is first and farB is last
    [rooms[0], rooms[farA]] = [rooms[farA], rooms[0]];
    [rooms[rooms.length - 1], rooms[farB]] = [
      rooms[farB],
      rooms[rooms.length - 1],
    ];
  }
  // ── connect rooms with corridors ──
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i];
    const b = rooms[i + 1];
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);

    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) map[ay][x] = 0;
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) map[y][bx] = 0;
    // ── place doors at corridor entrances ──
  }

  // ── first and last rooms ──
  const first = rooms[0];
  const last = rooms[rooms.length - 1];

  // ── player start in first room centre ──
  const playerStart = {
    x: Math.floor(first.x + first.w / 2),
    y: Math.floor(first.y + first.h / 2),
  };

  // ── stairs in last room ──
  const isLastFloor = floorNum === 19;
  map[last.y + 1][last.x + 1] = isLastFloor ? 9 : 3;

  // ── 5 chests in random middle rooms ──
  const middleRooms = rooms.slice(1, -1);
  const shuffledForChests = [...middleRooms].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(5, shuffledForChests.length); i++) {
    const r = shuffledForChests[i];
    map[r.y + 1][r.x + 2] = 5;
  }

  // ── 3 grunt positions in random middle rooms ──
  const shuffledForGrunts = [...middleRooms].sort(() => Math.random() - 0.5);
  const gruntPositions = shuffledForGrunts.slice(0, 3).map((r) => ({
    x: Math.floor(r.x + r.w / 2),
    y: Math.floor(r.y + r.h / 2),
  }));

  return { map, gruntPositions, playerStart };
}

const generatedFloors = [];
for (let i = 0; i < 20; i++) {
  generatedFloors.push(generateFloor(20, 20, i));
}
export { generatedFloors };

export const playerStartByFloor: { x: number; y: number }[] =
  generatedFloors.map((f) => f.playerStart);

export const floors: number[][][] = generatedFloors.map((f) => f.map);
export const gruntSpawnsByFloor: { x: number; y: number }[][] =
  generatedFloors.map((f) => f.gruntPositions);

export let currentFloor: number = 0;

export function nextFloor(): void {
  currentFloor += 1;
}

export function drawMap(ctx: CanvasRenderingContext2D, map: number[][]): void {
  const tileSize = 32;
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      switch (tile) {
        case 0:
          ctx.drawImage(
            floorImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
        case 1:
          ctx.drawImage(
            wallImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
        case 2:
          ctx.drawImage(
            doorImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
        case 3:
          ctx.drawImage(
            stairsImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
        case 5:
          ctx.drawImage(
            chestImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
        case 9:
          ctx.drawImage(
            exitImg,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
          );
          break;
      }
    }
  }
}
