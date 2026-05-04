const gruntImages: { [key: string]: HTMLImageElement } = {
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
  })(),
};
export class Grunt {
  hp: number;
  damage: number;
  x: number;
  y: number;
  speed: number;
  direction: string;
  alive: boolean = true

  constructor(hp: number, damage: number, x: number, y: number, speed: number) {
    this.hp = hp;
    this.damage = damage;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = "down";
  }
  draw(ctx: CanvasRenderingContext2D, tileSize: number): void {
    ctx.drawImage(
      gruntImages[this.direction],
      this.x * tileSize,
      this.y * tileSize,
      tileSize,
      tileSize,
    );
  }

  isAdjacentTo(playerX: number, playerY: number): boolean {
    return Math.abs(this.x - playerX) + Math.abs(this.y - playerY) === 1;
  }

  moveToward(playerX: number, playerY: number, map: number[][]): void {
    const distance = Math.abs(this.x - playerX) + Math.abs(this.y - playerY);
    if (distance > 5) return;
    if (distance <= 1) return; // already adjacent, don't move onto player

    if (
      playerX > this.x &&
      map[this.y][this.x + 1] !== 1 &&
      !(this.x + 1 === playerX && this.y === playerY)
    ) {
      this.x += 1;
      this.direction = "right";
    } else if (
      playerX < this.x &&
      map[this.y][this.x - 1] !== 1 &&
      !(this.x - 1 === playerX && this.y === playerY)
    ) {
      this.x -= 1;
      this.direction = "left";
    } else if (
      playerY > this.y &&
      map[this.y + 1][this.x] !== 1 &&
      !(this.x === playerX && this.y + 1 === playerY)
    ) {
      this.y += 1;
      this.direction = "down";
    } else if (
      playerY < this.y &&
      map[this.y - 1][this.x] !== 1 &&
      !(this.x === playerX && this.y - 1 === playerY)
    ) {
      this.y -= 1;
      this.direction = "up";
    }
  }
}
