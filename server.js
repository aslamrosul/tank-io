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
const WORLD = { width: 2400, height: 1550 };
const TICK_RATE = 60;
const SNAPSHOT_RATE = 30;
const DT = 1 / TICK_RATE;
const TANK_RADIUS = 28;
const BULLET_RADIUS = 5;
const MAX_LEVEL = 30;

let obstacles = [
  { id: 'wall_1', x: 260, y: 240, w: 260, h: 80, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_2', x: 760, y: 180, w: 120, h: 360, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_3', x: 1180, y: 260, w: 420, h: 80, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_4', x: 1760, y: 190, w: 170, h: 240, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_5', x: 2140, y: 320, w: 120, h: 320, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_6', x: 240, y: 700, w: 360, h: 90, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'crate_1', x: 820, y: 780, w: 260, h: 170, type: 'crate', destructible: true, hp: 145, maxHp: 145, xpReward: 42, respawnMs: 15000, destroyed: false, respawnAt: 0 },
  { id: 'wall_7', x: 1320, y: 720, w: 130, h: 380, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_8', x: 1640, y: 800, w: 340, h: 90, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'crate_2', x: 2040, y: 940, w: 190, h: 120, type: 'crate', destructible: true, hp: 120, maxHp: 120, xpReward: 36, respawnMs: 14000, destroyed: false, respawnAt: 0 },
  { id: 'wall_9', x: 520, y: 1230, w: 260, h: 90, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'wall_10', x: 1040, y: 1260, w: 360, h: 90, type: 'wall', destructible: false, hp: 0, maxHp: 0, xpReward: 0 },
  { id: 'crate_3', x: 1720, y: 1220, w: 230, h: 120, type: 'crate', destructible: true, hp: 130, maxHp: 130, xpReward: 38, respawnMs: 14500, destroyed: false, respawnAt: 0 },
  { id: 'core_1', x: 620, y: 430, w: 72, h: 72, type: 'core', destructible: true, hp: 75, maxHp: 75, xpReward: 30, respawnMs: 12000, destroyed: false, respawnAt: 0 },
  { id: 'core_2', x: 1515, y: 510, w: 76, h: 76, type: 'core', destructible: true, hp: 80, maxHp: 80, xpReward: 32, respawnMs: 12000, destroyed: false, respawnAt: 0 },
  { id: 'core_3', x: 310, y: 1020, w: 74, h: 74, type: 'core', destructible: true, hp: 75, maxHp: 75, xpReward: 30, respawnMs: 12000, destroyed: false, respawnAt: 0 },
  { id: 'core_4', x: 2090, y: 1250, w: 78, h: 78, type: 'core', destructible: true, hp: 82, maxHp: 82, xpReward: 34, respawnMs: 13000, destroyed: false, respawnAt: 0 },
];

const colors = [
  '#00D1FF', '#FFB703', '#FB5607', '#06D6A0', '#B517FF',
  '#F72585', '#90BE6D', '#4CC9F0', '#F9C74F', '#43AA8B',
];

const WEAPON_TREE = {
  basic: {
    id: 'basic', name: 'Basic Tank', tier: 0, minLevel: 1,
    desc: 'Seimbang. Cocok untuk awal permainan.', children: ['twin', 'sniper', 'machine', 'heavy'],
  },
  twin: {
    id: 'twin', name: 'Twin Cannon', tier: 1, minLevel: 2, parent: 'basic',
    desc: 'Dua peluru paralel. Enak buat duel jarak dekat.', children: ['triple', 'flanker'],
  },
  sniper: {
    id: 'sniper', name: 'Sniper', tier: 1, minLevel: 2, parent: 'basic',
    desc: 'Peluru cepat dan sakit, tapi reload lebih lama.', children: ['railgun', 'assassin'],
  },
  machine: {
    id: 'machine', name: 'Machine Gun', tier: 1, minLevel: 2, parent: 'basic',
    desc: 'Tembakan cepat. Cocok spam dan pressure.', children: ['minigun', 'shotgun'],
  },
  heavy: {
    id: 'heavy', name: 'Heavy Cannon', tier: 1, minLevel: 2, parent: 'basic',
    desc: 'Peluru besar dan damage tinggi, tapi lambat.', children: ['destroyer', 'juggernaut'],
  },
  triple: {
    id: 'triple', name: 'Triple Shot', tier: 2, minLevel: 5, parent: 'twin',
    desc: 'Tiga peluru menyebar. Area control kuat.', children: [],
  },
  flanker: {
    id: 'flanker', name: 'Flanker', tier: 2, minLevel: 5, parent: 'twin',
    desc: 'Menembak depan dan belakang sekaligus.', children: [],
  },
  railgun: {
    id: 'railgun', name: 'Railgun', tier: 2, minLevel: 5, parent: 'sniper',
    desc: 'Peluru super cepat, bisa menembus 1 target.', children: [],
  },
  assassin: {
    id: 'assassin', name: 'Assassin', tier: 2, minLevel: 5, parent: 'sniper',
    desc: 'Range jauh, damage besar, peluru kecil cepat.', children: [],
  },
  minigun: {
    id: 'minigun', name: 'Minigun', tier: 2, minLevel: 5, parent: 'machine',
    desc: 'Rate of fire brutal. Bisa jadi sangat OP.', children: [],
  },
  shotgun: {
    id: 'shotgun', name: 'Shotgun', tier: 2, minLevel: 5, parent: 'machine',
    desc: 'Banyak pellet jarak dekat. Burst damage tinggi.', children: [],
  },
  destroyer: {
    id: 'destroyer', name: 'Destroyer', tier: 2, minLevel: 5, parent: 'heavy',
    desc: 'Satu peluru raksasa. Hit bersih hampir mematikan.', children: [],
  },
  juggernaut: {
    id: 'juggernaut', name: 'Juggernaut', tier: 2, minLevel: 5, parent: 'heavy',
    desc: 'Tank tebal, peluru besar, cocok jadi frontliner.', children: [],
  },
};

const STAT_UPGRADES = {
  damage: { id: 'damage', name: 'Damage', max: 6, desc: '+12% damage per level' },
  reload: { id: 'reload', name: 'Reload', max: 6, desc: 'Tembak makin cepat' },
  speed: { id: 'speed', name: 'Movement', max: 6, desc: 'Tank makin lincah' },
  maxHp: { id: 'maxHp', name: 'Max HP', max: 6, desc: '+18 HP per level' },
  bulletSpeed: { id: 'bulletSpeed', name: 'Bullet Speed', max: 6, desc: 'Peluru lebih cepat dan range naik' },
  regen: { id: 'regen', name: 'Regen', max: 4, desc: 'Heal pelan saat tidak kena hit' },
};

const TACTICAL_UPGRADES = {
  ricochet: { id: 'ricochet', name: 'Ricochet Core', max: 1, desc: 'Peluru bisa mantul 1x dari tembok, tapi damage turun setelah mantul.' },
  burst: { id: 'burst', name: 'Burst Trigger', max: 2, desc: 'Tambah peluru samping kecil, damage ekstra sudah dinerf.' },
  explosive: { id: 'explosive', name: 'Explosive Shell', max: 2, desc: 'Splash damage kecil. Kuat untuk farming obstacle, tidak terlalu OP di duel.' },
  killHeal: { id: 'killHeal', name: 'Vampiric Repair', max: 3, desc: 'Heal lebih besar setiap berhasil kill musuh.' },
  armor: { id: 'armor', name: 'Reactive Armor', max: 3, desc: 'Mengurangi damage sedikit. Dinerf supaya tank tebal tidak abadi.' },
};

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
  if (x < radius || y < radius || x > WORLD.width - radius || y > WORLD.height - radius) return true;
  return obstacles.some((rect) => !rect.destroyed && circleRectCollision(x, y, radius, rect));
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

function xpToNext(level) {
  if (level >= MAX_LEVEL) return 0;
  return Math.floor(80 + level * 42 + Math.pow(level, 1.55) * 12);
}

function getWeaponBonus(player) {
  const weapon = player.weapon;
  return {
    extraHp: weapon === 'juggernaut' ? 90 : weapon === 'heavy' ? 20 : weapon === 'destroyer' ? 35 : 0,
    speedPenalty: weapon === 'juggernaut' ? 42 : weapon === 'destroyer' ? 34 : weapon === 'heavy' ? 20 : 0,
  };
}

function getMaxHp(player) {
  return 100 + player.stats.maxHp * 18 + getWeaponBonus(player).extraHp;
}

function getMoveSpeed(player) {
  return Math.max(150, 255 + player.stats.speed * 18 - getWeaponBonus(player).speedPenalty);
}

function awardXp(player, amount) {
  if (!player || player.level >= MAX_LEVEL) return;
  player.xp += amount;
  while (player.level < MAX_LEVEL && player.xp >= xpToNext(player.level)) {
    player.xp -= xpToNext(player.level);
    player.level += 1;
    player.upgradePoints += 1;
    const before = player.maxHp;
    player.maxHp = getMaxHp(player);
    player.hp = clamp(player.hp + Math.max(0, player.maxHp - before), 0, player.maxHp);
  }
}

function statOptionsFor(player) {
  return Object.values(STAT_UPGRADES)
    .filter((stat) => player.stats[stat.id] < stat.max)
    .map((stat) => ({ ...stat, level: player.stats[stat.id] }));
}

function weaponOptionsFor(player) {
  const current = WEAPON_TREE[player.weapon] || WEAPON_TREE.basic;
  return current.children
    .map((id) => WEAPON_TREE[id])
    .filter((weapon) => player.level >= weapon.minLevel)
    .map((weapon) => ({ id: weapon.id, name: weapon.name, tier: weapon.tier, minLevel: weapon.minLevel, desc: weapon.desc }));
}

function tacticalOptionsFor(player) {
  return Object.values(TACTICAL_UPGRADES)
    .filter((item) => player.tactical[item.id] < item.max)
    .map((item) => ({ ...item, level: player.tactical[item.id] }));
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
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      score: p.score,
      deaths: p.deaths,
      alive: p.alive,
      level: p.level,
      xp: Math.floor(p.xp),
      xpToNext: xpToNext(p.level),
      upgradePoints: p.upgradePoints,
      killStreak: p.killStreak || 0,
      obstacleBreaks: p.obstacleBreaks || 0,
      tactical: p.tactical,
      tacticalOptions: tacticalOptionsFor(p),
      weapon: p.weapon,
      weaponName: WEAPON_TREE[p.weapon]?.name || 'Basic Tank',
      weaponPath: p.weaponPath,
      stats: p.stats,
      statOptions: statOptionsFor(p),
      weaponOptions: weaponOptionsFor(p),
      respawnIn: p.alive ? 0 : Math.max(0, Math.ceil((p.respawnAt - Date.now()) / 1000)),
    };
  }
  return data;
}

