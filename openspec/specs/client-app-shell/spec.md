# Client App Shell

## Purpose

Kerangka aplikasi client HRIS: layout terproteksi (sidebar + topbar + konten), navigasi terpusat yang role-aware dan siap diperluas per modul, serta homepage dashboard placeholder. Shell menjadi tempat semua route modul bisnis bernavigasi, menggantikan pola guard/logout yang sebelumnya tersebar per-halaman.

## Requirements

### Requirement: Layout shell terproteksi via route group

Sistem SHALL menyediakan layout terproteksi (`app shell`) berupa route group TanStack Router (`routes/_app/`) yang membungkus semua halaman terproteksi dengan sidebar, topbar, dan area konten `<Outlet/>`. Route `beforeLoad` pada layout shell SHALL memanggil `restoreSession()`; bila tidak ada sesi, sistem SHALL melempar `redirect` ke `/login` dengan parameter `?redirect=` ke lokasi asal, sehingga login kembali mengarahkan ke halaman yang dituju.

#### Scenario: User berkunjung terproteksi tanpa sesi

- **WHEN** user tanpa sesi mengakses route di dalam shell (mis. `/`)
- **THEN** sistem melempar redirect ke `/login?redirect=<lokasi>` dan halaman shell tidak dirender

#### Scenario: User dengan sesi melihat shell

- **WHEN** user dengan sesi valid mengakses route di dalam shell
- **THEN** halaman dirender di dalam layout: sidebar di kiri, topbar di atas, konten route di area utama

### Requirement: Halaman publik tetap di luar shell

Route `login` (dan route publik lain) SHALL berada di luar route group shell dan tidak menampilkan sidebar/topbar.

#### Scenario: Halaman login bebas shell

- **WHEN** user mengakses `/login`
- **THEN** halaman dirender tanpa sidebar dan topbar shell

### Requirement: Navigasi terpusat, role-aware, siap diperluas

Sistem SHALL memuat konfigurasi navigasi terpusat (satu sumber menu) berisi label, ikon, target route, dan daftar role yang boleh melihat. Komponen sidebar SHALL merender menu dan menyaring item sesuai `role` user saat ini. Penambahan modul cukup menambah entri konfigurasi tanpa mengedit komponen shell.

#### Scenario: Item menu difilter per role

- **WHEN** user ber-role `STAFF` membuka shell
- **THEN** menu yang hanya diizinkan role `HRD` tidak dirender di sidebar

#### Scenario: Modul baru tersambung tanpa edit shell

- **WHEN** developer menambah entri menu modul baru ke konfigurasi navigasi
- **THEN** item tersebut langsung muncul di sidebar tanpa mengubah komponen shell

### Requirement: Sidebar menampilkan item modul yang belum aktif sebagai disabled

Menu modul yang belum memiliki halaman/implementasi SHALL ditampilkan di sidebar dalam keadaan disabled (non-interaktif) agar arah produk terlihat, dan menjadi aktif ketika modulnya diimplementasi.

#### Scenario: Item modul masa depan berstatus disabled

- **WHEN** user melihat sidebar pada tahap di mana modul Cuti/Absensi/Payroll belum diimplementasi
- **THEN** item tersebut tampil tetapi non-interaktif (tidak dapat diklik / tidak menimbulkan navigasi)

### Requirement: Homepage adalah dashboard placeholder di dalam shell

Route `/` SHALL dirender sebagai halaman dashboard di dalam shell, menampilkan identitas user (email dan role) sebagai konten placeholder. Halaman ini TIDAK lagi menjadi halaman polos di luar shell dan tidak memuat tombol logout/guard sendiri.

#### Scenario: Homepage menampilkan identitas user

- **WHEN** user dengan sesi membuka `/`
- **THEN** halaman menampilkan email dan role user dalam konteks dashboard shell

#### Scenario: Homepage tidak menduplikasi logout

- **WHEN** user membuka `/`
- **THEN** tidak ada tombol logout pada konten dashboard (logout berada di topbar shell)

### Requirement: Topbar menampilkan identitas & logout

Topbar shell SHALL menampilkan identitas user (mis. email dan badge role) dan menyediakan aksi logout. Aksi logout SHALL memanggil `authApi.logout()`, membersihkan store auth, lalu menavigasi ke `/login`. Selama proses logout, tombol SHALL dalam keadaan disabled dengan spinner.

#### Scenario: Logout dari topbar

- **WHEN** user mengklik tombol logout di topbar
- **THEN** sistem memanggil logout API, membersihkan sesi, dan mengarahkan ke `/login`

#### Scenario: Indikasi proses logout

- **WHEN** aksi logout sedang berjalan
- **THEN** tombol logout disabled dan menampilkan spinner

### Requirement: Shell mematuhi design system

Seluruh elemen shell SHALL menggunakan token desain dari `@theme` (`index.css`), primitif shadcn/ui dari `components/ui/`, dan mengikuti aturan layout/feedback/aksesibilitas pada `docs/DESIGN-SYSTEM.md` (termasuk ring fokus terlihat, label terasosiasi, dan kontras ≥ 4.5:1).

#### Scenario: Elemen interaktif shell memiliki fokus terlihat

- **WHEN** user menekan Tab pada sidebar/topbar
- **THEN** setiap item interaktif menampilkan ring fokus terlihat sesuai design system

#### Scenario: Sidebar & topbar memakai token desain

- **WHEN** shell dirender
- **THEN** warna/radius sidebar, topbar, dan konten merujuk token desain tanpa nilai literal di luar token