# Proposal: Add Login UI

## Why

Autentikasi di server sudah lengkap (login, refresh cookie, me, logout), tetapi client belum punya UI sama sekali: `App.tsx` masih placeholder tanpa router, sehingga aplikasi tidak dapat digunakan melalui browser. Sebelum modul bisnis (cuti, absensi, payroll) dikembangkan, fondasi frontend harus dibangun lebih dulu: router, alur autentikasi end-to-end, dan aturan penggayaan terpusat agar setiap halaman berikutnya konsisten tanpa dikerjakan ulang dari nol.

## What Changes

- Pasang **TanStack Router (file-based)**: `routes/__root.tsx`, `routes/index.tsx` (`"/"` terlindungi), `routes/login.tsx` (publik); logika tinggal di `features/auth/` sesuai struktur feature-based yang direncanakan docs.
- **Gating sesi router-sentric**: `beforeLoad` pada route terlindungi menjalankan `restoreSession()` (silent refresh via cookie, promise dimemoisasi agar hanya sekali per app load); selama pengecekan router menampilkan `pendingComponent` (spinner), bukan kedipan halaman login.
- **Halaman login**: form email + password dengan validasi **Zod v4** di sisi client (mirror schema server — duplikasi disadari sebagai tradeoff repo dua-package), pesan error dari envelope API (`ApiClientError.message`), redirect ke parameter `?redirect=` setelah sukses via `validateSearch` typed.
- **Halaman home placeholder**: menampilkan email + role user + tombol logout sebagai bukti siklus login → sesi → logout end-to-end.
- **BREAKING** (internal client saja): hapus `authApi.register` dari `lib/api.ts`; endpoint `/auth/register` akan dihapus dari server secara terpisah (di luar change ini).
- **Kontrak env client ditetapkan**: `VITE_API_URL` (nilai termasuk suffix `/api/v1`) dengan fallback `http://localhost:9000/api/v1` — lokal tanpa env, production via Environment Variable Vercel. Tambah `.env.example` untuk client dan koreksi `docs/DEPLOYMENT.md` yang saat ini menyebut nama (`VITE_API_BASE_URL`) dan nilai (tanpa `/api/v1`) yang salah.
- **`docs/DESIGN-SYSTEM.md`** ditulis sebagai fase pertama: design tokens via `@theme` (Tailwind v4), primitif **shadcn/ui**, arah visual *korporat bersih* (netral + aksen biru tua, ala Linear/Notion); dark mode ditunda sebagai non-goal. Semua UI berikutnya wajib mengikuti dokumen ini.

## Capabilities

### New Capabilities

- `design-system-ui`: Kontrak penggayaan UI — lokasi dan struktur design tokens (`@theme` di `index.css`), adopsi shadcn/ui sebagai sumber primitif (Button, Input, Card, dsb.), aturan layout, feedback state (loading/error), dan aksesibilitas dasar yang wajib dipatuhi setiap pengembangan UI selanjutnya.
- `client-auth-flow`: Navigasi & sesi di client — routing file-based TanStack Router, pemulihan sesi saat boot (silent refresh), proteksi route via `beforeLoad` + `throw redirect`, halaman login dengan validasi Zod, redirect pasca-login, logout, pembersihan `authApi.register`, dan kontrak base URL API (`VITE_API_URL`).

### Modified Capabilities

_(tidak ada — requirement capability `user-auth` di sisi server tidak berubah dalam change ini; penghapusan endpoint register ditangani terpisah)_

## Impact

- **Kode client** (`client/`): `package.json` (+ `@tanstack/react-router`, `@tanstack/router-plugin`, `zod@^4`, dependensi shadcn: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`), `vite.config.ts` (plugin router), `tsconfig.json` (path alias `@/*`), `src/index.css` (tokens `@theme`), `src/main.tsx` (RouterProvider), `src/App.tsx` (digantikan route root), folder baru `src/routes/`, `src/features/auth/`, `src/components/ui/`, `src/lib/utils.ts` (helper `cn`), `src/lib/api.ts` (hapus `register`), `.env.example` (baru).
- **Docs**: `docs/DESIGN-SYSTEM.md` (baru); `docs/DEPLOYMENT.md` (koreksi nama/nilai env client); `docs/ARCHITECTURE.md` (struktur FE aktual — termasuk penyeragaman `store/` vs `stores/`: kode tetap `store/`).
- **Server**: tidak ada perubahan kode atau kontrak API dalam change ini.
- **Koordinasi lintas-change**: agar refresh token bekerja di production, change `harden-serverless-deployment` (cookie `SameSite=None; Secure` + validasi Origin) tetap prasyarat deployment — di lokal (same-site localhost) login ini sudah berfungsi tanpa menunggunya.
