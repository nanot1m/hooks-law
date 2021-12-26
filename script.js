// @ts-check
const stiffnessInput = document.getElementById("stiffness");
const dampingInput = document.getElementById("damping");
const massInput = document.getElementById("mass");

if (!(stiffnessInput instanceof HTMLInputElement)) {
  throw new Error("stiffnessInput is not an HTMLInputElement");
}
if (!(dampingInput instanceof HTMLInputElement)) {
  throw new Error("dampingInput is not an HTMLInputElement");
}
if (!(massInput instanceof HTMLInputElement)) {
  throw new Error("massInput is not an HTMLInputElement");
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas not supported");
}

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

prepareCanvas(ctx, WIDTH, HEIGHT);

const box = { x: 10, y: 10, width: 20, height: 20, backgroundColor: "red" };

let stiffness = +stiffnessInput.value;
let damping = +dampingInput.value;
let mass = +massInput.value;

function createAnimationStepper() {
  let speed = 0;
  /**
   * @param {number} cur
   * @param {number} target
   * @param {number} dt
   */
  return (cur, target, dt) => {
    dt = dt / 1000;
    const hookAcceleration = -stiffness * (cur - target);
    const dampingAcceleration = -damping * speed;
    const acceleration = (hookAcceleration + dampingAcceleration) / mass;
    speed += acceleration * dt;
    return cur + speed * dt;
  };
}

let targetX = box.x;
let targetY = box.y;

canvas.addEventListener("pointermove", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  targetX = x - box.width / 2;
  targetY = y - box.height / 2;
});

let stepperX = createAnimationStepper();
let stepperY = createAnimationStepper();

stiffnessInput.addEventListener("change", function () {
  stiffness = +this.value;
});
dampingInput.addEventListener("change", function () {
  damping = +this.value;
});
massInput.addEventListener("change", function () {
  mass = +this.value;
});

function stack(size) {
  const stash = Array(size);
  return {
    push(item) {
      if (stash.length === size) {
        stash.shift();
      }
      stash.push(item);
    },
    forEach(fn) {
      stash.forEach(fn);
    },
  };
}

const TAIL_SIZE = 100;
const tail = stack(TAIL_SIZE);

let prevElapsedTime;
function renderLoop(elapsedTime) {
  if (prevElapsedTime === undefined) {
    prevElapsedTime = elapsedTime;
  }
  const dt = elapsedTime - prevElapsedTime;
  clearCanvas(ctx);

  tail.push({ ...box });
  tail.forEach((box, idx) => {
    const color = `hsl(${(idx * 360) / TAIL_SIZE}, 100%, 50%)`;
    drawBox(ctx, { ...box, backgroundColor: color });
  });
  box.x = stepperX(box.x, targetX, dt);
  box.y = stepperY(box.y, targetY, dt);
  drawBox(ctx, box);
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  drawLine(
    ctx,
    { x: box.x + halfWidth, y: box.y + halfHeight },
    { x: targetX + halfWidth, y: targetY + halfHeight },
    "black"
  );
  prevElapsedTime = elapsedTime;
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

/**
 * @typedef {Object} Box
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {string} backgroundColor
 */

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Box} box
 */
function drawBox(ctx, box) {
  ctx.fillStyle = box.backgroundColor;
  ctx.fillRect(box.x, box.y, box.width, box.height);
}

function drawLine(ctx, start, end, color) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function prepareCanvas(ctx, width, height) {
  const canvas = ctx.canvas;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.scale(pixelRatio, pixelRatio);
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
