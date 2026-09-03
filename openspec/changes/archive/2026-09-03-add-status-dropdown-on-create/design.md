## Context

Sistem HRIS saat ini memiliki field `status` pada karyawan dengan enum `PROBATION | ACTIVE | ON_LEAVE | RESIGNED` dan state machine transisi yang sudah berjalan. Namun, saat HRD membuat karyawan baru melalui `POST /employees`, status selalu default `PROBATION` — tidak bisa dipilih. Field `status` juga tidak ditampilkan di dialog edit (hanya 5 field inti: nama, department, jabatan, gaji, tanggal gabung).

Backend: Express 5 + Drizzle ORM + PostgreSQL. Frontend: React 19 + Vite + TypeScript. Deployment serverless di Vercel.

## Goals / Non-Goals

**Goals:**
- HRD dapat memilih status saat membuat karyawan baru (default tetap `PROBATION`)
- HRD dapat mengubah status karyawan melalui dialog edit
- Dialog create dan edit menampilkan 6 field inti (nama, department, jabatan, status, gaji, tanggal gabung)
- Tidak ada perubahan pada state machine transisi atau auto-transition

**Non-Goals:**
- Tidak menambah status baru ke enum
- Tidak mengubah aturan transisi status
- Tidak menambahkan validasi transisi di sisi frontend (backend sudah handle)
- Tidak mengubah field pribadi di dialog edit (masih dihapus sesuai active change `simplify-edit-employee-dialog`)

## Decisions

### 1. Status sebagai field opsional di create (bukan wajib)

**Pilihan:** `status` bersifat opsional pada `createEmployeeSchema` dan `CreateEmployeeInput`. Jika tidak disertakan, default `PROBATION` (tetap seperti sekarang).

**Rationale:**
- Backward-compatible — client lama yang tidak kirim `status` tetap berfungsi
- Konsisten dengan pola `position` yang juga punya default
- HRD tetap bisa quick-create tanpa pilih status (default PROBATION)

**Alternatif yang ditolak:**
- Status wajib diisi → memaksa HRD selalu pilih, padahal PROBATION adalah case paling umum

### 2. Status di form schema create (bukan hanya edit)

**Pilihan:** Tambah `status: statusEnum` ke `employeeFormSchema` (create) DAN pertahankan di `employeeEditSchema` (edit).

**Rationale:**
- Konsisten — create dan edit punya field yang sama
- HRD bisa langsung set ACTIVE untuk karyawan transfer dari perusahaan lain
- `employeeEditSchema` sudah punya `status: statusEnum.optional()`, tinggal pertahankan

**Alternatif yang ditolak:**
- Status hanya di edit → HRD harus create dulu lalu edit untuk set status, redundant

### 3. Dropdown di dialog (bukan inline di tabel)

**Pilihan:** Status ditampilkan sebagai `<Select>` dropdown di dialog create dan edit, bukan inline action di tabel.

**Rationale:**
- Konsisten dengan pattern position (sudah pakai dropdown)
- Lebih aman — dropdown dengan pilihan terbatas, bukan free-text
- Error message dari backend (transisi tidak valid) sudah jelas

### 4. Tidak ada validasi transisi di frontend

**Pilihan:** Frontend mengirim status yang dipilih, backend melakukan validasi transisi. Jika invalid, backend return 400 dengan pesan error.

**Rationale:**
- State machine sudah ada di backend (`VALID_STATUS_TRANSITIONS`)
- Menghindari duplikasi logic di dua tempat
- Error message dari backend lebih akurat (bisa akses current status dari DB)

**Alternatif yang ditolak:**
- Validasi di frontend → perlu sync state machine di dua tempat, risk of drift

### 5. Tidak ada perubahan auto-transition

**Pilihan:** Auto-transition PROBATION → ACTIVE tetap berjalan seperti sekarang. Jika HRD langsung set ACTIVE saat create, auto-transition tidak akan jalan (karena status bukan PROBATION).

**Rationale:**
- Behavior yang diharapkan — jika status sudah ACTIVE, tidak perlu auto-transition
- Tidak ada edge case baru yang perlu ditangani

## Risks / Trade-offs

- **[Risk]** HRD salah pilih status saat create (misal RESIGNED) → **Mitigation**: Error akan muncul saat update berikutnya jika transisi tidak valid; bisa juga HRD langsung ubah via edit dialog.
- **[Risk]** Frontend dan backend punya interpretasi berbeda tentang status awal → **Mitigation**: Backend tetap source of truth; frontend hanya mengirim pilihan, tidak menghitung default.
- **[Trade-off]** Duplikasi dropdown options (4 nilai) di create dan edit → diterima karena konsistensi UI lebih penting dari DRY di view layer.
