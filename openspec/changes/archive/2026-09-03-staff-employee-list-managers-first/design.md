## Context

Tampilan daftar karyawan untuk role STAFF saat ini adalah flat list `<ul>` tanpa hierarki visual. Data yang diterima dari server hanya berisi `id`, `full_name`, `position` — tanpa `join_date`. Komponen `StaffEmployeeList` me-render data apa adanya tanpa sorting maupun grouping.

Perubahan ini menambahkan visual hierarchy: manager ditampilkan di atas dengan badge, dipisahkan divider dari staff. Staff diurutkan berdasarkan `join_date` (terlama ke terbaru).

## Goals / Non-Goals

**Goals:**
- Manager tampil paling atas di daftar STAFF dengan badge `variant="outline"`
- Divider visual memisahkan grup manager dan staff
- Staff diurutkan berdasarkan `join_date` ASC
- Empty state per-grab jika salah satu grup kosong
- Jika tidak ada manager, tampilkan staff tanpa divider

**Non-Goals:**
- Mengubah tampilan HRD (`EmployeeTable`) — tidak disentuh
- Menambahkan fitur search/filter/sort interaktif untuk STAFF
- Mengubah struktur response API untuk HRD
- Menambahkan pagination untuk daftar STAFF

## Decisions

### 1. Sorting di frontend, bukan backend

**Keputusan**: Sorting manager-first + staff by join_date dilakukan di client menggunakan `useMemo`.

**Alternatif**: Sorting di backend via SQL `ORDER BY` di query STAFF.

**Alasan**: Data STAFF hanya beberapa orang per department (kecil). Sorting di frontend lebih fleksibel dan tidak memerlukan ubahan query SQL. Backend tetap return data tanpa sort order.

### 2. Tambah `join_date` ke projection, bukan switch ke `listAll`

**Keputusan**: Tambahkan `join_date` ke `employeeListItemProjection` di server.

**Alternatif**: Gunakan endpoint `listAll` (yang sudah punya `join_date`) untuk STAFF juga.

**Alasan**: `listAll` mengembalikan semua 14 field + department — terlalu banyak data untuk STAFF yang hanya perlu lihat nama, jabatan, dan join_date. Lebih efisien tambah 1 field ke projection yang sudah ada.

### 3. Badge hanya untuk MANAGER

**Keputusan**: Hanya MANAGER yang mendapat `<Badge variant="outline">`. STAFF tetap ditampilkan sebagai teks `text-muted-foreground`.

**Alasan**: MANAGER cuma 1 per department — badge berfungsi sebagai highlight. Jika semua orang dapat badge, tidak ada pembeda visual.

### 4. Divider sederhana (border-t)

**Keputusan**: Divider berupa `<div className="border-t" />` tanpa label teks.

**Alasan**: User STAFF sudah tahu siapa manager mereka. Label section "Manager"/"Staff" tidak perlu karena konteks sudah jelas dari badge dan posisi.

## Risks / Trade-offs

- **[Risk] join_date tidak ada di data lama** → join_date adalah field NOT NULL di database, selalu ada. Tidak ada risk data kosong.
- **[Risk] Breaking change di API projection** → Penambahan field ke response adalah non-breaking. Client lama yang tidak pakai field ini tidak terpengaruh.
- **[Trade-off] Sorting di frontend** → Jika department sangat besar (ratusan orang), sorting di frontend bisa lambat. Tapi ini tidak realistis untuk HRIS — department biasanya < 50 orang.
