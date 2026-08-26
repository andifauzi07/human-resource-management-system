# Contributing Guide — Onboarding Developer Baru

Selamat datang! Dokumen ini memandu kamu dari clone repo sampai bisa submit PR pertama.

## 1. Prasyarat
- Node.js LTS terbaru (cocokkan dengan versi di `server/package.json` → `@types/node`, cek versi aktif dengan `node -v`)
- npm (bawaan Node.js)
- Docker Desktop (untuk Postgres development lokal)
- Git

## 2. Setup Awal
```bash
git clone <repo-url> hris && cd hris
npm run install:all              # install dependency di root, client, dan server sekaligus
docker compose up -d             # Postgres development lokal (host port 5433 → menghindari bentrok PG native)
```

Environment **development sudah disediakan** lewat `server/.env.development`
(dikomit, non-rahasia — menunjuk ke Docker lokal). Rahasia pribadi/override
hanya bila perlu, di `server/.env.development.local` (gitignored):
```bash
cd server
cp .env.example .env.development.local   # opsional
```
Variabel divalidasi oleh `src/configs/env.ts` via Zod. Kredensial database
**production tidak pernah ada di laptop** — hanya di GitHub Secrets
(`PROD_DATABASE_URL`) dan Vercel Dashboard.
> `dotenv-flow` memuat `.env.development` lalu menimpanya dengan `.env.development.local` bila ada.

## 3. Setup Database (Drizzle)
```bash
npm run db:migrate --prefix server    # apply migration ke database lokal
npm run db:seed --prefix server       # user demo (staff@demo.hris / hrd@demo.hris)
```
Generate migration baru setelah mengubah schema:
```bash
npm run db:generate --prefix server   # generate migration dari drizzle schema (src/drizzle/schemas/)
```
Untuk lihat/edit data lewat GUI:
```bash
npm run db:studio --prefix server     # buka Drizzle Studio
```
Reset total data dev: `docker compose down -v && docker compose up -d` lalu migrate + seed ulang.
Migrasi ke **production** terjadi otomatis di CI (`deploy-server.yml`, step sebelum deploy) — jangan jalankan manual ke produksi dari laptop.

## 4. Jalankan Dev Server
```bash
npm run dev   # menjalankan client (Vite) dan server (Express, via tsx watch) bersamaan
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:9000` (sesuaikan dengan `PORT` di `.env.development`)
- Dokumentasi API (Swagger): jalankan `npm run docs --prefix server` untuk generate ulang spec, lalu akses lewat endpoint swagger-ui yang didaftarkan di `app.ts`

## 5. Alur Kerja Sebelum Coding
1. Buat branch dari `main`: lihat konvensi penamaan di `docs/GIT_WORKFLOW.md`
2. Baca `docs/ARCHITECTURE.md` untuk paham layer Controller → Service → Repository
3. Cek `docs/CODE_STYLE.md` sebelum menulis kode baru
4. Kalau menambah endpoint baru, tambahkan juga validasi input dengan **Zod** (`*.schema.ts`) dan update dokumentasi Swagger

## 6. Sebelum Push / Membuka PR — Checklist Wajib
```bash
npm run lint          # eslint client + lint:check server
npm run typecheck      # tsc --noEmit di kedua folder
npm run build          # pastikan build production sukses
```
> Belum ada `npm run test` — test runner belum terpasang di `client`/`server`. Lihat `docs/TESTING.md` untuk status dan rencana penambahannya.

> **Catatan CI:** `.github/workflows/` saat ini hanya berisi `deploy-client.yml` & `deploy-server.yml` (deploy ke Vercel, bukan lint/test). Jadi `lint`/`typecheck`/`build` **tidak di-enforce otomatis** — checklist lokal di atas adalah satu-satunya gerbang kualitas sebelum push.

## 7. Format Commit Message
Menggunakan [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(attendance): tambah validasi radius geolocation
fix(payroll): perbaiki pembulatan kalkulasi lembur
docs(readme): update instruksi setup
refactor(auth): pindahkan validasi ke service layer
chore(deps): tambah zustand dan tanstack query di client
```

## 8. Struktur Review PR
- Deskripsikan **apa** dan **kenapa**, bukan cuma daftar file yang berubah
- Sertakan screenshot/GIF untuk perubahan UI
- Tag modul yang terdampak (`employees`, `attendance`, `payroll`, `leave`, `auth`)
- Kalau ada perubahan skema database, sebutkan nama file migration yang dihasilkan `db:generate`
- PR idealnya < 400 baris diff — pecah kalau lebih besar

## 9. Git Hook (husky)
Hook `husky` ada di root (`.husky/pre-commit`), tapi isinya saat ini `npm test` yang **belum ada script-nya** → commit akan gagal/terblokir. Config `lint-staged` dan penggantian isi pre-commit ke `npx lint-staged` **belum ditambahkan** (rencana, lihat `docs/01-PROJECT-STRUCTURE.md`). Waspadai saat commit; bila terblokir, cek isi `.husky/pre-commit`.

Untuk mengaktifkan husky setelah clone (jika belum):
```bash
npm run prepare   # menjalankan `husky` di root, generate .husky/
```

## 10. Butuh Bantuan?
Cek dulu `docs/AGENTS.md` bila kamu bekerja berdampingan dengan AI coding assistant — ada aturan main khusus supaya perubahan tetap konsisten dengan arsitektur (Drizzle, Zod, RBAC, dll).
