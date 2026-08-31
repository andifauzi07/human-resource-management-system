# Design System — HRIS Web

Dokumen ini adalah **sumber kebenaran (source of truth) wajib** untuk seluruh
pengembangan yang menyentuh UI di `client/`. Setiap halaman — termasuk modul
bisnis yang belum ada (department, karyawan, cuti, absensi, payroll) — HARUS
mengikuti dokumen ini. Enforcement bertingkat:

1. **Token** — semua warna/radius/shadow berasal dari `@theme` di `index.css`.
2. **Primitif wajib** — fungsionalitas UI dipakai dari `components/ui/`, tidak
   didefinisikan ulang per halaman.
3. **Pattern komposit** — kasus berulang (KPI, status, empty, judul halaman)
   memakai `components/` yang sudah tersedia.
4. **ESLint rule** — `design-system/no-hardcoded-style` menolak nilai literal
   di luar token secara otomatis saat `npm run lint`.
5. **Dokumen ini** — panduan konvensi visual & interaksi.

> **Arah visual: deep indigo/violet profesional & kreatif** (modern SaaS, ala
> Linear/Stripe). Netral tetap menjadi dasar latar/teks/kartu; indigo/violet
> dipakai secara **disiplin** sebagai aksen: primary action, link, ring fokus,
> brand, active nav. **Dark mode tetap non-goal.**

---

## 1. Design Tokens

Token didefinisikan **sekali** sebagai CSS variables di blok `:root` +
pemetaan `@theme inline` pada `client/src/index.css` (cara idiomatik Tailwind
v4 — bukan `tailwind.config.js`). Komponen TIDAK BOLEH meng-hardcode nilai
warna/radius/shadow; selalu rujuk token.

### 1.1 Warna (semantik)

| Token | Nilai (`oklch`) | Peruntukan |
|---|---|---|
| `--background` | `0.982 0.003 286` | Latar halaman (netral sejuk) |
| `--foreground` | `0.208 0.02 286` | Teks utama |
| `--card` / `--card-foreground` | `1 0 0` / `0.208 0.02 286` | Permukaan kartu |
| `--popover` / `--popover-foreground` | `1 0 0` / `0.208 0.02 286` | Menu/select/dialog |
| `--primary` / `--primary-foreground` | **`0.457 0.24 277.023`** (≈ indigo-700) / `0.985 0 0` | Aksi utama, link, brand, active nav |
| `--secondary` / `--secondary-foreground` | `0.947 0.012 286` / `0.3 0.03 285` | Aksi sekunder |
| `--muted` / `--muted-foreground` | `0.952 0.009 286` / `0.52 0.022 286` | Teks bantu, placeholder |
| `--accent` / `--accent-foreground` | `0.947 0.024 280` / `0.3 0.04 280` | Hover/highlight (rona indigo halus) |
| `--destructive` / `--destructive-foreground` | `0.577 0.245 27.325` / `0.985 0 0` | Error, aksi merusak |
| `--success` / `--success-foreground` | `0.606 0.202 152.203` / `0.985 0 0` | Status sukses/aktif |
| `--warning` / `--warning-foreground` | `0.666 0.157 58.318` / `0.2 0.04 65` | Status pending/hati-hati |
| `--info` / `--info-foreground` | `0.585 0.233 277.117` / `0.985 0 0` | Status informasi/penyampaian |
| `--border`, `--input` | `0.905 0.008 286` | Garis pembatas & input |
| `--ring` | **`0.511 0.262 276.966`** (indigo-600) | Ring fokus keyboard |
| `--radius` | `0.5rem` | Basis skala radius |

> `--primary` dan `--ring` dengan **hue 277 (indigo→violet deep)** adalah ciri
> karakter HRIS. Jangan mengganti dengan biru generik. Nilai hanya diubah di
> `:root` — komponen cukup merujuk `bg-primary`, `text-primary`, `ring-ring`.

### 1.2 Skala Depth (shadow)

Skala default Tailwind di-override agar lebih tegas dan berona indigo halus,
sehingga permukaan "terangkat" di atas latar netral. Skala yang diizinkan
(dan satu-satunya yang lolos lint): `shadow-none`, `shadow-2xs`, `shadow-xs`,
`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`.

| Utilitas | Penggunaan |
|---|---|
| `shadow-xs` | Input, trigger, elemen datar |
| `shadow-md` | **Card default** (kedalaman standar konten) |
| `shadow-lg` | Menu/dropdown/select/toast |
| `shadow-xl`/`shadow-2xl` | Modal/dialog level atas |

### 1.3 Radius & Tipografi

- `--radius: 0.5rem` — skala `rounded-xs…xl`; `rounded-full` untuk pill, avatar,
  badge status.
