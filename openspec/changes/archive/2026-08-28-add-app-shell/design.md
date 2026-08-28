# Design: App Shell untuk HRIS Client

## Context

Client saat ini memakai TanStack Router file-based: `routes/__root.tsx` hanya `<Outlet/>`, `routes/index.tsx` adalah halaman "home polos" yang menaruh guard sesi (`beforeLoad` + `restoreSession()` + `throw redirect`) **per-halaman** dan memuat logika logout. Tidak ada sidebar/topbar; tiap modul berikutnya akan mengulang guard & layout sendiri.

App shell adalah fondasi yang akan dipakai semua halaman modul (department, employee, lalu cuti/absensi/payroll). Tujuannya agar:
1. Guard sesi + logout berada di **satu tempat** (level layout), bukan per-halaman.
2. Navigasi terpusat dan mudah diperluas per modul.
3. Ada tampilan konsisten (sidebar + topbar + konten) sejak kecil, mengikuti `docs/DESIGN-SYSTEM.md`.

## Goals / Non-Goals

**Goals:**
- Layout terproteksi (app shell) dengan sidebar + topbar + `<Outlet/>`.
- Konfigurasi navigasi terpusat, role-aware, dan siap diperluas per modul.
- Homepage `/` menjadi dashboard placeholder di dalam shell.
- Topbar menampilkan identitas user (email + role) + logout.
- Mengikuti design-system (token, primitif shadcn, aksesibilitas, feedback).

**Non-Goals:**
- Implementasi halaman Department / Employee (iterasi berikutnya).
- Dark mode, animasi kompleks (non-goal design-system).
- Perubahan kontrak API server.

## Decisions

### D1 — Route group `_app` untuk shell terproteksi
Gunakan route group TanStack (folder `routes/_app/`) sebagai layout root terproteksi; `index.tsx` dan modul-modul bisnis jadi **anak** (nested) dari `_app`. Guard sesi & logout ditaruh di `_app` (`beforeLoad`), sehingga semua route anak otomatis terproteksi.

```
routes/
├── __root.tsx            # <Outlet/> (root)
├── login.tsx             # publik, di luar shell
└── _app/
    ├── route.tsx         # layout shell: guard + sidebar + topbar + <Outlet/>
    └── index.tsx         # dashboard placeholder (anak shell)
```

- **Alternatif ditolak**: melanjutkan penaruhan guard per-halaman di tiap modul → duplikasi & rawan lupa; leaseh terkonsentrasi.

### D2 — Konfigurasi navigasi terpusat role-aware
Satu modul `features/shell/navigation.tsx` (atau `features/navigation/`) berisi array menu: label, ikon lucide, target route, dan `roles?: UserRole[]`. Komponen sidebar merender daftar & menyaring per role user. Modul masa depan menambah entri tanpa mengedit shell.

- **Alternatif**: hardcode menu di sidebar → tidak scalable untuk iterasi modul berikutnya.

### D3 — Komponen shell monolitis vs terpecah
Pecah jadi `AppShell` (layout) + `Sidebar` + `Topbar` di `features/shell/components/`. Logika (guard, logout) di layout; presentasi (nav, identitas) tersebar di komponen presentasional. Ini selaras struktur feature-based yang sudah dipakai `features/auth/`.

### D4 — Logout & guard dipindah ke shell
Logout (yang sekarang di `index.tsx`) pindah ke `Topbar`; guard `beforeLoad` + `restoreSession()` pindah ke `_app/route.tsx`. `index.tsx` lama dibuang logikanya → jadi dashboard yang memakai data user dari store.

### D5 — Navigasi masa depan ditampilkan sebagai disabled
Menu modul yang belum ada implementasinya (Cuti, Absensi, Payroll) ditampilkan di sidebar sebagai item **disabled** (non-aktif), sedangkan Department & Employee tetap aktif untuk iterasi berikutnya. Ini menjadikan shell "terlihat lengkap" dan memberi arah produk tanpa membangun halaman yang belum ada. (Di tahap app-shell, yang benar-benar aktif hanya Dashboard.)

- **Catatan**: di iterasi selanjutnya, item department/employee diaktifkan saat modulnya diimplementasi. Non-goal hari ini adalah membuat halaman tersebut.

### D6 — Primitif tambahan minimal
Tambah primitif shadcn yang benar-benar dibutuhkan shell (mis. `Separator` untuk pemisah nav, dan bila perlu `Avatar`/`DropdownMenu` untuk menu user di topbar). Hindari menambah primitif yang tak terpakai; ikuti aturan design-system (tidak menduplikasi fungsional primitif yang ada).

## Risks / Trade-offs

- **[Route group `_app` butuh penyesuaian routeTree.gen]** → `routeTree.gen.ts` di-generate otomatis oleh router plugin saat dev/build; tidak diedit manual. Pastikan Vite dev menulis ulang tree.
- **[Item nav disabled bisa membingungkan user]** → gunakan visual disabled (opacity + non-interaktif) disertai tooltip/title "Segera hadir" bila perlu; aktifkan saat modul diimplementasi.
- **[Pemindahan guard dari `index.tsx` berisiko mengubah perilaku login → redirect]** → pastikan `beforeLoad` shell memakai helper `safeRedirectTarget` yang sama dan `throw redirect` ke `/login` dengan `?redirect=` sehingga perilaku login→kembali tetap terjaga.
- **[Scope shell membesar (ditarik ke dashboard/aksi lain)]** → non-goal sudah tegas; dashboard hanya placeholder identitas. Aksi & statistik diserahkan ke iterasi modul.

## Migration Plan

1. Buat folder `routes/_app/` dengan `route.tsx` (layout shell) + `index.tsx` (dashboard) — pindahkan guard/logout dari `routes/index.tsx`.
2. Buat `features/shell/` (components + navigation config).
3. Tambah primitif UI yang dibutuhkan ke `components/ui/`.
4. Hapus/rewrite `routes/index.tsx` menjadi dashboard shell (atau hapus, karena dipindah ke `_app/index.tsx`).
5. Update `docs/DESIGN-SYSTEM.md` (aturan app shell) + `docs/ARCHITECTURE.md` (struktur FE aktual).
6. Jalankan gerbang kualitas root: `npm run lint && npm run typecheck && npm run build`.

Rollback: karena ini murni restrukturisasi client (tanpa migrasi DB / perubahan API), rollback = revert commit client + docs.

## Open Questions
- Apakah ingin `DropdownMenu` untuk area user di topbar (menu aksi: lihat profil, keluar) atau cukup tombol logout langsung? (Default: cukup tombol logout langsung untuk scope kecil.)
