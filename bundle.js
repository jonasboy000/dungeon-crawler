"use strict";
(() => {
  // js/player.ts
  var playerImages = {
    up: (() => {
      const img = new Image();
      img.src = "images/player-back-facing.png";
      return img;
    })(),
    down: (() => {
      const img = new Image();
      img.src = "images/player-front-facing.png";
      return img;
    })(),
    left: (() => {
      const img = new Image();
      img.src = "images/player-left-facing.png";
      return img;
    })(),
    right: (() => {
      const img = new Image();
      img.src = "images/player-right-facing.png";
      return img;
    })()
  };
  var Player = class {
    constructor(hp, damage, x, y, speed, direction) {
      this.hp = hp;
      this.damage = damage;
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.direction = "down";
    }
    draw(ctx2, tileSize) {
      ctx2.drawImage(
        playerImages[this.direction],
        this.x * tileSize,
        this.y * tileSize,
        tileSize,
        tileSize
      );
    }
    attack(grunt) {
      grunt.hp -= this.damage;
    }
    openChest() {
      if (Math.random() > 0.5) {
        this.hp += 20;
        let reward = "+20 HP!";
        return reward;
      } else {
        this.damage += 2;
        let reward = "+2 damage!";
        return reward;
      }
    }
  };

  // js/map.ts
  var floorImg = new Image();
  var wallImg = new Image();
  var doorImg = new Image();
  var stairsImg = new Image();
  var chestImg = new Image();
  var exitImg = new Image();
  floorImg.src = "images/floor.png";
  wallImg.src = "images/walls.png";
  doorImg.src = "images/door.png";
  stairsImg.src = "images/stairs.png";
  chestImg.src = "images/chest.png";
  exitImg.src = "images/exit-portal.png";
  function generateFloor(width, height, floorNum) {
    const map = Array.from(
      { length: height },
      () => Array(width).fill(1)
    );
    const rooms = [];
    const numRooms = 7;
    let attempts = 0;
    while (rooms.length < numRooms && attempts < 200) {
      attempts++;
      const w = Math.floor(Math.random() * 4) + 3;
      const h = Math.floor(Math.random() * 4) + 3;
      const x = Math.floor(Math.random() * (width - w - 2)) + 1;
      const y = Math.floor(Math.random() * (height - h - 2)) + 1;
      const overlaps = rooms.some(
        (r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y
      );
      if (overlaps)
        continue;
      for (let ry = y; ry < y + h; ry++)
        for (let rx = x; rx < x + w; rx++)
          map[ry][rx] = 0;
      rooms.push({ x, y, w, h });
    }
    if (rooms.length >= 2) {
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
      [rooms[0], rooms[farA]] = [rooms[farA], rooms[0]];
      [rooms[rooms.length - 1], rooms[farB]] = [
        rooms[farB],
        rooms[rooms.length - 1]
      ];
    }
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i];
      const b = rooms[i + 1];
      const ax = Math.floor(a.x + a.w / 2);
      const ay = Math.floor(a.y + a.h / 2);
      const bx = Math.floor(b.x + b.w / 2);
      const by = Math.floor(b.y + b.h / 2);
      for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++)
        map[ay][x] = 0;
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++)
        map[y][bx] = 0;
    }
    const first = rooms[0];
    const last = rooms[rooms.length - 1];
    const playerStart = {
      x: Math.floor(first.x + first.w / 2),
      y: Math.floor(first.y + first.h / 2)
    };
    const isLastFloor = floorNum === 19;
    map[last.y + 1][last.x + 1] = isLastFloor ? 9 : 3;
    const middleRooms = rooms.slice(1, -1);
    const shuffledForChests = [...middleRooms].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(5, shuffledForChests.length); i++) {
      const r = shuffledForChests[i];
      map[r.y + 1][r.x + 2] = 5;
    }
    const shuffledForGrunts = [...middleRooms].sort(() => Math.random() - 0.5);
    const gruntPositions = shuffledForGrunts.slice(0, 3).map((r) => ({
      x: Math.floor(r.x + r.w / 2),
      y: Math.floor(r.y + r.h / 2)
    }));
    return { map, gruntPositions, playerStart };
  }
  var generatedFloors = [];
  for (let i = 0; i < 20; i++) {
    generatedFloors.push(generateFloor(20, 20, i));
  }
  var playerStartByFloor = generatedFloors.map((f) => f.playerStart);
  var floors = generatedFloors.map((f) => f.map);
  var gruntSpawnsByFloor = generatedFloors.map((f) => f.gruntPositions);
  var currentFloor = 0;
  function nextFloor() {
    currentFloor += 1;
  }
  function drawMap(ctx2, map) {
    const tileSize = 32;
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tile = map[row][col];
        switch (tile) {
          case 0:
            ctx2.drawImage(
              floorImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
          case 1:
            ctx2.drawImage(
              wallImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
          case 2:
            ctx2.drawImage(
              doorImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
          case 3:
            ctx2.drawImage(
              stairsImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
          case 5:
            ctx2.drawImage(
              chestImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
          case 9:
            ctx2.drawImage(
              exitImg,
              col * tileSize,
              row * tileSize,
              tileSize,
              tileSize
            );
            break;
        }
      }
    }
  }

  // js/enemy.ts
  var gruntImages = {
    up: (() => {
      const img = new Image();
      img.src = "images/grunt-back-facing.png";
      return img;
    })(),
    down: (() => {
      const img = new Image();
      img.src = "images/grunt-front-facing.png";
      return img;
    })(),
    left: (() => {
      const img = new Image();
      img.src = "images/grunt-left-facing.png";
      return img;
    })(),
    right: (() => {
      const img = new Image();
      img.src = "images/grunt-right-facing.png";
      return img;
    })()
  };
  var Grunt = class {
    constructor(hp, damage, x, y, speed) {
      this.alive = true;
      this.hp = hp;
      this.damage = damage;
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.direction = "down";
    }
    draw(ctx2, tileSize) {
      ctx2.drawImage(
        gruntImages[this.direction],
        this.x * tileSize,
        this.y * tileSize,
        tileSize,
        tileSize
      );
    }
    isAdjacentTo(playerX, playerY) {
      return Math.abs(this.x - playerX) + Math.abs(this.y - playerY) === 1;
    }
    moveToward(playerX, playerY, map) {
      const distance = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
      if (distance > 5)
        return;
      if (distance <= 1)
        return;
      if (playerX > this.x && map[this.y][this.x + 1] !== 1 && !(this.x + 1 === playerX && this.y === playerY)) {
        this.x += 1;
        this.direction = "right";
      } else if (playerX < this.x && map[this.y][this.x - 1] !== 1 && !(this.x - 1 === playerX && this.y === playerY)) {
        this.x -= 1;
        this.direction = "left";
      } else if (playerY > this.y && map[this.y + 1][this.x] !== 1 && !(this.x === playerX && this.y + 1 === playerY)) {
        this.y += 1;
        this.direction = "down";
      } else if (playerY < this.y && map[this.y - 1][this.x] !== 1 && !(this.x === playerX && this.y - 1 === playerY)) {
        this.y -= 1;
        this.direction = "up";
      }
    }
  };

  // js/game.ts
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 640;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 640, 640);
  drawMap(ctx, floors[currentFloor]);
  var animationId = 0;
  var gameOver = false;
  var player = new Player(
    100,
    10,
    playerStartByFloor[0].x,
    playerStartByFloor[0].y,
    1,
    "down"
  );
  var gruntsByFloor = gruntSpawnsByFloor.map((spawns, floorNum) => {
    const hp = 10 + floorNum * 10;
    const damage = 5 + floorNum * 5;
    return spawns.map((pos) => new Grunt(hp, damage, pos.x, pos.y, 1));
  });
  function currentGrunts() {
    return gruntsByFloor[currentFloor];
  }
  function updateStats() {
    const stats = document.getElementById("playerStats");
    stats.querySelector("ul").innerHTML = `
        <li>HP: ${player.hp}</li>
        <li>damage: ${player.damage}</li>
    `;
  }
  updateStats();
  function canMove(map, newX, newY) {
    const tile = map[newY][newX];
    if (tile === 1)
      return false;
    for (const grunt of currentGrunts()) {
      if (grunt.alive && grunt.x === newX && grunt.y === newY)
        return false;
    }
    return true;
  }
  function clearMessages() {
    const messages = document.getElementById("messages");
    messages.innerHTML = "";
  }
  var messageCount = 0;
  function addMessage(text) {
    messageCount++;
    const messages = document.getElementById("messages");
    const msg = document.createElement("li");
    msg.textContent = messageCount + ". " + text;
    messages.prepend(msg);
    if (messages.children.length > 10) {
      messages.removeChild(messages.lastChild);
    }
  }
  document.addEventListener("keydown", (e) => {
    if (gameOver)
      return;
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
            break;
          }
        }
        break;
    }
    for (const grunt of currentGrunts()) {
      if (!grunt.alive)
        continue;
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
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap(ctx, floors[currentFloor]);
    for (const grunt of currentGrunts()) {
      if (grunt.alive)
        grunt.draw(ctx, 32);
    }
    player.draw(ctx, 32);
    if (!gameOver) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }
  gameLoop();
})();
