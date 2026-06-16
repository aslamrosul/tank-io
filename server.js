const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const WORLD = { width: 2200, height: 1400 };
const TICK_RATE = 60;
const SNAPSHOT_RATE = 30;
const DT = 1 / TICK_RATE;
const TANK_RADIUS = 28;
const BULLET_RADIUS = 5;

const obstacles = [
  { x: 260, y: 240, w: 260, h: 80, type: 'wall' },
  { x: 760, y: 180, w: 120, h: 360, type: 'wall' },
  { x: 1180, y: 260, w: 420, h: 80, type: 'wall' },
  { x: 1760, y: 190, w: 170, h: 240, type: 'wall' },
  { x: 240, y: 700, w: 360, h: 90, type: 'wall' },
  { x: 820, y: 780, w: 260, h: 170, type: 'crate' },
  { x: 1320, y: 720, w: 130, h: 380, type: 'wall' },
  { x: 1640, y: 800, w: 340, h: 90, type: 'wall' },
  { x: 520, y: 1130, w: 260, h: 90, type: 'wall' },
  { x: 1040, y: 1160, w: 360, h: 90, type: 'wall' },
  { x: 1720, y: 1120, w: 230, h: 120, type: 'crate' },
];

const colors = [
  '#00D1FF', '#FFB703', '#FB5607', '#06D6A0', '#B517FF',
  '#F72585', '#90BE6D', '#4CC9F0', '#F9C74F', '#43AA8B',
];

const players = new Map();
const bullets = new Map();
let bulletCounter = 0;
let colorIndex = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function circleRectCollision(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function isBlocked(x, y, radius = TANK_RADIUS) {
  if (x < radius || y < radius || x > WORLD.width - radius || y > WORLD.height - radius) {
    return true;
  }
  return obstacles.some((rect) => circleRectCollision(x, y, radius, rect));
}

function randomSpawn() {
  for (let i = 0; i < 500; i += 1) {
    const x = 90 + Math.random() * (WORLD.width - 180);
    const y = 90 + Math.random() * (WORLD.height - 180);
    if (!isBlocked(x, y, TANK_RADIUS + 20)) return { x, y };
  }
  return { x: 120, y: 120 };
}

function safeName(name) {
  return String(name || 'Player')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 16) || 'Player';
}

function serializePlayers() {
  const data = {};
  for (const [id, p] of players.entries()) {
    data[id] = {
      id,
      name: p.name,
      x: Math.round(p.x),
      y: Math.round(p.y),
      bodyAngle: p.bodyAngle,
      turretAngle: p.turretAngle,
      color: p.color,
      hp: p.hp,
      maxHp: p.maxHp,
      score: p.score,
      deaths: p.deaths,
      alive: p.alive,
      respawnIn: p.alive ? 0 : Math.max(0, Math.ceil((p.respawnAt - Date.now()) / 1000)),
    };
  }
  return data;
}

function serializeBullets() {
  const data = [];
  for (const b of bullets.values()) {
    data.push({ id: b.id, x: Math.round(b.x), y: Math.round(b.y), angle: b.angle, ownerId: b.ownerId });
  }
  return data;
}

function leaderboard() {
  return [...players.values()]
    .map((p) => ({ id: p.id, name: p.name, score: p.score, deaths: p.deaths }))
    .sort((a, b) => b.score - a.score || a.deaths - b.deaths)
    .slice(0, 6);
}

function spawnPlayer(socket, name) {
  const spawn = randomSpawn();
  const now = Date.now();
  const id = socket.id;
  const player = {
    id,
    name: safeName(name),
    x: spawn.x,
    y: spawn.y,
    bodyAngle: 0,
    turretAngle: 0,
    color: colors[colorIndex % colors.length],
    hp: 100,
    maxHp: 100,
    score: 0,
    deaths: 0,
    alive: true,
    respawnAt: 0,
    lastShotAt: now,
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
      shooting: false,
      aimAngle: 0,
    },
  };
  colorIndex += 1;
  players.set(id, player);
  return player;
}

