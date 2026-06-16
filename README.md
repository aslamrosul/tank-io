# Iron Battalion — Semi 3D Arena

Multiplayer tank arena berbasis Node.js, Express, Socket.io, dan HTML5 Canvas.
Versi ini sudah ditingkatkan menjadi tampilan **semi-3D HD** dengan efek visual yang lebih premium.

## Fitur utama

- Multiplayer realtime dengan Socket.io
- Controller desktop dan HP/touchscreen
- Sistem XP, level, stat upgrade, dan weapon evolution tree
- Visual semi-3D HD: shadow, extrusion, lighting, glow, ground texture, road layer
- Efek muzzle flash, sparks, smoke, explosion, bullet trail, dan vignette cinematic
- Camera zoom responsif untuk desktop dan mobile
- Minimap, leaderboard, HP bar, dan XP bar
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

## Deploy ke Render

Pilih **Web Service**, bukan Static Site.

```txt
Build Command: npm install
Start Command: npm start
```

Pastikan `server.js` menggunakan `process.env.PORT`, sudah disiapkan di project ini.


## Patch upgrade click
- Player sekarang mulai dengan 3 upgrade point agar upgrade langsung bisa dites.
- Tombol upgrade tidak lagi memakai attribute disabled; kalau point habis akan muncul toast feedback.
- Ada notifikasi berhasil/gagal saat membeli stat, weapon, atau tactical mod.
