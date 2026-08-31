# Tasks — Redesign Design System

> Prasyarat: selesaikan secara berurutan dalam satu change. Jalankan gerbang kualitas root setelah tiap milestone: `npm run lint && npm run typecheck && npm run build`.

## Milestone 1 — Fondasi Token & Tooling

- [x] Pasang dependensi shadcn yang dibutuhkan primitif baru (`sonner`; Radix primitives sudah tersedia via `radix-ui` unified: select/dialog/tabs/tooltip/table/slot) via `shadcn add` atau npm — di `client/`.
- [x] Rombak token di `client/src/index.css` (`@theme`): palet deep indigo/violet sebagai `--primary` (nilai `oklch`), pertahankan/tambah skala netral, skala `shadow`/depth lebih tegas, ring/focus turunan indigo, radius/spacing konsisten. (Nilai final didokumentasikan di DESIGN-SYSTEM.md.)
- [x] Tambah **ESLint rule** di `client/eslint.config.js` yang menolak hardcode style: warna literal di luar token (`bg-indigo-600`, `text-[#...]`), shadow/radius off-scale, dan nilai arbitrary (`bg-[...]`). Verifikasi rule melaporkan pelanggaran pada kasus contoh.

## Milestone 2 — Primitif & Pattern

- [x] Perluas primitif shadcn di `client/src/components/ui/`: `Badge`, `Table`, `Tabs`, `Select`, `Dialog`, `Sonner` (toast), `Skeleton`, `Tooltip`.
- [x] Sesuaikan primitif yang ada (Button, Card, Input, Label, Avatar, DropdownMenu, Separator, Spinner) agar selaras token baru.
- [x] Bangun pattern komposit di `client/src/components/`: `StatCard`, `StatusBadge`, `EmptyState`, `PageHeader` (memakai primitif + token).

## Milestone 3 — App Shell

- [x] Redesign sidebar di `features/shell/components/sidebar.tsx` menjadi **icon-only** (dengan `Tooltip` label), struktur siap ditambah state expanded tanpa menulis ulang navigasi; tetap satu sumber dari `navigation.tsx`.
- [x] Redesign topbar di `features/shell/components/topbar.tsx`: aksen brand + user menu via `DropdownMenu` (profil/kirim), konsisten depth & token.
- [x] Sesuaikan `app-shell.tsx` (latar konten, depth konsisten) dengan shell baru.

## Milestone 4 — Dashboard & Docs

- [x] Polish dashboard (`routes/_app/index.tsx`): minimal, selaras shell + pattern (`PageHeader`, `StatCard`, `EmptyState` bila relevan).
- [x] Tulis ulang `docs/DESIGN-SYSTEM.md` sesuai arah baru (token indigo/violet, depth, sidebar icon-only siap-collapsible, katalog primitif & pattern, layout, feedback, aksesibilitas) sebagai sumber kebenaran wajib.
- [x] Update spesifikasi OpenSpec `design-system-ui` (delta) — selesai pada change ini; setelah archive, spec utama ikut ter-update.

## Verifikasi

- [x] `npm run lint && npm run typecheck && npm run build` (root) lolos (termasuk ESLint rule penolak hardcode aktif & tidak ada pelanggaran di kode existing).
- [x] Login & dashboard dirender sesuai arah baru (indigo/violet, depth, sidebar icon-only) tanpa error.