- Font: stack sistem sans-serif (tanpa webfont tambahan). Body default `text-sm`,
  judul halaman `text-lg font-semibold tracking-tight`.

### 1.4 Spacing

Gunakan skala Tailwind apa adanya (`p-*`, `gap-*`, `space-y-*`). Pola berulang:
kontainer kartu `p-6` (atau `p-5` untuk `StatCard`), jarak field form `gap-4`,
jarak label-input `gap-2`, jarak antar-kartu `gap-4`/`gap-6`.

---

## 2. Primitif Komponen (shadcn/ui)

Primitif di-install via shadcn/ui ke `client/src/components/ui/` (basis Radix +
cva). **Larangan:** mendefinisikan ulang primitif fungsional di luar folder ini;
penyesuaian tampilan lewat varian/cva atau token, bukan duplikasi.

Katalog:

| Primitif | File | Catatan |
|---|---|---|
| Button | `ui/button.tsx` | Varian: `default`, `secondary`, `outline`, `ghost`, `link`, `destructive`; ukuran `xs`, `sm`, `default`, `lg`, `icon*` |
| Input | `ui/input.tsx` | Selalu berpasangan dengan Label |
| Label | `ui/label.tsx` | Wajib untuk setiap input |
| Card (+ Header/Title/Description/Content/Footer) | `ui/card.tsx` | Wadah konten; depth `shadow-md` |
| Badge | `ui/badge.tsx` | Varian: `default`, `secondary`, `outline`, `destructive`, `success`, `warning`, `info` |
| Table (+ Header/Body/Footer/Head/Row/Cell/Caption) | `ui/table.tsx` | Semua data tabular WAJIB memakai ini |
| Tabs | `ui/tabs.tsx` | Navigasi konten bertingkat |
| Select | `ui/select.tsx` | Dropdown (Radix) untuk form |
| Dialog | `ui/dialog.tsx` | Modal konfirmasi/internal |
| Sonner | `ui/sonner.tsx` | Toast: aksi/notifikasi non-blokir |
| Skeleton | `ui/skeleton.tsx` | Placeholder loading blok |
| Tooltip | `ui/tooltip.tsx` | Label kontekstual hover/fokus (sidebar icon-only) |
| Spinner | `ui/spinner.tsx` | Indikator loading tunggal |
| Separator | `ui/separator.tsx` | Pemisah visual |
| Avatar (+ Fallback) | `ui/avatar.tsx` | Representasi identitas pengguna |
| DropdownMenu | `ui/dropdown-menu.tsx` | Menu kontekstual / aksi terlipat (user menu topbar) |

### 2.1 Aturan penggunaan Button

- Satu tombol `default` (primary) per panduan aksi; aksi sekunder pakai
  `outline`/`ghost`. Hindari banyak tombol solid dalam satu pandangan.
- Saat pending: `disabled` + `<Spinner />` menggantikan ikon; teks tetap terbaca.
- Aksi destruktif wajib varian `destructive` (bukan warna manual).

### 2.2 Aturan New, asli kecuali

- Toast hanya untuk umpan balik singkat yang tidak menghalangi tugas;
  aksi yang mengubah state penting boleh menampilkan toast via Sonner.
- Busy state per-blok memakai `Skeleton`; per-aksi memakai `Spinner`.

---

## 3. Pattern Komposit (di luar `ui/`)

`client/src/components/` memuat pattern yang memakai primitif + token, dibangun
sekali agar fitur mendatang tidak menebak layout sendiri. **Halaman TIDAK BOLEH
meniru pola ini manual dengan styling berbeda** bila kasusnya sesuai.

| Pattern | File | Penggunaan |
|---|---|---|
| StatCard | `components/stat-card.tsx` | Kartu KPI dashboard: `label`, `value`, `icon?`, `hint?` |
| StatusBadge | `components/status-badge.tsx` | Badge kondisi (cuti/absensi/kehadiran) dengan peta `status → varian` otomatis |
| EmptyState | `components/empty-state.tsx` | Placeholder daftar/modul tanpa data: `icon?`, `title`, `description?`, `action?` |
| PageHeader | `components/page-header.tsx` | Judul halaman + deskripsi + `actions?` (kanan) — dipakai semua halaman |

---

## 4. Aturan Layout

- Halaman diasuh di dalam app shell (`route group _app/`): sidebar kiri +
  topbar atas + konten `<Outlet/>`; halaman publik (login) berada di luar shell.
- Header konten dibungkus `mx-auto w-full max-w-5xl py-8 px-6` (di `app-shell.tsx`).
- Form: satu kolom `grid gap-4`; field = `[Label] + [Input] + [pesan error]`
  dalam wrapper `grid gap-2`.
- Kartu autentikasi dipusatkan vertikal: parent `flex min-h-svh items-center justify-center`.

