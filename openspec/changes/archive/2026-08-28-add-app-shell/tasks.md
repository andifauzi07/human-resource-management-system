## 1. Primitif & Konfigurasi Shell

- [x] 1.1 Tambah primitif shadcn/ui yang dibutuhkan shell (`Separator`, dan bila dipakai `Avatar`/`DropdownMenu`) ke `components/ui/` sesuai design-system
- [x] 1.2 Buat `features/shell/navigation.tsx`: konfigurasi menu terpusat (label, ikon lucide, target route, `roles`) — Dashboard aktif; Department/Employee/Cuti/Absensi/Payroll sebagai item (disabled utk yang belum ada)
- [x] 1.3 Buat helper pemetaan role-aware utk memfilter menu per role user

## 2. Layout Shell (Route Group)

- [x] 2.1 Buat folder `routes/_app/` dan `route.tsx`: layout `AppShell` memuat `beforeLoad` (guard sesi `restoreSession()` + `throw redirect` ke `/login?redirect=`), sidebar + topbar + `<Outlet/>`
- [x] 2.2 Buat `features/shell/components/sidebar.tsx`: render menu dari konfigurasi navigasi, filter per role, tandai item disabled utk yang belum aktif
- [x] 2.3 Buat `features/shell/components/topbar.tsx`: identitas user (email + badge role) + tombol logout (panggil `authApi.logout()`, bersihkan store, navigasi ke `/login`, state disabled+spinner saat proses)
- [x] 2.4 Buat `features/shell/components/app-shell.tsx` (atau serap di `route.tsx`): komposisi Sidebar + Topbar + area konten

## 3. Dashboard & Restrukturisasi Route

- [x] 3.1 Buat `routes/_app/index.tsx`: dashboard placeholder menampilkan email + role user dalam shell (tanpa tombol logout/guard sendiri)
- [x] 3.2 Hapus/rewrite `routes/index.tsx` lama yang berisi halaman home polos + guard + logout (pindah ke shell/dashboard)
- [x] 3.3 Pastikan `routeTree.gen.ts` ter-regenerate (via plugin router saat dev/build) dan tidak diedit manual

## 4. Verifikasi

- [x] 4.1 Jalankan `npm run lint` (root) dan perbaiki bila ada
- [x] 4.2 Jalankan `npm run typecheck` (root) dan perbaiki bila ada
- [x] 4.3 Jalankan `npm run build` (root) dan pastikan build sukses

## 5. Dokumentasi

- [x] 5.1 Tambah aturan app shell (struktur sidebar/topbar/container konten) ke `docs/DESIGN-SYSTEM.md`
- [x] 5.2 Perbarui `docs/ARCHITECTURE.md` struktur FE aktual (route group `_app`, fitur `shell`, dashboard)
