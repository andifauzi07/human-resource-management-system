## ADDED Requirements

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
Pada login sukses, sistem HARUS mengembalikan access JWT (di body) dan men-set refresh JWT via httpOnly cookie.

#### Scenario: Login sukses
- **WHEN** kredensial valid dikirim ke `POST /api/auth/login`
- **THEN** response berisi `accessToken`, DAN `Set-Cookie` berisi `refreshToken` dengan atribut `HttpOnly`, `Secure`, `SameSite=Lax`

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
- **WHEN** request tanpa/dfengan token invalid
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
