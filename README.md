# Iron Battalion — Lag + Upgrade Click Fix

Versi ini memperbaiki masalah upgrade yang harus di-spam klik dan mengurangi lag jaringan.

## Perbaikan utama

- Upgrade card dieksekusi pada `pointerdown`, bukan menunggu `click/pointerup`.
- Panel upgrade diberi z-index lebih tinggi agar tidak ketutup canvas atau touch controller.
- Tidak lagi men-disable tombol secara permanen saat menunggu server.
- UI upgrade update langsung setelah server membalas, tidak menunggu snapshot berikutnya.
- Input player dikirim dengan `socket.volatile.emit()` 30x/detik.
- Snapshot server dikirim dengan `io.volatile.emit()` 22x/detik.
- Socket dipaksa WebSocket agar tidak lewat long-polling.
- `perMessageDeflate` dimatikan untuk mengurangi CPU spike.
- Optional dependency `bufferutil` dan `utf-8-validate` ditambahkan untuk optimasi WebSocket.

## Run lokal

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Deploy Render

- Type: Web Service
- Build Command: `npm install`
- Start Command: `npm start`

Kalau setelah deploy masih terasa aneh, buka dengan Ctrl+F5 atau incognito agar cache lama hilang.
