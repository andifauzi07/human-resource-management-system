## ADDED Requirements

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

## MODIFIED Requirements

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

## ADDED Requirements

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
