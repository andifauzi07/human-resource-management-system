# user-auth Specification

## Purpose

Autentikasi & otorisasi user HRIS: login berbasis JWT (access + refresh), refresh via httpOnly cookie, endpoint profil, logout, serta guard RBAC untuk proteksi endpoint berdasarkan role. (Purpose TBD — lengkapi saat capability berkembang.)

## Requirements

### Requirement: Password hashing
Sistem HARUS menyimpan password sebagai hash menggunakan `bcryptjs`. Plaintext password TIDAK BOLEH pernah disimpan atau dikembalikan dalam response.

#### Scenario: Registrasi menyimpan hash
- **WHEN** user dibuat (seed/register) dengan password `P`
- **THEN** kolom `password_hash` berisi hash bcrypt dari `P`, BUKAN `P` itu sendiri

#### Scenario: Verifikasi login
- **WHEN** login dengan email benar dan password cocok
- **THEN** verifikasi hash berhasil dan token diterbitkan

#### Scenario: Verifikasi gagal
- **WHEN** login dengan password salah
- **THEN** sistem menolak dengan 401 dan TIDAK mengungkap apakah email/password salah

### Requirement: Login menerbitkan access & refresh token
Pada login sukses, sistem HARUS mengembalikan access JWT (di body) dan men-set refresh JWT via httpOnly cookie. Karena frontend (`hrd-management-system.vercel.app`) dan backend (`hriss-api.vercel.app`) berada lintas-situs (`*.vercel.app` termasuk Public Suffix List), atribut cookie WAJIB `SameSite=None; Secure` agar cookie terkirim pada request lintas-situs dari origin yang diizinkan.

#### Scenario: Login sukses
- **WHEN** kredensial valid dikirim ke `POST /api/auth/login` dari origin yang diizinkan
- **THEN** response berisi `accessToken`, DAN `Set-Cookie` berisi `refreshToken` dengan atribut `HttpOnly`, `Secure`, `SameSite=None`

#### Scenario: Login sukses di development lokal
- **WHEN** login dilakukan di environment development (`http://localhost`)
- **THEN** cookie refresh tetap `HttpOnly` dan aman dikirim antar port localhost

#### Scenario: Kredensial invalid
- **WHEN** email/password salah
- **THEN** sistem mengembalikan 401 tanpa meng-set cookie refresh

### Requirement: Refresh token via httpOnly cookie
Sistem HARUS menerbitkan access token baru ketika `POST /api/auth/refresh` dipanggil dengan refresh cookie valid; cookie refresh dapat di-rotasi.

#### Scenario: Refresh sukses
- **WHEN** request `POST /api/auth/refresh` membawa cookie refresh valid
- **THEN** response berisi access token baru

#### Scenario: Refresh tanpa cookie
- **WHEN** request `POST /api/auth/refresh` tanpa cookie refresh
- **THEN** sistem mengembalikan 401

### Requirement: Endpoint profil `me`
Sistem HARUS mengembalikan identitas user terautentikasi pada `GET /api/auth/me`.

#### Scenario: Terautentikasi
- **WHEN** request membawa access token valid (via `Authorization: Bearer`)
- **THEN** response berisi `id`, `email`, `role` user, TANPA `password_hash`

#### Scenario: Tidak terautentikasi
- **WHEN** request tanpa/dengan token invalid
- **THEN** `authGuard` mengembalikan 401

### Requirement: Logout menghapus refresh cookie
Sistem HARUS menghapus cookie refresh pada `POST /api/auth/logout` (stateless, tanpa denylist).

#### Scenario: Logout
- **WHEN** `POST /api/auth/logout` dipanggil
- **THEN** response menghapus cookie refresh (expiry masa lalu / maxAge 0)

### Requirement: RBAC guard
Sistem HARUS menolak akses endpoint yang dilindungi `rbacGuard(roles)` ketika `req.user.role` tidak ada dalam whitelist, dengan status 403.

#### Scenario: Role tidak diizinkan
- **WHEN** user `STAFF` memanggil endpoint hanya untuk `HRD`
- **THEN** sistem mengembalikan 403

#### Scenario: Role diizinkan
- **WHEN** user `HRD` memanggil endpoint untuk `HRD`
- **THEN** request diteruskan ke controller

### Requirement: Token strategy (access di memori FE, refresh di cookie)
Kontrak token: access JWT disimpan di memori frontend (zustand) dan dikirim via header `Authorization`; refresh JWT HANYA ada di httpOnly cookie, tidak terbaca JavaScript.

#### Scenario: Interceptor otomatis refresh
- **WHEN** request API mendapat 401 karena access token kedaluwarsa
- **THEN** frontend memanggil `POST /api/auth/refresh` (cookie otomatis terkirim) dan mengulang request dengan access token baru

#### Scenario: Cookie tidak terbaca JS
- **WHEN** inspeksi `document.cookie` di browser
- **THEN** refresh token TIDAK muncul karena flag `HttpOnly`

### Requirement: Registrasi publik selalu menghasilkan role STAFF
Endpoint registrasi publik HARUS mengabaikan field `role` dari request body; setiap user baru yang mendaftar sendiri HARUS mendapat role `STAFF`. Penetapan role `HRD` HANYA boleh dilakukan lewat seed atau alur administratif internal, tidak melalui endpoint publik mana pun.

#### Scenario: Registrasi dengan field role berisi HRD
- **WHEN** `POST /api/v1/auth/register` mengirim `{ email, password, role: "HRD" }`
- **THEN** user dibuat dengan role `STAFF` dan response TIDAK memuat role `HRD`

#### Scenario: Registrasi tanpa field role
- **WHEN** `POST /api/v1/auth/register` mengirim `{ email, password }` valid
- **THEN** user dibuat dengan role `STAFF`

#### Scenario: Skema Zod menolak/mengabaikan role
- **WHEN** payload registrasi divalidasi oleh schema Zod
- **THEN** field `role` TIDAK ADA dalam skema publik sehingga tidak pernah sampai ke service layer

### Requirement: Validasi Origin pada endpoint konsumen cookie refresh
Endpoint yang mengonsumsi cookie refresh (`POST /api/auth/refresh`, `POST /api/auth/logout`) HARUS menolak request dengan status 403 ketika header `Origin` ada dan nilainya tidak termasuk daftar origin yang diizinkan (`CORS_ORIGIN`). Request tanpa header `Origin` (klien non-browser seperti curl) HARUS diteruskan. Validasi ini adalah mitigasi CSRF karena `SameSite=None` mengizinkan pengiriman cookie lintas-situs.

#### Scenario: Origin asing mencoba refresh
- **WHEN** `POST /api/auth/refresh` membawa cookie refresh valid tetapi header `Origin: https://evil.example`
- **THEN** sistem mengembalikan 403 dan TIDAK menerbitkan token baru

#### Scenario: Origin diizinkan
- **WHEN** `POST /api/auth/refresh` dikirim dengan `Origin: https://hrd-management-system.vercel.app`
- **THEN** request diproses normal

#### Scenario: Klien tanpa header Origin
- **WHEN** request tanpa header `Origin` (mis. curl/skrip) membawa cookie valid
- **THEN** request diproses normal
