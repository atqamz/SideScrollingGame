/** @type {HTMLCanvasElement} */

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 1300;
  canvas.height = 720;

  const fullscreenButton = document.getElementById("fullscreen");

  let gameOver = false;
  let score = 0;
  let enemies = [];

  class InputHandler {
    constructor() {
      this.keys = [];
      window.addEventListener("keydown", (e) => {
        if (
          (e.key === "ArrowDown" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight") &&
          this.keys.indexOf(e.key)
        ) {
          this.keys.push(e.key);
        } else if (e.key === "Enter" && gameOver) {
          restartGame();
        }
      });
      window.addEventListener("keyup", (e) => {
        if (
          e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          this.keys.splice(this.keys.indexOf(e.key), 1);
        }
      });

      this.touchY = "";
      this.touchTreshold = 30;
      window.addEventListener("touchstart", (e) => {
        this.touchY = e.changedTouches[0].pageY;
      });
      window.addEventListener("touchmove", (e) => {
        const swipeDistance = e.changedTouches[0].pageY - this.touchY;
        if (swipeDistance < -this.touchTreshold && this.keys.indexOf("SwipeUp") === -1)
          this.keys.push("SwipeUp");
        else if (
          swipeDistance > this.touchTreshold &&
          this.keys.indexOf("SwipeDown") === -1
        ) {
          this.keys.push("SwipeDown");
          if (gameOver) {
            restartGame();
          }
        }
      });
      window.addEventListener("touchend", (e) => {
        this.keys.splice(this.keys.indexOf("SwipeUp"), 1);
        this.keys.splice(this.keys.indexOf("SwipeDown"), 1);
      });
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 2400;
      this.height = 720;
      this.x = 0;
      this.y = 0;

      this.image = document.getElementById("backgroundImage");

      this.velX = 0.5;
    }

    draw(ctx) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      ctx.drawImage(
        this.image,
        this.x + this.width - this.velX,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime) {
      this.x -= this.velX * deltaTime;
      if (this.x <= -this.width) {
        this.x = 0;
      }
    }

    restart() {
      this.x = 0;
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.x = 100;
      this.y = this.gameHeight - this.height;

      this.image = document.getElementById("playerImage");

      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 7;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;

      this.input = new InputHandler();
      this.velX = 0.1;
      this.velY = 0;
      this.weight = 0.03;
    }

    draw(ctx) {
      ctx.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime, enemies) {
      // collision detection
      enemies.forEach((enemy) => {
        const dx = enemy.x + enemy.width / 2 - 20 - (this.x + this.width / 2);
        const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2 + 20);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.width / 3 + this.width / 3) {
          gameOver = true;
        }
      });

      // animations
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX > this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      // controls
      if (
        (this.input.keys.indexOf("ArrowUp") > -1 ||
          this.input.keys.indexOf("SwipeUp") > -1) &&
        this.onGround()
      ) {
        this.velY -= 2;
      }
      if (this.input.keys.indexOf("ArrowRight") > -1) {
        this.velX = 0.5;
      }
      if (this.input.keys.indexOf("ArrowLeft") > -1) {
        this.velX = -0.5;
      }

      // there is no input
      if (this.input.keys.length < 1) {
        this.velX = 0;
      }

      // jump
      if (!this.onGround()) {
        this.velY += this.weight;
        this.frameY = 1;
        this.maxFrame = 4;
      } else {
        this.frameY = 0;
        this.maxFrame = 7;
      }

      this.x += this.velX * deltaTime;
      this.y += this.velY * deltaTime;

      // boundaries
      if (this.x < 0) {
        this.x = 0;
      }
      if (this.x > this.gameWidth - this.width) {
        this.x = this.gameWidth - this.width;
      }
      if (this.y < 0) {
        this.y = 0;
      }
      if (this.y > this.gameHeight - this.height) {
        this.y = this.gameHeight - this.height;
      }
    }

    onGround() {
      return this.y >= this.gameHeight - this.height;
    }

    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.maxFrame = 7;
      this.frameY = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height;

      this.image = document.getElementById("enemyImage");

      this.frameX = 0;
      this.maxFrameX = 4;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;

      this.velX = 1;

      this.canDelete = false;
    }

    draw(ctx) {
      ctx.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX > this.maxFrameX) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      this.x -= this.velX * deltaTime;

      if (this.x < 0 - this.width) {
        this.canDelete = true;
        score++;
      }
    }
  }

  function handleEnemy(deltaTime, ctx) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.update(deltaTime);
      enemy.draw(ctx);
    });

    enemies = enemies.filter((enemy) => !enemy.canDelete);
  }

  function displayStatusText(ctx) {
    ctx.font = "40px Helvetica";
    ctx.fillStyle = "black";
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, 22, 52);

    if (gameOver) {
      ctx.save();
      ctx.textAlign = "center";

      ctx.fillStyle = "black";
      ctx.fillText(`GAME OVER, your score is ${score}`, canvas.width / 2, 150);
      ctx.fillText(`Press ENTER or Swipe Down to play again!`, canvas.width / 2, 210);

      ctx.fillStyle = "white";
      ctx.fillText(`GAME OVER, your score is ${score}`, canvas.width / 2 + 2, 150 + 2);
      ctx.fillText(
        `Press ENTER or Swipe Down to play again!`,
        canvas.width / 2 + 2,
        210 + 2
      );

      ctx.restore();
    }
  }

  function restartGame() {
    background.restart();
    player.restart();
    gameOver = false;
    score = 0;
    enemies = [];

    animate(0);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      canvas
        .requestFullscreen()
        .catch((error) =>
          alert(
            `Error attempting to enable full-screen mode: ${error.message} (${error.name})`
          )
        );
    } else {
      document.exitFullscreen();
    }
  }
  fullscreenButton.addEventListener("click", toggleFullscreen);

  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);

  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = 3000;
  let randomEnemyInterval = Math.random() * 1000 + 500;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update(deltaTime);
    background.draw(ctx);
    player.update(deltaTime, enemies);
    player.draw(ctx);
    handleEnemy(deltaTime, ctx);
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);
  }
  animate(0);
});
