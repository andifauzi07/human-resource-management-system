# Proposal: Redesign Design System (Deep Indigo)

## Why

Tampilan HRIS saat ini terasa monoton: background putih polos, kartu hanya border tipis + `shadow-sm`, tanpa kedalaman atau karakter visual. Arah "korporat bersih (zinc + biru tua)" yang ditetapkan saat fase login terlalu generik dan tidak menandakan kualitas produk.

App masih kecil (baru login + dashboard placeholder), dan modul bisnis (department, karyawan, cuti, absensi, payroll) belum diimplementasi. Ini adalah **momentum terbaik** untuk menetapkan fondasi design system yang benar sebelum ratusan komponen data-dense (tabel, badge status, form kompleks) dibangun dengan gaya yang salah. Design system ini dirancang **untuk fitur yang akan datang**, bukan hanya yang ada sekarang, dan dijadikan **aturan wajib** agar setiap halaman berikutnya konsisten.

## What Changes

- **Tokens dirombak** di `client/src/index.css` (`@theme`): palet netral + aksen baru **deep indigo/violet** sebagai primary (bukan biru tua generik); tambah skala surface/depth (shadow), ring/focus, dan pertahankan skala radius/spacing yang konsisten. Dark mode tetap non-goal.
- **Primitif shadcn/ui diperluas** di `client/src/components/ui/` untuk kebutuhan fitur masa depan: `Badge`, `Table`, `Tabs`, `Select`, `Dialog`, `Sonner/Toast`, `Skeleton`, `Tooltip`. Milik yang ada (Button, Card, Input, Label, Avatar, DropdownMenu, Separator, Spinner) disesuaikan agar selaras token baru.
- **Pattern komponen data/UI** ditambahkan di `client/src/components/` (di luar `ui/`): `StatCard`, `StatusBadge`, `EmptyState`, `PageHeader`. Ini menjadi blok konsisten untuk dashboard & modul bisnis mendatang.
- **App Shell di-redesign** (`features/shell/`): sidebar menjadi **icon-only** (tetap `w-64` diberi opsi sesuai kode, siap di-collapse/diperluas di masa depan lewat struktur yang sudah mendukung), topbar modern dengan user menu via `DropdownMenu` + aksen brand, latar konten diberi depth konsisten.
- **Dashboard di-polish minimal**: mengikuti shell & pattern baru, tetap isi ringkas — bukan showcase penuh.
- **`docs/DESIGN-SYSTEM.md` diperbarui** menjadi sumber kebenaran (source of truth): token baru, katalog primitif & pattern, aturan layout, feedback state, aksesibilitas — menjadi **aturan wajib** bagi setiap fitur UI mendatang.
- **ESLint rule penolak hardcode style** ditambahkan di `client/eslint.config.js`: menolak nilai warna literal di luar token (mis. `bg-indigo-600`, `text-[#...]`), shadow/radius off-scale, dan nilai arbitrary (`bg-[...]`) pada komponen/halaman — sehingga maintainability design system **terjamin otomatis** di lint, bukan sekadar disiplin review. Ini adalah pengaman tingkat 2 (di atas token+primitif+docs).
- **Spesifikasi OpenSpec** `design-system-ui` di-update: arah visual & prinsip enforcement (token + primitif + docs + ESLint rule) baru menggantikan yang lama.

## Capabilities

### New Capabilities

_(tidak ada capability baru; perubahan berada dalam capability yang sudah ada)_

### Modified Capabilities

- `design-system-ui`: Arah visual berubah dari "korporat bersih (zinc + biru tua)" menjadi **deep indigo/violet profesional & kreatif**. Tokens, daftar primitif shadcn, pattern komponen, dan aturan layout/feedback diperbarui agar menjadi aturan yang siap menghandle modul data-dense (tabel, badge status, form kompleks) di masa depan. Dark mode tetap non-goal. Enforcement: **token + primitif wajib + ESLint rule + docs** sebagai sumber kebenaran — jaminan otomatis bahwa style hardcode ditolak di lint.

## Impact

- **Kode client** (`client/`): `src/index.css` (tokens baru), `src/components/ui/*` (penyesuaian + primitif baru: Badge, Table, Tabs, Select, Dialog, Sonner, Skeleton, Tooltip), `src/components/*` (pattern baru: StatCard, StatusBadge, EmptyState, PageHeader), `src/features/shell/*` (sidebar icon-only, topbar modern), `src/routes/_app/index.tsx` (dashboard polish), `eslint.config.js` (rule penolak hardcode style), `package.json` (dependensi shadcn tambahan: radix select/dialog/tooltip/tabs/table, sonner).
- **Docs**: `docs/DESIGN-SYSTEM.md` (ditulis ulang sesuai arah baru).
- **OpenSpec**: `openspec/specs/design-system-ui/spec.md` (di-update).
- **Server**: tidak ada perubahan kode atau kontrak API.
- **Non-goals**: dark mode, halaman katalog/styleguide mandiri (ditunda), pembangunan modul bisnis (department/karyawan/cuti/absensi/payroll).
