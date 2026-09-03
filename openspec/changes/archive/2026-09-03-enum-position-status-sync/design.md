## Context

Sistem HRIS saat ini memiliki `position` sebagai free-text (`varchar(100)`) tanpa validasi, dan `status` karyawan hanya `ACTIVE`/`INACTIVE`. Manager assignment di `departments.manager_id` tidak terhubung dengan field `position` pada employee, sehingga terjadi inkonsistensi data. Tidak ada lifecycle tracking untuk karyawan (probation, cuti, resign).

Backend Express 5 + Drizzle ORM + PostgreSQL, frontend React 19 + Vite. Deployment serverless di Vercel (tidak boleh long-running processes).

## Goals / Non-Goals

**Goals:**
- `position` menjadi enum `STAFF | MANAGER` di database level
- `status` diekspans ke `PROBATION | ACTIVE | ON_LEAVE | RESIGNED`
- Bi-directional sync: employee position ↔ department manager
- Validasi 1 manager per department, same-department constraint
- Guard deactivation untuk manager
- Auto-transition PROBATION → ACTIVE setelah 3 bulan

**Non-Goals:**
- Tidak menambah jabatan lain selain STAFF/MANAGER
- Tidak menambah field `position` ke departments table
- Tidak mengubah role system (`user_role` tetap STAFF/HRD)
- Tidak menambah notification/alert untuk perubahan status
- Tidak menambah audit trail untuk perubahan manager

## Decisions

### 1. Position enum di database level (bukan application layer)

**Pilihan:** Gunakan `pgEnum` di Drizzle schema.

**Rationale:** Database-level constraint menjamin data integrity. Tidak mungkin ada value selain STAFF/MANAGER masuk ke database. Application layer hanya untuk UX (dropdown, error messages).

**Alternatif yang ditolak:**
- Application-layer enum saja → raw varchar bisa diisi bebas via direct DB access
- Separate `positions` table → over-engineering untuk hanya 2 values

### 2. Sync mechanism di service layer (bukan trigger DB)

**Pilihan:** Semua sync logic di service layer, dalam transaction.

**Rationale:** 
- Konsisten dengan pola existing (service layer handle business logic)
- Bisa berikan error messages yang spesifik
- Transaction menjamin atomicity
- Tidak perlu database trigger (Drizzle tidak support triggers secara native)

**Alternatif yang ditolak:**
- Database triggers → Drizzle ORM tidak support triggers, raw SQL maintainance burden
- Application-level only (tanpa service layer) → tidak atomic, race conditions

### 3. Auto-transition PROBATION computed at query time

**Pilihan:** Saat fetch employee, cek `join_date + 90 hari < now`. Jika iya dan status masih PROBATION, auto-update ke ACTIVE.

**Rationale:**
- Serverless-friendly (tidak perlu cron job)
- Transisi terjadi saat data diperlukan
- Simple implementation

**Trade-off:**
- Transisi tidak real-time jika tidak ada yang fetch
- List employee mungkin menampilkan PROBATION yang seharusnya sudah ACTIVE
- Mitigasi: Lakukan update di service layer saat list/detail employee

### 4. Manager conflict: Reject (bukan overwrite)

**Pilihan:** Jika department sudah punya manager, sistem menolak dengan error message.

**Rationale:**
- Prevent accidental overwrite
- Force admin consciously unassign dulu
- Lebih aman untuk production data

### 5. Same-department constraint di service layer

**Pilihan:** Validasi `employee.department_id === department.id` saat assign manager.

**Rationale:**
- Business rule: manager harus dari department yang sama
- HRD harus pindah department dulu sebelum promote
- Prevent confusion about which department employee belongs to

### 6. Deactivation guard di service layer

**Pilihan:** Cek `position === "MANAGER"` sebelum allow deactivation.

**Rationale:**
- Prevent orphaned department (department tanpa manager)
- Force HRD consciously ganti manager dulu

### 7. Migration: alter enum + data migration

**Pilihan:** 
1. Buat new enum type `position_enum`
2. Add column `position_new` dengan enum type
3. Migrate data: map existing position strings → enum values
4. Drop old column, rename new column
5. Set default value

**Rationale:**
- PostgreSQL tidak bisa alter enum type langsung (tambah value saja)
- Position dari varchar ke enum butuh migration step
- Status enum diekspans (tambah value) lebih mudah

## Risks / Trade-offs

- **[Risk] Data migration position** → Existing position values yang bukan "Manager"/"Staff" perlu di-map. Mitigasi: Review data existing, map ke STAFF sebagai default untuk values yang tidak dikenal.
- **[Risk] Race condition saat sync** → Dua request bersamaan ubah manager. Mitigasi: Transaction isolation level SERIALIZABLE untuk sync operations.
- **[Risk] Auto-transition PROBATION tidak real-time** → Employee mungkin masih PROBATION di UI padahal sudah 3 bulan. Mitigasi: Lakukan update di service layer saat list/detail, bukan hanya saat individual fetch.
- **[Trade-off] Sync di service layer vs DB trigger** → Service layer lebih fleksibel dan bisa berikan error messages, tapi kurang atomic dibanding DB trigger. Diterima karena Drizzle tidak support triggers.
- **[Trade-off] Reject conflict vs overwrite** → Reject lebih aman tapi kurang convenient. Diterima karena safety lebih penting dari convenience untuk data karyawan.
