import { Grunt } from "./enemy";

const playerImages: { [key: string]: HTMLImageElement } = {
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
  })(),
};

export class Player {
  hp: number;
  damage: number;
  x: number;
  y: number;
  speed: number;
  direction: string;

  constructor(
    hp: number,
    damage: number,
    x: number,
    y: number,
    speed: number,
    direction: string,
  ) {
    this.hp = hp;
    this.damage = damage;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = "down"; //default
  }
  draw(ctx: CanvasRenderingContext2D, tileSize: number): void {
    ctx.drawImage(
      playerImages[this.direction],
      this.x * tileSize,
      this.y * tileSize,
      tileSize,
      tileSize,
    );
  }
  attack(grunt: Grunt): void {
    grunt.hp -= this.damage
}
  openChest(): string {
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
}
