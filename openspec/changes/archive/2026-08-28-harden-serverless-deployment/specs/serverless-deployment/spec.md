## ADDED Requirements

### Requirement: Entry point serverless Vercel
Server HARUS diekspos ke Vercel melalui handler serverless (`server/api/index.ts`) yang mengimpor Express app tanpa memanggil `app.listen`. `vercel.json` HARUS memakai `rewrites` untuk meneruskan semua path ke handler tersebut, dan TIDAK BOLEH lagi mengekspos direktori `dist/` sebagai output statis. `src/server.ts` (dengan `app.listen`) HANYA digunakan untuk development lokal.

#### Scenario: Request API sampai ke Express
- **WHEN** `POST https://hriss-api.vercel.app/api/v1/auth/login` dipanggil pada deployment production
- **THEN** request diteruskan oleh rewrite ke serverless function dan diproses router Express

#### Scenario: Hasil kompilasi tidak publik
- **WHEN** siapa pun mencoba mengakses path aset statis hasil build (mis. `/dist/...` atau file JS hasil kompilasi)
- **THEN** tidak ada kode terkompilasi yang dilayani sebagai file statis publik

#### Scenario: Development lokal tetap berjalan
- **WHEN** `npm run dev --prefix server` dijalankan di laptop
- **THEN** server listen di port yang dikonfigurasi dengan hot-reload, tanpa menyentuh jalur serverless

### Requirement: Pipeline migrasi produksi sebelum deploy
Workflow deploy server (`deploy-server.yml`) HARUS menjalankan migrasi Drizzle terhadap database production menggunakan secret `PROD_DATABASE_URL` SEBELUM langkah deploy Vercel. Migrasi HARUS idempotent (hanya menerapkan entri jurnal yang belum ada), dan kegagalan migrasi HARUS membatalkan deploy.

#### Scenario: Push berisi migrasi baru
- **WHEN** commit yang menambahkan file migrasi baru di-push ke `main`
- **THEN** CI menerapkan migrasi ke database production terlebih dahulu, kemudian kode baru ter-deploy

#### Scenario: Migrasi gagal
- **WHEN** salah satu statement migrasi gagal di database production
- **THEN** workflow berhenti dan deployment versi baru TIDAK dilanjutkan

#### Scenario: Push tanpa migrasi baru
- **WHEN** commit hanya mengubah logika aplikasi tanpa file migrasi baru
- **THEN** step migrasi selesai tanpa efek (idempotent) dan deploy tetap berjalan

### Requirement: Preview deployment dinonaktifkan untuk hris-api
Project Vercel `hris-api` HARUS memiliki Preview Deployment dimatikan sehingga tidak ada environment preview yang memerlukan database tersendiri. Production adalah satu-satunya lingkungan cloud untuk API; pengujian pra-push dilakukan di lingkungan lokal.

#### Scenario: Pull request dibuka
- **WHEN** PR dibuka yang menyentuh folder `server/`
- **THEN** Vercel tidak membuat URL preview untuk project `hris-api`

### Requirement: Swagger UI dikontrol flag ENABLE_DOCS
Dokumentasi Swagger HARUS disajikan hanya ketika flag `ENABLE_DOCS` aktif. Ketika flag nonaktif, route dokumentasi HARUS merespons 404. Untuk portofolio ini production secara default mengaktifkan docs (nilai flag ditentukan per environment), namun dapat dimatikan kapan saja tanpa deploy ulang kode.

#### Scenario: Docs diaktifkan
- **WHEN** `ENABLE_DOCS=true` dan user membuka `/api/docs`
- **THEN** Swagger UI tampil

#### Scenario: Docs dinonaktifkan
- **WHEN** `ENABLE_DOCS=false` dan user membuka `/api/docs`
- **THEN** sistem merespons 404 dan tidak membocorkan struktur endpoint

#### Scenario: Flag default per environment
- **WHEN** flag tidak diset di suatu environment
- **THEN** nilai efektifnya aktif di development dan mengikuti keputusan environment production tanpa error validasi
