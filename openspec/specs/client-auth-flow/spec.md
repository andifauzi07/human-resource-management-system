# Client Auth Flow

## Purpose

Client authentication flow covering API base URL configuration, routing with TanStack Router, login page with validation, logout functionality, and register endpoint cleanup from client.

## Requirements

### Requirement: Kontrak base URL API `VITE_API_URL`

Client HARUS memakai satu kontrak base URL: `BASE_URL = VITE_API_URL ?? "http://localhost:9000/api/v1"`. Nilai `VITE_API_URL` (jika diset) HARUS mencakup suffix `/api/v1`. Aplikasi HARUS berfungsi di lokal tanpa file env apa pun; di production base URL ditentukan lewat Environment Variable Vercel. Repository HARUS menyertakan `client/.env.example` yang mendokumentasikan variabel ini, dan `docs/DEPLOYMENT.md` HARUS dirapikan agar nama dan format nilainya konsisten dengan kontrak ini.

#### Scenario: Development tanpa env

- **WHEN** aplikasi client dijalankan lokal tanpa `VITE_API_URL`
- **THEN** semua request API diarahkan ke `http://localhost:9000/api/v1`

#### Scenario: Production dengan env

- **WHEN** build production membawa `VITE_API_URL=https://hriss-api.vercel.app/api/v1`
- **THEN** semua request API diarahkan ke origin tersebut

#### Scenario: Dokumentasi konsisten dengan kode

- **WHEN** `client/.env.example` dan `docs/DEPLOYMENT.md` dibaca
- **THEN** keduanya menyebut `VITE_API_URL` dengan nilai contoh yang menyertakan `/api/v1`, tanpa referensi lagi ke nama lama `VITE_API_BASE_URL`

### Requirement: Routing file-based dengan proteksi route

Client HARUS menggunakan TanStack Router secara file-based dengan struktur minimal: `routes/__root.tsx` (layout root + Outlet), `routes/index.tsx` (`"/"` — terlindungi), `routes/login.tsx` (`"/login"` — publik), sementara logika sesi/form tinggal di `features/auth/`. Route terlindungi HARUS menjalankan pemeriksaan sesi di `beforeLoad`; ketika belum terautentikasi, router HARUS melempar redirect ke `/login` dengan search param `redirect` berisi lokasi awal. Selama pengecekan sesi berlangsung, router HARUS menampilkan `pendingComponent` (spinner) dan TIDAK BOLEH merender halaman login terlebih dahulu.

#### Scenario: Akses route terlindungi saat belum login

- **WHEN** pengguna tanpa sesi membuka `"/"`
- **THEN** ia dialihkan ke `/login?redirect=%2F` dan halaman login dirender (tanpa kedipan spinner berkepanjangan)

#### Scenario: Boot dengan refresh cookie valid

- **WHEN** pengguna membuka `"/"` sementara cookie refresh masih valid
- **THEN** silent refresh dijalankan sekali, halaman home dirender dengan identitas user, tanpa pernah menampilkan halaman login

#### Scenario: Pengecekan sesi hanya sekali per app load

- **WHEN** beberapa route terlindungi memicu pemulihan sesi dalam satu kunjungan aplikasi
- **THEN** promise `restoreSession()` dimemoisasi sehingga request refresh ke server hanya dikirim sekali

### Requirement: Halaman login dengan validasi Zod

Halaman login HARUS memvalidasi email + password dengan schema Zod v4 di sisi client sebelum submit; validasi gagal menampilkan pesan inline tanpa request jaringan. Kegagalan dari server HARUS ditampilkan memakai `message` dari envelope API. Login sukses HARUS mengarahkan pengguna ke nilai param `redirect` (hanya path relatif yang valid; selain itu fallback ke `"/"`) dan menyimpan access token + user ke store.

#### Scenario: Submit form tidak valid

- **WHEN** pengguna submit dengan email kosong/tidak valid atau password kosong
- **THEN** pesan validasi inline muncul dan TIDAK ada request jaringan dikirim

#### Scenario: Kredensial salah

- **WHEN** server merespons 401 untuk kredensial salah
- **THEN** pesan error dari envelope API ditampilkan pada form

#### Scenario: Login sukses dengan redirect aman

- **WHEN** pengguna login sukses dari `/login?redirect=%2Fpayroll`
- **THEN** ia diarahkan ke `/payroll`

#### Scenario: Redirect tidak aman ditolak

- **WHEN** param `redirect` berisi URL absolut/eksternal (mis. `https://evil.example` atau `//evil.example`)
- **THEN** nilai tersebut diabaikan dan pengguna diarahkan ke `"/"`

### Requirement: Logout mengakhiri sesi client

Home (route `"/"`) HARUS menampilkan identitas user (email + role) dan tombol logout. Logout HARUS memanggil `POST /auth/logout`, mengosongkan store auth, lalu mengarahkan pengguna ke `/login`.

#### Scenario: Logout sukses

- **WHEN** pengguna menekan tombol logout pada home
- **THEN** store auth kosong dan pengguna berada di `/login`

#### Scenario: Route terlindungi setelah logout

- **WHEN** pengguna yang sudah logout mencoba membuka `"/"`
- **THEN** ia dialihkan kembali ke `/login`

### Requirement: Endpoint register dibersihkan dari client

Kode client TIDAK BOLEH lagi mereferensikan endpoint `/auth/register`: fungsi `authApi.register` dihapus dari `lib/api.ts`. (Penghapusan endpoint di server dikerjakan terpisah di luar change ini.)

#### Scenario: Tidak ada referensi register di client

- **WHEN** kode di `client/src/` dicari terhadap `register` pada konteks auth API
- **THEN** tidak ada fungsi/pemanggilan endpoint register tersisa