function respawnPlayer(player) {
  const spawn = randomSpawn();
  player.x = spawn.x;
  player.y = spawn.y;
  player.hp = player.maxHp;
  player.alive = true;
  player.respawnAt = 0;
  player.bodyAngle = Math.random() * Math.PI * 2;
  player.turretAngle = player.bodyAngle;
}

function movePlayer(player, dt) {
  if (!player.alive) return;

  const input = player.input;
  let vx = 0;
  let vy = 0;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;

  const length = Math.hypot(vx, vy);
  if (length > 0) {
    vx /= length;
    vy /= length;
    const speed = input.down && !input.up ? 205 : 255;
    const nextX = player.x + vx * speed * dt;
    const nextY = player.y + vy * speed * dt;

    if (!isBlocked(nextX, player.y)) player.x = nextX;
    if (!isBlocked(player.x, nextY)) player.y = nextY;

    player.bodyAngle = Math.atan2(vy, vx);
  }

  if (Number.isFinite(input.aimAngle)) {
    player.turretAngle = input.aimAngle;
  }
}

function shootIfNeeded(player) {
  if (!player.alive || !player.input.shooting) return;

  const now = Date.now();
  const cooldownMs = 220;
  if (now - player.lastShotAt < cooldownMs) return;
  player.lastShotAt = now;

  const muzzleDistance = 40;
  const speed = 760;
  const id = `b_${bulletCounter++}`;
  bullets.set(id, {
    id,
    ownerId: player.id,
    x: player.x + Math.cos(player.turretAngle) * muzzleDistance,
    y: player.y + Math.sin(player.turretAngle) * muzzleDistance,
    vx: Math.cos(player.turretAngle) * speed,
    vy: Math.sin(player.turretAngle) * speed,
    angle: player.turretAngle,
    life: 1.7,
    damage: 25,
  });
}

function updateBullets(dt) {
  for (const [id, bullet] of bullets.entries()) {
    bullet.life -= dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    const outside = bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD.width || bullet.y > WORLD.height;
    const hitWall = obstacles.some((rect) => circleRectCollision(bullet.x, bullet.y, BULLET_RADIUS, rect));

    if (bullet.life <= 0 || outside || hitWall) {
      bullets.delete(id);
      continue;
    }

    for (const player of players.values()) {
      if (!player.alive || player.id === bullet.ownerId) continue;
      if (distanceSquared(player, bullet) <= (TANK_RADIUS + BULLET_RADIUS) ** 2) {
        player.hp = Math.max(0, player.hp - bullet.damage);
        bullets.delete(id);

        if (player.hp <= 0) {
          player.alive = false;
          player.deaths += 1;
          player.respawnAt = Date.now() + 2600;
          const owner = players.get(bullet.ownerId);
          if (owner) owner.score += 1;
        }
        break;
      }
    }
  }
}

function gameLoop() {
  const now = Date.now();
  for (const player of players.values()) {
    if (!player.alive && player.respawnAt && now >= player.respawnAt) {
      respawnPlayer(player);
    }
    movePlayer(player, DT);
    shootIfNeeded(player);
  }
  updateBullets(DT);
}

function sendSnapshot() {
  io.emit('snapshot', {
    serverTime: Date.now(),
    players: serializePlayers(),
    bullets: serializeBullets(),
    leaderboard: leaderboard(),
  });
}

io.on('connection', (socket) => {
  socket.emit('init', { id: socket.id, world: WORLD, obstacles });

  socket.on('join', ({ name } = {}) => {
    const player = spawnPlayer(socket, name);
    socket.emit('joined', { id: socket.id, player });
    sendSnapshot();
  });

  socket.on('input', (input = {}) => {
    const player = players.get(socket.id);
    if (!player) return;

    player.input.up = Boolean(input.up);
    player.input.down = Boolean(input.down);
    player.input.left = Boolean(input.left);
    player.input.right = Boolean(input.right);
    player.input.shooting = Boolean(input.shooting);

    if (Number.isFinite(input.aimAngle)) {
      player.input.aimAngle = input.aimAngle;
    }
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    sendSnapshot();
  });
});

setInterval(gameLoop, 1000 / TICK_RATE);
setInterval(sendSnapshot, 1000 / SNAPSHOT_RATE);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HD Multiplayer Tank running at http://localhost:${PORT}`);
});
