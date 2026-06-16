# Iron Battalion — Grind & Balance Update

Multiplayer tank arena berbasis Node.js, Express, Socket.io, dan HTML5 Canvas.
Versi ini sudah punya visual semi-3D HD, controller HP, sistem upgrade, tactical mods, warna peluru biru/merah, dan update baru: **destroyable obstacle** untuk farming XP tanpa harus kill player lain.

## Fitur utama

- Multiplayer realtime dengan Socket.io
- Controller desktop dan HP/touchscreen
- Sistem XP, level, stat upgrade, tactical mods, dan weapon evolution tree
- Peluru biru = peluru kamu, peluru merah = peluru musuh/player lain
- Destroyable obstacle:
  - Wall abu-abu = tidak bisa dihancurkan
  - Crate coklat = bisa ditembak untuk XP
  - Supply Core biru = bisa ditembak untuk XP
  - Obstacle yang hancur akan respawn otomatis
- Balance nerf:
  - Ricochet sekarang maksimal 1 bounce dan damage turun setelah mantul
  - Burst Trigger damage ekstra diturunkan
  - Explosive Shell splash area dan damage diturunkan
  - Reactive Armor diturunkan supaya tank tebal tidak terlalu OP
  - Kill heal dikurangi
  - Bonus upgrade point dari kill chain sekarang setiap 3 kill, bukan 2 kill
  - Beberapa weapon OP seperti Minigun, Railgun, Assassin, Shotgun, dan Destroyer ikut diturunkan sedikit
- Visual semi-3D HD: shadow, extrusion, lighting, glow, ground texture, muzzle flash, sparks, smoke, explosion, bullet trail, dan vignette cinematic
- Minimap, leaderboard, HP bar, XP bar, dan HP bar untuk obstacle
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

## Cara farming XP

Tembak obstacle yang punya HP bar:

```txt
Crate coklat      = XP sedang
Supply Core biru  = XP cepat, tapi HP lebih kecil dan respawn
Wall abu-abu      = tidak bisa dihancurkan
```

Farming obstacle memberi XP lebih lambat daripada kill player, jadi player tetap bisa naik level sendiri tanpa membuat duel jadi tidak seimbang.

## Deploy ke Render

Pilih **Web Service**, bukan Static Site.

```txt
Build Command: npm install
Start Command: npm start
```

Pastikan `server.js` menggunakan `process.env.PORT`, sudah disiapkan di project ini.
