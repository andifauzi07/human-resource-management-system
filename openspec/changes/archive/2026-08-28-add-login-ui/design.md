# Design: Add Login UI

## Context

Server auth lengkap (`/auth/login|refresh|me|logout`) dengan access JWT di body + refresh di httpOnly cookie. Client sudah memiliki `lib/api.ts` (fetch wrapper, envelope parser, auto-refresh saat 401) dan `store/auth.store.ts` (Zustand, token hanya di memori) — tetapi tanpa router, halaman, atau aturan penggayaan. Repo adalah dua package terpisah (`client/`, `server/`), masing-masing punya lockfile sendiri, deploy sebagai dua project Vercel.

Kendala yang membingkai desain:

1. **Sesi tidak selamat dari reload** — access token di memori hilang saat F5; `tryRefresh()` di `api.ts` ada tapi belum pernah dipanggil saat boot.
2. **Production lintas-situs** — FE dan BE pada subdomain `*.vercel.app` berbeda termasuk cross-site; refresh cookie baru bekerja setelah change `harden-serverless-deployment` (dianggap selesai). Di lokal aman karena same-site.
3. **Env client belum terdokumentasi** — kode memakai `VITE_API_URL` (fallback localhost), docs menyebut `VITE_API_BASE_URL` tanpa suffix `/api/v1` (salah).

## Goals / Non-Goals

**Goals:**

- Alur login → sesi → logout end-to-end yang benar di lokal maupun production.
- Pemulihan sesi otomatis saat boot tanpa kedipan halaman login.
- Fondasi routing + struktur folder feature-based yang meniru pola docs untuk modul berikutnya.
- Aturan penggayaan terpusat (`docs/DESIGN-SYSTEM.md`) yang mengikat semua UI selanjutnya.

**Non-Goals:**

- Halaman register (endpoint akan dihapus dari server secara terpisah).
- Perubahan apa pun di server (kode, kontrak API, cookie).
- Dark mode, i18n, TanStack Query, manajemen state global di luar auth.
- Persistensi access token ke storage (tetap memori-only sesi kontrak `user-auth`).

## Decisions

### D1 — Router: TanStack Router file-based (bukan react-router / code-based)

File-based dipilih karena: (a) DX resmi yang direkomendasikan TanStack dengan plugin Vite (`@tanstack/router-plugin`); (b) folder `routes/` menjadi peta navigasi yang bisa dibaca sekilas; (c) tipe route & link tergenerasi otomatis (`routeTree.gen.ts`). Alternatif react-router-dom lebih umum tetapi tidak punya `beforeLoad` typed + typed search params bawaan; code-based menghemat satu dev-dependency tapi kehilangan generasi tipe.

### D2 — Gating sesi router-sentric via `beforeLoad` (bukan status store)

Route terlindungi menjalankan `await restoreSession()` di `beforeLoad`; gagal → `throw redirect({ to: "/login", search: { redirect } })`. `restoreSession()` membungkus panggilan `POST /auth/refresh` dengan promise dimemoisasi modul-scope sehingga hanya dieksekusi sekali per app load meski beberapa route memanggilnya.

Konsekuensi: **store tidak berubah sama sekali** — tidak ada field `status` baru; `user === null` cukup sebagai sinyal "belum login". Satu mekanisme gating (router), tidak ada dua sumber kebenaran. Selama `restoreSession()` berjalan, router otomatis menampilkan `pendingComponent` → spinner, bukan kedipan login. Alternatif yang ditolak: bootstrap di `useEffect` App + guard komponen wrapper (gaya react-router) — menduplikasi state gating dan butuh perubahan store.

### D3 — Zod v4 lokal di client (tanpa package bersama)

Client menambah `zod@^4` (versi mayor sama dengan server) untuk: validasi form login sebelum submit, `validateSearch` untuk parameter `?redirect=` (typed + aman dari open-redirect — hanya nilai path relatif yang diterima), dan tipe data kontrak. Folder `packages/shared` sempat dipertimbangkan untuk schema lintas ekosistem namun **ditolak**: memaksa konversi workspaces/lockfile root dan menyulitkan build Vercel dua-project terpisah. Duplikasi schema server↔client adalah tradeoff yang disadari; jika kelak menyakitkan, shared package dapat diangkat tanpa mengubah desain fitur.

### D4 — Env: ikut kode (`VITE_API_URL`), value termasuk `/api/v1`

Kontrak: `BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9000/api/v1"`. Lokal tidak butuh file env sama sekali; production set Environment Variable di Vercel (mis. `https://hriss-api.vercel.app/api/v1`). `.env.example` baru di `client/` mendokumentasikannya; `docs/DEPLOYMENT.md` dikoreksi (nama lama `VITE_API_BASE_URL` salah). Alternatif mengganti nama variabel ditolak — lebih murah memperbaiki docs daripada kode + deployment yang sudah merujuk nama ini.

### D5 — Design system: shadcn/ui + tokens `@theme`, arah korporat bersih

- Primitif (Button, Input, Label, Card, Spinner) di-install via shadcn/ui ke `components/ui/` (Radix + cva) — aksesibilitas gratis, varian deklaratif; docs ARCHITECTURE sudah mengisyaratkan ini.
- Tokens (warna, radius, font-size) didefinisikan sebagai CSS variables dalam blok `@theme` di `index.css` — cara idiomatik Tailwind v4 (bukan `tailwind.config.js`).
- Palet: netral (zinc/slate) + aksen biru tua (primary), ala Linear/Notion — citra HRIS profesional.
- Semua aturan dibakukan di `docs/DESIGN-SYSTEM.md` (Bahasa Indonesia) yang menjadi rujukan wajib pengembangan UI berikutnya; login page adalah konsumen pertamanya.

### D6 — Pembersihan register

`authApi.register` dihapus dari `lib/api.ts`. Penghapusan endpoint `/auth/register` di server dilakukan user secara terpisah — change ini hanya memastikan client tidak lagi mereferensikannya agar tidak menjadi dead code.

## Risks / Trade-offs

- [Refresh gagal diam-diam di production jika `harden-serverless-deployment` belum aktif] → Login tetap berfungsi di lokal; di production kegagalannya nyata sebagai "logout tiap 15 menit". Catat di tasks: verifikasi prasyarat sebelum uji production.
- [`routeTree.gen.ts` hasil generasi plugin ikut ter-track git] → Biarkan ter-commit (konvensi umum TanStack); pastikan plugin berjalan via script `dev`/`build` agar tidak stale.
- [Open redirect lewat `?redirect=`] → `validateSearch` hanya menerima string path relatif (regex `^\/` dan bukan `//`); fallback ke `/`.
- [Duplikasi schema server↔client drift seiring waktu] → Disadari; mitigasi jangka panjang = angkat `packages/shared` bila perlu (D3).
- [Shadcn menarik dependensi Radix beberapa paket kecil] → Diterima demi aksesibilitas & konsistensi; semua primitif lewat satu jalur `components/ui/`.

## Migration Plan

Tidak ada data/migrasi DB. Deploy: merge → CI Vercel build client dengan env Production `VITE_API_URL` sudah diset di dashboard. Rollback: revert commit client (server tak tersentuh).

Smoke test mengikuti pola `harden-serverless-deployment`: verifikasi lokal meniru task 6.2-nya (login/refresh/me/logout/RBAC dari konteks browser), dan smoke produksi pasca-deploy mengerjakan sekaligus task 7.2 harden yang memang mensyaratkan adanya login UI di domain FE (uji login lintas-situs + cookie `SameSite=None`).

## Open Questions

_(tidak ada — semua keputusan telah dikunci bersama user selama eksplorasi)_
