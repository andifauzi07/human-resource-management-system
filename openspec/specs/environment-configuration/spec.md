# environment-configuration Specification

## Purpose

Konfigurasi environment untuk aplikasi HRIS: kontrak variabel environment, strategi file .env, Docker Compose untuk Postgres development lokal, dan isolasi kredensial produksi.

## Requirements

### Requirement: Kontrak variabel environment
Sistem HARUS mendefinisikan skema env berikut: `DATABASE_URL` (wajib), `JWT_SECRET` dan `REFRESH_SECRET` (wajib, minimal 16 karakter), `CORS_ORIGIN` (wajib), `NODE_ENV` (default `development`), `LOG_LEVEL` (default `info`), `PORT` (opsional, default 9000), `ENABLE_DOCS` (opsional, default mengikuti aturan gating docs). Validasi env TIDAK BOLEH memanggil `process.exit()` atau `console.error`; kegagalan validasi HARUS melempar exception terstruktur agar platform serverless melaporkan penyebabnya dengan jelas.

#### Scenario: PORT tidak diset di lingkungan serverless
- **WHEN** aplikasi di-deploy ke Vercel tanpa variabel `PORT`
- **THEN** validasi env lolos dan nilai efektif `PORT` adalah 9000

#### Scenario: Env wajib tidak lengkap
- **WHEN** `DATABASE_URL` tidak ada saat aplikasi dimuat
- **THEN** proses gagal dengan exception terstruktur yang menyebut variabel yang bermasalah, bukan keluar diam-diam

#### Scenario: Env lengkap
- **WHEN** semua variabel wajib tersedia
- **THEN** objek `env` terekspos sebagai readonly dan aplikasi siap melayani request

### Requirement: Strategi file .env* (dotenv-flow)
Repository HARUS mengkomit `.env.development` yang berisi default development non-rahasia (`DATABASE_URL` menunjuk Postgres lokal, `PORT`, `LOG_LEVEL`, `ENABLE_DOCS`). Rahasia pribadi HANYA boleh berada di `.env.development.local`. Semua varian `.env*` lainnya (termasuk `.env.production`) HARUS diabaikan git KECUALI `.env.example` dan `.env.development`.

#### Scenario: Clone fresh tanpa file rahasia
- **WHEN** repo di-clone baru, Docker Compose dinyalakan, lalu `npm run dev --prefix server` dijalankan
- **THEN** server berjalan terhubung ke database lokal tanpa perlu membuat file env tambahan apa pun

#### Scenario: Override rahasia pribadi
- **WHEN** developer menaruh kredensial berbeda di `.env.development.local`
- **THEN** nilai tersebut menimpa default dari `.env.development` dan file itu tidak pernah masuk git

### Requirement: Postgres development lokal via Docker Compose
Repository HARUS menyediakan `docker-compose.yml` yang menjalankan Postgres dengan versi mayor yang sama dengan production (Neon), database awal `hris`, kredensial non-rahasia untuk lokal, serta volume persisten.

#### Scenario: Menyalakan environment dev pertama kali
- **WHEN** `docker compose up -d` dijalankan diikuti migrasi dan seed
- **THEN** database lokal berisi skema lengkap dan user demo sehingga login lokal berfungsi

#### Scenario: Reset total data dev
- **WHEN** developer menjalankan `docker compose down -v && docker compose up -d`
- **THEN** database lokal kembali kosong dan dapat di-migrate ulang dari nol tanpa sisa data

### Requirement: Isolasi kredensial produksi
Kredensial database produksi HANYA boleh hidup di GitHub Secrets (`PROD_DATABASE_URL`) dan Environment Variables "Production" pada Vercel. Kredensial produksi TIDAK BOLEH disimpan dalam file apa pun di workspace lokal atau dikomit ke repository.

#### Scenario: Audit repository
- **WHEN** isi repository (termasuk semua file `.env*` yang dikomit) dicari terhadap host database production
- **THEN** tidak ada kredensial produksi yang ditemukan

#### Scenario: Script lokal salah arah secara struktural
- **WHEN** `db:seed` atau `db:migrate` dijalankan dari laptop tanpa override eksplisit
- **THEN** operasi hanya mungkin menyentuh database lokal karena URL produksi tidak tersedia di lingkungan lokal
