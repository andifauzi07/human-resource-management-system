# Design — Redesign Design System (Deep Indigo)

Catatan keputusan desain yang disepakati selama eksplorasi. Ini adalah **rujukan** untuk implementasi; detail operasional mengikuti `docs/DESIGN-SYSTEM.md` (sumber kebenaran operasional) dan spesifikasi OpenSpec.

## Keputusan Desain (dari eksplorasi)

| # | Keputusan | Rincian |
|---|---|---|
| 1 | **Karakter visual** | Deep indigo/violet (modern SaaS, ala Linear/Stripe). Menggantikan "biru tua zinc" yang generik. Profesional sekaligus kreatif. |
| 2 | **Sidebar** | Awal **icon-only** (kompak, hemat ruang). Desain harus **siap-collapsible** ke depan: struktur mendukung peralihan icon-only ↔ expanded (dengan label) tanpa refactor besar. |
| 3 | **Komponen** | Semua konsisten & profesional; tidak ada satu "hero" pun yang menonjol — keseluruhan seragam. |
| 4 | **Dashboard** | Jaga minimal — cukup polish agar selaras shell/pattern baru, bukan showcase penuh. |
| 5 | **Design system = aturan** | Ditetapkan sebagai **source of truth** wajib untuk fitur mendatang. Enforcement bertingkat: **token + primitif wajib + ESLint rule + docs**. (Katalog/styleguide mandiri ditunda.) |
| 6 | **Dark mode** | Tetap non-goal. |
| 7 | **Maintainability terjamin otomatis** | ESLint rule (tingkat 2) menolak nilai style literal di luar token — `bg-indigo-600`, `text-[#...]`, shadow/radius off-scale, nilai arbitrary `bg-[...]`. Perubahan styling cukup lewat token; tidak ada yang menyelipkan hardcode tanpa terdeteksi lint. |

## Arah Visual

```
Zona terang (konten)                       Aksen deep indigo/violet
┌──────────────────────────────┐           ┌───────────────────────┐
│ background: soft neutral     │           │ primary: indigo-700   │
│ card:      putih + depth     │           │ hover, ring, fokus    │
│ (shadow scale lebih tegas)   │           │ brand icon, CTA       │
└──────────────────────────────┘           └───────────────────────┘
```

- Palet netral tetap dipakai sebagai dasar (background/card/teks) agar konten tetap terbaca dan profesional.
- Indigo/violet dipakai secara **disiplin** untuk: primary action, link, ring fokus, badge aksen, brand, active nav — bukan warna-warni menyeluruh.
- Depth ditingkatkan lewat skala `shadow` yang lebih tegas (bukan hanya `shadow-sm`), untuk hierarki kartu yang jelas di atas background.

## Architecture Primitif vs Pattern

```
client/src/components/
├── ui/          # shadcn/ui — primitif fungsional (milik: Button, Card, Input,
│                #   Label, Avatar, DropdownMenu, Separator, Spinner)
│                # tambah: Badge, Table, Tabs, Select, Dialog, Sonner, Skeleton, Tooltip
│                # Larangan: mendefinisikan ulang primitif di luar folder ini
└── (root)       # pattern komposit UI — kombinasi primitif + token utk kasus nyata
    ├── stat-card.tsx       # kartu KPI dashboard
    ├── status-badge.tsx    # badge status (cuti/absensi: pending/approved/rejected, dll)
    ├── empty-state.tsx     # kosong/placeholder data
    └── page-header.tsx     # judul halaman + deskripsi + aksi (konsisten semua halaman)
```

**Prinsip batch:** primitif (`ui/`) = komponen fungsional tunggal bersumber shadcn. Pattern (`components/`) = komposit yang memakai primitif + token, dibangun sekali agar fitur mendatang tidak menebak layout/state masing-masing.

## Sidebar: icon-only, siap-collapsible

```
[Compact: icon-only]  ⇄  [Expanded: icon + label]
┌──┐                        ┌──────────────┐
│▣│  Dashboard              │▣  Dashboard  │
│▣│  Department             │▣  Department │
│▣│  Karyawan               │▣  Karyawan   │
└──┘                        └──────────────┘
```

- Wujud awal: **icon-only** (token `w-16`-ish) dengan `Tooltip` untuk label.
- Konfigurasi tetap berasal dari `features/shell/navigation.tsx` (satu sumber menu; tetap role-aware & `disabled`).
- Struktur mendukung penambahan state `expanded` nanti tanpa menulis ulang navigasi — hanya menambah prop/switcher di shell.

## Tokens Kunci (indikatif — nilai final di `docs/DESIGN-SYSTEM.md`)

| Token | Peran |
|---|---|
| `--background` / `--card` | Latar halaman neutal; kartu putih dengan depth |
| `--primary` | Deep indigo/violet (aksen utama, action, brand) |
| `--muted` / `--muted-foreground` | Teks bantu, placeholder |
| `--destructive` | Error/destruktif |
| `--border` / `--input` | Garis & input |
| `--ring` | Fokus (turunan indigo) |
| `--radius` | Skala radius konsisten |
| skala `shadow` | Depth/hierarki |

Nilai `oklch` final ditetapkan saat implementasi dan didokumentasikan; komponen hanya merujuk token, tidak hardcode.

## Non-goals (untuk change ini)

- Dark mode.
- Halaman katalog/styleguide mandiri.
- Implementasi modul bisnis (department/karyawan/cuti/absensi/payroll) — hanya fondasi & pattern yang disiapkan.

> ESLint rule **tidak** lagi menjadi non-goal — dimasukkan ke scope sebagai pengaman otomatis atas maintainability (lihat keputusan #5 dan #7).
