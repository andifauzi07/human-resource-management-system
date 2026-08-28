# Design System UI

## Purpose

Design system for UI components, styling tokens, and accessibility requirements for the HRIS client application.

## Requirements

### Requirement: Design tokens terpusat via `@theme`

Seluruh token desain (palet warna netral + aksen biru tua sebagai primary, radius, ukuran tipografi) HARUS didefinisikan sebagai CSS variables dalam blok `@theme` pada `client/src/index.css` (cara idiomatik Tailwind v4). Komponen dan halaman TIDAK BOLEH meng-hardcode nilai warna/radius di luar token; mereka HANYA boleh merujuk utilitas/kelas yang dihasilkan token.

#### Scenario: Perubahan token merambat global

- **WHEN** nilai token `--color-primary` diubah di `index.css`
- **THEN** seluruh elemen yang memakai kelas token primary (tombol, aksen) berubah tanpa penyuntingan per-komponen

#### Scenario: Nilai di luar token ditolak saat review

- **WHEN** sebuah komponen memakai nilai warna literal (mis. `bg-blue-600`) yang bukan bagian token
- **THEN** implementasi tersebut melanggar design system dan harus diganti token

### Requirement: Primitif komponen bersumber shadcn/ui

Primitif UI (Button, Input, Label, Card, Spinner, dan seterusnya) HARUS di-install melalui shadcn/ui ke `client/src/components/ui/` (basis Radix + cva). Halaman/fitur TIDAK BOLEH mendefinisikan primitif fungsionalnya sendiri di luar folder ini; penyesuaian tampilan dilakukan lewat varian/cva atau token, bukan duplikasi komponen.

#### Scenario: Form menggunakan primitif resmi

- **WHEN** halaman login membangun form email/password
- **THEN** Input, Label, dan Button diimpor dari `components/ui/`, bukan elemen bergaya manual

### Requirement: `docs/DESIGN-SYSTEM.md` adalah rujukan wajib UI

Repository HARUS memuat `docs/DESIGN-SYSTEM.md` (Bahasa Indonesia) yang membakukan: daftar token, katalog primitif beserta variannya, aturan layout (container, grid form), pola feedback state (loading/error/empty selaras envelope API), dan aturan aksesibilitas dasar. Setiap pengembangan yang menyentuh UI WAJIB mengikuti dokumen ini; dark mode dicatat sebagai non-goal (ditunda).

#### Scenario: Halaman baru mengikuti dokumen

- **WHEN** developer menambahkan halaman modul bisnis baru (mis. cuti)
- **THEN** struktur visual halaman (token, primitif, layout, feedback) konsisten dengan aturan `docs/DESIGN-SYSTEM.md`

### Requirement: Aksesibilitas dasar pada primitif

Setiap input WAJIB memiliki label yang terasosiasi secara programatik; elemen interaktif WAJIB memiliki indikator fokus yang terlihat; kontras teks normal minimal 4.5:1 terhadap latarnya.

#### Scenario: Form login dapat dinavigasi keyboard

- **WHEN** pengguna menekan Tab pada halaman login
- **THEN** urutan fokus melewati email → password → tombol submit dengan ring fokus terlihat pada setiap elemen
