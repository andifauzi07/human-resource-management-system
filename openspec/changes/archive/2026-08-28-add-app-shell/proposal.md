# Proposal: App Shell untuk HRIS Client

## Why

Backend sudah siap dipakai untuk modul Department dan Employee, dan auth client sudah berjalan (login → sesi → logout). Namun client belum punya "kerangka" aplikasi: halaman `/` hanya berupa kartu polos "Selamat datang". Tanpa app shell (sidebar + topbar + routing terproteksi ber-navigasi), setiap modul bisnis berikutnya harus mengulang infrastruktur layout — dan aplikasi tidak punya tampilan yang konsisten untuk dikembangkan. Dibutuhkan fondasi UI tunggal sebagai tempat semua halaman modul (department, employee, diikuti cuti/absensi/payroll nanti) ditenagai.

## What Changes

- **Layout terproteksi (`app shell`)** via route group TanStack Router: sidebar navigasi + topbar + area konten `<Outlet/>`. Route dalam shell mewarisi aturan sesi: `beforeLoad` memanggil `restoreSession()` dan `throw redirect` ke `/login` bila tidak ada sesi (menggantikan pola guard yang sekarang terpetakan per-halaman di `index.tsx`).
- **Konfigurasi navigasi terpusat** di `features/navigation` (atau `features/shell`): satu array menu (label, ikon lucide, target route, role yang boleh melihat). Modul masa depan cukup menambah entri — shell tak perlu diedit per modul.
- **Homepage menjadi dashboard placeholder** dalam shell, berisi ringkasan identitas user (email, role) — bukan lagi kartu polos di luaran shell.
- **Topbar**: menampilkan identitas user + tombol logout (memindahkan logika logout yang sekarang ada di `index.tsx` ke komponen shell). Role-aware: menampilkan badge role.
- **Primitif UI tambahan minimal** dari shadcn/ui bila diperlukan (mis. `Separator`/`Tooltip` untuk sidebar) — hanya yang benar-benar dibutuhkan shell, mengikuti aturan design-system (tidak menduplikasi primitif).
- **Halaman placeholder non-shell dipertahankan**: `/login` tetap publik tanpa shell.
- **BREAKING (internal client)**: `routes/index.tsx` berubah dari halaman "home polos" menjadi route di dalam shell (dashboard); logika logout & guard dipindah ke shell. Tidak ada perubahan kontrak API.

## Capabilities

### New Capabilities
- `client-app-shell`: Kerangka aplikasi client — layout terproteksi (sidebar + topbar + konten `<Outlet/>`), konfigurasi navigasi terpusat yang role-aware dan siap diperluas per modul, homepage dashboard placeholder, dan pemindahan guard-sesi + logout ke level shell.

### Modified Capabilities
_(tidak ada — `client-auth-flow`, `design-system-ui` tidak berubah requirement-nya; shell hanya memanfaatkannya)_

## Impact

- **Kode client** (`client/`): `src/main.tsx` (tidak berubah), restrukturisasi `src/routes/` (layout route group + route `index` jadi dashboard yang ter-nest di shell), tambah `src/features/shell/` atau `src/features/navigation/` (layout, sidebar, topbar, nav config), `src/components/ui/` (tambah primitif bila perlu), `src/store/auth.store.ts` (tidak berubah).
- **Docs**: `docs/DESIGN-SYSTEM.md` ditambah aturan app shell (struktur sidebar/topbar/container konten); `docs/ARCHITECTURE.md` diperbarui struktur FE aktual (layout route group, fitur shell).
- **Server**: tidak ada perubahan.
- **Scope di luar change ini**: halaman modul Department dan Employee akan diimplementasikan pada iterasi/module berikutnya di atas shell ini (bukan bagian dari change app-shell).
