## 1. Design System (fase pertama — fondasi gaya)

- [x] 1.1 Tulis `docs/DESIGN-SYSTEM.md` (Bahasa Indonesia): palet netral + aksen biru tua, daftar token, katalog primitif shadcn/ui + varian, aturan layout (container/grid form), pola feedback state (loading/error/empty selaras envelope API), aturan aksesibilitas dasar; catat dark mode sebagai non-goal
- [x] 1.2 Definisikan tokens di `client/src/index.css` blok `@theme` (warna primary/netral, radius, tipografi) sesuai dokumen
- [x] 1.3 Setup shadcn/ui: dependensi (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`), `components.json`, path alias `@/*` di `tsconfig.json` + `vite.config.ts`, helper `cn()` di `src/lib/utils.ts`
- [x] 1.4 Install primitif awal via shadcn ke `src/components/ui/`: button, input, label, card, spinner

## 2. Router & Infrastruktur

- [x] 2.1 Tambah dependensi `@tanstack/react-router` + dev-dependency `@tanstack/router-plugin`; pasang plugin di `vite.config.ts`
- [x] 2.2 Buat route file-based: `routes/__root.tsx` (layout root + Outlet), `routes/index.tsx` (`"/"` terlindungi), `routes/login.tsx` (publik); pastikan `routeTree.gen.ts` tergenerasi via plugin
- [x] 2.3 Ganti entry: `main.tsx` merender `RouterProvider`; hapus/ubah `App.tsx` placeholder

## 3. Sesi & Auth Flow

- [x] 3.1 Refactor `lib/api.ts`: ekspor fungsi refresh sesi (bungkus `POST /auth/refresh`) untuk dipakai ulang; hapus `authApi.register`
- [x] 3.2 Buat `features/auth/session.ts`: `restoreSession()` dengan promise dimemoisasi modul-scope (sekali per app load), sinkron dengan store
- [x] 3.3 Pasang gating di `routes/index.tsx`: `beforeLoad` → `await restoreSession()`; gagal → `throw redirect({ to: "/login", search: { redirect } })`; sukses → render home; sedang berjalan → `pendingComponent` spinner
- [x] 3.4 Halaman login (`features/auth/components/login-form.tsx`): schema Zod v4 (`features/auth/schemas/login.schema.ts`), validasi inline sebelum submit, tampilkan error envelope API, state pending pada tombol
- [x] 3.5 `validateSearch` di route login: param `redirect` hanya path relatif (`^\/` dan bukan `//`), fallback `"/"`; setelah login sukses navigate ke nilai tersebut
- [x] 3.6 Home placeholder: kartu menampilkan email + role dari store + tombol logout (panggil `POST /auth/logout`, clear store, redirect `/login`)

## 4. Konfigurasi & Dokumentasi

- [x] 4.1 Tambah `client/.env.example` berisi `VITE_API_URL=https://<domain-api>/api/v1` beserta komentar kontrak fallback localhost
- [x] 4.2 Koreksi `docs/DEPLOYMENT.md`: nama variabel menjadi `VITE_API_URL` dan contoh nilai menyertakan `/api/v1`
- [x] 4.3 Perbarui `docs/ARCHITECTURE.md` bagian struktur frontend: struktur aktual (`routes/`, `features/auth/`, `components/ui/`), penyeragaman folder `store/` (kode tetap tunggal)

## 5. Smoke Test & Verifikasi (selaras `harden-serverless-deployment`)

- [x] 5.1 Smoke test lokal (pola task 6.2 harden): dari login UI di localhost — login user seed → home tampil email+role; reload halaman → silent refresh sukses sesi bertahan; logout → cookie refresh terhapus dan akses `/` dialihkan ke `/login`; panggil endpoint RBAC (`GET /hrd-area`) memakai token sesi → HRD diterima, STAFF 403
- [x] 5.2 Uji kasus tepi: submit form kosong (tanpa request jaringan), password salah (pesan envelope API tampil), `?redirect=https://evil.example` diabaikan
- [x] 5.3 Jalankan gate kualitas di root: `npm run lint && npm run typecheck && npm run build` hingga lolos
- [x] 5.4 Smoke test produksi pasca-deploy (pola task 7.2 harden, sehingga dapat ditandai selesai bersamaan): buka `hrd-management-system.vercel.app` → login dari UI; verifikasi cookie refresh terkirim lintas-situs (`SameSite=None; Secure`); reload → sesi bertahan (refresh bekerja); logout bersih; docs tampil bila `ENABLE_DOCS=true`
- [x] 5.5 Setelah smoke produksi lolos: centang task 7.2 (dan 7.1 bila workflow migrasi+deploy telah dipantau) pada change `harden-serverless-deployment`
- [x] 5.6 Prasyarat sebelum uji produksi: env `VITE_API_URL` diset di Vercel (Production) dan perubahan cookie/Origin dari `harden-serverless-deployment` sudah aktif
