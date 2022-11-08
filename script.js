const levelsInput = document.getElementById("game-levels");
const starnewGameBtn = document.getElementById("start");
const dialogBox = document.getElementById("dialog");
const movesEl = document.getElementById("moves_element");
const playAgainEl = document.getElementById("playAgain");

const ctx = canvas.getContext("2d");
let newGame = null;

class Maze {
  constructor(ctx, mazeWidth, mazeHeight) {
    this.ctx = ctx;
    this.mazeWidth = mazeWidth;
    this.mazeHeight = mazeHeight;
    this.cellSize = this.ctx.canvas.width / this.mazeHeight;
    this.width = this.cellSize - 3;
    this.mazeMap = null;
    this.player = null;
    this.finishCell = null;
    this.score = 0;
  }

  //generate random maze map
  defineMaze() {
    const directions = {
      // create maze path based on randomly picked available directions (n, s, w, e)
      n: {
        y: -1,
        x: 0,
        o: "s",
      },
      s: {
        y: 1,
        x: 0,
        o: "n",
      },
      w: {
        y: 0,
        x: -1,
        o: "e",
      },
      e: {
        y: 0,
        x: 1,
        o: "w",
      },
    };
    let shuffledDirections = shuffle(["n", "s", "w", "e"]);
    let prevCell = { x: 0, y: 0 };
    let checkedCells = 1;
    let maxShuffle = Math.floor(this.mazeWidth / 7);
    let shuffleCount = 0;
    const maxCells = this.mazeWidth * this.mazeHeight;
    do {
      let isMoved = false;
      this.mazeMap[prevCell.x][prevCell.y].isVisited = true;

      if (shuffleCount === maxShuffle) {
        shuffledDirections = shuffle(shuffledDirections);
        shuffleCount = 0;
      }
      shuffleCount++;
      for (let i = 0; i < shuffledDirections.length; ++i) {
        const nextPath = shuffledDirections[i];
        const newX = prevCell.x + directions[nextPath].x;
        const newY = prevCell.y + directions[nextPath].y;
        if (
          newX >= 0 &&
          newX < this.mazeWidth &&
          newY >= 0 &&
          newY < this.mazeHeight
        ) {
          if (!this.mazeMap[newX][newY].isVisited) {
            this.mazeMap[prevCell.x][prevCell.y][nextPath] = true;
            this.mazeMap[newX][newY][directions[nextPath].o] = true;
            checkedCells++;
            this.mazeMap[newX][newY].prevPos = prevCell;
            prevCell = { x: newX, y: newY };
            isMoved = true;
            break;
          }
        }
      }
      if (!isMoved) {
        prevCell = this.mazeMap[prevCell.x][prevCell.y].prevPos;
      }
    } while (checkedCells < maxCells);
  }

  makeMaze() {
    const mazeRows = new Array(this.mazeWidth);
    for (let i = 0; i < this.mazeWidth; ++i) {
      mazeRows[i] = new Array(this.mazeHeight);
      for (let j = 0; j < this.mazeHeight; ++j) {
        mazeRows[i][j] = {
          n: false,
          s: false,
          e: false,
          w: false,
          isVisited: false,
          prevPos: null,
        };
      }
    }
    this.mazeMap = mazeRows;
  }

  generateMap() {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    this.mazeMap.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        const x = rowIndex * this.cellSize;
        const y = colIndex * this.cellSize;

        if (!col.n) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + this.cellSize, y);
          ctx.stroke();
        }
        if (!col.s) {
          ctx.beginPath();
          ctx.moveTo(x, y + this.cellSize);
          ctx.lineTo(x + this.cellSize, y + this.cellSize);
          ctx.stroke();
        }
        if (!col.e) {
          ctx.beginPath();
          ctx.moveTo(x + this.cellSize, y);
          ctx.lineTo(x + this.cellSize, y + this.cellSize);
          ctx.stroke();
        }
        if (!col.w) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + this.cellSize);
          ctx.stroke();
        }
      });
    });
  }

  generateSprite(imgurl, component) {
    const spriteImage = genSpriteImg(imgurl);
    this[component] = { spriteImage };

    this[component].spriteImage.onload = (e) => {
      const imgratio = e.target.height / e.target.width;
      const imgResizedHeight = this.width * imgratio;
      this[component].resizedHeight = imgResizedHeight;
    };
  }

  drawSprites(component) {
    const centerY = (this.cellSize - component.resizedHeight) / 2;
    const centerX = (this.cellSize - this.width) / 2;
    ctx.drawImage(
      component.spriteImage,
      0,
      0,
      component.spriteImage.width,
      component.spriteImage.height,
      this.cellSize * component.x + centerX,
      this.cellSize * component.y + centerY,
      this.width,
      component.resizedHeight
    );
  }

  generateSpriteCords() {
    const randomNum = genRandomNums(4);
    const spriteCords = {};

    switch (randomNum) {
      case 0:
        spriteCords.x = 0;
        spriteCords.y = 0;
        break;
      case 1:
        spriteCords.x = this.mazeWidth - 1;
        spriteCords.y = 0;
        break;
      case 2:
        spriteCords.x = 0;
        spriteCords.y = this.mazeHeight - 1;
        break;
      case 3:
        spriteCords.x = this.mazeWidth - 1;
        spriteCords.y = this.mazeHeight - 1;
        break;

      default:
        return null;
    }
    return spriteCords;
  }

  clearPlayer() {
    this.ctx.clearRect(
      this.player.x * this.cellSize + 4 / 2,
      this.player.y * this.cellSize +
        (this.cellSize - this.player.resizedHeight) / 2,
      this.width,
      this.player.resizedHeight
    );
  }

  run() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    newGame.makeMaze();
    newGame.defineMaze();
    newGame.generateMap();
    newGame.shuffleInitialCords();
    [this.player, this.finishCell].forEach((sprite) =>
      newGame.drawSprites(sprite)
    );
  }

  shuffleInitialCords() {
    do {
      [this.player, this.finishCell].forEach((sprite) => {
        const { x, y } = this.generateSpriteCords();
        sprite.x = x;
        sprite.y = y;
      });
    } while (
      this.player.x === this.finishCell.x &&
      this.player.y === this.finishCell.y
    );
  }

  checkWin() {
    if (
      this.player.x === this.finishCell.x &&
      this.player.y === this.finishCell.y
    ) {
      window.removeEventListener("keyup", gameControls);
      movesEl.textContent = this.score;
      setTimeout(() => {
        dialogBox.showModal();
      }, 500);
    }
  }

  resizeSprite(sprite) {
    const imgratio = sprite.spriteImage.height / sprite.spriteImage.width;
    const imgResizedHeight = newGame.width * imgratio;
    return imgResizedHeight;
  }

  resizeGame() {
    this.cellSize = this.ctx.canvas.width / this.mazeHeight;
    this.width = this.cellSize - 3;
    [this.player, this.finishCell].forEach((sprite) => {
      sprite.resizedHeight = this.resizeSprite(sprite);
      this.drawSprites(sprite);
    });
    this.generateMap();
  }
}

