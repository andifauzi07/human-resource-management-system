# Design System — HRIS Web

Dokumen ini adalah **rujukan wajib** untuk setiap pengembangan yang menyentuh UI di
`client/`. Tujuannya menjaga konsistensi visual dan pola interaksi sejak aplikasi masih
kecil, sehingga halaman baru tidak perlu menebak-nebak aturan.

> **Arah visual: korporat bersih.** Netral (zinc) dengan aksen biru tua sebagai primary,
> ala Linear/Notion — kesan profesional HRIS, tidak ramai, kontras jelas.

---

## 1. Design Tokens

Token didefinisikan **sekali** sebagai CSS variables di blok `@theme` pada
`client/src/index.css` (cara idiomatik Tailwind v4 — bukan `tailwind.config.js`).
Komponen TIDAK BOLEH meng-hardcode nilai warna/radius; selalu rujuk token.

### 1.1 Warna (semantik)

| Token | Nilai (`oklch`) | Peruntukan |
|---|---|---|
| `--background` / `--foreground` | putih / zinc-950 | Latar halaman & teks utama |
| `--card` / `--card-foreground` | putih / zinc-950 | Permukaan kartu |
| `--primary` / `--primary-foreground` | **biru tua** (≈ blue-800) / putih | Aksi utama, link, fokus |
| `--secondary` / `--secondary-foreground` | zinc-100 / zinc-900 | Aksi sekunder |
| `--muted` / `--muted-foreground` | zinc-100 / zinc-500 | Teks bantu, placeholder |
| `--accent` / `--accent-foreground` | zinc-100 / zinc-900 | Hover/highlight |
| `--destructive` | red-600 | Error, aksi merusak |
| `--border`, `--input` | zinc-200 | Garis pembatas & input |
| `--ring` | biru (turunan primary) | Ring fokus keyboard |

### 1.2 Radius & Tipografi

- `--radius: 0.5rem` — memengaruhi semua skala radius (`rounded-sm…xl`).
- Font: stack sistem sans-serif (tanpa webfont tambahan). Ukuran mengikuti skala Tailwind;
  body default `text-sm`, judul halaman `text-lg font-semibold`.

### 1.3 Spacing

Gunakan skala Tailwind apa adunya (`p-*`, `gap-*`, `space-y-*`). Pola berulang:
kontainer kartu `p-6`, jarak antar-field form `space-y-4`, jarak label-input `space-y-2`.

---

## 2. Primitif Komponen (shadcn/ui)

Primitif di-install via shadcn/ui ke `client/src/components/ui/` (basis Radix + cva).
**Larangan:** mendefinisikan ulang primitif fungsional di luar folder ini; penyesuaian
tampilan dilakukan lewat varian/cva atau token, bukan duplikasi komponen.

Katalog awal:

| Primitif | File | Catatan |
|---|---|---|
| Button | `components/ui/button.tsx` | Varian: `default`, `outline`, `ghost`, `destructive`, `secondary`, `link`; ukuran `sm`, `default`, `lg`, `icon` |
| Input | `components/ui/input.tsx` | Selalu berpasangan dengan Label |
| Label | `components/ui/label.tsx` | Wajib untuk setiap input |
| Card (+ Header/Title/Description/Content/Footer) | `components/ui/card.tsx` | Wadah konten standar |
| Spinner | `components/ui/spinner.tsx` | Indikator loading tunggal |

### 2.1 Aturan penggunaan Button

- Satu tombol `default` (primary) per panduan aksi — aksi sekunder pakai `outline`/`ghost`.
- Saat pending: `disabled` + `<Spinner />` menggantikan ikon; teks tetap terbaca.
- Aksi destruktif wajib varian `destructive`, bukan warna manual.

---

## 3. Aturan Layout

- Halaman dibungkus container tengah: `mx-auto w-full max-w-md` untuk halaman fokus
  (login), `max-w-5xl` untuk halaman data/tabel; padding vertikal `py-10`.
- Form: satu kolom (`grid gap-4`); field = `[Label] + [Input] + [pesan error]`
  dalam wrapper `grid gap-2`.
- Kartu autentikasi dipusatkan vertikal: parent `flex min-h-svh items-center justify-center`.
- Judul halaman konsisten: `CardTitle` atau `text-lg font-semibold tracking-tight`.

---

## 4. Feedback State (selaras envelope API)

Server selalu mengirim envelope `{ success, message, statusCode, data }`. Aturan UI:

| State | Pola |
|---|---|
| Loading route | `pendingComponent` router menampilkan Spinner terpusat (bukan kedip halaman login) |
| Loading aksi | Tombol `disabled` + Spinner |
| Error API | Pesan dari `ApiClientError.message` ditampilkan di area form, `role="alert"`, gaya destructive; JANGAN tampilkan `statusCode` mentah ke user |
| Error validasi | Inline per-field tepat di bawah input, teks `text-destructive text-xs` |
| Sukses | Navigasi/ubah state — hindari toast yang tidak perlu |

---

## 5. Aksesibilitas Dasar

- Setiap input WAJIB punya `<Label>` terasosiasi (`htmlFor` + `id`).
- Elemen interaktif WAJIB memiliki ring fokus terlihat (bawaan shadcn via `--ring`);
  jangan pernah menghapus `focus-visible` tanpa pengganti.
- Kontras teks normal ≥ 4.5:1 terhadap latarnya.
- Status async yang memengaruhi hasil layar diberi `role="alert"` / `aria-live`.
- Urutan tab mengikuti urutan visual; form dapat diselesaikan hanya dengan keyboard.

---

## 6. Non-Goals

- **Dark mode** — ditunda; token gelap belum didefinisikan. Jangan menulis gaya kustom
  `.dark` di luar rencana.
- Animasi kompleks/transisi halaman — cukup transisi utilitas Tailwind bawaan primitif.

---

## 7. Menambahkan Halaman Baru

1. Buat file di `src/routes/<nama>.tsx` (file-based routing TanStack Router).
2. Route terlindungi: cek sesi lewat `beforeLoad` → `restoreSession()`; gagal →
   `throw redirect({ to: "/login", search: { redirect } })`. Logika fitur tinggal di
   `src/features/<fitur>/`.
3. Gunakan hanya token §1 + primitif §2; ikuti layout §3 dan feedback §4.
4. Jalankan gerbang kualitas root: `npm run lint && npm run typecheck && npm run build`.