function serializeBullets() {
  const data = [];
  for (const b of bullets.values()) {
    data.push({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
      angle: b.angle,
      ownerId: b.ownerId,
      radius: b.radius,
      color: b.color,
      bounces: b.bounces || 0,
      splashRadius: b.splashRadius || 0,
    });
  }
  return data;
}

function serializeObstacles() {
  const now = Date.now();
  return obstacles.map((o) => ({
    id: o.id,
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    type: o.type,
    destructible: Boolean(o.destructible),
    hp: Math.max(0, Math.round(o.hp || 0)),
    maxHp: Math.round(o.maxHp || 0),
    xpReward: o.xpReward || 0,
    destroyed: Boolean(o.destroyed),
    respawnIn: o.destroyed && o.respawnAt ? Math.max(0, Math.ceil((o.respawnAt - now) / 1000)) : 0,
  }));
}

function leaderboard() {
  return [...players.values()]
    .map((p) => ({ id: p.id, name: p.name, score: p.score, deaths: p.deaths, level: p.level, killStreak: p.killStreak || 0, obstacleBreaks: p.obstacleBreaks || 0, weaponName: WEAPON_TREE[p.weapon]?.name || 'Basic Tank' }))
    .sort((a, b) => b.score - a.score || b.level - a.level || a.deaths - b.deaths)
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
    killStreak: 0,
    obstacleBreaks: 0,
    level: 1,
    xp: 0,
    upgradePoints: 3,
    weapon: 'basic',
    weaponPath: ['basic'],
    stats: { damage: 0, reload: 0, speed: 0, maxHp: 0, bulletSpeed: 0, regen: 0 },
    tactical: { ricochet: 0, burst: 0, explosive: 0, killHeal: 0, armor: 0 },
    alive: true,
    respawnAt: 0,
    lastShotAt: now,
    lastDamageAt: now,
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
  player.maxHp = getMaxHp(player);
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
    const speed = input.down && !input.up ? getMoveSpeed(player) * 0.82 : getMoveSpeed(player);
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

function weaponSpec(player) {
  const stats = player.stats;
  const damageMult = 1 + stats.damage * 0.10;
  const reloadDiv = 1 + stats.reload * 0.12;
  const speedMult = 1 + stats.bulletSpeed * 0.06;
  const lifeMult = 1 + stats.bulletSpeed * 0.035;

  const specs = {
    basic: { cooldown: 230, damage: 24, speed: 760, life: 1.7, radius: 5, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#fff4a3' },
    twin: { cooldown: 270, damage: 21, speed: 760, life: 1.65, radius: 5, shots: [{ angle: 0, offset: -13 }, { angle: 0, offset: 13 }], inaccuracy: 0, pierce: 0, color: '#a7f3d0' },
    triple: { cooldown: 310, damage: 19, speed: 770, life: 1.65, radius: 5, shots: [{ angle: -0.16, offset: -14 }, { angle: 0, offset: 0 }, { angle: 0.16, offset: 14 }], inaccuracy: 0, pierce: 0, color: '#bbf7d0' },
    flanker: { cooldown: 245, damage: 21, speed: 770, life: 1.65, radius: 5, shots: [{ angle: 0, offset: 0 }, { angle: Math.PI, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#99f6e4' },
    sniper: { cooldown: 550, damage: 48, speed: 1100, life: 2.7, radius: 5, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#bfdbfe' },
    railgun: { cooldown: 820, damage: 68, speed: 1360, life: 3.2, radius: 7, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 1, color: '#e0f2fe' },
    assassin: { cooldown: 540, damage: 55, speed: 1480, life: 3.4, radius: 4, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#dbeafe' },
    machine: { cooldown: 105, damage: 14, speed: 720, life: 1.25, radius: 4, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0.055, pierce: 0, color: '#fde68a' },
    minigun: { cooldown: 74, damage: 8, speed: 735, life: 1.15, radius: 4, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0.09, pierce: 0, color: '#fef08a' },
    shotgun: { cooldown: 560, damage: 11, speed: 760, life: 0.78, radius: 4, shots: [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36].map((angle, index) => ({ angle, offset: (index - 3) * 4 })), inaccuracy: 0.06, pierce: 0, color: '#fed7aa' },
    heavy: { cooldown: 740, damage: 76, speed: 560, life: 2.05, radius: 10, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#fdba74' },
    destroyer: { cooldown: 1220, damage: 116, speed: 520, life: 2.45, radius: 16, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0, pierce: 0, color: '#fb923c' },
    juggernaut: { cooldown: 680, damage: 66, speed: 535, life: 2.15, radius: 12, shots: [{ angle: 0, offset: 0 }], inaccuracy: 0.02, pierce: 0, color: '#f97316' },
  };

  const base = specs[player.weapon] || specs.basic;
  return {
    ...base,
    cooldown: Math.max(38, base.cooldown / reloadDiv),
    damage: Math.round(base.damage * damageMult),
    speed: base.speed * speedMult,
    life: base.life * lifeMult,
  };
}

function shootIfNeeded(player) {
  if (!player.alive || !player.input.shooting) return;

  const now = Date.now();
  const spec = weaponSpec(player);
  if (now - player.lastShotAt < spec.cooldown) return;
  player.lastShotAt = now;

  const muzzleDistance = player.weapon === 'destroyer' ? 52 : player.weapon === 'heavy' || player.weapon === 'juggernaut' ? 48 : 42;
  const shots = spec.shots.map((shot) => ({ ...shot, damageScale: 1, radiusScale: 1 }));
  const burstLevel = player.tactical?.burst || 0;
  if (burstLevel >= 1) {
    shots.push({ angle: -0.14, offset: -9, damageScale: 0.32, radiusScale: 0.66 });
    shots.push({ angle: 0.14, offset: 9, damageScale: 0.32, radiusScale: 0.66 });
  }
  if (burstLevel >= 2) {
    shots.push({ angle: -0.26, offset: -15, damageScale: 0.22, radiusScale: 0.58 });
    shots.push({ angle: 0.26, offset: 15, damageScale: 0.22, radiusScale: 0.58 });
  }

  shots.forEach((shot) => {
    const angle = player.turretAngle + shot.angle + (Math.random() - 0.5) * spec.inaccuracy;
    const sideAngle = angle + Math.PI / 2;
    const offset = shot.offset || 0;
    const id = `b_${bulletCounter++}`;
    const explosiveLevel = player.tactical?.explosive || 0;
    bullets.set(id, {
      id,
      ownerId: player.id,
      x: player.x + Math.cos(player.turretAngle) * muzzleDistance + Math.cos(sideAngle) * offset,
      y: player.y + Math.sin(player.turretAngle) * muzzleDistance + Math.sin(sideAngle) * offset,
      vx: Math.cos(angle) * spec.speed,
      vy: Math.sin(angle) * spec.speed,
      angle,
      life: spec.life,
      damage: Math.max(1, Math.round(spec.damage * (shot.damageScale || 1))),
      radius: Math.max(3, Math.round(spec.radius * (shot.radiusScale || 1))),
      pierce: spec.pierce,
      bounces: player.tactical?.ricochet || 0,
      splashRadius: explosiveLevel > 0 ? 34 + explosiveLevel * 14 : 0,
      splashDamageScale: explosiveLevel > 0 ? 0.16 + explosiveLevel * 0.06 : 0,
      color: spec.color,
    });
  });
}

function applyDamage(target, bullet, owner, damage) {
  const armorLevel = target.tactical?.armor || 0;
  const finalDamage = Math.max(1, Math.round(damage * (1 - armorLevel * 0.055)));
  target.hp = Math.max(0, target.hp - finalDamage);
  target.lastDamageAt = Date.now();
  if (owner) awardXp(owner, 8);

  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    target.deaths += 1;
    target.killStreak = 0;
    target.respawnAt = Date.now() + 2600;
    if (owner && owner.id !== target.id) {
      owner.score += 1;
      owner.killStreak = (owner.killStreak || 0) + 1;
      awardXp(owner, 135 + target.level * 8);

      const killHeal = 16 + (owner.tactical?.killHeal || 0) * 10;
      owner.hp = clamp(owner.hp + killHeal, 0, owner.maxHp);

      // Every 3 kills in a row: smaller bonus heal + one extra upgrade point.
      if (owner.killStreak > 0 && owner.killStreak % 3 === 0) {
        owner.upgradePoints += 1;
        owner.hp = clamp(owner.hp + 24, 0, owner.maxHp);
      }
    }
    return true;
  }
  return false;
}

function bounceBullet(bullet, prevX, prevY, hitWall) {
  if ((bullet.bounces || 0) <= 0) return false;

  let bounced = false;
  if (bullet.x <= bullet.radius || bullet.x >= WORLD.width - bullet.radius) {
    bullet.vx *= -1;
    bullet.x = clamp(bullet.x, bullet.radius + 2, WORLD.width - bullet.radius - 2);
    bounced = true;
  }
  if (bullet.y <= bullet.radius || bullet.y >= WORLD.height - bullet.radius) {
    bullet.vy *= -1;
    bullet.y = clamp(bullet.y, bullet.radius + 2, WORLD.height - bullet.radius - 2);
    bounced = true;
  }

  if (hitWall && !bounced) {
    const cameFromSide = prevX < hitWall.x || prevX > hitWall.x + hitWall.w;
    if (cameFromSide) bullet.vx *= -1;
    else bullet.vy *= -1;
    bullet.x = prevX;
    bullet.y = prevY;
    bounced = true;
  }

  if (bounced) {
    bullet.bounces -= 1;
    bullet.life *= 0.72;
    bullet.damage = Math.max(1, Math.round(bullet.damage * 0.72));
    bullet.angle = Math.atan2(bullet.vy, bullet.vx);
  }
  return bounced;
}

function applySplashDamage(bullet, directHitId) {
  if (!bullet.splashRadius || bullet.splashRadius <= 0) return;
  const owner = players.get(bullet.ownerId);
  const splashDamage = Math.max(1, Math.round(bullet.damage * (bullet.splashDamageScale || 0.32)));
  const radiusSq = bullet.splashRadius * bullet.splashRadius;

  for (const target of players.values()) {
    if (!target.alive || target.id === bullet.ownerId || target.id === directHitId) continue;
    if (distanceSquared(target, bullet) <= radiusSq) {
      applyDamage(target, bullet, owner, splashDamage);
    }
  }
}


function damageObstacle(obstacle, bullet, owner) {
  if (!obstacle || !obstacle.destructible || obstacle.destroyed) return false;

  obstacle.hp = Math.max(0, (obstacle.hp || obstacle.maxHp || 1) - Math.max(1, bullet.damage || 1));
  if (owner && owner.alive) {
    // Small hit XP so players can grind, but far slower than killing players.
    awardXp(owner, 3);
  }

  if (obstacle.hp <= 0) {
    obstacle.destroyed = true;
    obstacle.respawnAt = Date.now() + (obstacle.respawnMs || 14000);
    const reward = obstacle.xpReward || 25;
    if (owner && owner.alive) {
      awardXp(owner, reward);
      owner.obstacleBreaks = (owner.obstacleBreaks || 0) + 1;
      owner.hp = clamp(owner.hp + 5, 0, owner.maxHp);
    }
    return true;
  }
  return false;
}

function updateObstacles() {
  const now = Date.now();
  obstacles.forEach((obstacle) => {
    if (!obstacle.destructible || !obstacle.destroyed) return;
    if (obstacle.respawnAt && now >= obstacle.respawnAt) {
      obstacle.destroyed = false;
      obstacle.respawnAt = 0;
      obstacle.hp = obstacle.maxHp;
    }
  });
}

function updateBullets(dt) {
  for (const [id, bullet] of bullets.entries()) {
    bullet.life -= dt;
    const prevX = bullet.x;
    const prevY = bullet.y;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    const hitObstacle = obstacles.find((rect) => !rect.destroyed && circleRectCollision(bullet.x, bullet.y, bullet.radius || BULLET_RADIUS, rect));
    const outside = bullet.x < bullet.radius || bullet.y < bullet.radius || bullet.x > WORLD.width - bullet.radius || bullet.y > WORLD.height - bullet.radius;

    if (hitObstacle && hitObstacle.destructible) {
      const owner = players.get(bullet.ownerId);
      damageObstacle(hitObstacle, bullet, owner);
      applySplashDamage(bullet, null);
      if (bullet.pierce > 0) {
        bullet.pierce -= 1;
      } else {
        bullets.delete(id);
      }
      continue;
    }

    if (outside || hitObstacle) {
      if (bounceBullet(bullet, prevX, prevY, hitObstacle)) continue;
      applySplashDamage(bullet, null);
      bullets.delete(id);
      continue;
    }

    if (bullet.life <= 0) {
      applySplashDamage(bullet, null);
      bullets.delete(id);
      continue;
    }

    for (const player of players.values()) {
      if (!player.alive || player.id === bullet.ownerId || bullet.hitIds?.has(player.id)) continue;
      if (distanceSquared(player, bullet) <= (TANK_RADIUS + (bullet.radius || BULLET_RADIUS)) ** 2) {
        const owner = players.get(bullet.ownerId);
        if (!bullet.hitIds) bullet.hitIds = new Set();
        bullet.hitIds.add(player.id);

        applyDamage(player, bullet, owner, bullet.damage);
        applySplashDamage(bullet, player.id);

        if (bullet.pierce > 0) {
          bullet.pierce -= 1;
        } else {
          bullets.delete(id);
        }
        break;
      }
    }
  }
}

function regenerate(player, dt) {
  if (!player.alive || player.stats.regen <= 0) return;
  if (Date.now() - player.lastDamageAt < 3500) return;
  const healPerSecond = 1.8 + player.stats.regen * 1.4;
  player.hp = clamp(player.hp + healPerSecond * dt, 0, player.maxHp);
}

function gameLoop() {
  const now = Date.now();
  for (const player of players.values()) {
    if (!player.alive && player.respawnAt && now >= player.respawnAt) {
      respawnPlayer(player);
    }
    player.maxHp = getMaxHp(player);
    movePlayer(player, DT);
    regenerate(player, DT);
    shootIfNeeded(player);
  }
  updateBullets(DT);
  updateObstacles();
}

function sendSnapshot() {
  io.emit('snapshot', {
    serverTime: Date.now(),
    players: serializePlayers(),
    bullets: serializeBullets(),
    leaderboard: leaderboard(),
    obstacles: serializeObstacles(),
  });
}

function chooseStatUpgrade(player, id) {
  const stat = STAT_UPGRADES[id];
  if (!stat || player.upgradePoints <= 0 || player.stats[id] >= stat.max) return false;
  const beforeMax = player.maxHp;
  player.stats[id] += 1;
  player.upgradePoints -= 1;
  player.maxHp = getMaxHp(player);
  if (id === 'maxHp') player.hp = clamp(player.hp + (player.maxHp - beforeMax), 0, player.maxHp);
  return true;
}

function chooseWeaponUpgrade(player, id) {
  const target = WEAPON_TREE[id];
  const current = WEAPON_TREE[player.weapon];
  if (!target || !current || player.upgradePoints <= 0) return false;
  if (!current.children.includes(id)) return false;
  if (player.level < target.minLevel) return false;

  const beforeMax = player.maxHp;
  player.weapon = id;
  player.weaponPath.push(id);
  player.upgradePoints -= 1;
  player.maxHp = getMaxHp(player);
  player.hp = clamp(player.hp + Math.max(0, player.maxHp - beforeMax), 0, player.maxHp);
  return true;
}

function chooseTacticalUpgrade(player, id) {
  const item = TACTICAL_UPGRADES[id];
  if (!item || player.upgradePoints <= 0) return false;
  if (player.tactical[id] >= item.max) return false;
  player.tactical[id] += 1;
  player.upgradePoints -= 1;
  return true;
}

io.on('connection', (socket) => {
  socket.emit('init', { id: socket.id, world: WORLD, obstacles: serializeObstacles() });

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

  socket.on('chooseUpgrade', ({ type, id } = {}) => {
    const player = players.get(socket.id);
    if (!player) return;

    let ok = false;
    if (type === 'stat') ok = chooseStatUpgrade(player, id);
    if (type === 'weapon') ok = chooseWeaponUpgrade(player, id);
    if (type === 'tactical') ok = chooseTacticalUpgrade(player, id);

    socket.emit('upgradeResult', { ok, type, id, upgradePoints: player.upgradePoints });
    sendSnapshot();
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