// generate random number within range of length param
const genRandomNums = (length) => {
  return Math.floor(Math.random() * length);
};
// shuffle elements of given array argument
const shuffle = (array) => {
  const newArray = [...array];
  for (let i = array.length - 1; i > 0; --i) {
    const shiftedIndex = genRandomNums(i + 1);
    [newArray[i], newArray[shiftedIndex]] = [
      newArray[shiftedIndex],
      newArray[i],
    ];
  }
  return newArray;
};
// create image object from imgUrl relative path
const genSpriteImg = (imgUrl) => {
  const spriteIcon = new Image();
  spriteIcon.src = `./images/${imgUrl}`;
  return spriteIcon;
};

// Sizing canvas to make it responsive on different screen devices
const resizeCanvas = () => {
  const bodyHeight =
    document.body.clientHeight - canvas.getBoundingClientRect().top;
  const bodyWidth = document.body.clientWidth;
  if (bodyHeight < bodyWidth) {
    canvas.width = bodyHeight - bodyHeight / 100;
    canvas.height = bodyHeight - bodyHeight / 100;
  } else if (bodyHeight > bodyWidth) {
    canvas.width = bodyWidth - bodyWidth / 100;
    canvas.height = bodyWidth - bodyWidth / 100;
  }
  canvas.style.cssText = `--cvs-height: ${canvas.height}; --cvs-width: ${canvas.width};`;
};

const gameControls = (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (
        newGame.player.y - 1 >= 0 &&
        newGame.mazeMap[newGame.player.x][newGame.player.y - 1].s
      ) {
        newGame.clearPlayer();
        newGame.player.y--;
        newGame.drawSprites(newGame.player);
      }
      break;
    case "ArrowDown":
      if (
        newGame.player.y + 1 <= newGame.mazeHeight - 1 &&
        newGame.mazeMap[newGame.player.x][newGame.player.y + 1].n
      ) {
        newGame.clearPlayer();
        newGame.player.y++;
        newGame.drawSprites(newGame.player);
      }
      break;
    case "ArrowRight":
      if (
        newGame.player.x + 1 <= newGame.mazeWidth - 1 &&
        newGame.mazeMap[newGame.player.x + 1][newGame.player.y].w
      ) {
        newGame.clearPlayer();
        newGame.player.x++;
        newGame.drawSprites(newGame.player);
      }
      break;
    case "ArrowLeft":
      if (
        newGame.player.x - 1 >= 0 &&
        newGame.mazeMap[newGame.player.x - 1][newGame.player.y].e
      ) {
        newGame.clearPlayer();
        newGame.player.x--;
        newGame.drawSprites(newGame.player);
      }
      break;
  }
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowRight":
    case "ArrowLeft":
      newGame.score++;
      newGame.checkWin();
      break;
  }  
}

const setNewGame = () => {
  const mazeDimenstion = parseInt(levelsInput.value);
  newGame = new Maze(ctx, mazeDimenstion, mazeDimenstion);
  newGame.generateSprite("dog.png", "player");
  newGame.generateSprite("bone.png", "finishCell");
  runGame(newGame.player, newGame.finishCell).then(() => newGame.run());

  window.addEventListener("keyup", gameControls);
  dialogBox.close();
}

const runGame = (...sprites) => {
  return Promise.all(
    sprites.map(
      (sprite) =>
        new Promise((resolve, reject) => {
          sprite.spriteImage.onload = function () {
            sprite.resizedHeight = newGame.resizeSprite(sprite);
            resolve();
          };
          sprite.onerror = reject;
        })
    )
  )
};

// set puzzle level on current selected input option
starnewGameBtn.addEventListener("click", setNewGame);

// play new game btn inside modal dialog with same setting
playAgainEl.addEventListener("click", setNewGame);

// handling canvas resize when browser window gets risized
window.addEventListener("resize", function () {
  resizeCanvas();
  newGame.resizeGame();
});

resizeCanvas();
setNewGame();