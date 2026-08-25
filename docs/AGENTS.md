# AGENTS.md — Panduan untuk AI Coding Agent

Dokumen ini dibaca oleh AI agent (Claude Code, Cursor, Copilot Workspace, dll) sebelum melakukan perubahan di repo ini. Tujuannya: agent menghasilkan kode yang konsisten dengan arsitektur, tanpa perlu manusia menjelaskan ulang konteks setiap sesi.

## Konteks Proyek
NexaHR adalah demo sistem HRIS (manajemen karyawan, cuti, absensi geolocation, payroll/lembur otomatis, RBAC): React 19 + Vite di `client/` (Tailwind CSS, Shadcn UI, Zustand, TanStack Query sebagai stack tujuan) + Express 5 di `server/` (Drizzle ORM, Zod, Pino, Swagger), keduanya ESM (`"type": "module"`), dalam **satu repo monolitik sederhana** — bukan monorepo/workspace tooling.

Baca dulu sebelum mengerjakan apapun:
1. `docs/01-PROJECT-STRUCTURE.md` — di mana kode harus diletakkan
2. `docs/ARCHITECTURE.md` — pola Controller → Schema → Service → Repository
3. `docs/CODE_STYLE.md` — konvensi penamaan & struktur
4. `docs/TESTING.md` — status test runner (belum terpasang) & rencana pengujian
5. `docs/DEPLOYMENT.md` — client & server di-deploy sebagai dua project Vercel terpisah dari repo yang sama

## Aturan Wajib (Non-negotiable)

1. **Jangan taruh business logic di controller.** Semua kalkulasi (payroll, overtime, validasi geolocation) masuk ke `*.service.ts`. Controller hanya boleh: validasi via middleware Zod, panggil service, kirim response.

2. **Jangan mengakses instance `db` (Drizzle) langsung dari service atau controller.** Hanya `*.repository.ts` yang boleh mengimpor `db` dari `src/db/index.ts` dan menjalankan query.

3. **Setiap endpoint baru WAJIB punya Zod schema validasi** (`*.schema.ts`) untuk `body`/`query`/`params` sebelum masuk controller. Jangan percaya input mentah dari `req.body`.

4. **Jangan modifikasi file migration di `server/drizzle/migrations/` yang sudah pernah di-apply.** Kalau perlu ubah schema, edit `server/src/db/schema.ts` lalu generate migration baru:
   ```bash
   npm run db:generate --prefix server
   npm run db:migrate --prefix server
   ```

5. **Setiap perubahan pada service layer sebaiknya disertai test** — tapi catat: test runner **belum terpasang** di repo ini (lihat `docs/TESTING.md`). Jangan asumsikan Vitest sudah ada dan langsung menulis file `*.test.ts` tanpa memastikan dependency-nya terpasang dan script `test` ada di `package.json` — pasang dulu sesuai `docs/TESTING.md`, baru tulis test.

6. **Jangan menambah dependency baru tanpa alasan jelas.** Cek dulu apakah kebutuhan bisa dipenuhi dengan yang sudah ada. Untuk client, dependency target (Tailwind, Shadcn, Zustand, TanStack Query) sudah direncanakan di `docs/01-PROJECT-STRUCTURE.md` — install sesuai kebutuhan fitur yang sedang dikerjakan, jangan sekaligus semua di awal tanpa diminta.

7. **Tipe data lintas frontend-backend HARUS didefinisikan di folder `shared/types`**, diakses lewat alias `@shared/*` — bukan didefinisikan ulang lokal di `client/` atau `server/`.

8. **RBAC check tidak boleh hanya di middleware.** Middleware menolak role yang jelas-jelas tidak berhak, tapi kasus "boleh lihat data sendiri" harus dicek juga di service layer (bandingkan `req.user.employeeId` dengan target resource).

9. **Gunakan Pino (`src/utils/logger.ts`) untuk logging, jangan `console.log`.**

10. **Jangan pakai `node-cron` atau proses long-running lain di `server/src`.** Backend di-deploy sebagai serverless function di Vercel (lihat `docs/DEPLOYMENT.md`) — background job harus lewat API route yang dipicu Vercel Cron.

11. **Jangan taruh `app.listen()` di file yang diimpor `server/api/index.ts`.** Pertahankan pemisahan `app.ts` (export app saja) vs `server.ts` (listen, untuk dev/production non-serverless).

12. **Kalau menambah/mengubah endpoint, update dokumentasi Swagger** — jalankan `npm run docs --prefix server` untuk regenerate spec dari `swagger.config.ts`.

## Sebelum Menyatakan Task Selesai
Agent wajib menjalankan dan memastikan lolos:
```bash
npm run lint --prefix client
npm run lint:check --prefix server
npm run typecheck --prefix server
npm run build --prefix client
npm run build --prefix server
```
Kalau test runner sudah terpasang (cek `package.json` masing-masing folder untuk script `test`), tambahkan juga `npm run test` di kedua folder ke checklist ini. Jika salah satu langkah gagal, perbaiki dulu sebelum melaporkan pekerjaan selesai.

## Hal yang TIDAK Boleh Dilakukan Tanpa Konfirmasi Eksplisit
- Menghapus atau mengubah struktur tabel yang sudah berisi data (terutama lewat edit migration lama, bukan migration baru)
- Mengubah kontrak API (nama field response, status code) yang sudah dipakai frontend
- Mengubah aturan RBAC (matriks permission di `docs/ARCHITECTURE.md`) tanpa diminta
- Mengganti library inti (Drizzle → ORM lain, Express → framework lain, dsb.)
- Memindahkan konfigurasi `husky`/`lint-staged` kembali ke dalam `server/` — harus tetap di root repo
- Menambah `package-lock.json` baru secara manual di dalam folder `client/` atau `server/` tanpa memberi tahu — tiap folder punya lockfile sendiri, pastikan install dilakukan di folder yang benar (`npm install --prefix client` / `--prefix server`)

## Gaya Komunikasi yang Diharapkan dari Agent
- Jelaskan **keputusan desain**, bukan cuma menyebutkan file yang diubah
- Jika ada trade-off (misal: performa vs kesederhanaan kode), sebutkan secara singkat
- Kalau menemukan bug atau inkonsistensi di luar scope task yang diminta, laporkan tapi jangan langsung diperbaiki tanpa konfirmasi

## Referensi Cepat Struktur Modul
```
server/src/modules/<nama-modul>/
├── <modul>.schema.ts       # validasi Zod
├── <modul>.controller.ts   # request/response saja
├── <modul>.service.ts      # business logic
├── <modul>.repository.ts   # satu-satunya akses ke Drizzle db
├── <modul>.routes.ts       # definisi route + middleware guard + validate(schema)
└── <modul>.service.test.ts # setelah test runner terpasang, lihat docs/TESTING.md
```