### 4.1 App Shell

- **Sidebar** (`features/shell/components/sidebar.tsx`): mode **icon-only**
  (lebar `w-16`, label via `Tooltip`) sebagai default; terima prop `expanded`
  untuk mode ikon+label (`w-64`) **tanpa menulis ulang navigasi**. Menu selalu
  dari **`features/shell/navigation.tsx`** (satu sumber, role-aware & `disabled`).
- **Topbar** (`features/shell/components/topbar.tsx`): aksen brand (chip role,
  `bg-primary/10 text-primary`) di kiri; **user menu via `DropdownMenu`**
  (Avatar trigger → email/role → item "Profil" [nonaktif pr] dan "Keluar"
  [destructive, Spinner saat proses]) di kanan.
- **Latar konten**: `bg-muted/30` pada `main` agar kartu `shadow-md` terangkat.
- **Guard sesi**: `routes/_app/route.tsx` memanggil `restoreSession()` di
  `beforeLoad` dan redirect ke `/login?redirect=` bila tanpa sesi.

---

## 5. Feedback State (selaras envelope API)

Server selalu mengirim envelope `{ success, message, statusCode, data }`. Aturan UI:

| State | Pola |
|---|---|
| Loading route | `pendingComponent` router menampilkan Spinner terpusat |
| Loading blok | `Skeleton` per blok (daftar/tabel) |
| Loading aksi | Tombol `disabled` + Spinner |
| Error API | Pesan dari `ApiClientError.message` di area form/`role="alert"`, gaya destructive; JANGAN tampilkan `statusCode` mentah |
| Error validasi | Inline per-field tepat di bawah input, `text-xs text-destructive` |
| Empty | Pattern `EmptyState` (judul + deskripsi + aksi opsional) |
| Sukses | Navigasi/ubah state; toast (Sonner) hanya bila umpan balik singkat dibutuhkan |

---

## 6. Aksesibilitas Dasar

- Setiap input WAJIB punya `<Label>` terasosiasi (`htmlFor` + `id`).
- Elemen interaktif WAJIB memiliki ring fokus terlihat (`ring-ring`); jangan
  pernah menghapus `focus-visible` tanpa pengganti.
- Kontras teks normal ≥ 4.5:1 terhadap latarnya (token sudah dipilih agar
  kontras `--primary-foreground`/`--foreground` aman).
- Status async yang memengaruhi hasil layar diberi `role="alert"` / `aria-live`.
- Urutan tab mengikuti urutan visual; form dapat diselesaikan hanya dengan keyboard.
- Sidebar icon-only tetap menyediakan akses teks: `Tooltip` + `aria-label` pada link.

---

## 7. Enforcement Otomatis (ESLint)

`client/eslint.config.js` memuat rule **`design-system/no-hardcoded-style`**
(yang melarang):

- warna literal di luar token: `bg-indigo-600`, `text-white`, `text-[#123456]`;
- shadow di luar skala §1.2 (`shadow-jumbo`) atau arbitrary (`shadow-[…]`);
- radius di luar skala (`rounded-[8px]`) — skala sah: `rounded-none/xs/sm/md/lg/xl/2xl/3xl/full`
  (termasuk varian sisi);
- nilai arbitrary berkonten warna pada util warna.

Rule memeriksa `className` literal, `cn(...)`, dan string `cva(...)`. Perubahan
styling cukup mengubah token di `@theme`; penyelipan hardcode terdeteksi saat
`npm run lint`. Kasus yang dibolehkan: lebar/sisi (mis. `ring-2`, `border-b-0`,
`rounded-full`, `rotate-45`), varian data-radix, dan referensi CSS var
(`bg-(--primary)`, `max-h-(--radix-select-content-available-height)`).

---

## 8. Non-Goals

- **Dark mode** — ditunda; token gelap belum didefinisikan. Jangan menulis
  gaya kustom `.dark` di luar rencana.
- **Halaman katalog/styleguide mandiri** — ditunda; dokumen ini adalah rujukan.
- Animasi kompleks/transisi halaman — cukup transisi utilitas Tailwind bawaan primitif.

---

## 9. Menambahkan Halaman Baru

1. Buat file di `src/routes/<nama>.tsx` (file-based routing TanStack Router),
   atau di route group terproteksi `_app/`.
2. Route terlindungi disusun lewat route group `_app` (guard sesi sudah ada di
   `routes/_app/route.tsx`); fitur disimpan di `src/features/<fitur>/`.
3. Gunakan hanya token §1 + primitif §2; pakai pattern §3 bila kasusnya sesuai;
   ikuti layout §4 dan feedback §5.
4. Jalankan gerbang kualitas root:
   `npm run lint && npm run typecheck && npm run build`.