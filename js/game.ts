import { Player } from "./player";
import {
  floors,
  gruntSpawnsByFloor,
  currentFloor,
  drawMap,
  nextFloor,
  playerStartByFloor,
} from "./map";
import { Grunt } from "./enemy";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

canvas.width = 640;
canvas.height = 640;

ctx.fillStyle = "black";
ctx.fillRect(0, 0, 640, 640);

drawMap(ctx, floors[currentFloor]);

let animationId: number = 0;
let gameOver: boolean = false;

const player = new Player(
  100,
  10,
  playerStartByFloor[0].x,
  playerStartByFloor[0].y,
  1,
  "down",
);

/* grunts per floor */
const gruntsByFloor: Grunt[][] = gruntSpawnsByFloor.map((spawns, floorNum) => {
  const hp = 10 + floorNum * 10;
  const damage = 5 + floorNum * 5;
  return spawns.map((pos) => new Grunt(hp, damage, pos.x, pos.y, 1));
});

/* returns the grunts for the current floor */
function currentGrunts(): Grunt[] {
  return gruntsByFloor[currentFloor];
}

function updateStats(): void {
  const stats = document.getElementById("playerStats")!;
  stats.querySelector("ul")!.innerHTML = `
        <li>HP: ${player.hp}</li>
        <li>damage: ${player.damage}</li>
    `;
}

updateStats();

function canMove(map: number[][], newX: number, newY: number): boolean {
  const tile = map[newY][newX];
  if (tile === 1) return false;
  /* check all grunts on current floor */
  for (const grunt of currentGrunts()) {
    if (grunt.alive && grunt.x === newX && grunt.y === newY) return false;
  }
  return true;
}

function clearMessages(): void {
  const messages = document.getElementById("messages")!;
  messages.innerHTML = "";
}

let messageCount: number = 0;
function addMessage(text: string): void {
  messageCount++;
  const messages = document.getElementById("messages")!;
  const msg = document.createElement("li");
  msg.textContent = messageCount + ". " + text;
  messages.prepend(msg);
  if (messages.children.length > 10) {
    messages.removeChild(messages.lastChild!);
  }
}

document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  switch (e.key) {
    case "ArrowUp":
    case "w":
      player.direction = "up";
      if (canMove(floors[currentFloor], player.x, player.y - player.speed))
        player.y -= player.speed;
      break;
    case "ArrowDown":
    case "s":
      player.direction = "down";
      if (canMove(floors[currentFloor], player.x, player.y + player.speed))
        player.y += player.speed;
      break;
    case "ArrowLeft":
    case "a":
      player.direction = "left";
      if (canMove(floors[currentFloor], player.x - player.speed, player.y))
        player.x -= player.speed;
      break;
    case "ArrowRight":
    case "d":
      player.direction = "right";
      if (canMove(floors[currentFloor], player.x + player.speed, player.y))
        player.x += player.speed;
      break;
    case " ":
      /* attack adjacent grunt */
      for (const grunt of currentGrunts()) {
        if (grunt.alive && grunt.isAdjacentTo(player.x, player.y)) {
          grunt.hp -= player.damage;
          addMessage("You attack for " + player.damage + " damage!");
          if (grunt.hp <= 0) {
            grunt.alive = false;
            grunt.x = -1;
            grunt.y = -1;
            addMessage("Grunt defeated!");
          }
          break; // only attack one grunt per spacebar press
        }
      }
      break;
  }

  /* move all grunts and handle their attacks */
  for (const grunt of currentGrunts()) {
    if (!grunt.alive) continue;
    grunt.moveToward(player.x, player.y, floors[currentFloor]);
    if (grunt.isAdjacentTo(player.x, player.y)) {
      player.hp -= grunt.damage;
      addMessage("Grunt attacks for " + grunt.damage + " damage!");
      updateStats();
      if (player.hp <= 0) {
        gameOver = true;
        cancelAnimationFrame(animationId);
        gameLoop();
        clearMessages();
        addMessage("You died! Game over.");
        return;
      }
    }
  }

  const currentTile = floors[currentFloor][player.y][player.x];

  if (currentTile === 5) {
    const reward = player.openChest();
    floors[currentFloor][player.y][player.x] = 0;
    addMessage("You opened a chest: " + reward);
    updateStats();
  }

  if (currentTile === 3) {
    nextFloor();
    player.x = playerStartByFloor[currentFloor].x;
    player.y = playerStartByFloor[currentFloor].y;
    addMessage("You descend to floor " + (currentFloor + 1));
  }

  if (currentTile === 9) {
    gameOver = true;
    cancelAnimationFrame(animationId);
    gameLoop();
    clearMessages();
    addMessage("Congratulations! You escaped the dungeon!");
  }
});

function gameLoop(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap(ctx, floors[currentFloor]);
  for (const grunt of currentGrunts()) {
    if (grunt.alive) grunt.draw(ctx, 32);
  }
  player.draw(ctx, 32);
  if (!gameOver) {
    animationId = requestAnimationFrame(gameLoop);
  }
}
gameLoop();
