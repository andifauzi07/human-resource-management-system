## MODIFIED Requirements

### Requirement: Arah visual deep indigo/violet profesional

Identitas visual HRIS beralih dari "korporat bersih (netral zinc + aksen biru tua)" menjadi **deep indigo/violet** yang profesional sekaligus kreatif, ala modern SaaS. Primary action, brand, ring fokus, dan aksen aktif memakai indigo/violet; netral tetap menjadi dasar latar/teks/kartu. Dark mode tetap non-goal.

#### Scenario: Aksen utama memakai indigo/violet

- **WHEN** tombol primary, link, ring fokus, brand icon, atau active nav dirender
- **THEN** warnanya berasal dari token primary (indigo/violet) dan `--primary` diubah hanya di `@theme` — bukan nilai hardcode di komponen

#### Scenario: Latar & kartu tetap netral dengan depth

- **WHEN** halaman dirender
- **THEN** background halaman berwarna netral dan kartu memiliki depth (shadow scale yang lebih tegas), sehingga hierarki terlihat tanpa kehilangan keterbacaan teks

### Requirement: Depth & hierarki lewat card depth + shadow

Kartu dan permukaan memakai skala `shadow`/depth yang lebih tegas (bukan hanya `border` + `shadow-sm`) sehingga hierarki komponen jelas di atas background. Nilai depth merujuk token/utilitas Tailwind; TIDAK BOLEH memakai nilai shadow literal di luar utilitas bawaan token scale.

#### Scenario: Kartu memiliki kedalaman

- **WHEN** komponen Card dirender di atas background
- **THEN** Card menampilkan shadow sesuai skala depth token, sehingga terangkat dari latar halaman

### Requirement: Sidebar icon-only, siap-collapsible

Sidebar app shell menggunakan mode **icon-only** (kompak) dengan label tersedia lewat `Tooltip`. Desain harus **siap mendukung** peralihan ke mode expanded (icon + label) di masa depan tanpa menulis ulang konfigurasi navigasi — struktur shell harus menerima pendorongan state expanded. Navigasi tetap tunggal dari `features/shell/navigation.tsx` (role-aware & `disabled`).

#### Scenario: Sidebar menampilkan ikon tanpa label

- **WHEN** app shell dirender dalam keadaan non-expanded
- **THEN** sidebar menampilkan hanya ikon menu (dengan `Tooltip` label), bukan teks label

#### Scenario: Navigasi tetap satu sumber

- **WHEN** developer menambah item menu baru
- **THEN** cukup menambah entri di `features/shell/navigation.tsx` tanpa mengedit shell/sidebar, dan mode expanded/collapsed tidak memerlukan perubahan pada entri tersebut

### Requirement: Primitif shadcn/ui diperluas untuk modul data-dense

Katalog primitif (dibawah `client/src/components/ui/`) diperluas untuk kebutuhan modul bisnis mendatang (department/karyawan/cuti/absensi/payroll): `Badge`, `Table`, `Tabs`, `Select`, `Dialog`, `Sonner` (toast), `Skeleton`, dan `Tooltip`. Halaman/fitur TIDAK BOLEH mendefinisikan primitif fungsionalnya sendiri di luar folder ini; penyesuaian tampilan lewat varian/cva atau token.

#### Scenario: Tabel data memakai primitif resmi

- **WHEN** modul karyawan/cuti/absensi menampilkan data tabular
- **THEN** Table diimpor dari `components/ui/`, bukan `<table>` bergaya manual di halaman

#### Scenario: Status memakai Badge/Sonner resmi

- **WHEN** menampilkan status (mis. cuti pending/approved) atau notifikasi
- **THEN** Status memakai komponen `Badge` dan notifikasi memakai `Sonner`, keduanya dari `components/ui/`

### Requirement: Pattern komposit UI terstandar

`client/src/components/` (di luar `ui/`) menyediakan pattern komposit yang memakai primitif + token: `StatCard`, `StatusBadge`, `EmptyState`, `PageHeader`. Pattern ini dibangun sekali dan menjadi blok konsisten untuk dashboard & seluruh modul bisnis mendatang. Halaman TIDAK BOLEH meniru pola ini secara manual dengan styling berbeda; MENGgunakan pattern yang ada bila kasusnya sesuai.

#### Scenario: Dashboard memakai StatCard

- **WHEN** dashboard menampilkan ringkasan KPI
- **THEN** memakai pattern `StatCard` (bukan kartu ad-hoc dengan styling berbeda per halaman)

#### Scenario: Halaman kosong memakai EmptyState

- **WHEN** sebuah daftar/modul belum punya data
- **THEN** memakai pattern `EmptyState` sebagai placeholder yang konsisten

### Requirement: ESLint menolak hardcode style

`client/eslint.config.js` HARUS memuat rule yang menolak nilai style literal di luar design system: nilai warna hardcode di luar token (mis. `bg-indigo-600`, `text-[#123456]`), shadow/radius yang tidak berasal dari skala token, dan kelas arbitrary (`bg-[...]`). Tujuannya menjamin maintainability otomatis — perubahan styling cukup lewat token di `@theme`, dan style yang menyelip di komponen/halaman terdeteksi saat `npm run lint`.

#### Scenario: Styling hardcode ditolak lint

- **WHEN** developer menulis `bg-indigo-600` atau `text-[#123456]` di komponen/halaman
- **THEN** `npm run lint` (client) melaporkan pelanggaran dan mensyaratkan pemakaian token (`bg-primary`, `text-primary`, dst.)

#### Scenario: Nilai token lolos

- **WHEN** komponen memakai kelas yang berasal dari token (`bg-primary`, `rounded-md`, `shadow-lg`)
- **THEN** lint lolos tanpa pelanggaran, dan perubahan styling cukup mengubah nilai token di `@theme`

### Requirement: `docs/DESIGN-SYSTEM.md` menjadi sumber kebenaran arah baru

`docs/DESIGN-SYSTEM.md` ditulis ulang agar merefleksikan arah baru: token deep indigo/violet, depth/shadow, sidebar icon-only (siap-collapsible), katalog primitif & pattern, aturan layout, feedback state (loading/error/empty selaras envelope API), dan aksesibilitas dasar. Dokumen ini menjadi **aturan wajib** yang diikuti setiap pengembangan UI, termasuk modul yang belum ada sekarang. Enforcement: token + primitif wajib + ESLint rule + docs (katalog mandiri ditunda sebagai non-goal).

#### Scenario: Halaman modul baru mengikuti arah baru

- **WHEN** developer menambahkan halaman modul bisnis baru (mis. cuti)
- **THEN** struktur visual (token indigo/violet, primitif, pattern, layout, feedback) konsisten dengan `docs/DESIGN-SYSTEM.md` yang baru
