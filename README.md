# Iron Battalion — Tactical Semi 3D Arena

Multiplayer tank arena berbasis Node.js, Express, Socket.io, dan HTML5 Canvas.
Versi ini sudah punya visual **semi-3D HD**, controller HP, upgrade tree, dan tactical mods seperti arena roguelite / Diep.io.

## Fitur utama

- Multiplayer realtime dengan Socket.io
- Controller desktop dan HP/touchscreen
- Sistem XP, level, stat upgrade, dan weapon evolution tree
- **Kill-chain reward**: setiap 2 kill beruntun mendapat heal bonus + 1 upgrade point
- **Heal on kill**: setiap kill langsung memperbaiki HP tank
- **Tactical Mods**:
  - Ricochet Core: peluru bisa mantul dari tembok
  - Burst Trigger: menambah peluru samping setiap tembakan
  - Explosive Shell: peluru memberi splash damage
  - Vampiric Repair: heal kill lebih besar
  - Reactive Armor: mengurangi damage masuk
- Visual semi-3D HD: shadow, extrusion, lighting, glow, ground texture, road layer
- Efek muzzle flash, sparks, smoke, explosion, bullet trail, dan vignette cinematic
- Camera zoom responsif untuk desktop dan mobile
- Minimap, leaderboard, HP bar, XP bar, kill chain, dan upgrade panel
- Siap deploy ke Render sebagai Web Service

## Cara menjalankan lokal

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Kontrol PC/Laptop

- WASD / Arrow: gerak tank
- Mouse: arah meriam
- Klik kiri / Space: tembak
- U: buka panel upgrade

## Kontrol HP

- Joystick kiri: gerak tank
- Joystick kanan: aim dan tembak
- Tombol Upgrade: buka panel upgrade

## Cara kerja upgrade baru

- Naik level memberi upgrade point.
- Kill memberi XP dan heal.
- Setiap 2 kill beruntun memberi heal tambahan dan 1 upgrade point ekstra.
- Upgrade point bisa dipakai untuk Weapon Evolution, Stat Upgrade, atau Tactical Mods.

## Deploy ke Render

Pilih **Web Service**, bukan Static Site.

```txt
Build Command: npm install
Start Command: npm start
```

Pastikan `server.js` menggunakan `process.env.PORT`, sudah disiapkan di project ini.
